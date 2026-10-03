#!/usr/bin/env python3
"""Comprehensive smoke test for NIRIKSHAK AI Service models and state."""
from __future__ import annotations
import sys
import asyncio
from pathlib import Path

# Add parent directory to sys.path
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from nirikshak_ai import NirikshakAI
from nirikshak_ai.schemas import ProjectSnapshot, ProjectCore, ContractorReported, GovernmentVerified, FinanceSection, ComplaintsSection

async def run_tests():
    print("=" * 60)
    print("NIRIKSHAK AI MODEL & PIPELINE SMOKE TEST")
    print("=" * 60)

    ai = NirikshakAI(ROOT)

    # 1. Health check
    health = ai.health_check()
    assert health["status"] == "ok"
    assert health["historical_model"] == "READY"
    assert health["online_model"] == "READY"
    assert health["rl_policy"] == "READY"
    print("[PASS] Health probe passed:", health)

    # 2. Historical Inference on structured snapshot
    snapshot = ProjectSnapshot(
        project=ProjectCore(
            project_id="PROJ-SMOKE-001",
            project_name="Metro Rail Phase 2 - Elevated Corridor",
            sector="Transport",
            subsector="Urban Transport",
            authority="Pune Municipal Corporation",
            total_cost_inr_crore=450.0,
            award_date="2024-03-15",
            normalized_status="UNDER_CONSTRUCTION",
        ),
        contractor_reported=ContractorReported(
            contractor_reported_progress_pct=65.0,
            resource_shortage_ratio=0.15,
            evidence_count=8,
        ),
        government_verified=GovernmentVerified(
            government_verified_progress_pct=54.0,
            planned_progress_pct=72.0,
            schedule_variance_days=25.0,
            inspection_defects=3,
            approval_delay_days=7.0,
        ),
        finance=FinanceSection(
            sanctioned_amount=450.0,
            cost_variance_pct=12.5,
            payment_delay_days=14.0,
        ),
        complaints=ComplaintsSection(
            open_complaints=4,
            high_severity_complaints=1,
        ),
    )

    print("\nRunning full AI analysis...")
    result = await ai.analyze(snapshot, top_k_actions=3, include_explanation=False)
    
    assert "analysis_id" in result
    assert result["model_version"] == "nirikshak-ai-v1.0.0"
    
    unsup = result["historical_analysis"]
    print("Historical Scores:", {
        "archetype": unsup["archetype_cluster"],
        "review_priority": unsup["review_priority_score"],
        "band": unsup["review_band"],
        "structural_anomaly": unsup["structural_anomaly_score"],
        "cost_anomaly": unsup["cost_anomaly_score"],
    })
    assert 0 <= unsup["review_priority_score"] <= 100
    assert unsup["review_band"] in ("TYPICAL", "MODERATE", "UNUSUAL", "VERY_UNUSUAL")
    print("[PASS] Unsupervised ML scoring verified")

    actions = result["recommended_actions"]
    assert len(actions) == 3
    print("Top actions:", [a["action"] for a in actions])
    print("[PASS] LinUCB recommendation ranking verified")

    # 3. Online Learner: Reject unverified snapshot
    print("\nTesting online learner guardrails...")
    rejected = ai.learn_verified_snapshot(snapshot, verified=False)
    assert rejected["learned"] is False
    print("[PASS] Unverified contractor snapshot correctly rejected")

    # 4. Online Learner: Accept verified snapshot
    accepted = ai.learn_verified_snapshot(snapshot, verified=True)
    assert accepted["learned"] is True
    assert accepted["seen_verified_snapshots"] >= 1
    print("[PASS] Verified government snapshot successfully learned")

    # 5. Recommendation Feedback
    analysis_id = result["analysis_id"]
    target_action = actions[0]["action"]
    fb_res = ai.submit_recommendation_feedback(
        analysis_id=analysis_id,
        action=target_action,
        government_feedback="useful",
        note="Inspection scheduled per recommendation.",
    )
    assert fb_res["updated"] is True
    assert fb_res["action"] == target_action
    print("[PASS] Government feedback successfully updated policy matrices")

    # 6. SQLite State Store Verification
    history = ai.state_store.get_analysis(analysis_id)
    assert history is not None
    assert history["analysis_id"] == analysis_id
    print("[PASS] Analysis and feedback successfully retrieved from SQLite state store")

    print("\n" + "=" * 60)
    print("ALL AI PIPELINE SMOKE TESTS PASSED!")
    print("=" * 60)

if __name__ == "__main__":
    asyncio.run(run_tests())
