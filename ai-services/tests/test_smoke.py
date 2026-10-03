import sys
import asyncio
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from nirikshak_ai import NirikshakAI

def test_smoke():
    ai = NirikshakAI(ROOT)
    project = {
        "project_id": "TEST-1",
        "project_name": "Road Improvement",
        "project_authority": "Government",
        "sector": "Transport",
        "subsector": "Roads and bridges",
        "record_scope": "Project",
        "normalized_status": "UNDER_CONSTRUCTION",
        "reported_status": "work in progress",
        "total_cost_inr_crore": 500,
        "award_date": "2025-01-01",
        "quality_score": 0.9,
        "contractor_reported_progress_pct": 60,
        "government_verified_progress_pct": 52,
        "planned_progress_pct": 70,
        "schedule_variance_days": 20,
        "cost_variance_pct": 8,
        "high_severity_complaints": 1,
        "inspection_defects": 2,
        "resource_shortage_ratio": 0.25,
        "pending_approval_days": 5,
        "evidence_count": 6,
    }
    result = asyncio.run(ai.analyze(project, include_explanation=False))
    assert 0 <= result["unsupervised"]["review_priority_score"] <= 100
    assert len(result["recommended_actions"]) == 3
    rejected = ai.learn_verified_snapshot(project, verified=False)
    assert rejected["learned"] is False

if __name__ == "__main__":
    test_smoke()
    print("SMOKE TEST PASSED")
