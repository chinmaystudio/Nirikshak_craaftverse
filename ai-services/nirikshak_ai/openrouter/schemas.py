"""Pydantic schemas for OpenRouter structured explanations."""
from __future__ import annotations
from typing import Literal
from pydantic import BaseModel, Field

class KeyFinding(BaseModel):
    title: str
    severity: Literal["LOW", "MEDIUM", "HIGH"]
    reason: str
    evidence_keys: list[str] = Field(default_factory=list)

class RecommendedActionItem(BaseModel):
    action: str
    reason: str
    priority: Literal["LOW", "MEDIUM", "HIGH"]
    responsible_party: Literal["GOVERNMENT", "CONTRACTOR", "BOTH"]

class ContractorEvaluation(BaseModel):
    contractor_name: str | None = None
    performance_rating: Literal["LOW", "MODERATE", "HIGH", "EXCELLENT"] | None = "MODERATE"
    risk_band: Literal["LOW", "MEDIUM", "HIGH", "CRITICAL"] | None = "MEDIUM"
    strengths: list[str] = Field(default_factory=list)
    risk_factors: list[str] = Field(default_factory=list)
    compliance_notes: list[str] = Field(default_factory=list)
    recommendation: str | None = None

class LLMExplanationSchema(BaseModel):
    summary: str
    key_findings: list[KeyFinding] = Field(default_factory=list)
    recommended_actions: list[RecommendedActionItem] = Field(default_factory=list)
    contractor_evaluation: ContractorEvaluation | None = None
    missing_information: list[str] = Field(default_factory=list)
    government_review_notes: list[str] = Field(default_factory=list)
    contractor_followups: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)

class LLMExplanationResult(BaseModel):
    status: Literal["READY", "DISABLED", "UNAVAILABLE", "ERROR"]
    provider: str = "Google Gemini 3.1 Pro"
    model: str = ""
    summary: str = ""
    key_findings: list[KeyFinding] = Field(default_factory=list)
    recommended_actions: list[RecommendedActionItem] = Field(default_factory=list)
    contractor_evaluation: ContractorEvaluation | None = None
    missing_information: list[str] = Field(default_factory=list)
    government_review_notes: list[str] = Field(default_factory=list)
    contractor_followups: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)

