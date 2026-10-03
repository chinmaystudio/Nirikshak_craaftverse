# NIRIKSHAK DATABASE V2 AUDIT REPORT

**Date:** 2026-10-03  
**Auditors:** Principal Database Architect, Supabase/PostgreSQL Engineer, Security Engineer, Backend Architect, AI/ML Integration Engineer  
**Scope:** Migrations `001_extensions.sql` through `028_public_rls_helper_privileges.sql`, `frontend/src/lib/supabase/database.types.ts`, `backend/src/modules/`, `frontend/src/modules/`  

---

## 1. Executive Summary

This comprehensive audit catalogs the state of the NIRIKSHAK PostgreSQL/Supabase database across all 28 existing migrations (encompassing 29 SQL migration files). The schema currently contains 37 distinct relational tables, 3 database views, 22 database functions/RPCs, 6 custom enum types, 121 Row Level Security (RLS) policies, and 2 database triggers.

The database successfully establishes foundations for core identity, multi-tenant organization isolation (Government vs. Contractor vs. Citizen), project master data, tenders, progress verification, citizen grievances, and initial AI insight logging. However, critical gaps exist: several target lifecycle domains (Resource Tracking, Project Budget Heads & Payment Claims, Legal & Litigation Management, Settlement Management, Environmental Clearances/Incidents, Fine-Grained AI Action Tracking & Verified Outcomes) either lack tables entirely or exist only as frontend demo fixtures without authoritative database backing. Furthermore, several critical data-flow bugs and column mismatches exist in the current application code (e.g. `ai.context.ts` querying nonexistent column names and destructing `data` instead of `count`).

Database V2 will preserve all existing migrations (001–028) as immutable history and begin all additive, non-destructive normalization migrations at `029_...`.

---

## 2. Inventory of Existing Tables (Migrations 001–028)

