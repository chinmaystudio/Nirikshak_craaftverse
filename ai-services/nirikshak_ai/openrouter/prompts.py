"""Prompts for OpenRouter explanation and reasoning layer."""
from __future__ import annotations
import json
from typing import Any

SYSTEM_PROMPT = """You are NIRIKSHAK's infrastructure advisory reasoning layer.
Your role is to explain unsupervised machine learning signals and contextual-bandit action recommendations to Government engineers and project oversight authorities.

CRITICAL RULES:
1. Use ONLY the supplied project snapshot evidence and deterministic ML scores.
2. Do NOT invent project facts, timelines, or financial amounts.
3. Do NOT modify, recalculate, or fabricate the underlying ML scores.
4. Clearly distinguish:
   - CONTRACTOR_REPORTED: Unverified progress and claims submitted by the contractor.
   - GOVERNMENT_VERIFIED: Formal progress, defect findings, and milestones verified by officials.
   - DATABASE_FACT: Contract values, sanction dates, and formal administrative records.
   - AI_INFERENCE: Unsupervised anomaly percentiles, cluster distances, and LinUCB policy ranks.
5. Do NOT approve or reject any progress, payment, or contractor proposal.
6. Do NOT select or disqualify contractors.
7. Do NOT recommend illegal, unconstitutional, or non-compliant actions.
8. Output VALID JSON ONLY matching the requested schema. No markdown formatting outside the JSON, no prologue, no epilogue.
"""

def build_user_prompt(
    sanitized_snapshot: dict[str, Any],
    historical_analysis: dict[str, Any],
    operational_drift: dict[str, Any],
    recommended_actions: list[dict[str, Any]],
) -> str:
    payload = {
        "project_snapshot": sanitized_snapshot,
        "historical_ml_scores": historical_analysis,
        "operational_drift": operational_drift,
        "policy_recommended_actions": recommended_actions,
    }
    
    return f"""Please analyze this infrastructure project and provide a structured advisory explanation in JSON.

INPUT DATA:
{json.dumps(payload, indent=2, default=str)}

JSON SCHEMA REQUIREMENTS:
{{
  "summary": "Clear, concise 2-3 sentence overview explaining why this project was flagged and its overall operational state.",
  "key_findings": [
    {{
      "title": "Short descriptive title of finding",
      "severity": "LOW | MEDIUM | HIGH",
      "reason": "Clear explanation referencing specific evidence",
      "evidence_keys": ["e.g. schedule_variance_days", "cost_anomaly_score"]
    }}
  ],
  "recommended_actions": [
    {{
      "action": "Name of action aligned with policy recommendations",
      "reason": "Why this action is recommended based on evidence",
      "priority": "LOW | MEDIUM | HIGH",
      "responsible_party": "GOVERNMENT | CONTRACTOR | BOTH"
    }}
  ],
  "contractor_evaluation": {{
    "contractor_name": "Name of assigned contractor if present in snapshot",
    "performance_rating": "LOW | MODERATE | HIGH | EXCELLENT",
    "risk_band": "LOW | MEDIUM | HIGH | CRITICAL",
    "strengths": ["Key contractor execution capabilities and demonstrated strengths"],
    "risk_factors": ["Specific contractor risks, defects, or workload exposure to watch"],
    "compliance_notes": ["Statutory tax, bank guarantee, and labor compliance observations"],
    "recommendation": "Objective contractor performance recommendation for designated officers"
  }},
  "missing_information": ["List of unverified or missing data points needed for complete assessment"],
  "government_review_notes": ["Specific points for government engineers to verify during review or site inspection"],
  "contractor_followups": ["Specific clarifications or documentation the contractor should provide"],
  "limitations": [
    "Unsupervised scores indicate statistical deviation, not confirmed fraud or guaranteed delay.",
    "Advisory only; final authority rests with designated government officials."
  ]
}}

Return ONLY the raw JSON object. Do not include markdown code block tags (```json)."""

def build_repair_prompt(invalid_content: str, error_msg: str) -> str:
    return f"""The previous response was not valid JSON conforming to the schema.
Validation error: {error_msg}

Previous response:
{invalid_content[:2000]}

Please correct and output ONLY the valid JSON object conforming to the schema."""
