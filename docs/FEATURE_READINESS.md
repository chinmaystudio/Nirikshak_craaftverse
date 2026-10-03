# NIRIKSHAK Craftverse — Feature Readiness Matrix

**Version:** 1.0.0  
**Date:** 2026-10-03  
**Status:** Canonical Baseline

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
| **Milestones Management** | **PARTIAL** | Supabase `project_milestones` | Milestones table exists; CRUD UI partially wired. |
| **Progress Submission** | **LIVE** | PostgreSQL RPC `submit_progress_update` | Contractor submits reported progress & evidence paths. |
| **Progress Verification** | **LIVE** | PostgreSQL RPC `approve_progress_update` | Government official reviews, accepts, or rejects update. |
| **Resources & Workforce** | **NOT_IMPLEMENTED** | UI only (Mock in Demo mode) | Dedicated labor/machinery tables deferred to V2. |
| **Finance — Fund Allocations** | **PARTIAL** | Supabase `financial_updates` | Fund allocation & release tracking live; RA bills deferred. |
| **Invoices / RA Bills** | **NOT_IMPLEMENTED** | UI only (Mock in Demo mode) | Electronic measurement book & bills deferred to V2. |
| **Inspections** | **PARTIAL** | Supabase `inspections` | Inspection records live; multi-photo upload deferred. |
| **Documents Storage** | **LIVE** | Supabase `project_documents` + Storage | Document catalog metadata linked to projects. |
| **Complaints — Submission** | **LIVE** | Express `POST /api/complaints` | Citizen grievance filing with reference number. |
| **Complaints — Public Tracking** | **LIVE** | Express `GET /api/complaints/track/:ref` | Public grievance tracking with strict PII redaction. |
| **Litigation Management** | **NOT_IMPLEMENTED** | UI only (Mock in Demo mode) | Legal arbitration & court case schema deferred to V2. |
| **Environmental Compliance** | **PARTIAL** | Supabase `environmental_records` | Environmental table exists; monitoring dashboards partial. |
| **Notifications** | **LIVE** | Supabase `notifications` table | Real-time and persistent alerts queryable. |
| **Audit Logging** | **LIVE** | Supabase `audit_logs` table | System events recorded with actor ID, entity, & payload. |
| **Realtime Updates** | **PARTIAL** | Supabase Realtime Channels | Configured in migration 019; client service normalized. |
| **AI Project Risk Analysis** | **PARTIAL** | Express `/api/ai/analyze/:projectId` + OpenRouter | LLM provider analyzes schedule & cost risk; advisory only. |

---

### Detailed Domain Breakdown

### 1. Identity, Authentication & Multi-Tenancy (LIVE)
- Supabase Auth provides underlying JWT infrastructure.
- Zero privileged roles are granted automatically at signup.
- Multi-tenancy is enforced by linking authenticated users to `organizations` through `organization_members`.
- RLS policies verify caller membership and organization type on every row operation.

### 2. Infrastructure Projects & Milestones (PARTIAL)
- Core project records, metadata, sanction amounts, planned dates, and authority ownership are fully LIVE.
- Progress updates update `physical_progress_percent` through authoritative verification.
- Micro-milestones and detailed dependency graphs await the V2 database design.

### 3. Procurement, Tenders & Contracting (LIVE)
- End-to-end procurement cycle is supported by database schema and RPCs:
  1. Officer creates tender for their organization's project.
  2. Contractor submits bid before `bid_due_date`.
  3. Official evaluates bids and calls `award_contract`.
  4. Active contract links contractor organization to project.

### 4. Contractor Execution & Verification (LIVE)
- Contractor submits updates through `submit_progress_update`.
- State transitions to `SUBMITTED` / `UNDER_REVIEW`.
- Government engineers review evidence and execute `approve_progress_update`.
- No fake local state double-writes.

### 5. AI Advisory Engine (PARTIAL)
- Uses NVIDIA Nemotron through OpenRouter.
- Strictly advisory; forbidden from executing mutations or approvals.
- Sanitizes PII and credentials prior to prompt dispatch.
- Returns structured JSON for risk scoring and mitigation recommendations.