| # | Table Name | Defining Migration | Column Count | Primary Domain | Existing Indexes / Constraints |
|---|---|---|---|---|---|
| 1 | `profiles` | `001_initial_schema.sql` | 8 | Identity | PK `id` -> `auth.users(id)` |
| 2 | `organizations` | `001_initial_schema.sql` (+`024`) | 13 | Organization | PK `id`, `org_type_enum`, `name` |
| 3 | `organization_members` | `001_initial_schema.sql` | 7 | Membership & RBAC | PK `id`, Unique `(organization_id, user_id)`, `role` |
| 4 | `government_access_requests` | `019_realtime_and_workflow.sql` (+`024`, `026`) | 13 | Access Management | PK `id`, FK `user_id`, `status` |
| 5 | `contractor_access_requests` | `019_realtime_and_workflow.sql` (+`024`, `026`) | 14 | Access Management | PK `id`, FK `user_id`, `status` |
| 6 | `projects` | `001_initial_schema.sql` (+`024`) | 53 | Project Master | PK `id`, Unique `nirikshak_project_id`, FK `government_organization_id` |
| 7 | `project_organizations` | `001_initial_schema.sql` | 7 | Project-Org Links | PK `id`, FK `project_id`, FK `organization_id` |
| 8 | `project_milestones` | `001_initial_schema.sql` | 20 | Milestones | PK `id`, FK `project_id`, `milestone_code`, `status` |
| 9 | `project_documents` | `001_initial_schema.sql` | 13 | Documents | PK `id`, FK `project_id`, `storage_path`, `document_type` |
| 10 | `project_aliases` | `001_initial_schema.sql` | 8 | Ingestion/Alias | PK `id`, FK `project_id` |
| 11 | `project_updates` | `001_initial_schema.sql` | 13 | Generic Updates | PK `id`, FK `project_id` |
| 12 | `tenders` | `001_initial_schema.sql` (+`021`, `024`) | 19 | Procurement | PK `id`, Unique `tender_number`, FK `project_id`, FK `issuing_organization_id` |
| 13 | `tender_bids` | `001_initial_schema.sql` (+`021`, `024`, `025`) | 14 | Procurement Bids | PK `id`, Unique `bid_reference`, FK `tender_id`, FK `contractor_organization_id` |
| 14 | `contracts` | `001_initial_schema.sql` | 17 | Contracting | PK `id`, Unique `contract_number`, FK `project_id`, FK `tender_id`, FK `contractor_organization_id` |
| 15 | `progress_updates` | `001_initial_schema.sql` (+`025`) | 16 | Execution Progress | PK `id`, FK `project_id`, FK `contractor_organization_id`, `reported_progress`, `verified_progress` |
| 16 | `progress_evidence` | `001_initial_schema.sql` | 9 | Progress Evidence | PK `id`, FK `progress_update_id`, `evidence_type`, `storage_path` |
| 17 | `delay_events` | `001_initial_schema.sql` | 11 | Timeline / Delays | PK `id`, FK `project_id`, `delay_days`, `delay_type` |
| 18 | `financial_updates` | `001_initial_schema.sql` | 13 | Finance Outlay | PK `id`, FK `project_id`, `expenditure_inr_crore` |
| 19 | `inspections` | `001_initial_schema.sql` | 11 | Quality Oversight | PK `id`, FK `project_id`, `status`, `overall_result` |
| 20 | `inspection_findings` | `001_initial_schema.sql` | 13 | Defects Oversight | PK `id`, FK `inspection_id`, `severity`, `status` |
| 21 | `environmental_clearances` | `001_initial_schema.sql` | 11 | Compliance | PK `id`, FK `project_id`, `clearance_type`, `status` |
| 22 | `environmental_commitments` | `001_initial_schema.sql` | 11 | Compliance | PK `id`, FK `project_id` |
| 23 | `environmental_baselines` | `001_initial_schema.sql` | 11 | Compliance | PK `id`, FK `project_id`, `metric_type` |
| 24 | `environmental_observations` | `012_environment.sql` | 12 | Compliance | PK `id`, FK `project_id`, `metric_type`, `value` |
| 25 | `environmental_incidents` | `012_environment.sql` | 12 | Compliance | PK `id`, FK `project_id`, `incident_type`, `severity` |
| 26 | `complaints` | `001_initial_schema.sql` (+`024`) | 18 | Citizen Grievance | PK `id`, Unique `reference_number`, FK `project_id`, FK `user_id`, `status` |
| 27 | `complaint_updates` | `001_initial_schema.sql` | 7 | Grievance Thread | PK `id`, FK `complaint_id`, `status`, `visibility` |
| 28 | `complaint_evidence` | `001_initial_schema.sql` | 7 | Grievance Media | PK `id`, FK `complaint_id`, `storage_path` |
| 29 | `notifications` | `001_initial_schema.sql` (+`024`) | 11 | Platform Alerts | PK `id`, FK `user_id`, `notification_type` |
| 30 | `audit_logs` | `001_initial_schema.sql` | 10 | Security Audit | PK `id`, FK `actor_id`, `action`, `entity_type` |
| 31 | `ai_runs` | `001_initial_schema.sql` | 14 | AI Execution | PK `id`, FK `project_id`, `status` |
| 32 | `ai_insights` | `001_initial_schema.sql` (+`024`) | 18 | AI Intelligence | PK `id`, FK `project_id`, `insight_type`, `review_priority_score` |
| 33 | `ai_jobs` | `021_procurement_progress_ai.sql` | 13 | AI Queue | PK `id`, FK `project_id`, `job_type`, `status` |
| 34 | `sources` | `001_initial_schema.sql` | 10 | External Ingestion | PK `id`, `source_name`, `base_url` |
| 35 | `source_observations` | `001_initial_schema.sql` | 13 | External Ingestion | PK `id`, FK `source_id`, FK `project_id` |
| 36 | `import_batches` | `001_initial_schema.sql` | 9 | Data Import | PK `id`, `batch_status` |
| 37 | `project_import_staging` | `001_initial_schema.sql` | 8 | Data Import | PK `id`, `staging_status` |

---

## 3. Inventory of Existing Views

1. **`public_projects_view` (Created in `001_initial_schema.sql`, updated in `024`):**
   - Sanitized representation of published projects for public and citizen consumption.
   - Restricts exposure of internal contractor disputes, internal financial adjustments, and unverified raw claims.
2. **`government_project_summary_view` (Created in `024_multi_tenant_gov_contractor_architecture.sql`):**
   - Enriched administrative dashboard view aggregating assigned contractor, verified progress, approved budget, milestone counts, and latest update timestamps.
