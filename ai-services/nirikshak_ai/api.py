"""FastAPI application for NIRIKSHAK AI Intelligence Microservice."""
from __future__ import annotations
from pathlib import Path
import os
import logging
from fastapi import FastAPI, HTTPException, Depends, status
from dotenv import load_dotenv

# Load environment variables if .env exists
load_dotenv()

from .service import NirikshakAI
from .security import verify_ai_service_key
from .schemas import (
    AnalyzeRequest,
    AnalyzeResponse,
    SnapshotRequest,
    OutcomeRequest,
    FeedbackRequest,
    HealthResponse,
)

logger = logging.getLogger("nirikshak.api")

ROOT = Path(os.getenv("NIRIKSHAK_MODEL_ROOT", Path(__file__).resolve().parents[1]))

# Singleton AI Coordinator loaded once at startup
ai = NirikshakAI(ROOT)

app = FastAPI(
    title="NIRIKSHAK AI Service",
    version="1.0.0",
    description="Deterministic ML anomaly scoring + verified online drift learning + LinUCB recommendation policy + OpenRouter explanation layer.",
    docs_url="/docs" if os.getenv("ENABLE_SWAGGER", "true").lower() in ("1", "true") else None,
    redoc_url=None,
)

@app.get("/health", response_model=HealthResponse)
def health():
    """Unauthenticated health probe for readiness check (does not leak secrets)."""
    return ai.health_check()

@app.get("/model-info")
def model_info():
    """Returns static model metadata and historical training characteristics."""
    return ai.model_info()

@app.post(
    "/analyze",
    response_model=AnalyzeResponse,
    dependencies=[Depends(verify_ai_service_key)],
)
async def analyze(req: AnalyzeRequest):
    """
    Evaluates project snapshot against:
    1. Historical unsupervised anomaly & archetype models
    2. Online operational drift model
    3. LinUCB contextual-bandit recommendation policy
    4. OpenRouter/Nemotron structured reasoning layer (advisory only)
    """
    try:
        result = await ai.analyze(
            snapshot_input=req.snapshot,
            top_k_actions=req.top_k_actions,
            include_explanation=req.include_explanation,
        )
        return result
    except Exception as exc:
        logger.error("Analysis failed: %s", exc, exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis computation failed: {str(exc)}",
        )

@app.post(
    "/learn/snapshot",
    dependencies=[Depends(verify_ai_service_key)],
)
def learn_snapshot(req: SnapshotRequest):
    """
    Updates the continuous online drift model using verified operational data.
    MUST require verified=True from designated Government authority.
    Unverified contractor data will be rejected.
    """
    try:
        return ai.learn_verified_snapshot(req.snapshot, req.verified)
    except Exception as exc:
        logger.error("Snapshot learning failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

@app.post(
    "/feedback",
    dependencies=[Depends(verify_ai_service_key)],
)
def submit_feedback(req: FeedbackRequest):
    """
    Receives Government official rating on recommendation usefulness.
    Updates LinUCB policy matrices in the state store.
    """
    try:
        res = ai.submit_recommendation_feedback(
            analysis_id=req.analysis_id,
            government_feedback=req.government_feedback,
            note=req.note,
        )
        if not res.get("updated"):
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=res.get("reason"))
        return res
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Feedback submission failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))

@app.post(
    "/learn/outcome",
    dependencies=[Depends(verify_ai_service_key)],
)
def learn_outcome(req: OutcomeRequest):
    """
    Updates the LinUCB recommendation policy from longitudinal project outcomes.
    Requires Government-verified current snapshot.
    """
    try:
        res = ai.learn_action_outcome(
            analysis_id=req.analysis_id,
            action=req.action,
            current_snapshot_input=req.current_snapshot,
            government_feedback=req.government_feedback,
            current_snapshot_verified=req.current_snapshot_verified,
        )
        if not res.get("updated"):
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=res.get("reason"))
        return res
    except HTTPException:
        raise
    except Exception as exc:
        logger.error("Outcome learning failed: %s", exc, exc_info=True)
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))
