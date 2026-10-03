# NIRIKSHAK Database V2 Schema Specification

This document details the complete production schema for NIRIKSHAK Database V2.

---

## 1. Identity & Organization Domain

### `profiles`
- **Purpose**: Canonical user account metadata linked to Supabase Auth.
- **PK**: `id UUID REFERENCES auth.users(id)`
- **Key Columns**: `full_name`, `display_name`, `phone`, `avatar_url`, `preferred_language`, `timezone`, `is_active`
- **Write Authority**: Owning user (`auth.uid() = id`), Main Gov Admin.
- **Read Authority**: Authenticated users within related organizations; public display names where authorized.
- **Public Visibility**: Sanitized `display_name` only.
- **AI Usage**: Excluded to preserve privacy.

### `organizations`
- **Purpose**: Master legal entities (Government Departments, Public Authorities, Contractors, Auditors).
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Key Columns**: `name`, `organization_type` (`GOVERNMENT`, `CONTRACTOR`, `AUDITOR`, `CONSULTANT`), `status` (`PENDING`, `ACTIVE`, `SUSPENDED`, `REJECTED`), `state`, `district`, `city`, `gstin`, `cin`
- **Write Authority**: Main Gov Admin, authorized organizational onboarding RPCs.
- **Read Authority**: Public can view active organization names; members can view details.
- **Public Visibility**: Name, verified state, city.
- **AI Usage**: Aggregated agency reliability indicators.

### `organization_members`
- **Purpose**: Explicit user membership and roles within an organization.
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Unique**: `(organization_id, user_id)`
- **Key Columns**: `organization_id`, `user_id`, `role`, `status` (`active`, `pending`, `suspended`, `removed`)
- **Write Authority**: Main Gov Admin or organization admin via secure RPC.
- **Read Authority**: Members of the organization, system administrators.
- **Public Visibility**: None.
- **AI Usage**: None.

---

## 2. Projects & Procurement Domain

### `projects`
- **Purpose**: Central infrastructure asset tracking throughout all lifecycle phases.
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Key Columns**: `nirikshak_project_id` (Unique), `project_name`, `government_organization_id`, `sector`, `subsector`, `total_cost_inr_crore`, `approved_cost_inr_crore`, `physical_progress_percent`, `financial_progress_percent`, `normalized_status`, `current_status_verified`, `public_visibility`
- **Statuses**: `PROPOSED`, `UNDER_REVIEW`, `APPROVED`, `TENDERING`, `AWARDED`, `UNDER_CONSTRUCTION`, `DELAYED`, `AT_RISK`, `STALLED`, `SUSPENDED`, `COMPLETED`, `CANCELLED`
- **Write Authority**: Owning Government Organization admins & project officers.
- **Read Authority**: Owning Government Org, assigned contractors, auditors; sanitized public view.
- **Public Visibility**: Sanitized via `public_projects_view`.
- **AI Usage**: Primary feature vector source (sector, cost, verified progress, timeline).

### `project_organizations`
- **Purpose**: Multi-organization association to projects (Owner, Contractor, Consultant, Auditor).
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Unique**: `(project_id, organization_id, relationship_type)`
- **Key Columns**: `project_id`, `organization_id`, `relationship_type` (`OWNER`, `CONTRACTOR`, `AUDITOR`, `CONSULTANT`), `status` (`ACTIVE`, `INACTIVE`)
- **Write Authority**: Government project authority.
- **Read Authority**: Participating organizations.
- **Public Visibility**: Awarded contractor and implementing agency names.
- **AI Usage**: Relational context.

### `tenders`
- **Purpose**: Official procurement tender notices and criteria.
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Key Columns**: `project_id`, `tender_number` (Unique), `government_organization_id`, `title`, `estimated_value_inr_crore`, `publication_date`, `bid_due_date`, `status`
- **Statuses**: `DRAFT`, `PUBLISHED`, `CLOSED`, `UNDER_EVALUATION`, `AWARDED`, `CANCELLED`
- **Write Authority**: Owning Government department.
- **Read Authority**: Public/contractors when `PUBLISHED`; Government internal when `DRAFT`.
- **Public Visibility**: Full public catalog via `tender_catalog_view`.
- **AI Usage**: Procurement timeline analysis.

