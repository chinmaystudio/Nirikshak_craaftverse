"""Data sanitizer for PII, secrets, and confidential data."""
from __future__ import annotations
import re
from typing import Any

# Regex patterns for sensitive data
EMAIL_REGEX = re.compile(r"[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+")
PHONE_REGEX = re.compile(r"(?:\+?91[\-\s]?)?[6-9]\d{9}\b")
AADHAAR_REGEX = re.compile(r"\b\d{4}\s\d{4}\s\d{4}\b")
PAN_REGEX = re.compile(r"\b[A-Z]{5}[0-9]{4}[A-Z]{1}\b")
JWT_REGEX = re.compile(r"eyJ[a-zA-Z0-9_-]+\.eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+")
KEY_REGEX = re.compile(r"(?:sbp_|sk-|eyJh)[a-zA-Z0-9_\-\.]{20,}")

SENSITIVE_KEY_PATTERNS = [
    "password", "secret", "token", "auth", "jwt", "key",
    "aadhaar", "pan", "ssn", "competitor_bid", "confidential"
]

def sanitize_text(text: str) -> str:
    if not isinstance(text, str):
        return text
    text = JWT_REGEX.sub("[REDACTED_JWT]", text)
    text = KEY_REGEX.sub("[REDACTED_KEY]", text)
    text = AADHAAR_REGEX.sub("[REDACTED_AADHAAR]", text)
    text = PAN_REGEX.sub("[REDACTED_PAN]", text)
    text = EMAIL_REGEX.sub("[REDACTED_EMAIL]", text)
    text = PHONE_REGEX.sub("[REDACTED_PHONE]", text)
    return text

def sanitize_context_data(data: Any) -> Any:
    if isinstance(data, dict):
        cleaned = {}
        for k, v in data.items():
            k_lower = str(k).lower()
            if any(pattern in k_lower for pattern in SENSITIVE_KEY_PATTERNS):
                cleaned[k] = "[REDACTED]"
            else:
                cleaned[k] = sanitize_context_data(v)
        return cleaned
    elif isinstance(data, list):
        return [sanitize_context_data(item) for item in data]
    elif isinstance(data, str):
        return sanitize_text(data)
    else:
        return data
