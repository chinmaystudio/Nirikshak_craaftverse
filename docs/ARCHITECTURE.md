# NIRIKSHAK Craftverse — Architecture Guide

**Version:** 2.0.0  
**Date:** 2026-10-03  
**Target State:** Clean Production-Ready Architecture

---

## 1. Architectural Philosophy

NIRIKSHAK Craftverse adheres to five foundational engineering principles:

1. **The Backend & Database are Authoritative:** The browser is a presentation and interaction layer. Business validation, role assignment, project creation, financial verification, and tender awards must never be trusted from client state.
2. **PostgreSQL / Supabase as the Source of Truth:** Relational data integrity, Row Level Security (RLS), and database transactional RPCs (`submit_progress_update`, `approve_progress_update`, `award_contract`) govern critical state transitions.
3. **Defense in Depth:** Security is verified across multiple tiers:
   - Client UX Guards (`ProtectedRoute`, `RoleGuard`)
   - Backend Gateway Middleware (`requireAuth`, `requireGovernment`, `requireContractor`)
   - Database Row Level Security (RLS policies checking user JWT and organization membership)
   - Stored Procedure (RPC) security definers checking tenant ownership
4. **Zero Fallback Deception:** LIVE mode queries real backend/Supabase sources. If a query fails or returns zero rows, the UI renders the true state (error or empty). The application must **never** silently fall back to mock data in live mode.
5. **Strict Secret Isolation:** Server-side secrets (`SUPABASE_SERVICE_ROLE_KEY`, `OPENROUTER_API_KEY`, database credentials) reside exclusively in backend memory and are never exposed to client-side bundles.

---

## 2. Global Architecture Diagram

```
                       FRONTEND (React + Vite)
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
   Government Portal      Contractor Portal         Citizen Portal
          │                       │                       │
          └───────────────────────┼───────────────────────┘
                                  │
                            frontend/src/lib
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
          Authorized Browser Client        Direct Safe RLS Reads
          (Auth, Sessions, Realtime)      (Public Views, Own Records)
                    │                           │
                    ▼                           ▼
                 BACKEND                        │
             (Express API)                      │
                    │                           │
             backend/src/core                   │
                    │                           │
          ┌─────────┴─────────┐                 │
          │                   │                 │
    Security / Auth       Database              │
    (CORS, RateLimit)  (Admin Client)           │
          │                   │                 │
          └─────────┬─────────┘                 │
                    │                           │
          backend/src/modules                   │
          (Projects, Procurement,               │
           Progress, Grievance, AI)             │
                    │                           │
                    ▼                           ▼
       SUPABASE POSTGRESQL V2 (Migrations 001-046: RLS / RPCs / Realtime / Storage)
                    │
                    ▼
            EXPRESS AI CONTEXT BUILDER (Data Sanitization, Honest NULLs)
                    │
                    ▼
       PYTHON AI MICROSERVICE (FastAPI, Port 8000)
                    │
        ┌───────────┼───────────┐
        ▼           ▼           ▼
  Historical ML   Online Drift  LinUCB RL Policy
        │           │           │
        └───────────┼───────────┘
                    │
                    ▼
       OPENROUTER / NVIDIA NEMOTRON REASONING
                    │
                    ▼
         GOVERNMENT HUMAN REVIEW & DECISION SUPPORT
                    │
                    ▼
         DOWNSTREAM VERIFIED OUTCOME LEARNING LOOP
```

---

## 3. Frontend Architecture (`frontend/`)

### Directory Layout:
- `src/app/`: Application root component (`App.tsx`), router configuration, and global context providers.
- `src/lib/`: Browser-only client infrastructure:
  - `api/apiClient.ts`: Authenticated fetch wrapper handling Bearer tokens, JSON parsing, and unified error mapping.
  - `supabase/client.ts`: Single shared browser Supabase client.
  - `auth/`: Browser auth helpers (`AuthService`, session recovery, role resolution).
  - `config/env.ts`: Centralized, typed environment reader.
  - `config/dataMode.ts`: Explicit `LIVE` vs `DEMO` mode switch.
  - `realtime/realtime.service.ts`: Managed Supabase Realtime channel subscriptions.
  - `storage/storage.service.ts`: Browser file upload and path generation helpers.
- `src/shared/`: Shared domain interfaces (`types/`), canonical role constants (`constants/roles.ts`), normalized statuses (`constants/statuses.ts`), and common UI utilities.
- `src/demo/`: Isolated mock datasets and demo fixtures (`government/`, `contractor/`, `citizen/`, `shared/`). Never imported by live services.
- `src/modules/`:
  - `government/`: Government officer portal (pages, services, components).
  - `contractor/`: Contractor management portal (pages, services, components).
  - `citizen/`: (Formerly `user/`) Public accountability portal.

---

## 4. Backend Architecture (`backend/`)

### Decoupled App and Server:
- `backend/src/app.ts`: Instantiates and configures Express, attaches security headers, strict CORS, request body limits, rate limiters, route handlers, 404 handler, and centralized error handler.
- `backend/src/server.ts`: Validates environment configuration, imports `app`, binds `PORT`, and handles graceful startup and shutdown.

