# NIRIKSHAK Craftverse — API Exposure & Security Matrix

**Document Version:** 3.0.0  
**Effective Date:** 2026-10-03  
**Classification:** Institutional Public Infrastructure Specification  
**Status:** **AUTHORITATIVE SPECIFICATION**

---

## 1. Overview & Policy Enforcement

Under the Zero-Trust Architecture, all API endpoints are closed by default (`requireAuthByDefault`). An endpoint is only accessible without authentication if it is explicitly listed in `AUTH_BOOTSTRAP_PUBLIC`.

All mutating requests (`POST`, `PUT`, `PATCH`, `DELETE`) require a valid `X-CSRF-Token` header matching the issued `nirikshak_csrf` cookie.

---

## 2. API Endpoint Exposure Matrix

| Route Path | HTTP Method | Exposure Tier | Auth Requirement | CSRF Required | Rate Limit | Description / Role Scoping |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| `/health` | `GET` | **Public** | None | No | 120 / min | Minimal health check. Returns `{"status":"ok"}`. Zero infra disclosure. |
| `/internal/health` | `GET` | **Internal** | None (Private Subnet) | No | Uncapped | Deep health check (DB, Fabric, AI). Returns 403 on public interfaces. |
| `/api/auth/csrf` | `GET` | **Public** | None | No | 60 / min | Issues cryptographically signed CSRF cookie and token. |
| `/api/auth/login` | `POST` | **Public** | None | Yes | 10 / min | Authenticates user; returns HttpOnly session cookie. |
| `/api/auth/register` | `POST` | **Public** | None | Yes | 5 / min | Citizen registration and contractor onboarding initial request. |
| `/api/auth/forgot-password` | `POST` | **Public** | None | Yes | 5 / min | Initiates password recovery email with rate-limited OTP. |
| `/api/auth/reset-password` | `POST` | **Public** | None | Yes | 5 / min | Completes password reset using valid OTP/token. |
| `/api/auth/logout` | `POST` | **Authenticated** | Valid Session | Yes | 30 / min | Invalidates session and clears HttpOnly cookies. |
| `/api/auth/session` | `GET` | **Authenticated** | Valid Session | No | 60 / min | Returns profile, active roles, and project assignments. |
| `/api/auth/mfa/challenge` | `POST` | **Authenticated** | Valid Session | Yes | 10 / min | Issues MFA challenge (SMS/TOTP) for elevated actions. |
| `/api/auth/mfa/verify` | `POST` | **Authenticated** | Valid Session | Yes | 10 / min | Verifies MFA token and sets 15-minute elevated auth timestamp. |
| `/api/projects` | `GET` | **Authenticated** | Valid Session | No | 120 / min | Lists projects scoped to user tenant (`can_access_project`). |
| `/api/projects` | `POST` | **Authenticated** | Government Only | Yes | 30 / min | Creates project. Requires `government_admin` or `project_manager`. |
| `/api/projects/:id` | `GET` | **Authenticated** | Scoped | No | 120 / min | Detailed project view. Enforces `can_access_project(id)`. |
| `/api/projects/:id` | `PATCH` | **Elevated** | Managed Only | Yes | 30 / min | Updates project attributes. Enforces `can_manage_project(id)`. |
| `/api/tenders` | `GET` | **Authenticated** | Scoped | No | 120 / min | Lists active tenders. Contractors view open tenders. |
| `/api/tenders` | `POST` | **Elevated** | Government Only | Yes | 20 / min | Publishes new tender notice with budget and criteria. |
| `/api/tenders/:id/bids` | `GET` | **Authenticated** | Strict Scoped | No | 60 / min | Contractors view only their bids; Gov views all after deadline. |
| `/api/tenders/:id/bids` | `POST` | **Authenticated** | Contractor Only | Yes | 20 / min | Submits sealed bid with financial and technical documents. |
| `/api/contracts` | `GET` | **Authenticated** | Scoped | No | 120 / min | Contract summaries for assigned government/contractor entities. |
| `/api/contracts/:id` | `GET` | **Authenticated** | Scoped | No | 120 / min | Contract details, clauses, performance bonds, and milestone map. |
| `/api/milestones/:id/progress` | `POST` | **Authenticated** | Contractor / Gov | Yes | 60 / min | Submits contractor progress report or records verified milestone. |
| `/api/inspections` | `GET` | **Authenticated** | Scoped | No | 120 / min | Lists inspection reports and field findings for project. |
| `/api/inspections` | `POST` | **Elevated** | Inspector / Gov | Yes | 30 / min | Submits official inspection report with geolocated photo evidence. |
| `/api/finance/payment-claims` | `GET` | **Authenticated** | Scoped | No | 120 / min | Lists claims for contractor org or government department. |
| `/api/finance/payment-claims` | `POST` | **Authenticated** | Contractor Only | Yes | 20 / min | Submits payment claim against verified milestone achievement. |
| `/api/finance/payment-claims/:id/review` | `POST` | **Elevated** | Gov Finance | Yes | 20 / min | Approves/rejects claim. Triggers blockchain anchor outbox. |
| `/api/finance/disbursements` | `POST` | **Elevated** | Gov Finance | Yes | 15 / min | Records actual bank treasury disbursement reference. |
| `/api/disputes` | `GET` | **Authenticated** | Scoped | No | 60 / min | Lists active dispute proceedings for assigned project. |
| `/api/disputes` | `POST` | **Elevated** | Legal / Gov | Yes | 15 / min | Records formal dispute filing or arbitral hearing record. |
| `/api/disputes/:id/settlements` | `POST` | **Elevated** | Legal / Gov | Yes | 10 / min | Enacts formal settlement agreement with binding terms. |
| `/api/ai/analyze` | `POST` | **Authenticated** | Scoped | Yes | 30 / min | Requests AI anomaly detection and delay forecasting for project. |
| `/api/ai/health` | `GET` | **Public** | None | No | 60 / min | Returns AI service availability and model status. |
| `/api/ai/feedback` | `POST` | **Elevated** | Gov Official | Yes | 30 / min | Records official review of recommendation for LinUCB learning. |
| `/api/integrity/project/:id` | `GET` | **Authenticated** | Scoped | No | 60 / min | Retrieves complete cryptographic audit trail from Hyperledger. |
| `/api/integrity/entity/:type/:id` | `GET` | **Authenticated** | Scoped | No | 60 / min | Retrieves entity audit history and cryptographic state proofs. |
| `/api/integrity/verify` | `POST` | **Authenticated** | Scoped | Yes | 60 / min | Verifies live database entity state against blockchain hash. |
| `/api/integrity/anchor/:auditId` | `GET` | **Authenticated** | Scoped | No | 60 / min | Inspects specific blockchain anchor record and Raft block header. |

---

## 3. Error Codes & Information Leakage Guards

In accordance with institutional security guidelines:
- **401 Unauthorized**: Returned for missing, expired, or invalid session cookies. Stack traces and detailed reasons are strictly omitted.
- **403 Forbidden**: Returned when authenticated user lacks project-level scope or elevated privileges.
- **404 Not Found**: Returned uniformly for unauthorized resource access when disclosing existence would leak confidential institutional data (e.g., unpublished tenders or sealed bids).
- **429 Too Many Requests**: Returned when rate limits are exceeded, with `Retry-After` header.
- **500 Internal Server Error**: Emits a sanitized error response containing only `{ success: false, error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred. Reference correlation ID: <uuid>' } }`. Complete diagnostics are written to internal Winston logs.
