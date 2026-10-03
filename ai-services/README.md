# NIRIKSHAK AI Intelligence Service

The production AI/ML, online drift, contextual bandit, and LLM reasoning microservice for NIRIKSHAK Craftverse.

---

## 1. Architectural Overview

NIRIKSHAK AI operates as a strictly bounded, advisory decision-support layer within the platform architecture:

```text
Frontend (Government / Contractor / Citizen Portal)
        │
        ▼ (Authenticated JWT & Role Verification)
Express Backend Gateway (Authorized DB Context, Tenant Isolation)
        │
        ▼ (Shared-Secret Auth: X-Nirikshak-AI-Key)
Python AI Microservice (FastAPI + Uvicorn)
        │
   ┌────┴────────────────────────┬─────────────────────────┐
   │                             │                         │
   ▼                             ▼                         ▼
Historical Unsupervised ML   Online Drift Monitor    LinUCB Contextual Bandit
- Isolation Forest           - StandardScaler (inc.) - Action Recommender
- Local Outlier Factor       - MiniBatchKMeans       - Action-specific feedback
- Truncated SVD              - Feature drift         - Duplicate reward guard
- MiniBatch K-Means          - Operational drift     - Seed policy baseline
   │                             │                         │
   └──────────────┬──────────────┴─────────────────────────┘
                  │
                  ▼
         OpenRouter / NVIDIA Nemotron-4-340B-Instruct (Reasoning & Explanations)
                  │ (Context Sanitization, Transient Retries, Graceful Fallback)
                  ▼
         SQLite State Store (WAL mode, Foreign Keys, Idempotent Audit Ledger)
                  │
                  ▼
         Express Backend Gateway
                  │
                  ▼
         Human Government Review & Verification (Authoritative RPC)
                  │
                  ▼
         Continuous Learning (Verified Outlays Only)
```

### Key Principles

1. **Advisory Role**: The AI system assists human officials with structured anomaly signals and audit recommendations. It never replaces official government sanction, statutory verification, or procurement decisions.
2. **Gateway Protection**: The frontend **never** connects directly to Python. All AI requests must traverse the Express backend gateway, which authorizes the user, validates tenant isolation, sanitizes context, and presents the `X-Nirikshak-AI-Key` header.
3. **Fail-Closed Security**: In production, `AI_SERVICE_SHARED_SECRET` is strictly mandatory. In development, running without a secret is forbidden unless explicitly opted-in with `AI_ALLOW_INSECURE_DEV=true`.
4. **Honest Data Integrity**: Missing operational values are **never** converted into artificial zeros. Missing fields retain `null` provenance. Internal median imputation for historical ML models is tracked and exposed via `input_quality`.
5. **Human Verification Invariant**: Contractor-reported data cannot trigger model learning. Continuous learning (`/learn/snapshot` and `/learn/outcome`) occurs only after authoritative government approval.

---

## 2. API Endpoints

All protected endpoints require the HTTP header:
`X-Nirikshak-AI-Key: <AI_SERVICE_SHARED_SECRET>`

### `GET /health`
Returns operational status of the service, model artifacts, and state store.
- **Access**: Public
- **Response**:
  ```json
  {
    "status": "ok",
    "service": "nirikshak-ai",
    "models_ready": true,
    "openrouter_enabled": true,
    "security": "enforced"
  }
  ```

### `GET /model-info`
Provides technical metadata, artifact versions, feature dimensions, and cluster centers.
- **Access**: Protected
- **Response**: Standardized metadata object including `model_version`, feature counts, and hyperparameter specifications.

### `POST /analyze`
Performs comprehensive multi-layer analysis on a project snapshot:
- **Historical Analysis**: Isolation Forest anomaly score, Local Outlier Factor density score, SVD reconstruction error, cluster distance, and sector cost anomalies.
- **Operational Drift**: Continuous drift comparison against historical baseline and recent project cohorts.
- **LinUCB Contextual Bandit**: Recommends top ranked intervention actions (e.g., `REVIEW_RESOURCE_PLAN`, `ON_SITE_QUALITY_INSPECTION`, `EXPEDITE_CONTRACTOR_PAYMENT`).
- **OpenRouter Reasoning**: Generates contextual explanations, risk factor summaries, and limitations using NVIDIA Nemotron. Falls back gracefully if LLM is unavailable without failing the deterministic ML output.
- **Input Quality**: Calculates completeness score and lists missing/imputed fields.

### `POST /feedback`
Records government officer feedback for a **specific** recommended action.
- **Body**:
  ```json
  {
    "analysis_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "action": "REVIEW_RESOURCE_PLAN",
    "government_feedback": "useful",
    "note": "Immediate site inspection confirmed resource shortage."
  }
  ```
- **Validation**: Requires `action` to match one of the actions originally recommended for `analysis_id`. Rejects duplicate feedback.

### `POST /learn/snapshot`
Performs online incremental model updates (`StandardScaler.partial_fit`, `MiniBatchKMeans.partial_fit`) using an authoritative, government-verified project snapshot.
- Requires `verified=True` and `government_verified_progress_pct != null`.

### `POST /learn/outcome`
Computes closed-loop reinforcement learning rewards and updates LinUCB policy matrices based on real project outcomes and officer feedback. Idempotent and guarded against duplicate policy updates.

---

## 3. Important Interpretation Guidelines

### `review_priority_score` is NOT Failure Probability
- `review_priority_score` (0–100) measures **structural and statistical anomaly relative to the historical baseline**.
- It is **NOT**:
  - Fraud probability
  - Contractor corruption score
  - Delay probability
  - Default / failure risk
- A project flagged as `VERY_UNUSUAL` indicates operational patterns that deviate substantially from baseline norms (e.g., rapid outlay without milestone progression, unusual unit cost vs. subsector medians). It warrants prioritized government inspection, not automated punitive action.

---

## 4. Local Installation & Development

### Clean Environment Setup

```bash
# Create and activate virtual environment
python -m venv .venv
.venv\Scripts\activate   # Windows
# source .venv/bin/activate  # Linux/macOS

# Upgrade pip and install runtime dependencies
python -m pip install --upgrade pip
pip install -r requirements.txt
```

### Running the API

```bash
# Configure local environment
copy .env.example .env

# Start microservice
python run_api.py
```

### Running Test Suite

```bash
# Run pytest automated pipeline tests
python -m pytest tests/ -v

# Run model smoke test script
python scripts/model_smoke_test.py
```

---

## 5. Security & Persistence Architecture

- **State Database**: SQLite embedded store at `state/nirikshak_state.sqlite3`.
- **Database Optimizations**: `PRAGMA foreign_keys = ON` and `PRAGMA journal_mode = WAL` enabled for concurrency, data integrity, and crash resilience.
- **Worker Concurrency**: Single worker execution (`workers=1`) is strictly maintained to ensure atomic file/SQLite state consistency. Distributed deployment across multiple worker nodes requires external Postgres/Redis state backends.
- **State Hygiene**: Runtime RL policy state (`state/rl_policy.json`) is untracked by Git. Initial policy starts from immutable seed `models/rl_policy_seed.json`.