### `tender_bids`
- **Purpose**: Contractor commercial and technical proposals.
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Key Columns**: `tender_id`, `contractor_organization_id`, `bid_reference` (Unique), `bid_amount`, `technical_proposal`, `financial_proposal`, `technical_score`, `financial_score`, `combined_score`, `status`
- **Statuses**: `DRAFT`, `SUBMITTED`, `WITHDRAWN`, `UNDER_REVIEW`, `QUALIFIED`, `DISQUALIFIED`, `SELECTED`, `REJECTED`
- **Write Authority**: Owning contractor via `save_tender_bid` RPC.
- **Read Authority**: Owning contractor (own bid only); authorized Government evaluators. Competitors strictly prohibited.
- **Public Visibility**: Selected bid reference and value only after formal contract award.
- **AI Usage**: None during active bidding. Post-award cost variance analytics.

---

## 3. Contracts & Milestones Domain

### `contracts`
- **Purpose**: Binding legal contracts awarded to contractors.
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Key Columns**: `contract_number` (Unique), `project_id`, `tender_id`, `selected_bid_id`, `government_organization_id`, `contractor_organization_id`, `contract_value`, `scheduled_start_date`, `scheduled_end_date`, `retention_percentage`, `performance_security_amount`, `status`
- **Statuses**: `DRAFT`, `ACTIVE`, `SUSPENDED`, `TERMINATED`, `COMPLETED`
- **Write Authority**: Government authority via `award_contract` RPC.
- **Read Authority**: Owning Government Org, awarded contractor, auditors.
- **Public Visibility**: Awarded contract value and contractor name.
- **AI Usage**: Contract duration and cost baseline.

### `project_milestones`
- **Purpose**: WBS milestones and weight distributions for progress accountability.
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Key Columns**: `project_id`, `contract_id`, `milestone_code`, `milestone_name`, `sequence_number`, `weight_percent`, `planned_progress_percent`, `verified_progress_percent`, `status`
- **Statuses**: `NOT_STARTED`, `IN_PROGRESS`, `DELAYED`, `COMPLETED`, `SUSPENDED`
- **Write Authority**: Government project team and supervising engineers.
- **Read Authority**: Government, assigned contractor, auditors, public summary.
- **Public Visibility**: High-level milestone names and completion status.
- **AI Usage**: Schedule deviation and milestone slippage tracking.

---

## 4. Progress, Delays, Resources & Workforce Domain

### `progress_updates`
- **Purpose**: Progress reports submitted by contractors and reviewed by Government engineers.
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Key Columns**: `project_id`, `milestone_id`, `contractor_organization_id`, `reported_progress`, `verified_progress`, `verification_status`, `work_completed`, `work_planned`, `challenges`, `observation_date`, `submitted_by`, `reviewed_by`
- **Statuses**: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `APPROVED`, `REJECTED`, `CLARIFICATION_REQUIRED`
- **Write Authority**: Contractor can submit (`reported_progress`); Government can verify (`verified_progress`, `APPROVED`).
- **Read Authority**: Government team, reporting contractor, auditors.
- **Public Visibility**: Latest verified progress percentage only.
- **AI Usage**: Critical feature vector input for drift and anomaly modeling.

### `delay_events`
- **Purpose**: Structured logging of project roadblocks, stays, and force majeure delays.
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Key Columns**: `project_id`, `milestone_id`, `delay_type`, `reason`, `delay_days`, `start_date`, `end_date`, `responsibility`, `verified`, `status`
- **Delay Types**: `LAND_ACQUISITION`, `UTILITY_SHIFTING`, `WEATHER`, `RESOURCE_SHORTAGE`, `APPROVAL_DELAY`, `PAYMENT_DELAY`, `CONTRACTOR_DELAY`, `DESIGN_CHANGE`, `LEGAL_STAY`, `ENVIRONMENTAL_CLEARANCE`, `PUBLIC_PROTEST`, `OTHER`
- **Write Authority**: Contractor / Government submit; Government verifies.
- **Read Authority**: Government, contractor, auditors.
- **Public Visibility**: Generalized delay category.
- **AI Usage**: Cumulative schedule variance derivation.