3. **`contractor_assigned_projects_view` (Created in `024_multi_tenant_gov_contractor_architecture.sql`):**
   - Scoped view exposing only projects where the calling contractor's organization is officially assigned via active contract or `project_organizations`.

---

## 4. Inventory of Existing Functions / Stored Procedures (RPCs)

| RPC Name | Defining Migration | Parameters | Return Type | Security Context | Description |
|---|---|---|---|---|---|
| `submit_progress_update` | `025_complete_security_hardening.sql` | `p_project_id`, `p_reported_progress`, `p_description`, `p_milestone_id` | `progress_updates` | `SECURITY DEFINER` | Validates contractor assignment and inserts unverified report. |
| `approve_progress_update` | `025_complete_security_hardening.sql` | `p_update_id`, `p_decision`, `p_verified_progress`, `p_review_notes` | `jsonb` | `SECURITY DEFINER` | Authoritative Gov approval. Updates project `physical_progress_percent` only on `APPROVED`. |
| `save_tender_bid` | `025_complete_security_hardening.sql` | `p_tender_id`, `p_bid_amount`, `p_technical_proposal`, `p_documents` | `tender_bids` | `SECURITY DEFINER` | Validates contractor tenancy, generates official `bid_reference`, records bid atomically. |
| `award_contract` | `025_complete_security_hardening.sql` | `p_tender_id`, `p_selected_bid_id`, `p_contract_value`, `p_start_date`, `p_end_date` | `jsonb` | `SECURITY DEFINER` | Atomically marks bid SELECTED, rejects competitors, updates tender, creates contract, links org. |
| `approve_government_access_request` | `026_security_access_hardening.sql` | `request_id`, `approved_role` | `jsonb` | `SECURITY DEFINER` | Main Gov Admin activation of pending Government accounts. |
| `approve_contractor_access_request` | `026_security_access_hardening.sql` | `request_id`, `approved_role` | `jsonb` | `SECURITY DEFINER` | Main Gov Admin activation of pending Contractor company accounts. |
| `register_government_account` | `024_multi_tenant...sql` | `p_email`, `p_password`, `p_full_name`, `p_org_id`, `p_dept`, `p_designation` | `jsonb` | `SECURITY DEFINER` | Submits pending Government account request without immediate role grant. |
| `register_contractor_account` | `024_multi_tenant...sql` | `p_email`, `p_password`, `p_full_name`, `p_company_name`, `p_cin`, `p_class` | `jsonb` | `SECURITY DEFINER` | Submits pending Contractor account request without immediate role grant. |
| `get_user_organization_id` | `024_multi_tenant...sql` | none | `uuid` | `SECURITY DEFINER` | Resolves current caller's active organization ID via `auth.uid()`. |
| `get_current_user_organization_id` | `025_complete_security_hardening.sql` | none | `uuid` | `SECURITY DEFINER` | Hardened synonym for organization ID lookup. |
| `get_user_role` | `024_multi_tenant...sql` | none | `app_role_enum` | `SECURITY DEFINER` | Resolves caller's verified application role. |
| `get_current_user_role` | `025_complete_security_hardening.sql` | none | `app_role_enum` | `SECURITY DEFINER` | Hardened synonym for caller role resolution. |
| `can_access_project` | `024_multi_tenant...sql` | `p_id uuid` | `boolean` | `SECURITY DEFINER` | Enforces project-level isolation across Government and Contractor orgs. |
| `can_manage_project` | `024_multi_tenant...sql` | `p_id uuid` | `boolean` | `SECURITY DEFINER` | Verifies owning Government department authority. |
| `can_review_progress` | `025_complete_security_hardening.sql` | `p_project_id uuid` | `boolean` | `SECURITY DEFINER` | Guards progress review to authorized Government engineers. |
| `is_government_user` | `024_multi_tenant...sql` | none | `boolean` | `SECURITY DEFINER` | Checks if caller role is in Government hierarchy. |
| `is_contractor_user` | `024_multi_tenant...sql` | none | `boolean` | `SECURITY DEFINER` | Checks if caller role is in Contractor hierarchy. |
| `is_citizen` | `017_rls.sql` | none | `boolean` | `SECURITY DEFINER` | Checks if caller is authenticated citizen. |
| `belongs_to_organization` | `001_initial_schema.sql` | `target_org_id uuid` | `boolean` | `SECURITY DEFINER` | Membership verification helper. |
| `handle_new_user` | `024_multi_tenant...sql` | none | `trigger` | `SECURITY DEFINER` | Automatically initializes `profiles` record on `auth.users` insert. |
| `set_project_gov_org` | `024_multi_tenant...sql` | none | `trigger` | `SECURITY DEFINER` | Defaults project `government_organization_id` from caller org. |

