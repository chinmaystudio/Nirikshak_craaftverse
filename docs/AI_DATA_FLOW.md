# NIRIKSHAK AI Data Flow & Lifecycle Specification

**Version:** 1.0.0  
**Status:** Implemented & Verified  

---

## 1. End-to-End Operational Lifecycle

The NIRIKSHAK AI lifecycle enforces strict integrity checks at every state boundary. The sequence below details the full progression from field submission to continuous model refinement:

```mermaid
sequenceDiagram
    autonumber
    actor C as Contractor
    participant FE as React Frontend
    participant EX as Express Backend
    participant DB as Supabase PostgreSQL
    actor G as Government Officer
    participant AI as Python AI Microservice
    participant OR as OpenRouter (Nemotron)

    Note over C,DB: Phase 1: Unverified Field Submission
    C->>FE: Submits monthly progress report & site photos
    FE->>EX: POST /api/progress/update
    EX->>DB: RPC submit_progress_update()
    DB-->>EX: Status: PENDING_VERIFICATION
    EX-->>FE: Update Recorded (Unverified)
    Note over EX,AI: Unverified data CANNOT update the Online Learner!

    Note over G,DB: Phase 2: Official Government Verification
    G->>FE: Reviews site evidence & issues approval
    FE->>EX: POST /api/progress/approve/:id
    EX->>DB: RPC approve_progress_update()
    DB-->>EX: Transaction Committed (APPROVED)

    Note over EX,AI: Phase 3: Verified Online Learning Trigger
    EX->>EX: Build Verified Snapshot (GOVERNMENT_VERIFIED)
    EX->>AI: POST /learn/snapshot (verified=true)
    AI->>AI: MiniBatchKMeans.partial_fit() & StandardScaler
    AI-->>EX: Learning status: SUCCESS

    Note over G,AI: Phase 4: Project Analysis & Advisory Inference
    G->>FE: Requests AI Insights for Project
    FE->>EX: POST /api/ai/analyze/:projectId
    EX->>DB: Query authoritative project registers
    EX->>EX: Redact PII & format ProjectSnapshot
    EX->>AI: POST /analyze (X-Nirikshak-AI-Key)
    AI->>AI: IsolationForest + LOF + K-Means Archetype
    AI->>AI: LinUCB Contextual Bandit action ranking
    opt OpenRouter Enabled
        AI->>OR: POST /chat/completions (Sanitized context)
        OR-->>AI: Structured JSON explanation
    end
    AI->>AI: Persist analysis event to SQLite state
    AI-->>EX: AnalysisResult (Scores + Recommendations + Explanation)
    EX->>DB: Save audit log & ai_insights record
    EX-->>FE: Advisory Report

    Note over G,AI: Phase 5: Human Feedback & Bandit Learning
    G->>FE: Marks recommendation as ACCEPTED / USEFUL
    FE->>EX: POST /api/ai/feedback
    EX->>AI: POST /feedback (analysis_id, feedback)
    AI->>AI: Retrieve original context from SQLite
    AI->>AI: Calculate reward & update LinUCB covariance matrices
    AI-->>EX: Policy updated: true
    EX-->>FE: Feedback Recorded
```

---

## 2. Telemetry Provenance Taxonomy

Every data point entering the AI context builder is tagged with its provenance tier:

| Provenance Tag | Source | Trust Level | May Train Online Model? |
|---|---|---|---|
| `DATABASE_FACT` | Official tenders, sanctioned budgets, legal awards | Absolute | Yes |
| `CONTRACTOR_REPORTED` | Contractor self-reported progress, claims, delay reasons | Unverified Claim | **STRICTLY NO** |
| `GOVERNMENT_VERIFIED` | Executive Engineer field inspections, approval notes | Verified Fact | **YES** |
| `PUBLIC_EXTERNAL` | Public complaints, weather anomalies, GIS markers | Contextual | Only aggregated counts |
| `AI_INFERENCE` | Anomaly scores, archetype clusters, recommended actions | Advisory Model Output | No |

---

## 3. Human-in-the-Loop Feedback Rewards

LinUCB contextual bandit actions receive numerical reinforcement rewards based on human officer review and subsequent verified project outcomes:

| Government Feedback | Reward ($r$) | Effect on Policy Matrix |
|---|---|---|
| `ACCEPTED` | $+1.0$ | Strongly reinforces action weights for similar feature contexts |
| `USEFUL` | $+0.8$ | Moderately reinforces action weights |
| `NEUTRAL` | $0.0$ | Leaves baseline weights neutral |
| `REJECTED` | $-0.5$ | Deprioritizes action for similar project contexts |
| `HARMFUL` | $-1.0$ | Strongly penalizes action selection for similar contexts |

Future outcome indicators (such as reduced schedule variance or lower cost overruns over consecutive verified milestones) contribute up to $+0.5$ additional outcome reward.
