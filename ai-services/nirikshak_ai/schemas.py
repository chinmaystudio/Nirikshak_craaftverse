"""Pydantic request and response schemas for NIRIKSHAK AI Service."""
from __future__ import annotations
from typing import Any, Literal
from pydantic import BaseModel, Field

class ProjectCore(BaseModel):
    project_id: str | None = None
    nirikshak_project_id: str | None = None
    project_name: str | None = None
    sector: str | None = None
    subsector: str | None = None
    authority: str | None = None
    location: str | None = None
    total_cost_inr_crore: float | None = None
    award_date: str | None = None
    planned_start_date: str | None = None
    planned_completion_date: str | None = None
    revised_completion_date: str | None = None
    normalized_status: str | None = None
    reported_status: str | None = None
    project_description: str | None = None
    quality_score: float | None = None
    record_scope: str | None = "Project"

class ContractorReported(BaseModel):
    contractor_reported_progress_pct: float | None = None
    reported_at: str | None = None
    completed_work: str | None = None
    planned_work: str | None = None
    challenges: str | None = None
    resource_shortage_ratio: float | None = None
    manpower_count: int | None = None
    equipment_availability: float | None = None
    evidence_count: int | None = None
    site_photo_count: int | None = None
    contractor_delay_reason: str | None = None

class GovernmentVerified(BaseModel):
    government_verified_progress_pct: float | None = None
    verified_at: str | None = None
    verified_by_role: str | None = None
    planned_progress_pct: float | None = None
    schedule_variance_days: float | None = None
    inspection_defects: int | None = None
    quality_findings: str | None = None
    government_delay_reason: str | None = None
    approval_delay_days: float | None = None

class FinanceSection(BaseModel):
    sanctioned_amount: float | None = None
    revised_amount: float | None = None
    amount_spent: float | None = None
    financial_progress: float | None = None
    cost_variance_pct: float | None = None
    payment_delay_days: float | None = None
    pending_claim_amount: float | None = None

class ComplaintsSection(BaseModel):
    open_complaints: int | None = 0
    high_severity_complaints: int | None = 0
    complaints_last_30_days: int | None = 0
    resolved_complaints: int | None = 0

class ProjectSnapshot(BaseModel):
    project: ProjectCore = Field(default_factory=ProjectCore)
    contractor_reported: ContractorReported = Field(default_factory=ContractorReported)
    government_verified: GovernmentVerified = Field(default_factory=GovernmentVerified)
    finance: FinanceSection = Field(default_factory=FinanceSection)
    complaints: ComplaintsSection = Field(default_factory=ComplaintsSection)
    inspections: list[dict[str, Any]] = Field(default_factory=list)
    resources: dict[str, Any] = Field(default_factory=dict)
    legal: dict[str, Any] = Field(default_factory=dict)
    environment: dict[str, Any] = Field(default_factory=dict)
    metadata: dict[str, Any] = Field(default_factory=dict)

    def to_flat_dict(self) -> dict[str, Any]:
        """Flattens the structured snapshot into feature dictionary expected by ML engines."""
        flat = {}
        # Core project fields
        p = self.project
        flat["project_id"] = p.project_id or p.nirikshak_project_id
        flat["nirikshak_project_id"] = p.nirikshak_project_id
        flat["project_name"] = p.project_name
        flat["project_authority"] = p.authority
        flat["sector"] = p.sector
        flat["subsector"] = p.subsector
        flat["normalized_status"] = p.normalized_status
        flat["reported_status"] = p.reported_status
        flat["record_scope"] = p.record_scope or "Project"
        flat["total_cost_inr_crore"] = p.total_cost_inr_crore
        flat["award_date"] = p.award_date
        flat["quality_score"] = p.quality_score

        # Contractor fields
        c = self.contractor_reported
        flat["contractor_reported_progress_pct"] = c.contractor_reported_progress_pct
        flat["resource_shortage_ratio"] = c.resource_shortage_ratio
        flat["evidence_count"] = c.evidence_count

        # Government verified fields
        g = self.government_verified
        flat["government_verified_progress_pct"] = g.government_verified_progress_pct
        flat["planned_progress_pct"] = g.planned_progress_pct
        flat["schedule_variance_days"] = g.schedule_variance_days
        flat["inspection_defects"] = g.inspection_defects
        flat["pending_approval_days"] = g.approval_delay_days

        # Finance
        f = self.finance
        flat["cost_variance_pct"] = f.cost_variance_pct
        flat["payment_delay_days"] = f.payment_delay_days

        # Complaints
        comp = self.complaints
        flat["open_complaints"] = comp.open_complaints
        flat["high_severity_complaints"] = comp.high_severity_complaints

        return flat

TRACKED_INPUT_FIELDS = [
    "project_name",
    "sector",
    "subsector",
    "authority",
    "total_cost_inr_crore",
    "award_date",
    "quality_score",
    "normalized_status",
    "contractor_reported_progress_pct",
    "government_verified_progress_pct",
    "planned_progress_pct",
    "schedule_variance_days",
    "cost_variance_pct",
    "resource_shortage_ratio",
    "inspection_defects",
    "approval_delay_days",
    "payment_delay_days",
    "evidence_count",
]

