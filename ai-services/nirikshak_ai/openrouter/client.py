"""Gemini-only structured explanation client.

The module path is retained for backwards compatibility with existing imports.
No OpenRouter or alternate LLM provider is used.
"""
from __future__ import annotations
import os
import json
import logging
import asyncio
from typing import Any
import httpx
from pydantic import ValidationError

from .schemas import LLMExplanationSchema, LLMExplanationResult, KeyFinding, RecommendedActionItem
from .prompts import SYSTEM_PROMPT, build_user_prompt, build_repair_prompt
from .sanitizer import sanitize_context_data

logger = logging.getLogger("nirikshak.openrouter")

class OpenRouterClient:
    def __init__(
        self,
        api_key: str | None = None,
        model: str | None = None,
        base_url: str | None = None,
        app_name: str | None = None,
        referer: str | None = None,
        enabled: bool | None = None,
        timeout_seconds: float = 8.0,
    ):
        self.api_key = api_key if api_key is not None else os.getenv("GEMINI_API_KEY", "").strip()
        self.model = model if model is not None else os.getenv("GEMINI_MODEL", "gemini-3.1-pro-preview").strip()
        self.base_url = (base_url if base_url is not None else os.getenv("GEMINI_BASE_URL", "https://generativelanguage.googleapis.com/v1beta")).rstrip("/")
        self.app_name = app_name or "NIRIKSHAK"
        self.referer = referer or ""

        env_enabled = os.getenv("AI_ENABLE_GEMINI", "true").lower() in ("1", "true", "yes")
        self.enabled = env_enabled if enabled is None else enabled
        self.timeout = timeout_seconds

    @property
    def is_configured(self) -> bool:
        return bool(self.enabled and self.api_key)

    def _extract_json(self, text: str) -> dict[str, Any]:
        text = text.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            if lines[0].startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].startswith("```"):
                lines = lines[:-1]
            text = "\n".join(lines).strip()
        start = text.find("{")
        end = text.rfind("}")
        if start != -1 and end != -1 and end > start:
            text = text[start : end + 1]
        return json.loads(text)

    async def _call_api(self, messages: list[dict[str, str]]) -> str:
        headers = {"Content-Type": "application/json", "x-goog-api-key": self.api_key}
        system = next((m["content"] for m in messages if m["role"] == "system"), "")
        contents = [{"role": "user" if m["role"] == "user" else "model", "parts": [{"text": m["content"]}]} for m in messages if m["role"] != "system"]
        payload = {
            "systemInstruction": {"parts": [{"text": system}]},
            "contents": contents,
            "generationConfig": {"temperature": 0.2, "responseMimeType": "application/json"},
        }

        candidate_models = list(dict.fromkeys([self.model, "gemini-3.1-pro", "gemini-2.5-pro", "gemini-pro"]))
        last_error = None

        for model_candidate in candidate_models:
            url = f"{self.base_url}/models/{model_candidate}:generateContent"
            for attempt in range(2):
                try:
                    async with httpx.AsyncClient(timeout=self.timeout) as client:
                        resp = await client.post(url, headers=headers, json=payload)
                    
                    if resp.status_code in (429, 500, 502, 503, 504) and attempt == 0:
                        logger.warning("Gemini transient status %s, retrying once...", resp.status_code)
                        await asyncio.sleep(0.5)
                        continue

                    if resp.status_code == 404:
                        logger.warning("Gemini model %s returned 404, attempting fallback...", model_candidate)
                        break

                    resp.raise_for_status()
                    data = resp.json()
                    candidates = data.get("candidates", [])
                    if not candidates:
                        raise ValueError("Gemini returned empty candidates list")
                    content = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
                    return content
                except httpx.TimeoutException:
                    logger.warning("Gemini timed out after %ss for model %s", self.timeout, model_candidate)
                    last_error = httpx.TimeoutException("Gemini timed out")
                    break
                except httpx.HTTPStatusError as exc:
                    status_code = exc.response.status_code
                    last_error = exc
                    if status_code == 404:
                        break
                    if attempt == 0 and status_code in (429, 500, 502, 503, 504):
                        logger.warning("Gemini HTTP %s, retrying once...", status_code)
                        await asyncio.sleep(0.5)
                        continue
                    break
                except (httpx.ConnectError, httpx.RequestError) as exc:
                    logger.warning("Gemini network request error (%s)", exc)
                    last_error = exc
                    break

        raise last_error or RuntimeError("Gemini failed after trying candidate models")

    async def explain(
        self,
        snapshot: dict[str, Any],
        historical_analysis: dict[str, Any],
        operational_drift: dict[str, Any],
        recommended_actions: list[dict[str, Any]],
    ) -> LLMExplanationResult:
        if not self.enabled:
            return LLMExplanationResult(
                status="DISABLED",
                model=self.model,
                summary="Gemini explanation layer is disabled by configuration.",
            )

        if not self.api_key:
            return LLMExplanationResult(
                status="UNAVAILABLE",
                model=self.model,
                summary="Gemini API key is not configured.",
            )

        sanitized_snapshot = sanitize_context_data(snapshot)
        user_prompt = build_user_prompt(
            sanitized_snapshot=sanitized_snapshot,
            historical_analysis=historical_analysis,
            operational_drift=operational_drift,
            recommended_actions=recommended_actions,
        )

        messages = [
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ]

        try:
            content = await self._call_api(messages)
        except Exception as exc:
            logger.error("Gemini API call failed: %s", exc)
            return LLMExplanationResult(
                status="UNAVAILABLE",
                model=self.model,
                summary=f"Gemini advisory service temporarily unavailable: {type(exc).__name__}",
            )

        # Parse and validate structured output
        parsed_data = None
        try:
            parsed_data = self._extract_json(content)
            validated = LLMExplanationSchema.model_validate(parsed_data)
        except (json.JSONDecodeError, ValidationError, Exception) as parse_err:
            logger.warning("OpenRouter output invalid (%s), attempting single repair...", parse_err)
            repair_prompt = build_repair_prompt(content, str(parse_err))
            messages.append({"role": "assistant", "content": content})
            messages.append({"role": "user", "content": repair_prompt})
            try:
                repair_content = await self._call_api(messages)
                parsed_data = self._extract_json(repair_content)
                validated = LLMExplanationSchema.model_validate(parsed_data)
            except Exception as repair_err:
                logger.error("OpenRouter repair attempt failed: %s", repair_err)
                return LLMExplanationResult(
                    status="ERROR",
                    model=self.model,
                    summary="Gemini response could not be validated into required structured schema.",
                )

        return LLMExplanationResult(
            status="READY",
            provider="Google Gemini 3.1 Pro",
            model=self.model,
            summary=validated.summary,
            key_findings=validated.key_findings,
            recommended_actions=validated.recommended_actions,
            contractor_evaluation=validated.contractor_evaluation,
            missing_information=validated.missing_information,
            government_review_notes=validated.government_review_notes,
            contractor_followups=validated.contractor_followups,
            limitations=validated.limitations,
        )
