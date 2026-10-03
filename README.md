# NIRIKSHAK Craftverse — Enterprise Public Infrastructure Intelligence

NIRIKSHAK Craftverse is an enterprise platform for public infrastructure governance, transparent procurement, milestone verification, and multi-tier artificial intelligence decision support.

---

## 1. System Architecture

```
GOVERNMENT PORTAL │ CONTRACTOR PORTAL │ CITIZEN PORTAL
                      │
                      ▼
               REACT FRONTEND (Vite / TypeScript)
                      │ (Authenticated via Supabase JWT)
                      ▼
               EXPRESS BACKEND (Node.js / TypeScript)
            (Auth / Tenancy / Audit / RLS Gateway)
        ┌─────────────┼──────────────┐
        │             │              │
        ▼             ▼              ▼
     SUPABASE     AI CONTEXT      REALTIME
     DATABASE      BUILDER
        │             │
        │             ▼
        │        AI SERVICES (Python 3.11+ / FastAPI)
        │      (Historical ML + Online Drift + LinUCB)
        │             │
        │             ▼
        │        OPENROUTER (NVIDIA Nemotron 340B)
        │             │
        │             ▼
        │    STRUCTURED EXPLANATION & ADVISORY ACTIONS
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

---

## 2. Repository Structure

```
Nirikshak_craaftverse/
│
├── frontend/               # React 18, Vite, TypeScript, TailwindCSS
│   ├── src/
│   │   ├── core/           # Auth, Supabase client, shared status
│   │   ├── lib/            # Unified API client, environment, data mode
│   │   ├── demo/           # Isolated demo fixtures (never imported in LIVE)
│   │   └── modules/
│   │       ├── government/ # Government official workspace & oversight
│   │       ├── contractor/ # Contractor project management & e-Tenders
│   │       └── user/       # Citizen public transparency & grievances
│
├── backend/                # Express, TypeScript, Supabase Database V2
│   ├── src/
│   │   ├── core/           # Auth middleware, tenancy, errors, rate limiting
│   │   └── modules/
│   │       ├── auth/       # Registration & access approval pipelines
│   │       ├── projects/   # Tenancy-checked project management
│   │       ├── procurement/# Tenders & bidding gateway
│   │       ├── progress/   # Milestone verification & AI online learning hooks
│   │       ├── contracts/  # Contract state management & awards
│   │       ├── milestones/ # Project milestone CRUD & sequence validation
│   │       ├── resources/  # Resource tracking & aggregate workforce
│   │       ├── finance/    # Budget heads, payment claims & disbursements
│   │       ├── inspections/# Quality audits & severity findings
│   │       ├── documents/  # Secure document indexing & metadata
│   │       ├── environment/# Environmental compliance & baseline tracking
│   │       ├── legal/      # Litigation tracking & court settlements
│   │       ├── notifications/# System & alert notifications
│   │       └── ai/         # AI security gateway, context builder, client
│   └── supabase/           # PostgreSQL migrations 001–056 (Database V2 production schema)
│
├── ai-services/            # First-Class Python AI Microservice
│   ├── nirikshak_ai/       # Core Python package
│   │   ├── engine.py       # IsolationForest, LOF, MiniBatchKMeans, Cost Cohort
│   │   ├── online.py       # Incremental StandardScaler & MiniBatchKMeans (Verified Gated)
│   │   ├── bandit.py       # LinUCB Contextual Bandit action ranker (Normalized Signal Weights)
│   │   ├── openrouter/     # Async client, prompts, schemas, PII sanitizer
│   │   ├── security.py     # X-Nirikshak-AI-Key verification
│   │   ├── state_store.py  # SQLite thread-safe event persistence
│   │   └── api.py          # FastAPI application endpoints
│   ├── models/             # Pretrained model artifacts (.joblib, .json, .npz)
│   ├── state/              # SQLite state store (gitignored)
│   ├── requirements.txt    # Frozen Python dependencies
│   ├── run_api.py          # Microservice launcher
│   └── Dockerfile          # Production container specification
│
├── docs/                   # Architecture, Data Flow, Model Card, Matrix, Production Certification
└── tests/                  # Cross-cutting integration tests
```

---

## 3. Development Startup Instructions

To run the entire NIRIKSHAK platform locally, open three terminal windows:

### Terminal 1: AI Services (Python / FastAPI)
```bash
cd ai-services
python -m venv .venv
# Windows:
.venv\Scripts\activate
# Linux/macOS:
# source .venv/bin/activate

pip install -r requirements.txt
python run_api.py
```
*The AI microservice will start on `http://127.0.0.1:8000`.*  
*Health probe: `http://127.0.0.1:8000/health`*

### Terminal 2: Express Backend Gateway
```bash
cd backend
npm install
npm run dev
```
*The Express backend will start on `http://localhost:4000`.*  
*Gateway routes: `/api/ai/health`, `/api/ai/analyze/:projectId`, `/api/ai/feedback`*

### Terminal 3: React Frontend
```bash
cd frontend
npm install
npm run dev
```
*The Vite development server will start on `http://localhost:5173`.*

---

## 4. Environment Configuration

### Backend (`backend/.env`)
```ini
PORT=4000
NODE_ENV=development
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# AI Gateway configuration
AI_SERVICE_URL=http://127.0.0.1:8000
AI_SERVICE_SHARED_SECRET=your-secure-shared-secret
AI_SERVICE_TIMEOUT_MS=20000
```

### AI Services (`ai-services/.env`)
```ini
AI_SERVICE_SHARED_SECRET=your-secure-shared-secret
OPENROUTER_API_KEY=your-openrouter-key
OPENROUTER_MODEL=nvidia/nemotron-4-340b-instruct
AI_STATE_DIR=./state
AI_MODEL_DIR=./models
AI_ENABLE_OPENROUTER=true
```

### Frontend (`frontend/.env`)
```ini
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
VITE_API_BASE_URL=http://localhost:4000
VITE_DATA_MODE=LIVE
```

---

## 5. Verification & Test Commands

### 1. Python AI Unit & Pipeline Tests
```bash
cd ai-services
python -m pytest -v
python scripts/model_smoke_test.py
```

### 2. Backend Typecheck, Build, Security & AI Gateway Tests
```bash
cd backend
npm run typecheck
npm run build
npm test
```

### 3. Frontend Typecheck & Production Build
```bash
cd frontend
npm run typecheck
npm run build
npm test
```

### 4. Full Realistic Infrastructure Lifecycle Automation (3 Live Runs)
```bash
cd backend
npx tsx scripts/run-full-lifecycle-e2e.ts
```

---

## 6. Key Principles & Guardrails

1. **Advisory Decision Support Only:** AI systems discover anomalies and recommend interventions. Human Government officials make all executive, legal, and financial decisions.
2. **Review Priority Semantics:** The `Review Priority Score` indicates how unusual a project appears compared to historical infrastructure baselines. It is **never** a "delay probability" or "fraud probability".
3. **Verified Learning Only:** Contractor submissions remain unverified claims (`CONTRACTOR_REPORTED`). The online drift learner updates **only** upon official Government verification (`GOVERNMENT_VERIFIED`).
4. **Secret Isolation:** The browser never calls the Python microservice and never holds AI secrets. Express acts as the authoritative security gateway.