### Core Framework (`backend/src/core/`):
- `config/env.ts`: Zod-validated environment variables (`SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`, `OPENROUTER_API_KEY`, `ALLOWED_ORIGINS`, `PORT`, `NODE_ENV`). Fails fast if required variables are missing.
- `database/supabase.ts`: Exposes `supabaseAdmin` (service role), `supabasePublic` (anon client), and `createAuthenticatedClient(token)` (scoped client).
- `auth/`: Authoritative token verification (`auth.middleware.ts`), role definitions (`roles.ts`), permission matrix (`permissions.ts`), and request user context (`userContext.ts`).
- `http/`: Standardized response helpers (`response.ts`), typed error classes (`errors.ts`), and pagination utilities.
- `security/`: CORS rules (`cors.ts`), security headers (`headers.ts`), rate limiters (`rateLimit.ts`), and input sanitization (`sanitizer.ts`).
- `logging/`: Structured logger attaching correlation IDs to every request.

### Domain Modules (`backend/src/modules/`):
Every domain module follows a strict 5-layer separation:
```
module/
├── <module>.routes.ts       # HTTP path definition & middleware chain
├── <module>.controller.ts   # Request parameter extraction & HTTP response formatting
├── <module>.service.ts      # Business logic & database operations
├── <module>.validation.ts   # Zod request validation schemas
└── <module>.types.ts        # Module-specific domain types
```

---

## 5. Authentication & Multi-Tenancy

### User Onboarding Flow:
1. **Citizen**: Registers via backend. Receives immediate active `citizen` role.
2. **Government Officer**: Registers providing Department, Designation, and Employee ID. Stored in `government_access_requests` with status `PENDING`. An existing Government Admin must review and approve the request before government portal access is granted.
3. **Contractor**: Registers company details (CIN, GSTIN, Company Name, Contractor Class). Stored in `contractor_access_requests` with status `PENDING`. Government Admin verifies company credentials and associates the user with an active contractor organization.

### Identity Derivation:
- Backend middleware inspects `Authorization: Bearer <token>`.
- Token verified using Supabase Auth.
- Authoritative role and organization derived from `organization_members` joined with `organizations`.
- Request context enriched with:
  ```ts
  req.userContext = {
    userId: string;
    email: string;
    role: AppRole;
    organizationId: string | null;
    organizationType: 'government' | 'contractor' | null;
    permissions: string[];
  }
  ```

---

## 6. AI Microservice Architecture & Advisory Guardrails

NIRIKSHAK deploys a dedicated Python/FastAPI microservice (`ai-services/`) as a first-class intelligence engine, integrated with the Express gateway via private shared-secret authentication.

### Microservice Interaction Boundaries:
1. **Frontend to Express Only:** Browser clients NEVER communicate directly with Python AI. All requests flow through `POST /api/ai/analyze/:projectId` and `POST /api/ai/feedback`.
2. **Security Gateway:** Express authenticates the caller, validates organization tenancy (or contractor project assignment), builds a sanitized `ProjectSnapshot`, and attaches `X-Nirikshak-AI-Key`.
3. **Deterministic Core Intelligence:**
   - **Isolation Forest & Local Outlier Factor:** Structural and neighborhood anomaly detection.
   - **MiniBatch K-Means:** Archetype clustering and online operational drift tracking.
   - **Robust Cost Cohorts:** Non-parametric sector expenditure variance detection.
4. **Contextual Bandit Reinforcement Learning (LinUCB):**
   - Ranks 8 operational oversight actions (`SCHEDULE_SITE_INSPECTION`, `REVIEW_COST_VARIANCE`, etc.).
   - Learns from Government official feedback (`ACCEPTED`, `USEFUL`, `REJECTED`, `HARMFUL`) and verified milestone outcomes.
5. **Reasoning & Explanation Layer (OpenRouter / NVIDIA Nemotron):**
   - Provides structured human-readable explanations with strict Pydantic validation.
   - Resilient degradation: if OpenRouter is unreachable, deterministic ML intelligence is returned with `llm.status="UNAVAILABLE"`.
6. **Continuous Learning Lifecycle:**
   - Contractor reports remain `CONTRACTOR_REPORTED` and cannot update the online learner.
   - When an Executive Engineer issues official approval (`approve_progress_update`), the backend dispatches a verified snapshot (`verified=true`) to `/learn/snapshot`.
   - Thread-safe updates and event persistence are managed in `ai-services/state/nirikshak_ai_state.sqlite3`.
7. **Advisory Guardrails:**
   - Review Priority Score indicates how unusual a project appears compared to historical training data (never a "delay probability" or "fraud probability").
   - AI outputs are strictly decision support; authorized Government officials make all executive, legal, and financial decisions.

---

## 7. Migration Immutability & Future Roadmap

- Existing migrations `001_extensions.sql` through `028_public_rls_helper_privileges.sql` in `backend/supabase/migrations/` represent the historical baseline and must **remain untouched**.
- Any future schema enhancements will be introduced in the **NIRIKSHAK CRAFTVERSE DATABASE V2 DESIGN** phase starting at migration `029_...`.