### `resource_items` & `project_resource_allocations` & `resource_usage_updates`
- **Purpose**: Tracking equipment, machinery, and materials allocated to projects and reporting real shortages.
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Key Columns**: `resource_code`, `allocated_quantity`, `required_quantity`, `available_quantity`, `shortage_ratio`, `verification_status`
- **Write Authority**: Contractor reports usage; Government audits.
- **Read Authority**: Project-assigned organizations.
- **Public Visibility**: None.
- **AI Usage**: `resource_shortage_ratio` feature (honest `NULL` when unrecorded).

### `project_workforce_updates`
- **Purpose**: Aggregate labor headcounts (skilled, unskilled, supervisors) to monitor capacity without worker surveillance.
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Key Columns**: `planned_workers`, `available_workers`, `skilled_workers`, `unskilled_workers`, `worker_shortage_ratio`
- **Write Authority**: Contractor logs daily/weekly aggregates.
- **Read Authority**: Project team, labor compliance inspectors.
- **Public Visibility**: None.
- **AI Usage**: Labor bottleneck signal.

---

## 5. Financial Monitoring & Payment Claims Domain

### `project_budget_heads` & `financial_updates`
- **Purpose**: Sanctioned heads of account, committed allocations, and actual cumulative expenditures.
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Key Columns**: `sanctioned_amount_inr_crore`, `expenditure_inr_crore`, `committed_amount_inr_crore`, `financial_progress_percent`
- **Write Authority**: Government Finance Officer / PWD Accounts.
- **Read Authority**: Government project team, auditors.
- **Public Visibility**: Total approved and disbursed amounts in crores.
- **AI Usage**: `cost_variance_pct` calculation.

### `payment_claims` & `payments`
- **Purpose**: Contractor Running Account (RA) bills, verification, and disbursement records.
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Key Columns**: `claim_number`, `claimed_amount`, `verified_amount`, `approved_amount`, `status`, `submitted_by`, `reviewed_by`, `approved_by`
- **Statuses**: `DRAFT`, `SUBMITTED`, `UNDER_REVIEW`, `CLARIFICATION_REQUIRED`, `VERIFIED`, `APPROVED`, `REJECTED`, `PAID`
- **Write Authority**: Contractor submits claim; Government verifies, approves, and records disbursement via `submit_payment_claim`, `review_payment_claim`, and `record_payment` RPCs.
- **Read Authority**: Owning Government Org, claiming contractor, auditors.
- **Public Visibility**: Aggregated project payment amounts.
- **AI Usage**: Financial velocity and payment liquidity tracking.

---

## 6. Inspections, Documents & Compliance Domain

### `inspections` & `inspection_findings`
- **Purpose**: Quality, safety, structural, and environmental site audits.
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Key Columns**: `inspection_type`, `inspection_date`, `overall_result`, `severity` (`LOW`, `MEDIUM`, `HIGH`, `CRITICAL`), `finding_type`, `status` (`OPEN`, `ACTION_REQUIRED`, `RESOLVED`, `ACCEPTED`)
- **Write Authority**: Certified Government engineers and third-party auditors.
- **Read Authority**: Government, contractor, auditors.
- **Public Visibility**: Aggregate completed inspection count and safety compliance certification.
- **AI Usage**: `inspection_defects` is derived strictly from `OPEN` and `ACTION_REQUIRED` findings.

