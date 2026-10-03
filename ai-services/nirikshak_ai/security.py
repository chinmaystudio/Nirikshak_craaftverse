"""Security and shared secret verification for NIRIKSHAK AI Service."""
from __future__ import annotations
import os
import secrets
import logging
from fastapi import Header, HTTPException, status

logger = logging.getLogger("nirikshak.security")

def get_configured_secret() -> str:
    return os.getenv("AI_SERVICE_SHARED_SECRET", "").strip()

def is_development_mode() -> bool:
    env_name = (os.getenv("ENVIRONMENT") or os.getenv("AI_ENVIRONMENT") or "development").strip().lower()
    return env_name in ("development", "dev", "test")

def is_insecure_dev_allowed() -> bool:
    return os.getenv("AI_ALLOW_INSECURE_DEV", "false").strip().lower() in ("true", "1", "yes")

def validate_security_configuration() -> None:
    """Validates security posture at application startup."""
    secret = get_configured_secret()
    if secret:
        return
    if is_development_mode() and is_insecure_dev_allowed():
        logger.warning(
            "⚠️ [SECURITY WARNING] AI_SERVICE_SHARED_SECRET is not configured. "
            "Requests allowed ONLY because AI_ALLOW_INSECURE_DEV=true in development mode. "
            "Do NOT deploy this configuration to production."
        )
        return
    if not is_development_mode():
        raise RuntimeError(
            "CRITICAL SECURITY CONFIGURATION ERROR: AI_SERVICE_SHARED_SECRET is required in production. "
            "Startup aborted to prevent unauthenticated access."
        )
    logger.warning(
        "[SECURITY] AI_SERVICE_SHARED_SECRET is absent and AI_ALLOW_INSECURE_DEV is false. "
        "Protected endpoints will reject incoming requests."
    )

async def verify_ai_service_key(
    x_nirikshak_ai_key: str | None = Header(default=None, alias="X-Nirikshak-AI-Key")
) -> None:
    expected_secret = get_configured_secret()

    if expected_secret:
        if not x_nirikshak_ai_key:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Missing X-Nirikshak-AI-Key header",
            )
        if not secrets.compare_digest(x_nirikshak_ai_key, expected_secret):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Invalid X-Nirikshak-AI-Key",
            )
        return

    # When no secret is configured:
    if is_development_mode() and is_insecure_dev_allowed():
        logger.warning("Permitting request without shared secret due to AI_ALLOW_INSECURE_DEV=true")
        return

    logger.error("Protected endpoint accessed but AI_SERVICE_SHARED_SECRET is unconfigured and insecure dev mode is disabled.")
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="AI service authentication is misconfigured or closed. Set AI_SERVICE_SHARED_SECRET.",
    )
