"""Comprehensive automated test suite for NIRIKSHAK AI Intelligence Service."""
from __future__ import annotations
import os
import sys
import json
import asyncio
import pytest
from pathlib import Path
from unittest.mock import patch, AsyncMock
from fastapi.testclient import TestClient

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from nirikshak_ai import NirikshakAI
from nirikshak_ai.api import app
from nirikshak_ai.schemas import ProjectSnapshot, ProjectCore, ContractorReported, GovernmentVerified
from nirikshak_ai.openrouter.client import OpenRouterClient
from nirikshak_ai.openrouter.schemas import LLMExplanationResult

@pytest.fixture(scope="session")
def ai_service():
    return NirikshakAI(ROOT)

@pytest.fixture
def sample_snapshot_dict():
    return {
        "project": {
            "project_id": "TEST-PROJ-101",
            "project_name": "Metro Viaduct Construction",
            "sector": "Transport",
            "subsector": "Urban Transport",
            "authority": "MahaMetro",
            "total_cost_inr_crore": 350.0,
            "award_date": "2024-01-10",
            "normalized_status": "UNDER_CONSTRUCTION",
        },
        "contractor_reported": {
            "contractor_reported_progress_pct": 60.0,
            "resource_shortage_ratio": 0.2,
            "evidence_count": 5,
        },
        "government_verified": {
            "government_verified_progress_pct": 48.0,
            "planned_progress_pct": 65.0,
            "schedule_variance_days": 30.0,
            "inspection_defects": 2,
            "approval_delay_days": 10.0,
        },
        "finance": {
            "sanctioned_amount": 350.0,
            "cost_variance_pct": 5.0,
        },
        "complaints": {
            "open_complaints": 2,
            "high_severity_complaints": 1,
        },
    }

# 1. Model Loading & Health Test
def test_model_loading_and_health(ai_service):
    health = ai_service.health_check()
    assert health["status"] == "ok"
    assert health["historical_model"] == "READY"
    assert health["online_model"] == "READY"
    assert health["rl_policy"] == "READY"
    assert health["model_version"] == "nirikshak-ai-v1.0.0"

    info = ai_service.model_info()
    assert "model_version" in info
    assert "algorithms" in info

# 2. Historical Inference and Score Range Test
def test_historical_inference_and_score_ranges(ai_service, sample_snapshot_dict):
    result = asyncio.run(ai_service.analyze(sample_snapshot_dict, top_k_actions=3, include_explanation=False))
    assert "analysis_id" in result
    unsup = result["historical_analysis"]
    assert 0 <= unsup["review_priority_score"] <= 100
    assert 0 <= unsup["structural_anomaly_score"] <= 100
    assert 0 <= unsup["neighborhood_anomaly_score"] <= 100
    assert 0 <= unsup["cluster_distance_score"] <= 100
    assert 0 <= unsup["cost_anomaly_score"] <= 100
    assert unsup["review_band"] in ("TYPICAL", "MODERATE", "UNUSUAL", "VERY_UNUSUAL")
    assert isinstance(unsup["signals"], list)
    assert len(result["recommended_actions"]) == 3

# 3. Unknown Categories and Missing Optional Fields Test
def test_unknown_categories_and_missing_fields(ai_service):
    minimal_snapshot = {
        "project": {
            "project_id": "TEST-MINIMAL-001",
            "sector": "NON_EXISTENT_SECTOR",
            "subsector": "UNSEEN_SUBSECTOR",
            "normalized_status": "UNKNOWN_STATUS",
        }
    }
    result = asyncio.run(ai_service.analyze(minimal_snapshot, top_k_actions=3, include_explanation=False))
    assert result["historical_analysis"]["review_priority_score"] >= 0
    assert len(result["recommended_actions"]) == 3

# 4. Online Learner Guardrail: Reject Unverified Snapshot
def test_online_learner_rejects_unverified_snapshot(ai_service, sample_snapshot_dict):
    rejected = ai_service.learn_verified_snapshot(sample_snapshot_dict, verified=False)
    assert rejected["learned"] is False
    assert "not Government-verified" in rejected["reason"]

# 5. Online Learner: Accept Verified Snapshot
def test_online_learner_accepts_verified_snapshot(ai_service, sample_snapshot_dict):
    accepted = ai_service.learn_verified_snapshot(sample_snapshot_dict, verified=True)
    assert accepted["learned"] is True
    assert accepted["seen_verified_snapshots"] >= 1

