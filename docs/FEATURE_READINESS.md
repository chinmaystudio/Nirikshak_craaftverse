# NIRIKSHAK Craftverse — Feature Readiness Matrix

**Version:** 2.0.0  
**Date:** 2026-10-03  
**Status:** Canonical Baseline with First-Class AI Microservice Integration  

This document provides a realistic, honest assessment of the readiness level of every major capability within the NIRIKSHAK Craftverse platform.

---

## Readiness Summary

| Domain / Capability | Readiness Status | Backing Technology | Description |
| :--- | :---: | :--- | :--- |
| **Authentication Core** | **LIVE** | Supabase Auth + JWT | Email/password, session persistence, token verification. |
| **Citizen Registration** | **LIVE** | Express `/api/auth/register` + Supabase Auth | Immediate active citizen access upon registration. |
| **Government Registration** | **LIVE** | Express `/api/auth/register` + `government_access_requests` | PENDING access request created; no immediate role grant. |
| **Government Approval Workflow** | **LIVE** | Supabase RLS + `organization_members` | Government admin approves request and assigns role. |
| **Contractor Registration** | **LIVE** | Express `/api/auth/register` + `contractor_access_requests` | PENDING contractor company onboarding request. |
| **Contractor Approval Workflow**| **LIVE** | Supabase RLS + `organizations` + `organization_members` | Government admin verifies CIN/GSTIN and grants access. |
| **Projects — Public Directory** | **LIVE** | `public_projects_view` | Safe, sanitized view of published projects. |
| **Projects — Government Master** | **LIVE** | `government_project_summary_view` | Complete project attributes for authorized officials. |
| **Projects — Creation** | **LIVE** | Express `POST /api/projects` | Government officer project creation with audit logging. |
| **Tenders — Publishing** | **LIVE** | Express `POST /api/tenders` | Ownership validation against caller government org. |
| **Tenders — Public View** | **LIVE** | Supabase `tenders` table | Real published tenders listed for bidding. |
| **Bids — Submission** | **LIVE** | PostgreSQL RPC `save_tender_bid` | Validates contractor assignment and deadline. |
| **Tender Award / Contracting** | **LIVE** | PostgreSQL RPC `award_contract` | Transactional contract creation from selected bid. |
| **Milestones Management** | **LIVE** | Supabase `project_milestones` + Express `/api/milestones` | Complete milestone lifecycle, unique sequence constraints, weight totals, and frontend CRUD. |
| **Progress Submission** | **LIVE** | PostgreSQL RPC `submit_progress_update` | Contractor submits reported progress & evidence paths. |
| **Progress Verification** | **LIVE** | PostgreSQL RPC `approve_progress_update` | Government official reviews, accepts, or rejects update. |
| **Historical Unsupervised ML** | **LIVE** | Python FastAPI (`ai-services`) | IsolationForest, LOF, MiniBatchKMeans, Robust Cost Anomaly. |
| **Online Drift Learning** | **LIVE** | Python FastAPI (`/learn/snapshot`) | Incremental MiniBatchKMeans updated ONLY on verified data. |
| **RL Action Recommendations** | **LIVE** | Python FastAPI (`LinUCBPolicy`) | Disjoint LinUCB contextual bandit ranking administrative actions. |
| **OpenRouter Explanation Layer**| **LIVE** | Python FastAPI + NVIDIA Nemotron | Generates structured explanations with automatic schema repair. |
| **AI Project Analysis Gateway**| **LIVE** | Express `/api/ai/analyze/:projectId` | Tenancy-checked authorized snapshot dispatched to AI microservice. |
| **Government AI Feedback** | **LIVE** | Express `/api/ai/feedback` | Official reviews update bandit matrices and SQLite event state. |
| **Verified Snapshot Learning** | **LIVE** | Express `progress.service` hook | Triggers post-approval verified learning without blocking DB tx. |
| **Resources & Workforce** | **LIVE** | Supabase V2 (`resource_items`, `project_resource_allocations`, `resource_usage_updates`, `project_workforce_updates`) | Complete resource catalog, allocation, and aggregate workforce reporting. |
| **Finance — Fund Allocations** | **LIVE** | Supabase V2 (`project_budget_heads`, `financial_updates`) | Fund allocations, planned vs actual expenditure, cost variance tracking. |
| **Payment Claims / RA Bills** | **LIVE** | Supabase V2 (`payment_claims`, `payment_claim_documents`, `payments`, RPCs) | Electronic bill submission, verification, approval, and payment recording. |
| **Inspections & Findings** | **LIVE** | Supabase V2 (`inspections`, `inspection_findings`, Storage) | Field inspections, severity-ranked findings, and verification. |
| **Documents Storage** | **LIVE** | Supabase `project_documents` + V2 Storage Buckets & RLS | Document catalog metadata and secure storage bucket policies. |
| **Complaints — Submission** | **LIVE** | Express `POST /api/complaints` + Supabase V2 | Citizen grievance filing with tracking token and resolution updates. |
| **Complaints — Public Tracking** | **LIVE** | Express `GET /api/complaints/track/:ref` | Public grievance tracking with strict PII redaction. |
| **Litigation & Settlements** | **LIVE** | Supabase V2 (`litigations`, `litigation_events`, `settlements`) | Comprehensive court stay orders, hearings, disputes, and settlements. |
| **Environmental Compliance** | **LIVE** | Supabase V2 (`environmental_clearances`, `environmental_baselines`, `environmental_observations`, `environmental_incidents`) | Statutory clearances, baseline parameters, observations, and incidents. |
| **Notifications** | **LIVE** | Supabase `notifications` table + V2 RPC | Real-time and persistent alerts queryable with read-acknowledgement RPC. |
| **Audit Logging** | **LIVE** | Supabase `audit_logs` table V2 | System events recorded with actor org, entity, old/new value, and ip hash. |
| **Realtime Updates** | **LIVE** | Supabase Realtime Channels + Publication V2 | Realtime publication on notifications, progress, tenders, payment claims. |

