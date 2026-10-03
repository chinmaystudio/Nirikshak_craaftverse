#!/usr/bin/env python3
"""Manual smoke test for OpenRouter reasoning layer (runs when OPENROUTER_API_KEY is present)."""
from __future__ import annotations
import os
import sys
import asyncio
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))

from nirikshak_ai.openrouter import OpenRouterClient

async def main():
    api_key = os.getenv("OPENROUTER_API_KEY", "").strip()
    if not api_key:
        print("[SKIPPED] OPENROUTER_API_KEY is not set. Skipping live OpenRouter call.")
        return

    print("Testing live OpenRouter reasoning connection...")
    client = OpenRouterClient()

    sample_snapshot = {
        "project_name": "Flyover Construction Corridor",
        "sector": "Transport",
        "subsector": "Roads and bridges",
        "total_cost_inr_crore": 320.0,
        "contractor_reported_progress_pct": 70.0,
        "government_verified_progress_pct": 50.0,
        "schedule_variance_days": 45.0,
    }
    sample_historical = {
        "review_priority_score": 88.5,
        "review_band": "UNUSUAL",
        "cost_anomaly_score": 75.0,
        "structural_anomaly_score": 82.0,
    }
    sample_drift = {"available": False}
    sample_actions = [
        {"action": "SCHEDULE_SITE_INSPECTION", "score": 2.8, "learned_mean_reward": 1.9, "uncertainty_bonus": 0.9}
    ]

    result = await client.explain(
        snapshot=sample_snapshot,
        historical_analysis=sample_historical,
        operational_drift=sample_drift,
        recommended_actions=sample_actions,
    )

    print("\nOpenRouter Result Status:", result.status)
    print("Model:", result.model)
    print("Summary:", result.summary)
    print("Key Findings Count:", len(result.key_findings))
    print("Recommended Actions Count:", len(result.recommended_actions))

if __name__ == "__main__":
    asyncio.run(main())