# 6. RL Recommendation Output and Feedback Test
def test_rl_recommendation_and_feedback(ai_service, sample_snapshot_dict):
    result = asyncio.run(ai_service.analyze(sample_snapshot_dict, top_k_actions=3, include_explanation=False))
    actions = result["recommended_actions"]
    assert len(actions) == 3
    assert all("action" in a and "score" in a for a in actions)

    analysis_id = result["analysis_id"]
    fb_res = ai_service.submit_recommendation_feedback(
        analysis_id=analysis_id,
        government_feedback="useful",
        note="Field team deployed as recommended.",
    )
    assert fb_res["updated"] is True
    assert fb_res["action"] == actions[0]["action"]
    assert fb_res["reward"] == 1.0

# 7. SQLite State Store Persistence Test
def test_sqlite_state_persistence(ai_service, sample_snapshot_dict):
    result = asyncio.run(ai_service.analyze(sample_snapshot_dict, top_k_actions=3, include_explanation=False))
    analysis_id = result["analysis_id"]
    record = ai_service.state_store.get_analysis(analysis_id)
    assert record is not None
    assert record["analysis_id"] == analysis_id
    assert record["project_id"] == "TEST-PROJ-101"

# 8. OpenRouter Disabled Mode Test
def test_openrouter_disabled_mode():
    client = OpenRouterClient(enabled=False)
    res = asyncio.run(client.explain({}, {}, {}, []))
    assert res.status == "DISABLED"

# 9. OpenRouter Missing Key (Unavailable) Test
def test_openrouter_missing_key():
    client = OpenRouterClient(api_key="", enabled=True)
    res = asyncio.run(client.explain({}, {}, {}, []))
    assert res.status == "UNAVAILABLE"

# 10. OpenRouter Mocked Successful Response Test
def test_openrouter_mocked_success():
    client = OpenRouterClient(api_key="test-key-mock", enabled=True)
    mock_llm_json = {
        "summary": "Project shows minor schedule delay with healthy cost metrics.",
        "key_findings": [
            {
                "title": "Minor Schedule Variance",
                "severity": "MEDIUM",
                "reason": "Contractor-reported progress leads verified progress by 12%.",
                "evidence_keys": ["schedule_variance_days"]
            }
        ],
        "recommended_actions": [
            {
                "action": "SCHEDULE_SITE_INSPECTION",
                "reason": "Verify actual site progress against contractor reports.",
                "priority": "HIGH",
                "responsible_party": "GOVERNMENT"
            }
        ],
        "missing_information": ["Concrete curing lab tests"],
        "government_review_notes": ["Verify zone 2 pier foundations"],
        "contractor_followups": ["Submit updated muster rolls"],
        "limitations": ["Advisory assessment only"]
    }

    with patch.object(client, "_call_api", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = json.dumps(mock_llm_json)
        res = asyncio.run(client.explain({}, {}, {}, []))
        assert res.status == "READY"
        assert len(res.key_findings) == 1
        assert res.key_findings[0].title == "Minor Schedule Variance"
        assert res.recommended_actions[0].action == "SCHEDULE_SITE_INSPECTION"

# 11. OpenRouter Invalid JSON Recovery / Fallback Test
def test_openrouter_invalid_json_fallback():
    client = OpenRouterClient(api_key="test-key-mock", enabled=True)
    with patch.object(client, "_call_api", new_callable=AsyncMock) as mock_call:
        mock_call.return_value = "This is not json at all."
        res = asyncio.run(client.explain({}, {}, {}, []))
        assert res.status in ("ERROR", "UNAVAILABLE")

# 12. FastAPI Endpoints & Shared Secret Security Test
def test_fastapi_endpoints_and_security(sample_snapshot_dict):
    client = TestClient(app)

    # Health check is public
    health_resp = client.get("/health")
    assert health_resp.status_code == 200
    assert health_resp.json()["status"] == "ok"

    # Protected endpoint without key when key is configured
    with patch("nirikshak_ai.security.get_configured_secret", return_value="super-secure-shared-secret"):
        unauth_resp = client.post("/analyze", json={"snapshot": sample_snapshot_dict})
        assert unauth_resp.status_code in (401, 403)

        wrong_resp = client.post(
            "/analyze",
            json={"snapshot": sample_snapshot_dict},
            headers={"X-Nirikshak-AI-Key": "wrong-secret"},
        )
        assert wrong_resp.status_code == 403

        # With correct key
        auth_resp = client.post(
            "/analyze",
            json={"snapshot": sample_snapshot_dict, "include_explanation": False},
            headers={"X-Nirikshak-AI-Key": "super-secure-shared-secret"},
        )
        assert auth_resp.status_code == 200
        data = auth_resp.json()
        assert "analysis_id" in data
        assert "historical_analysis" in data