class InputQuality(BaseModel):
    available_fields: int
    missing_fields: list[str] = Field(default_factory=list)
    imputed_historical_fields: list[str] = Field(default_factory=list)
    completeness_score: float

class VersionMetadata(BaseModel):
    service: str = "1.0.0"
    historical_model: str = "nirikshak-historical-v1.0.0"
    online_model: str = "nirikshak-online-v1.0.0"
    rl_policy: str = "linucb-v1.0.0"
    llm_model: str = "gemini-3.1-pro-preview"

def calculate_input_quality(
    flat_data: dict[str, Any],
    imputed_historical_fields: list[str] | None = None,
) -> InputQuality:
    """Evaluates input completeness against tracked project and operational fields."""
    missing = []
    available_count = 0
    for key in TRACKED_INPUT_FIELDS:
        val = flat_data.get(key)
        if key == "authority" and val is None:
            val = flat_data.get("project_authority")
        if key == "approval_delay_days" and val is None:
            val = flat_data.get("pending_approval_days")

        if val is None:
            missing.append(key)
        elif isinstance(val, str) and (val.strip() == "" or val.strip().upper() in ("UNKNOWN", "NULL", "NONE")):
            missing.append(key)
        else:
            available_count += 1

    total = len(TRACKED_INPUT_FIELDS)
    completeness = round(available_count / total, 2) if total > 0 else 0.0

    return InputQuality(
        available_fields=available_count,
        missing_fields=missing,
        imputed_historical_fields=imputed_historical_fields or [],
        completeness_score=completeness,
    )

def extract_flat_features(data: dict[str, Any] | ProjectSnapshot) -> tuple[dict[str, Any], dict[str, Any]]:
    """Returns (flat_feature_dict, provenance_dict)."""
    if isinstance(data, ProjectSnapshot):
        return data.to_flat_dict(), data.model_dump()

    # If it's already a flat dict (e.g. from legacy call or test)
    if "project" not in data and "contractor_reported" not in data:
        return data, {"raw": data}

    # If it's a nested dict matching ProjectSnapshot
    try:
        snapshot = ProjectSnapshot.model_validate(data)
        return snapshot.to_flat_dict(), snapshot.model_dump()
    except Exception:
        return data, {"raw": data}

# API Request/Response Schemas
class AnalyzeRequest(BaseModel):
    snapshot: dict[str, Any] | ProjectSnapshot
    top_k_actions: int = Field(default=3, ge=1, le=8)
    include_explanation: bool = True

class SnapshotRequest(BaseModel):
    snapshot: dict[str, Any] | ProjectSnapshot
    verified: bool = False

class FeedbackRequest(BaseModel):
    analysis_id: str
    action: str
    government_feedback: Literal["accepted", "useful", "neutral", "rejected", "harmful"]
    note: str | None = None

class OutcomeRequest(BaseModel):
    analysis_id: str
    action: str
    current_snapshot: dict[str, Any] | ProjectSnapshot
    government_feedback: Literal["accepted", "useful", "neutral", "rejected", "harmful"] | None = None
    current_snapshot_verified: bool = False

class HistoricalAnalysis(BaseModel):
    project_id: str | None = None
    archetype_cluster: int
    structural_anomaly_score: float
    neighborhood_anomaly_score: float
    cluster_distance_score: float
    cost_anomaly_score: float
    review_priority_score: float
    review_band: str
    signals: list[str] = Field(default_factory=list)
    limitations: list[str] = Field(default_factory=list)

class OperationalDrift(BaseModel):
    available: bool
    live_cluster: int | None = None
    raw_drift_distance: float | None = None
    drift_percentile: float | None = None
    seen_verified_snapshots: int | None = None
    required_verified_snapshots: int | None = None

class RecommendedAction(BaseModel):
    action: str
    score: float
    learned_mean_reward: float
    uncertainty_bonus: float
    reason: str | None = None

class AnalyzeResponse(BaseModel):
    analysis_id: str
    model_version: str = "nirikshak-ai-v1.0.0"
    versions: VersionMetadata = Field(default_factory=VersionMetadata)
    project_id: str | None = None
    historical_analysis: HistoricalAnalysis
    operational_drift: OperationalDrift
    recommended_actions: list[RecommendedAction]
    input_quality: InputQuality
    llm: dict[str, Any] = Field(default_factory=dict)
    provenance: dict[str, Any] = Field(default_factory=dict)
    decision_guardrail: str = (
        "AI output is advisory only. Government officials remain responsible "
        "for approvals, inspections, contract awards, payments and legal decisions."
    )

class HealthResponse(BaseModel):
    status: str
    historical_model: str
    online_model: str
    rl_policy: str
    openrouter: str
    model_version: str
