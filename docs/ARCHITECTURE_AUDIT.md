# Architecture Audit: NIRIKSHAK Craftverse Codebase

**Date:** 2026-10-03  
**Status:** COMPLETED AUDIT (Pre-Refactor Baseline)  
**Role:** Senior Full-Stack Architect, Backend Architect, Security Engineer, Codebase Refactoring Engineer  
**Objective:** Comprehensive analysis of current state, architectural issues, security vulnerabilities, mock/live mixing, and concrete remediation roadmap toward the clean Nirikshak Craftverse architecture.

---

## 1. Current Architecture Overview

NIRIKSHAK Craftverse is an infrastructure transparency, public procurement, contractor execution, and public grievance oversight suite composed of:
1. **Frontend (`frontend/`):** React 18 SPA built with Vite and TypeScript, hosting three major portal domains:
   - **Government Portal (`frontend/src/modules/government/`)**: Project planning, administrative approvals, tender publishing, contractor oversight, progress verification, grievance escalation, audit observations.
   - **Contractor Portal (`frontend/src/modules/contractor/`)**: Bidding on tenders, project schedule/milestone management, progress update submissions, resource allocation, invoice generation, communication.
   - **Citizen Portal (`frontend/src/modules/user/`)**: Public project explorer, ward/city infrastructure stats, public grievance submission, issue tracking, community civic feedback.
2. **Backend (`backend/`):** Express API service running on Node.js (TypeScript) exposing endpoints for `/api/auth`, `/api/projects`, `/api/tenders`, `/api/progress`, `/api/complaints`, and `/api/ai`.
3. **Database & Infrastructure (`backend/supabase/migrations/001-028`):** PostgreSQL hosted via Supabase, with comprehensive Row Level Security (RLS), multi-tenant organization boundaries, security definer helper functions, audit logging, and transactional RPC workflows (`submit_progress_update`, `approve_progress_update`, `award_contract`).
4. **AI Risk Engine:** Integrated with OpenRouter / NVIDIA Nemotron (`backend/src/ai/provider.ts`) for infrastructure schedule slippage, budget variances, and anomaly predictions.

---

## 2. Existing Backend Modules

Located currently in `backend/src/`:
- `index.ts`: Combines Express server instantiation, CORS configuration, rate limiting, route binding, and `app.listen()`. Lacks clean decoupling of `app.ts` from `server.ts`.
- `services/supabase.ts`: Exposes `supabaseAdmin`, `supabasePublic`, and `createAuthenticatedClient(token)`. Directly reads `process.env` without structured Zod schema validation.
- `middleware/auth.ts`: Implements `requireAuth`, `requireRole`, `requireGovernment`, `requireContractor`, `requireGovernmentProjectAccess`, `requireContractorProjectAccess`.
- `middleware/security.ts`: Implements `securityHeaders`, `rateLimit`, `safeErrorHandler`.
- `ai/provider.ts`: Implements `getLLMProvider()` with OpenRouter integration, client-side PII and secret sanitization regexes, and fallback mock generator.
- `validation/schemas.ts`: Central Zod schemas for user registration, project creation, progress submission/review, tenders, complaints, and AI audit.
- `routes/`:
  - `auth.ts`: User registration with Supabase Admin Auth and organization metadata.
  - `projects.ts`: Public project listing, sanitized detail query, and government project creation.
  - `tenders.ts`: Government tender publishing.
  - `progress.ts`: Contractor progress submission and Government verification via PostgreSQL RPCs.
  - `complaints.ts`: Grievance submission and public tracking with PII redaction.
  - `ai.ts`: Project audit orchestration via LLM provider.

---

## 3. Existing Frontend Modules

