"""Async client for OpenRouter chat completions."""
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
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY", "").strip()
        self.model = model or os.getenv("OPENROUTER_MODEL", "nvidia/nemotron-4-340b-instruct").strip()
        self.base_url = (base_url or os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")).rstrip("/")
        self.app_name = app_name or os.getenv("OPENROUTER_APP_NAME", "NIRIKSHAK").strip()
        self.referer = referer or os.getenv("OPENROUTER_HTTP_REFERER", "").strip()
        
        env_enabled = os.getenv("AI_ENABLE_OPENROUTER", "true").lower() in ("1", "true", "yes")
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
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json",
            "X-Title": self.app_name,
        }
        if self.referer:
            headers["HTTP-Referer"] = self.referer

        payload = {
            "model": self.model,
            "messages": messages,
            "temperature": 0.2,
            "response_format": {"type": "json_object"},
        }

        url = f"{self.base_url}/chat/completions"

        for attempt in range(2):  # initial + 1 retry for transient server codes
            resp = None
            try:
                async with httpx.AsyncClient(timeout=self.timeout) as client:
                    resp = await client.post(url, headers=headers, json=payload)
                
                if resp.status_code in (429, 500, 502, 503, 504) and attempt == 0:
                    logger.warning("OpenRouter transient status %s, retrying once...", resp.status_code)
                    await asyncio.sleep(0.5)
                    continue

                resp.raise_for_status()
                data = resp.json()
                choices = data.get("choices", [])
                if not choices:
                    raise ValueError("OpenRouter returned empty choices list")
                content = choices[0].get("message", {}).get("content", "")
                return content
            except httpx.TimeoutException:
                logger.warning("OpenRouter timed out after %ss; fast-failing to preserve ML response", self.timeout)
                raise
            except httpx.HTTPStatusError as exc:
                status_code = exc.response.status_code
                if attempt == 0 and status_code in (429, 500, 502, 503, 504):
                    logger.warning("OpenRouter HTTP %s, retrying once...", status_code)
                    await asyncio.sleep(0.5)
                    continue
                # Do not retry 400, 401, 403, 404
                raise
            except (httpx.ConnectError, httpx.RequestError) as exc:
                logger.warning("OpenRouter network request error (%s)", exc)
                raise

        raise RuntimeError("OpenRouter failed after retries")

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
                summary="OpenRouter explanation layer is disabled by configuration.",
            )

        if not self.api_key:
            return LLMExplanationResult(
                status="UNAVAILABLE",
                model=self.model,
                summary="OpenRouter API key is not configured.",
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
            logger.error("OpenRouter API call failed: %s", exc)
            return LLMExplanationResult(
                status="UNAVAILABLE",
                model=self.model,
                summary=f"OpenRouter advisory service temporarily unavailable: {type(exc).__name__}",
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
                    summary="OpenRouter response could not be validated into required structured schema.",
                )

        return LLMExplanationResult(
            status="READY",
            provider="OpenRouter",
            model=self.model,
            summary=validated.summary,
            key_findings=validated.key_findings,
            recommended_actions=validated.recommended_actions,
            missing_information=validated.missing_information,
            government_review_notes=validated.government_review_notes,
            contractor_followups=validated.contractor_followups,
            limitations=validated.limitations,
        )
