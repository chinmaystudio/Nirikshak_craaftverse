"""Coordinator service for NIRIKSHAK AI intelligence."""
from __future__ import annotations
from pathlib import Path
import json
import uuid
import threading
from typing import Any

from .engine import HistoricalUnsupervisedEngine
from .online import OnlineDriftLearner
from .bandit import LinUCBPolicy, outcome_reward, outcome_reward_components
from .state_store import StateStore
from .openrouter import OpenRouterClient, sanitize_context_data
from .schemas import (
    extract_flat_features,
    calculate_input_quality,
    VersionMetadata,
    ProjectSnapshot,
)

class NirikshakAI:
    def __init__(self, root: str | Path):
        self.root = Path(root)
        self.lock = threading.RLock()
        
        # 1. Historical Unsupervised ML Engine
        self.engine = HistoricalUnsupervisedEngine(self.root / "models")
        
        # 2. Continuous Online Drift Learner
        self.online = OnlineDriftLearner(self.root / "state" / "online_drift.joblib")
        
        # 3. LinUCB Contextual Bandit Recommendation Policy
        self.policy = LinUCBPolicy(self.root / "state" / "rl_policy.json")
        
        # 4. SQLite State Persistence Store
        self.state_store = StateStore(self.root / "state" / "nirikshak_ai_state.sqlite3")
        
        # 5. OpenRouter Client
        self.openrouter = OpenRouterClient()

    async def analyze(
        self,
        snapshot_input: dict[str, Any] | ProjectSnapshot,
        top_k_actions: int = 3,
        include_explanation: bool = True,
    ) -> dict[str, Any]:
        flat_p, provenance = extract_flat_features(snapshot_input)
        analysis_id = str(uuid.uuid4())
        project_id = flat_p.get("project_id") or flat_p.get("nirikshak_project_id")

        with self.lock:
            # Step 1: Historical unsupervised anomaly & archetype evaluation
            unsup = self.engine.assess(flat_p)
            imputed_fields = unsup.get("imputed_fields", [])
            
            # Step 2: Online drift scoring
            drift = self.online.score(flat_p)
            
            # Step 3: LinUCB contextual bandit recommendation ranking
            ctx = self.policy.context(flat_p, unsup)
            actions = self.policy.rank(ctx, top_k=top_k_actions)

            # Step 3b: Input quality & completeness tracking
            input_quality = calculate_input_quality(flat_p, imputed_fields)
            versions = VersionMetadata(
                service="1.0.0",
                historical_model="nirikshak-historical-v1.0.0",
                online_model="nirikshak-online-v1.0.0",
                rl_policy="linucb-v1.0.0",
                llm_model=self.openrouter.model,
            )

        # Step 4: OpenRouter explanation layer (async, non-blocking lock)
        llm_result: dict[str, Any]
        if include_explanation:
            explanation = await self.openrouter.explain(
                snapshot=provenance,
                historical_analysis=unsup,
                operational_drift=drift,
                recommended_actions=actions,
            )
            llm_result = explanation.model_dump()
        else:
            llm_result = {
                "status": "DISABLED",
                "summary": "Explanation omitted by request.",
            }

        # Step 5: Persist sanitized analysis event in thread-safe SQLite
        sanitized_provenance = sanitize_context_data(provenance)
        with self.lock:
            self.state_store.save_analysis(
                analysis_id=analysis_id,
                project_id=str(project_id) if project_id else None,
                model_version="nirikshak-ai-v1.0.0",
                snapshot=sanitized_provenance,
                historical_result=unsup,
                drift_result=drift,
                actions=actions,
                llm=llm_result,
            )

        return {
            "analysis_id": analysis_id,
            "model_version": "nirikshak-ai-v1.0.0",
            "versions": versions.model_dump(),
            "project_id": project_id,
            "historical_analysis": unsup,
            "unsupervised": unsup,
            "operational_drift": drift,
            "recommended_actions": actions,
            "input_quality": input_quality.model_dump(),
            "llm": llm_result,
            "provenance": sanitized_provenance,
            "decision_guardrail": (
                "AI output is advisory only. Government officials remain responsible "
                "for approvals, inspections, contract awards, payments and legal decisions."
            ),
        }

    def learn_verified_snapshot(self, snapshot_input: dict[str, Any] | ProjectSnapshot, verified: bool) -> dict[str, Any]:
        """Online learner update. MUST require verified=True from designated Government authority."""
        if not verified:
            return {
                "learned": False,
                "reason": "Snapshot is not Government-verified. Unverified contractor submissions cannot train the model.",
            }
        
        flat_p, _ = extract_flat_features(snapshot_input)
        with self.lock:
            return self.online.learn(flat_p, verified=True)

    def submit_recommendation_feedback(
        self,
        analysis_id: str,
        action: str,
        government_feedback: str,
        note: str | None = None,
    ) -> dict[str, Any]:
        """
        Feedback on specific recommended action.
        Government feedback (POST /feedback) MUST ONLY:
        - validate analysis
        - validate action belongs to analysis
        - store feedback in state store
        - return success with policy_updated=False
        It must NOT update LinUCB or create final outcome records.
        """
        prior = self.state_store.get_analysis(analysis_id)
        if not prior:
            return {
                "stored": False,
                "policy_updated": False,
                "reason": f"Analysis ID {analysis_id} not found in state store.",
            }

        valid_actions = [a["action"] for a in prior.get("actions", [])]
        if action not in valid_actions:
            return {
                "stored": False,
                "policy_updated": False,
                "reason": f"Action '{action}' was not among the recommendations for analysis {analysis_id}: {valid_actions}",
            }

        if self.state_store.has_feedback_for_action(analysis_id, action):
            return {
                "stored": True,
                "policy_updated": False,
                "already_recorded": True,
                "analysis_id": analysis_id,
                "action": action,
            }

        with self.lock:
            self.state_store.record_feedback(analysis_id, action, government_feedback, note)

        return {
            "stored": True,
            "policy_updated": False,
            "analysis_id": analysis_id,
            "action": action,
        }

    def learn_action_outcome(
        self,
        analysis_id: str,
        action: str,
        current_snapshot_input: dict[str, Any] | ProjectSnapshot,
        government_feedback: str | None = None,
        current_snapshot_verified: bool = False,
    ) -> dict[str, Any]:
        """
        Only POST /learn/outcome performs final RL policy update.
        Flow:
        - load baseline analysis
        - load recommended action
        - load stored Government feedback (or use provided feedback)
        - receive later Government-verified snapshot
        - compare verified before/after metrics
        - calculate reward components
        - update LinUCB ONCE
        - record verified outcome (idempotent per analysis_id + action)
        """
        if not current_snapshot_verified:
            return {
                "updated": False,
                "reason": "RL policy updates require a Government-verified outcome snapshot.",
            }

        prior = self.state_store.get_analysis(analysis_id)
        if not prior:
            return {
                "updated": False,
                "reason": f"Original analysis {analysis_id} not found in state store.",
            }

        valid_actions = [a["action"] for a in prior.get("actions", [])]
        if action not in valid_actions:
            return {
                "updated": False,
                "reason": f"Action '{action}' was not among the recommendations for analysis {analysis_id}.",
            }

        # Idempotency check: unique final outcome per analysis_id + action
        if self.state_store.has_outcome_for_action(analysis_id, action):
            existing = self.state_store.get_outcome_for_action(analysis_id, action)
            return {
                "updated": False,
                "already_recorded": True,
                "analysis_id": analysis_id,
                "action": action,
                "reward": existing["reward"] if existing else None,
                "reason": f"Outcome already recorded for action '{action}' on analysis {analysis_id}.",
            }

        # If government_feedback is not explicitly passed in this call, load prior stored feedback
        effective_feedback = government_feedback
        if not effective_feedback:
            stored_fb = self.state_store.get_feedback_for_action(analysis_id, action)
            if stored_fb:
                effective_feedback = stored_fb.get("feedback")

        prev_flat, _ = extract_flat_features(prior["snapshot"])
        curr_flat, curr_prov = extract_flat_features(current_snapshot_input)
        unsup = prior["historical_result"]

        with self.lock:
            ctx = self.policy.context(prev_flat, unsup)
            reward, components = outcome_reward_components(prev_flat, curr_flat, effective_feedback)
            self.policy.update(action, ctx, reward)
            outcome_payload = {
                "outcome_snapshot": curr_prov,
                "reward_components": components,
                "effective_feedback": effective_feedback,
            }
            self.state_store.record_outcome(analysis_id, action, reward, outcome_payload)

        return {
            "updated": True,
            "analysis_id": analysis_id,
            "action": action,
            "reward": round(reward, 4),
            "reward_components": components,
            "policy_updates": self.policy.updates,
        }

    def health_check(self) -> dict[str, str]:
        openrouter_status = "READY" if self.openrouter.is_configured else "DISABLED" if not self.openrouter.enabled else "UNAVAILABLE"
        return {
            "status": "ok",
            "historical_model": "READY",
            "online_model": "READY",
            "rl_policy": "READY",
            "openrouter": openrouter_status,
            "model_version": "nirikshak-ai-v1.0.0",
        }

    def model_info(self) -> dict[str, Any]:
        info_file = self.root / "models" / "model_info.json"
        if info_file.exists():
            return json.loads(info_file.read_text(encoding="utf-8"))
        return {
            "model_version": "nirikshak-ai-v1.0.0",
            "status": "active",
        }