### `project_documents`
- **Purpose**: Canonical document registry for drawings, contracts, test reports, and clearances.
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Key Columns**: `storage_bucket`, `storage_path`, `mime_type`, `visibility` (`GOV_INTERNAL`, `PROJECT_SHARED`, `CONTRACTOR_PRIVATE`, `PUBLIC`, `AI_ALLOWED`), `checksum`, `version_number`
- **Write Authority**: Authorized uploaders per visibility scope.
- **Read Authority**: Strict RLS matching storage bucket policies.
- **Public Visibility**: Public if `visibility = 'PUBLIC'`.
- **AI Usage**: Only documents marked `AI_ALLOWED` and sanitized are accessible to reasoning models.

---

## 7. Citizen Complaints & Grievance Domain

### `complaints` & `complaint_updates` & `complaint_evidence`
- **Purpose**: Citizen grievances regarding noise, dust, delays, safety, and infrastructure defects.
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Key Columns**: `complaint_number` (Unique), `project_id`, `citizen_user_id`, `category`, `severity`, `title`, `description`, `status`, `assigned_organization_id`, `public_tracking_token`
- **Statuses**: `SUBMITTED`, `ACKNOWLEDGED`, `UNDER_REVIEW`, `ACTION_IN_PROGRESS`, `RESOLVED`, `REJECTED`, `CLOSED`
- **Write Authority**: Citizens submit complaints; assigned Government officers acknowledge and resolve.
- **Read Authority**: Submitting citizen (own complaints), assigned Government team, public tracking token holders.
- **Public Visibility**: Public complaint counts and resolved grievance metrics.
- **AI Usage**: Total complaint count and high-severity complaint counts.

---

## 8. Legal, Litigation & Settlement Domain

### `litigations` & `litigation_events` & `settlements`
- **Purpose**: High-stakes legal disputes (land acquisition, arbitrations, environmental writs, payment stays).
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Key Columns**: `case_number`, `court_or_forum`, `litigation_type`, `status` (`OPEN`, `UNDER_HEARING`, `STAY_ORDER`, `MEDIATION`, `SETTLED`, `DISMISSED`, `CLOSED`), `claimed_amount`, `risk_level`, `terms`, `approved_amount`
- **Write Authority**: Government legal cell officers.
- **Read Authority**: Government legal cell, authorized department heads.
- **Public Visibility**: Public court case numbers where disclosure is statutorily required.
- **AI Usage**: Litigation presence is fed as a high-risk flag; AI cannot approve or value settlements.

---

## 9. AI Intelligence & Reinforcement Learning Domain

### `ai_analysis_runs`
- **Purpose**: Business-level persistence of every model inference run.
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Key Columns**: `analysis_id` (Unique), `project_id`, `service_version`, `llm_model`, `context_hash`, `input_completeness_score`, `status`
- **Write Authority**: Express backend service-role.
- **Read Authority**: Government officers, system admins.
- **Public Visibility**: None.

### `ai_recommended_actions`
- **Purpose**: Actions proposed by the LinUCB reinforcement learning policy.
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Key Columns**: `analysis_run_id`, `project_id`, `action_code`, `rank`, `policy_score`, `learned_mean_reward`, `uncertainty_bonus`, `explanation`, `status`
- **Statuses**: `PROPOSED`, `REVIEWED`, `ACCEPTED`, `REJECTED`, `COMPLETED`

### `ai_recommendation_feedback`
- **Purpose**: Stores human government judgment (`USEFUL`, `ACCEPTED`, `NEUTRAL`, `REJECTED`, `HARMFUL`) without premature policy weight mutations.
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Write Authority**: Authenticated Government reviewer.

### `ai_action_outcomes`
- **Purpose**: Post-hoc verification linking recommended interventions to actual downstream project progress and cost deltas.
- **PK**: `id UUID DEFAULT gen_random_uuid()`
- **Key Columns**: `analysis_run_id`, `recommended_action_id`, `baseline_snapshot`, `verified_outcome_snapshot`, `reward`, `verified_by`, `verified_at`
- **Policy Update**: Triggers the single, authoritative `LinUCB` matrix update once per verified outcome.
