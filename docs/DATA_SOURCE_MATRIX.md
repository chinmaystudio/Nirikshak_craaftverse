# NIRIKSHAK Craftverse — Data Source Matrix

**Version:** 1.0.0  
**Date:** 2026-10-03  
**Status:** Canonical Baseline

This matrix tracks the data source, data mode (LIVE vs DEMO), implementation readiness, and target backend domain for every screen and functional feature across all portals in NIRIKSHAK Craftverse.

---

| Portal | Screen / Route | Feature | Current Data Source | Mode | Current Status | Target Backend Domain | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Government** | `/government/login` | Officer / Admin Login | Supabase Auth (`supabase.auth`) | LIVE | LIVE | `auth` | Authenticates against Supabase Auth. |
| **Government** | `/government/register` | Officer Onboarding | Express `/api/auth/register` + DB Request | LIVE | LIVE | `auth` | Inserts `government_access_requests` (PENDING). |
| **Government** | `/government/dashboard` | Executive KPI Metrics | `government_project_summary_view` + Aggregates | LIVE | PARTIAL | `projects` / `progress` | Project counts are live; some metrics were estimated. |
| **Government** | `/government/projects` | Project Master Register | Supabase `government_project_summary_view` | LIVE | LIVE | `projects` | Real project rows queried; mapper cleaned of fake data. |
| **Government** | `/government/projects/new` | Create Project | Express `POST /api/projects` | LIVE | LIVE | `projects` | Validated with Zod; creates project & audit log. |
| **Government** | `/government/projects/:id` | Project Overview & Milestones | Supabase `projects` + `project_milestones` | LIVE | PARTIAL | `projects` / `milestones` | Milestones table exists; relations connected. |
| **Government** | `/government/tenders` | Tender Catalog | Supabase `tenders` + `tender_bids` | LIVE | LIVE | `procurement` | Queries published tenders & bidder counts. |
| **Government** | `/government/tenders/publish`| Publish Tender | Express `POST /api/tenders` | LIVE | LIVE | `procurement` | Verifies government organization ownership. |
| **Government** | `/government/approvals` | Progress Verification | PostgreSQL RPC `approve_progress_update` | LIVE | LIVE | `progress` | Reviewer approval/rejection with verified progress. |
| **Government** | `/government/contractors` | Contractor Directory | Supabase `organizations` (`type = contractor`) | LIVE | PARTIAL | `contractors` | Lists registered contractor organizations. |
| **Government** | `/government/grievances` | Grievance Oversight | Supabase `complaints` + `complaint_updates` | LIVE | LIVE | `complaints` | Real complaints from citizen portal. |
| **Government** | `/government/finance` | Fund Flows & Spending | Supabase `financial_updates` | LIVE | PARTIAL | `finance` | Fund allocations live; contractor bills deferred to V2. |
| **Government** | `/government/audit` | Audit Observations | Supabase `inspections` | LIVE | PARTIAL | `inspections` / `audit` | Field inspections mapped; dedicated audit logs table exists. |
| **Government** | `/government/litigation` | Legal Disputes & Cases | None (Empty in LIVE) / Demo fixtures | DEMO | NOT_IMPLEMENTED | `legal` | Database V2 will implement dedicated litigation tables. |
| **Government** | `/government/documents` | Project Documents | Supabase `project_documents` | LIVE | LIVE | `documents` | Queries documents associated with projects. |
| **Government** | `/government/ai` | AI Risk Audit & Alerts | Express `POST /api/ai/analyze/:projectId` | LIVE | PARTIAL | `ai` | OpenRouter / Nemotron integration; advisory only. |
| **Contractor** | `/contractor/login` | Contractor Login | Supabase Auth (`supabase.auth`) | LIVE | LIVE | `auth` | Resolves contractor organization membership. |
| **Contractor** | `/contractor/register` | Contractor Registration | Express `/api/auth/register` + DB Request | LIVE | LIVE | `auth` | Inserts `contractor_access_requests` (PENDING). |
| **Contractor** | `/contractor/dashboard` | Assigned Projects Overview | Supabase `contractor_assigned_projects_view` | LIVE | PARTIAL | `projects` / `contracts` | Real assigned projects; expenses/forecasts deferred. |
| **Contractor** | `/contractor/projects/:id` | Project Execution View | Supabase `projects` + `contracts` | LIVE | PARTIAL | `projects` / `contracts` | Basic contract & project info live; detailed sub-items deferred. |
| **Contractor** | `/contractor/tenders` | Open Tenders & RFPs | Supabase `tenders` | LIVE | LIVE | `procurement` | Real published tenders available for bidding. |
| **Contractor** | `/contractor/tenders/:id/bid`| Submit Bid | Supabase `tender_bids` (RPC `save_tender_bid`) | LIVE | LIVE | `procurement` | Enforces contractor organization verification. |
| **Contractor** | `/contractor/progress` | Daily/Weekly Progress Report| PostgreSQL RPC `submit_progress_update` | LIVE | LIVE | `progress` | Authoritative progress update submission. |
| **Contractor** | `/contractor/resources` | Equipment & Workforce | Demo fixtures | DEMO | NOT_IMPLEMENTED | `resources` | Resource tables deferred to Database V2 design. |
| **Contractor** | `/contractor/invoices` | RA Bills & Invoices | Demo fixtures | DEMO | NOT_IMPLEMENTED | `finance` | Invoicing & payment reconciliation deferred to V2. |
| **Contractor** | `/contractor/inspections` | Quality & Safety Audits | Supabase `inspections` | LIVE | PARTIAL | `inspections` | Read-only inspection events from database. |
| **Contractor** | `/contractor/compliance` | Statutory Compliance | Demo fixtures | DEMO | NOT_IMPLEMENTED | `contracts` | Compliance checklist deferred to Database V2. |
| **Contractor** | `/contractor/messages` | Agency Communication | Demo fixtures | DEMO | NOT_IMPLEMENTED | `communications` | Official communication audit log deferred to V2. |
| **Citizen** | `/user/home` | Public Portal Landing | Supabase `public_projects_view` | LIVE | LIVE | `projects` | Shows real public infrastructure projects. |
| **Citizen** | `/user/explore` | Project Explorer & Map | Supabase `public_projects_view` | LIVE | LIVE | `projects` | Map coordinates and public status from database. |
| **Citizen** | `/user/projects/:id` | Public Project Detail | Supabase `public_projects_view` | LIVE | LIVE | `projects` | Public projection (no confidential bids or internal notes). |
| **Citizen** | `/user/report` | Submit Grievance | Express `POST /api/complaints` | LIVE | LIVE | `complaints` | Supports anonymous or authenticated submissions. |
| **Citizen** | `/user/track` | Track Grievance Status | Express `GET /api/complaints/track/:ref` | LIVE | LIVE | `complaints` | Automatic PII redaction for public queries. |
| **Citizen** | `/user/community` | Civic Community Discussions | Demo fixtures | DEMO | NOT_IMPLEMENTED | `community` | Citizen discussion forum deferred to V2. |

---

### Legend:
- **LIVE**: Powered entirely by authoritative database tables, backend APIs, or PostgreSQL RPCs. Zero mock fallbacks.
- **PARTIAL**: Core entity is backed by Supabase/backend, but certain advanced sub-attributes (e.g. daily breakdown, micro-forecasts) are awaiting Database V2 schema design.
- **DEMO**: Mock fixture data used strictly for demonstration. Never mixed with live database records.
- **NOT_IMPLEMENTED**: Awaiting future database schema and backend implementation (Database V2 phase).