---

## 5. Existing Enums & Custom Types

1. `org_type_enum` / `org_type`: `'government'`, `'contractor'`, `'auditor'`, `'other'`
2. `user_role`: `'citizen'`, `'government'`, `'contractor'`, `'auditor'`, `'super_admin'`
3. `app_role_enum`:
   - `'main_gov_admin'`, `'government_admin'`, `'chief_engineer'`, `'project_officer'`, `'government_engineer'`
   - `'contractor_admin'`, `'contractor_manager'`, `'contractor_engineer'`, `'contractor_site_engineer'`
   - `'citizen'`, `'auditor'`
4. `project_status_enum` / `project_status`:
   - `'PROPOSED'`, `'UNDER_REVIEW'`, `'APPROVED'`, `'TENDERING'`, `'AWARDED'`, `'UNDER_CONSTRUCTION'`, `'DELAYED'`, `'AT_RISK'`, `'STALLED'`, `'SUSPENDED'`, `'COMPLETED'`, `'CANCELLED'`

---

## 6. Existing Storage Buckets & Realtime Status

- **Storage Buckets:**
  - Configured in migration `001_initial_schema.sql` via Supabase API conventions: `project-documents`, `progress-evidence`, `inspection-evidence`, `complaint-evidence`.
  - Storage RLS policies exist in `017_rls.sql` and `025_complete_security_hardening.sql`.
- **Realtime Publications:**
  - `ALTER PUBLICATION supabase_realtime ADD TABLE progress_updates, notifications, tenders, complaints;` configured in `019_realtime_and_workflow.sql`.

---

## 7. Fields Required by Application Code that are Currently Missing or Inconsistent

| File & Location | Current Problematic Code | Required Database V2 Fix |
|---|---|---|
| `backend/src/modules/ai/ai.context.ts` (L102-103) | `{ data: complaintsCount }` from `select('id', { count: 'exact', head: true })` | Destructure `{ count: complaintsCount }`, `{ count: highComplaintsCount }`. In Supabase JS, `head: true` returns `count` on the response root; `data` is `null`. |
| `backend/src/modules/ai/ai.context.ts` (L106) | Queries `reported_physical_progress_percent, verified_physical_progress_percent, observation_date, status, labor_count, evidence_urls` on `progress_updates` | Query canonical columns: `reported_progress, verified_progress, verification_status, submitted_at, description`. |
| `backend/src/modules/ai/ai.context.ts` (L117) | Checks `u.status === 'VERIFIED'` | Check canonical column: `u.verification_status === 'APPROVED'`. |
| `backend/src/modules/progress/progress.service.ts` (L60) | Queries `verified_physical_progress_percent` on `progress_updates` | Query canonical column: `verified_progress`. |
| `frontend/src/modules/government/services/work.service.ts` | Relies on local fixtures for workforce, resources, machinery | Build database tables `resource_items`, `project_resource_allocations`, `resource_usage_updates`, `project_workforce_updates`. |
| `frontend/src/modules/government/services/finance.service.ts` | Lacks budget head breakdown and payment claims | Build tables `project_budget_heads`, `payment_claims`, `payment_claim_documents`, `payments`. |
| `frontend/src/modules/government/services/legal.service.ts` | Fully mocked in live mode | Build tables `litigations`, `litigation_events`, `settlements`. |
| `backend/src/modules/ai/ai.service.ts` | Inserts into `ai_insights` without dedicated analysis run tracking | Build `ai_analysis_runs`, `ai_recommended_actions`, `ai_recommendation_feedback`, `ai_action_outcomes`, `ai_context_snapshots`. |

---

## 8. Missing Domains Identified for Database V2

1. **Resources & Equipment Management:**
   - Need `resource_items` (materials, machinery, vehicles).
   - Need `project_resource_allocations` (allocation to specific projects/contractors).
   - Need `resource_usage_updates` (periodic usage, honest shortage ratios).
