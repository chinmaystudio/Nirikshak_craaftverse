# NIRIKSHAK AI Architecture Guide

**Version:** 1.0.0  
**Service:** `ai-services` (Python 3.11+ / FastAPI)  
**Security Gateway:** Express Backend (`backend/src/modules/ai/`)  
**Database Authority:** Supabase PostgreSQL with Row Level Security (RLS)  

---

## 1. Executive Summary & Design Principles

NIRIKSHAK Craftverse implements an enterprise, multi-tier artificial intelligence service for public infrastructure oversight. The system transforms raw project telemetry into actionable, prioritized risk intelligence while strictly preserving constitutional and administrative guardrails:

```
GOVERNMENT PORTAL │ CONTRACTOR PORTAL │ CITIZEN PORTAL
                      │
                      ▼
               REACT FRONTEND
                      │ (Authenticated via Supabase JWT)
                      ▼
               EXPRESS BACKEND
            (Auth / Tenancy / RLS)
        ┌─────────────┼──────────────┐
        │             │              │
        ▼             ▼              ▼
     SUPABASE     AI CONTEXT      REALTIME
     DATABASE      BUILDER
        │             │
        │             ▼
        │        AI SERVICES
        │      (Python/FastAPI)
        │ ┌───────────┼───────────┐
        │ │           │           │
        │ ▼           ▼           ▼
        │ Historical  Online ML   Reinforcement
        │ ML Models   Drift Model Learning Policy
        │ (IF, LOF,   (MiniBatch  (LinUCB)
        │  KMeans)     KMeans)
        │ │           │           │
        │ └───────────┼───────────┘
        │             │
        │             ▼
        │        OPENROUTER
        │             │
        │             ▼
        │      NVIDIA NEMOTRON
        │             │
        │             ▼
        │       AI EXPLANATION
        │             │
        │             ▼
        │    RECOMMENDED ACTIONS
        │             │
        ▼             ▼
       GOVERNMENT REVIEW & APPROVAL
                      │
                      ▼
          VERIFIED PROJECT OUTCOME
                      │
                      ▼
             CONTINUOUS LEARNING
```

### Core Guardrails
1. **Advisory Decision Support Only:** AI systems discover anomalies, surface patterns, and rank recommendations. Officials retain sole constitutional and legal authority for approvals, tender awards, payments, and sanctions.
2. **Deterministic ML Over LLM Hallucinations:** Risk bands and anomaly scores are computed deterministically from scikit-learn models. OpenRouter / Nemotron serves strictly as a natural language reasoning and explanation layer.
3. **Strict Provenance Separation:** Telemetry is strictly categorized as `DATABASE_FACT`, `CONTRACTOR_REPORTED`, or `GOVERNMENT_VERIFIED`. Unverified contractor claims can **never** train the online model.
4. **No Direct Browser Access:** The frontend never connects directly to Python AI and never holds the AI shared secret. Express acts as the single security gateway.

---

## 2. Multi-Tier AI Architecture

### Tier 1: Historical Unsupervised Machine Learning
Trained on comprehensive historical infrastructure baselines (`ai-services/models/`):
- **Isolation Forest (`isolation_forest.joblib`):** Quantifies global structural outliers in physical progress, cost ratios, and timeline metrics.
- **Local Outlier Factor (`local_outlier_factor.joblib`):** Assesses density-based neighborhood deviations within specific project archetypes.
- **Project Archetypes (`project_archetypes.joblib`):** MiniBatch K-Means cluster assigner categorizing projects into distinct structural archetypes using SVD dimensionality reduction.
- **Robust Cost Cohorts (`cost_cohort_stats.json`):** Sector-specific median and MAD statistics evaluating cost anomalies without Gaussian assumptions.
- **Review Priority Score:** Calibrated percentile score (0–100) indicating how unusual a project appears compared to the historical baseline.

### Tier 2: Online Operational Drift Detection
Maintains a live streaming representation of operational performance:
- Uses `StandardScaler.partial_fit()` and `MiniBatchKMeans.partial_fit()`.
- Computes operational drift distance against baseline clusters.
- **Verification Requirement:** The online learner only updates when `verified=true` (i.e. after Executive Engineer approval).

### Tier 3: Contextual Bandit Reinforcement Learning (LinUCB)
Recommends targeted administrative interventions:
- **Policy Algorithm:** Disjoint LinUCB with upper confidence bound exploration.
- **Advisory Action Space:**
  - `MONITOR_ONLY`
  - `REQUEST_CONTRACTOR_EVIDENCE`
  - `SCHEDULE_SITE_INSPECTION`
  - `REVIEW_MILESTONE_PLAN`
  - `REVIEW_RESOURCE_PLAN`
  - `REVIEW_COST_VARIANCE`
  - `EXPEDITE_PENDING_APPROVAL`
  - `ESCALATE_GRIEVANCE_REVIEW`
- **Feedback & Outcomes:** Government officials submit feedback (`USEFUL`, `ACCEPTED`, `NEUTRAL`, `REJECTED`, `HARMFUL`) which updates covariance matrices and ridge regressions in real time.

### Tier 4: Reasoning & Explanation Layer (OpenRouter / NVIDIA Nemotron)
- Receives sanitized project facts, deterministic ML scores, and top LinUCB recommended actions.
- Explains findings through strict Pydantic structured schemas (`LLMExplanationSchema`).
- Handles missing API keys or upstream outages with graceful degradation (`status="UNAVAILABLE"`), ensuring deterministic ML inference is never blocked.

---

## 3. Security & State Persistence

### Secret Gateway Authentication
- Express passes the `X-Nirikshak-AI-Key` header with `AI_SERVICE_SHARED_SECRET`.
- Python FastAPI validates this header via constant-time comparison (`secrets.compare_digest`).

### SQLite Local State Store
- Located at `ai-services/state/nirikshak_ai_state.sqlite3`.
- Safely manages thread-safe analysis events, Government feedback, and outcome updates via `threading.RLock()`.
- Gitignored to prevent accidental exposure of operational state.

### Privacy & Sanitization
- The `sanitizer.py` utility scrubs Aadhaar numbers, PAN, email addresses, phone numbers, JWT tokens, and internal keys before generating prompts for external LLMs.
