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
    target_action = actions[0]["action"]

    # 1. Successful action-specific feedback
    fb_res = ai_service.submit_recommendation_feedback(
        analysis_id=analysis_id,
        action=target_action,
        government_feedback="useful",
        note="Field team deployed as recommended.",
    )
    assert fb_res["updated"] is True
    assert fb_res["action"] == target_action
    assert fb_res["reward"] == 1.0

    # 2. Reject duplicate feedback for the same action
    dup_res = ai_service.submit_recommendation_feedback(
        analysis_id=analysis_id,
        action=target_action,
        government_feedback="useful",
    )
    assert dup_res["updated"] is False
    assert "already recorded" in dup_res["reason"].lower()

    # 3. Reject invalid action not in original recommendations
    invalid_res = ai_service.submit_recommendation_feedback(
        analysis_id=analysis_id,
        action="INVALID_UNRECOMMENDED_ACTION_XYZ",
        government_feedback="useful",
    )
    assert invalid_res["updated"] is False
    assert "was not among the recommendations" in invalid_res["reason"].lower()

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
        assert "input_quality" in data
        assert "versions" in data

# 13. Input Quality and Provenance Tracking Test
def test_input_quality_and_provenance(ai_service):
    # Snapshot missing quality_score, planned_progress_pct, resource_shortage_ratio
    incomplete_snapshot = {
        "project": {
            "project_id": "TEST-PROJ-INCOMPLETE",
            "project_name": "Rural Road Link",
            "total_cost_inr_crore": 45.0,
            "award_date": "2023-05-01",
            # quality_score is missing
        },
        "contractor_reported": {
            "contractor_reported_progress_pct": 30.0,
            # resource_shortage_ratio is missing
        },
        "government_verified": {
            "government_verified_progress_pct": 28.0,
            # planned_progress_pct is missing
        }
    }
    res = asyncio.run(ai_service.analyze(incomplete_snapshot, top_k_actions=2, include_explanation=False))
    iq = res["input_quality"]
    assert "quality_score" in iq["missing_fields"]
    assert "planned_progress_pct" in iq["missing_fields"]
    assert "resource_shortage_ratio" in iq["missing_fields"]
    assert "quality_score" in iq["imputed_historical_fields"]
    assert 0.0 <= iq["completeness_score"] <= 1.0
    assert iq["available_fields"] > 0

# 14. Data Sanitizer Coverage Test
def test_data_sanitizer():
    from nirikshak_ai.openrouter.sanitizer import sanitize_context_data, sanitize_text

    # Inline text sanitization
    raw_text = (
        "Contact engineer.patil@gov.in or phone +91 98765 43210. "
        "Aadhaar: 1234 5678 9012, PAN: ABCDE1234F, JWT: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.doNotLeakThisSignature "
        "Key: sk-or-v1-abcdef0123456789abcdef0123456789"
    )
    cleaned_text = sanitize_text(raw_text)
    assert "[REDACTED_EMAIL]" in cleaned_text
    assert "[REDACTED_PHONE]" in cleaned_text
    assert "[REDACTED_AADHAAR]" in cleaned_text
    assert "[REDACTED_PAN]" in cleaned_text
    assert "[REDACTED_JWT]" in cleaned_text
    assert "[REDACTED_KEY]" in cleaned_text

    # Dictionary key-level redaction
    sensitive_dict = {
        "citizen_name": "Rahul Sharma",
        "aadhaar": "1234 5678 9012",
        "pan": "ABCDE1234F",
        "competitor_bid": 105.5,
        "public_description": "Bridge foundation work underway.",
    }
    sanitized = sanitize_context_data(sensitive_dict)
    assert sanitized["citizen_name"] == "[REDACTED]"
    assert sanitized["aadhaar"] == "[REDACTED]"
    assert sanitized["pan"] == "[REDACTED]"
    assert sanitized["competitor_bid"] == "[REDACTED]"
    assert sanitized["public_description"] == "Bridge foundation work underway."

# 15. Security Configuration and Fail-Closed Verification Test
def test_security_configuration_validation():
    from nirikshak_ai.security import validate_security_configuration, verify_ai_service_key
    from fastapi import HTTPException

    # 1. Production without secret must abort startup
    with patch.dict(os.environ, {"ENVIRONMENT": "production", "AI_SERVICE_SHARED_SECRET": "", "AI_ALLOW_INSECURE_DEV": "false"}):
        with pytest.raises(RuntimeError) as exc_info:
            validate_security_configuration()
        assert "CRITICAL SECURITY" in str(exc_info.value)

    # 2. Development without secret and AI_ALLOW_INSECURE_DEV=false must fail-closed on requests
    with patch.dict(os.environ, {"ENVIRONMENT": "development", "AI_SERVICE_SHARED_SECRET": "", "AI_ALLOW_INSECURE_DEV": "false"}):
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(verify_ai_service_key(x_nirikshak_ai_key=None))
        assert exc_info.value.status_code == 403

    # 3. Development with AI_ALLOW_INSECURE_DEV=true succeeds with warning
    with patch.dict(os.environ, {"ENVIRONMENT": "development", "AI_SERVICE_SHARED_SECRET": "", "AI_ALLOW_INSECURE_DEV": "true"}):
        validate_security_configuration()  # Startup succeeds
        asyncio.run(verify_ai_service_key(x_nirikshak_ai_key=None))  # Request allowed

    # 4. Valid secret requires exact match
    with patch.dict(os.environ, {"ENVIRONMENT": "production", "AI_SERVICE_SHARED_SECRET": "a-strong-32-char-secret-configured-here"}):
        validate_security_configuration()  # Startup succeeds
        # Correct secret allowed
        asyncio.run(verify_ai_service_key(x_nirikshak_ai_key="a-strong-32-char-secret-configured-here"))
        # Wrong secret forbidden
        with pytest.raises(HTTPException) as exc_info:
            asyncio.run(verify_ai_service_key(x_nirikshak_ai_key="wrong-secret"))
        assert exc_info.value.status_code == 403