---

### Detailed AI & MLOps Architecture Breakdown

### 1. Historical Unsupervised Machine Learning (LIVE)
- Pretrained models loaded into memory at microservice startup (`isolation_forest.joblib`, `local_outlier_factor.joblib`, `project_archetypes.joblib`, `preprocessor.joblib`, `cost_cohort_stats.json`, `score_reference.npz`).
- Produces normalized Review Priority Score, Review Band (`TYPICAL`, `WATCHLIST`, `HIGH_PRIORITY`, `VERY_UNUSUAL`), Structural Anomaly Score, Neighborhood Anomaly Score, Cluster Distance, and Robust Cost Anomaly Score.
- Terminology rule strictly enforced: never described as delay probability or fraud probability.

### 2. Online Operational Drift Learning (LIVE)
- Incremental learner using `StandardScaler.partial_fit()` and `MiniBatchKMeans.partial_fit()`.
- Thread-safe updates guarded by `threading.RLock()`.
- **Security Guardrail:** Only updates when `verified=true`. Unverified contractor reports are strictly rejected from updating model weights.

### 3. Reinforcement Learning Contextual Bandit (LIVE)
- LinUCB contextual bandit with 8 administrative action arms (`SCHEDULE_SITE_INSPECTION`, `REVIEW_COST_VARIANCE`, `REQUEST_CONTRACTOR_EVIDENCE`, etc.).
- Exploration bonus balances exploitation with discovering effective oversight strategies.
- Official human feedback (`ACCEPTED`, `USEFUL`, `NEUTRAL`, `REJECTED`, `HARMFUL`) updates covariance matrices and reward registers.

### 4. OpenRouter / NVIDIA Nemotron Explanation Layer (LIVE)
- Async HTTP client with strict Pydantic JSON schema validation (`LLMExplanationSchema`).
- Single-attempt repair flow for malformed responses.
- Resilient fallback: if OpenRouter is unconfigured or unavailable, returns deterministic ML results with `llm.status="UNAVAILABLE"` without blocking analysis.

### 5. Express Security Gateway (LIVE)
- Express authenticates calling user, verifies organization tenancy (or contractor assignment), and extracts clean database context.
- Attaches `X-Nirikshak-AI-Key` secret header.
- Records audit event `AI_PROJECT_ANALYZED` and stores analysis metadata into `ai_insights`.