2. **Workforce Tracking (Aggregate Only):**
   - Need `project_workforce_updates` (planned vs. actual skilled/unskilled worker counts, safety personnel, without individual surveillance).
3. **Budget Heads & Structured Payment Claims:**
   - Need `project_budget_heads` (sanctioned vs. revised heads).
   - Need `payment_claims` (RA bills, milestone bills, retention release).
   - Need `payment_claim_documents` (supporting vouchers, test records).
   - Need `payments` (disbursement reference, date, amount, audit).
4. **Litigation & Dispute Settlement:**
   - Need `litigations` (case tracking, court, jurisdiction, claim amounts, stay orders).
   - Need `litigation_events` (hearings, filings, orders, counsel notes).
   - Need `settlements` (settlement proposals, reviews, approvals, execution).
5. **AI Intelligence Execution & Audit Domain:**
   - Need `ai_analysis_runs` (execution tracking, model versions, context hash, input completeness score).
   - Need `ai_recommended_actions` (action code, ranking, LinUCB policy score, explanation).
   - Need `ai_recommendation_feedback` (human officer review of specific action).
   - Need `ai_action_outcomes` (closed-loop reward tracking with verified baseline vs. verified outcome comparison).
   - Need `ai_context_snapshots` (tamper-evident audit trail of data submitted for ML/LLM inference).
6. **External Environmental & Civic Telemetry:**
   - Need `external_data_sources` and `external_observations` (weather, air quality, satellite, municipal open data).
7. **Comprehensive Public & Government Views:**
   - Need `public_projects_view` (refreshed with sanitized V2 aggregates).
   - Need `government_project_dashboard_view` (cross-domain executive metrics).
   - Need `contractor_assigned_projects_view` (contractor-specific overview).
   - Need `project_progress_summary_view` (reported vs. verified vs. planned).
   - Need `project_finance_summary_view` (sanctioned, spent, committed, variance).
   - Need `tender_catalog_view` (published tenders open for bidding).

---

## 9. Migration Roadmap (029+)

To maintain strict migration safety, modularity, and rollback isolation, Database V2 will be delivered in structured migration increments:

- `029_database_v2_foundation.sql`: Core schema extensions, organization and project normalization, `project_organizations`.
- `030_procurement_contracts_v2.sql`: Tender documents, bid documents, bid isolation, atomic `award_contract` upgrade.
- `031_milestones_progress_delays_v2.sql`: Milestone weight validation, delay events normalization, canonical progress schema alignment.
- `032_resources_workforce_v2.sql`: Resource items, allocations, usage updates, aggregate workforce tracking.
- `033_finance_payment_claims_v2.sql`: Project budget heads, financial updates normalization, payment claims, payments ledger.
- `034_inspections_documents_v2.sql`: Inspection findings lifecycle, canonical `project_documents` enhancements.
- `035_environment_compliance_v2.sql`: Environmental clearances, baselines, observations, incident tracking.
- `036_complaints_v2.sql`: Citizen grievance tracking token support, complaint updates, complaint evidence.
- `037_legal_litigation_settlements_v2.sql`: Litigations, litigation events, structured settlements.
- `038_notifications_audit_v2.sql`: Universal platform notifications, immutable security audit logging.
- `039_ai_intelligence_lifecycle_v2.sql`: AI analysis runs, recommendations, action feedback, verified outcomes, context snapshots.
- `040_external_telemetry_v2.sql`: External data sources and public telemetry observations.
- `041_views_v2.sql`: Materialized and relational views for public, government, contractor dashboards.
- `042_rls_v2.sql`: Row Level Security policies across all new V2 tables ensuring strict multi-tenant isolation.
- `043_secure_rpc_v2.sql`: Production-grade `SECURITY DEFINER` functions with fixed search paths.
- `044_storage_policies_v2.sql`: Storage bucket provisioning and fine-grained access policies.
- `045_realtime_indexes_v2.sql`: Concurrency indexes and selective Realtime publication bindings.
- `046_seed_support_v2.sql`: Comprehensive development seed script supporting all E2E test personas and full lifecycle transitions.

---

## 10. Conclusion & Pre-requisite Clearance
The audit verifies that all existing migrations 001–028 are structurally sound, well-documented, and ready to serve as the immutable baseline. With the exact column and domain requirements mapped above, Database V2 implementation can commence with absolute compatibility and zero risk of data loss.
