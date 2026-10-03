"""Security and shared secret verification for NIRIKSHAK AI Service."""
from __future__ import annotations
import os
import secrets
from fastapi import Header, HTTPException, status

def get_configured_secret() -> str:
    return os.getenv("AI_SERVICE_SHARED_SECRET", "").strip()

async def verify_ai_service_key(
    x_nirikshak_ai_key: str | None = Header(default=None, alias="X-Nirikshak-AI-Key")
) -> None:
    expected_secret = get_configured_secret()
    
    # If a secret is configured in the environment, it MUST be matched
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
    else:
        # Development fallback: if no secret is set, log warning in dev mode
        pass