- `frontend/src/core/`:
  - `auth/`: `AuthService`, `AuthProvider`, `RoleGuard`, `ProtectedRoute`. Performs Supabase Auth calls, active organization resolution from `organization_members`, and role permission mapping.
  - `supabase/client.ts`: Instantiates browser Supabase client using `import.meta.env.VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
  - `status/projectStatus.ts`: Provides normalization helpers for project statuses.
  - `realtime/` and `api/`: Stub/partial utilities.
- `frontend/src/modules/government/`:
  - `api/supabaseApi.ts`: Monolithic ~925-line API file implementing `projectsApi`, `approvalsApi`, `tendersApi`, `grievancesApi`, `financeApi`, `auditApi`, `documentsApi`, `workApi`, `insightsApi`.
  - `api/mockApi.ts`: 400-line mock API providing simulated government endpoints.
  - `data/`: Contains legacy mock datasets (`projects.ts`, `modules.ts`, `alerts.ts`, `approvals.ts`, `workspace.ts`).
  - `pages/`: 15+ government pages (Dashboard, Projects, Approvals, Tenders, Contractors, Grievances, Finance, Audit, Analytics, Legal, etc.).
- `frontend/src/modules/contractor/`:
  - `lib/data.ts`: ~1,700-line monolithic file mixing TypeScript interfaces with heavy mock datasets (`PROJECTS`, `INITIAL_WORKERS`, `INITIAL_RESOURCES`, `INITIAL_INVOICES`, `INITIAL_REPORTS`, `INITIAL_MESSAGES`, `INITIAL_DOCS`, `INITIAL_BIDS`).
  - `lib/store.tsx`: React Context store acting as a client-side database for projects, progress reports, workers, resources, invoices, messages, documents, and bids.
  - `services/tender.service.ts`: Real Supabase queries for published tenders and tender bids.
  - `pages/`: Contractor dashboard, project detail, bidding, progress reporting, resource management, billing, compliance, etc.
- `frontend/src/modules/user/` (Citizen Portal):
  - `services/projects/projectsService.ts`: Reads from Supabase `public_projects_view` or `projects` table, but previously had fallback logic to mock data.
  - `services/complaints/`: Grievance submission calling Express backend or direct Supabase insert.
  - `data/`: Mock datasets (`projects.ts`, `ward.ts`, `categories.ts`).
  - `pages/`: Citizen home, explore, project detail, report grievance, track grievance, community.

---

## 4. Live Supabase Integrations

1. **Supabase Auth**: Sign in, sign out, password auth, OAuth (Google), session recovery via `supabase.auth`.
2. **Access & Roles**: Resolves authoritative roles and active organization memberships via `organization_members` joined with `organizations`.
3. **Pending Access Requests**: Reads `government_access_requests` and `contractor_access_requests` for approval state.
4. **Public Projects**: `public_projects_view` queried for citizen and public catalog pages.
5. **Government Projects**: `government_project_summary_view` queried for authorized government overviews.
6. **Procurement**:
   - `tenders` table queried for published tenders.
   - `tender_bids` table queried and bids inserted via caller JWT.
   - `save_tender_bid` / `award_contract` RPCs.
7. **Progress Submission & Verification**:
   - `submit_progress_update` RPC called from contractor progress submissions.
   - `approve_progress_update` RPC called from government approvals workflow.
8. **Complaints & Grievances**:
   - `complaints`, `complaint_updates`, `complaint_evidence` queried and inserted.
9. **Financial Updates**:
   - `financial_updates` table queried for fund allocations and expenditures.
10. **Documents & Notifications**:
    - `project_documents` and `notifications` read from database.
11. **AI Insights**:
    - `ai_insights` persisted and queried.

---

## 5. Mock / Demo Integrations & Files

The following files contain hardcoded mock fixtures or demo logic:
1. `frontend/src/modules/government/api/mockApi.ts`: Complete mock implementation of all government APIs with artificial `delay()` (300-800ms).
2. `frontend/src/modules/government/data/`:
   - `projects.ts`: Mock project dataset.
   - `modules.ts`: Mock module metrics.
   - `alerts.ts`: Mock system alerts.
   - `approvals.ts`: Mock pending approvals list.
   - `workspace.ts`: Mock officer workspace items.
3. `frontend/src/modules/contractor/lib/data.ts`:
   - Contains massive fake datasets: `PROJECTS`, `INITIAL_WORKERS`, `INITIAL_RESOURCES`, `INITIAL_INVOICES`, `INITIAL_REPORTS`, `INITIAL_MESSAGES`, `INITIAL_DOCS`, `INITIAL_BIDS`.
4. `frontend/src/modules/user/data/`:
   - `projects.ts`: Mock citizen project records and static images.
   - `ward.ts`: Hardcoded ward metrics and statistics.
5. `backend/src/ai/provider.ts`:
   - Contains a fallback `generateMockAnalysis()` triggered when `OPENROUTER_API_KEY` is absent.

---

## 6. Mixed Live/Demo Areas

1. **Government `supabaseApi.ts` `mapDbProject()`**:
   - Takes real project database row, but manufactures:
     - Default contractor: `"Balaji Infraprojects / L&T Consortium"`
     - Fabricated milestones: `Site Handover & Preliminary Works`, `Core Civil & Structural Execution`, `Finishing, Testing & Final Commissioning`
     - Synthetic funding sources: `State Infrastructure Budget (60%)`, `Central Assistance (40%)`
     - Fake delay days: `45`
     - Default inspection count: `3`, complaints count: `2`, approvals count: `1`
     - Fabricated work order numbers: `WO-MH-${projId.slice(-6)}`
2. **Contractor Portal Project Pages**:
   - If Supabase returns projects, the UI maps them to complex mock structures (`milestones: []`, `workers: []`, `expenses: []`, `forecast: {}`, `health: {}`).
   - If not found or incomplete, contractor pages historically rendered demo objects from `lib/data.ts`.
3. **Contractor Progress Flow (Double-Write)**:
   - In `frontend/src/modules/contractor/lib/store.tsx`: `addReport()` immediately writes a new report to local React state `reports`, and then asynchronously attempts an RPC call to `submit_progress_update`. If the RPC fails or is offline, the local fake report persists in the UI!
4. **Litigation & Audit**:
   - Government litigation page queries an empty array or returns demo records.
   - Government audit page queries `inspections` and maps them to synthetic audit findings (`AUD-2026-XXXX`).

---

## 7. Authentication Architecture

### Current Flow:
1. Citizen, Government, or Contractor registers via backend `/api/auth/register`.
2. Backend uses `supabaseAdmin.auth.admin.createUser` with `email_confirm: true` and attaches `user_metadata` (e.g. `account_type`, `requested_role`, `department`, `company_name`).
3. Database triggers automatically create:
   - Row in `public.profiles`.
   - If government, row in `public.government_access_requests` (`status = 'PENDING'`).
   - If contractor, row in `public.contractor_access_requests` (`status = 'PENDING'`).
   - If citizen, automatically active citizen profile.
4. User signs in on browser using `supabase.auth.signInWithPassword`.
5. Frontend `AuthService.resolveUserSession()` queries:
   - `profiles` for personal info.
   - `organization_members` for active organization & role.
   - If no active membership, checks `government_access_requests` and `contractor_access_requests` to set `pendingApproval`.
6. Authorized sessions receive JWT access token which is passed to Express API requests (`Authorization: Bearer <token>`).

### Gaps / Inconsistencies:
- `government/api/supabaseApi.ts` lines 478–501 has `authApi.signIn()` and `authApi.currentOfficer()` which returned hardcoded mock officer details (`Executive Engineer`, `GOV-OFFICER`) instead of resolving through canonical `AuthService`.
- Lack of centralized `frontend/src/lib/auth/` client interface.

---

## 8. Authorization Architecture

- **Authoritative Enforcement**:
  - PostgreSQL Row Level Security (RLS) in migrations 017, 022, 023, 024, 025, 026.
  - Express middleware (`requireAuth`, `requireGovernment`, `requireContractor`, `requireGovernmentProjectAccess`, `requireContractorProjectAccess`) derives identity strictly from Supabase JWT and queries `organization_members` with `supabaseAdmin`.
- **Frontend Authorization**:
  - Roles and permissions computed in `AuthService` are used for UI routing (`ProtectedRoute`, `RoleGuard`) and menu visibility.
- **Rule Enforcement**: Frontend permission checks do NOT grant authorization. Any sensitive mutation must go through backend middleware or PostgreSQL RLS/RPC.

---

## 9. Database Access Patterns

- **Public Reads**: `supabasePublic` (backend) or browser Supabase client (frontend) querying public views (`public_projects_view`, `tenders` where `is_public = true`).
- **Authorized Reads**: Browser Supabase client querying with user JWT against tables with RLS (`organization_members`, `government_access_requests`, `contractor_assigned_projects_view`).
- **Authoritative State Transitions**: Executed through PostgreSQL RPCs:
  - `submit_progress_update(p_project_id, p_reported_progress, p_description, p_milestone_id)`
  - `approve_progress_update(p_update_id, p_decision, p_verified_progress, p_review_notes)`
  - `save_tender_bid(...)`
  - `award_contract(...)`
- **Audit Logging**: Backend writes directly to `audit_logs` table via `supabaseAdmin`.

---

## 10. Realtime Usage

- Realtime functionality is configured in PostgreSQL migration `019_realtime_and_workflow.sql`.
- In the frontend, arbitrary Supabase channel listeners were created ad-hoc or placed in partial services without centralized connection lifecycle management or teardown.
- Target requirement: Standardized `frontend/src/lib/realtime/realtime.service.ts`.

---

## 11. AI Integration

- Backend route `/api/ai/analyze/:projectId` invokes `getLLMProvider()`.
- Uses OpenRouter API with NVIDIA Nemotron (`nvidia/nemotron-3-super-120b-a12b:free` or configured model).
- Backend sanitizes project descriptions (removes emails, phone numbers, Aadhaar, PAN numbers, bearer tokens).
- Advisory Only: Outputs risk analysis, risk level (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), and recommendations. AI cannot approve payments, contracts, or progress.
- Problem: If `OPENROUTER_API_KEY` is missing in development, provider returned mock analysis. In live mode, error should be explicit (`503 AI_UNAVAILABLE`).

---

## 12. Security Concerns & Findings

1. **Frontend Mock Fallback**: In several services, catching an error or receiving an empty array triggered fallback to mock data, disguising database or permission failures.
2. **Double-Write Anti-Pattern**: Contractor progress reporting inserted a local mock report before waiting for RPC confirmation.
3. **Environment Exposure**: `process.env` was accessed throughout `backend/src/` without central Zod validation.
4. **Vite Alias Inconsistency**: Vite configured dynamic `@/` resolution that pointed to different directories depending on the importing file (`/src/modules/government/`, `/src/modules/contractor/`, `/src/modules/user/`), making imports fragile and ambiguous.
5. **Express App/Server Coupling**: `backend/src/index.ts` both configured the app and bound the network port.
6. **No Secret Leaks**: Audit confirms `SUPABASE_SERVICE_ROLE_KEY` and `OPENROUTER_API_KEY` are not referenced in the frontend build.

---

## 13. State Management Problems

- Contractor portal `StoreProvider` in `lib/store.tsx` stored `projects`, `workers`, `resources`, `invoices`, `reports`, `messages`, `documents`, and `bids` in React state.
- If a user refreshed the page, or if multiple users interacted, state was desynchronized.
- React state should only store client UI state (theme, font scale, accessibility, notifications, active filters, draft forms), not persistent business records.

---

## 14. Type & Status Inconsistencies

- Multiple differing definitions of `Project`, `Tender`, `Complaint`, and `Status`:
  - Government: `sanctionedAmountCr`, `utilizedAmountCr`, `status: 'completed' | 'on_track' | 'delayed' | 'at_risk' | 'on_hold'`
  - Contractor: `value`, `spent`, `received`, `status: 'Completed' | 'Active' | 'Delayed' | 'At Risk'`
  - Citizen: `physicalProgress`, `financialProgress`, `status: 'completed' | 'on-track' | 'delayed' | 'tendering' | 'under-review'`
- Database uses canonical uppercase or normalized strings (`COMPLETED`, `IN_PROGRESS`, `DELAYED`, `PUBLISHED`, `AWARDED`, `SUBMITTED`, `RESOLVED`).
- Target requirement: Shared domain types in `frontend/src/shared/types/` and status mapping constants in `frontend/src/shared/constants/`.

---

## 15. API Inconsistencies

- Government portal called both Express endpoints (`POST /api/projects`, `POST /api/tenders`, `POST /api/ai/analyze/...`) and direct Supabase queries.
- Backend routes returned slightly varying JSON formats across some endpoints.
- Target requirement: Standardized `{ success: true, data: T }` and `{ success: false, error: { code, message } }`.

---

## 16. Dead & Duplicated Code Identified

1. `frontend/src/modules/government/data/` (mock data files) — should be moved/isolated to `frontend/src/demo/government/`.
2. `frontend/src/modules/contractor/lib/data.ts` — massive mock datasets mixed with types; types must be extracted to `types/` and mock datasets to `frontend/src/demo/contractor/`.
3. `frontend/src/modules/user/data/projects.ts` — mock projects list; isolated to `frontend/src/demo/citizen/`.
4. `frontend/src/modules/government/api/mockApi.ts` — unused by live mode; belongs strictly in demo fixtures.

---

## 17. Recommended Corrected Structure

```
Nirikshak_craaftverse/
├── backend/
│   ├── src/
│   │   ├── app.ts                 # Express app setup, CORS, security, routes, error handlers
│   │   ├── server.ts              # Env check, port listener, startup
│   │   ├── core/
│   │   │   ├── config/env.ts      # Zod-validated environment config
│   │   │   ├── database/          # supabaseAdmin, supabasePublic, authenticated client
│   │   │   ├── auth/              # auth middleware, roles, permissions, user context
│   │   │   ├── http/              # standardized responses, errors, pagination
│   │   │   ├── security/          # CORS, headers, rate limit, sanitizer
│   │   │   └── logging/           # correlation ID, structured logger
│   │   └── modules/
│   │       ├── auth/              # auth.routes, auth.controller, auth.service, auth.validation
│   │       ├── projects/          # routes, controller, service, validation, types
│   │       ├── procurement/       # tenders & bids routes, controller, service, validation
│   │       ├── progress/          # progress submission & verification routes, controller, service
│   │       ├── complaints/        # grievances routes, controller, service, validation
│   │       └── ai/                # ai routes, controller, service, provider, schemas
│   └── supabase/migrations/       # 001-028 remain immutable
├── frontend/
│   ├── src/
│   │   ├── lib/
│   │   │   ├── api/               # apiClient.ts, apiError.ts, response.ts
│   │   │   ├── supabase/          # single browser client.ts, database.types.ts
│   │   │   ├── auth/              # session.ts, authClient.ts, authTypes.ts
│   │   │   ├── realtime/          # realtime.service.ts
│   │   │   ├── storage/           # storage.service.ts
│   │   │   └── config/            # env.ts, dataMode.ts (LIVE vs DEMO)
│   │   ├── shared/
│   │   │   ├── types/             # project, tender, contract, progress, complaint, etc.
│   │   │   ├── constants/         # roles.ts, statuses.ts
│   │   │   └── components/
│   │   ├── demo/
│   │   │   ├── government/
│   │   │   ├── contractor/
│   │   │   ├── citizen/
│   │   │   └── shared/
│   │   └── modules/
│   │       ├── government/        # clean domain services, pages, components
│   │       ├── contractor/        # clean domain services, pages, components
│   │       └── citizen/           # (user module) clean domain services, pages, components
└── docs/
    ├── ARCHITECTURE_AUDIT.md      # This document
    ├── DATA_SOURCE_MATRIX.md      # Screen-by-screen source of truth mapping
    ├── FEATURE_READINESS.md       # Readiness of all capabilities
    └── ARCHITECTURE.md            # Comprehensive target architecture guide
```
