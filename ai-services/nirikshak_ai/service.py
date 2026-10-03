"""Coordinator service for NIRIKSHAK AI intelligence."""
from __future__ import annotations
from pathlib import Path
import json
import uuid
import threading
from typing import Any

from .engine import HistoricalUnsupervisedEngine
from .online import OnlineDriftLearner
from .bandit import LinUCBPolicy, outcome_reward
from .state_store import StateStore
from .openrouter import OpenRouterClient, sanitize_context_data
from .schemas import extract_flat_features, ProjectSnapshot

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
            
            # Step 2: Online drift scoring
            drift = self.online.score(flat_p)
            
            # Step 3: LinUCB contextual bandit recommendation ranking
            ctx = self.policy.context(flat_p, unsup)
            actions = self.policy.rank(ctx, top_k=top_k_actions)

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
            "project_id": project_id,
            "historical_analysis": unsup,
            "unsupervised": unsup,
            "operational_drift": drift,
            "recommended_actions": actions,
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
        government_feedback: str,
        note: str | None = None,
    ) -> dict[str, Any]:
        """Feedback on recommended actions. Updates LinUCB policy and logs to SQLite."""
        prior = self.state_store.get_analysis(analysis_id)
        if not prior:
            return {
                "updated": False,
                "reason": f"Analysis ID {analysis_id} not found in state store.",
            }

        # Calculate reward directly from government feedback rating
        feedback_val = str(government_feedback).lower()
        reward_map = {
            "useful": 1.0,
            "accepted": 0.8,
            "neutral": 0.0,
            "rejected": -0.6,
            "harmful": -1.0,
        }
        reward = reward_map.get(feedback_val, 0.0)

        # Get context from the original analysis
        flat_p, _ = extract_flat_features(prior["snapshot"])
        unsup = prior["historical_result"]
        top_action = prior["actions"][0]["action"] if prior.get("actions") else "MONITOR_ONLY"

        with self.lock:
            ctx = self.policy.context(flat_p, unsup)
            self.policy.update(top_action, ctx, reward)
            self.state_store.record_feedback(analysis_id, government_feedback, note)
            self.state_store.record_outcome(analysis_id, top_action, reward, {"feedback": government_feedback})

        return {
            "updated": True,
            "analysis_id": analysis_id,
            "action": top_action,
            "reward": round(reward, 4),
            "policy_updates": self.policy.updates,
        }

    def learn_action_outcome(
        self,
        analysis_id: str,
        action: str,
        current_snapshot_input: dict[str, Any] | ProjectSnapshot,
        government_feedback: str,
        current_snapshot_verified: bool,
    ) -> dict[str, Any]:
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

        prev_flat, _ = extract_flat_features(prior["snapshot"])
        curr_flat, curr_prov = extract_flat_features(current_snapshot_input)
        unsup = prior["historical_result"]

        with self.lock:
            ctx = self.policy.context(prev_flat, unsup)
            reward = outcome_reward(prev_flat, curr_flat, government_feedback)
            self.policy.update(action, ctx, reward)
            self.state_store.record_outcome(analysis_id, action, reward, curr_prov)

        return {
            "updated": True,
            "analysis_id": analysis_id,
            "action": action,
            "reward": round(reward, 4),
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
