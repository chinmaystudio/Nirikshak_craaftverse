# NIRIKSHAK Database V2 Row Level Security (RLS) Matrix

This document provides the definitive authorization matrix implemented across all NIRIKSHAK Database V2 tables, views, and storage buckets.

---

## 1. Core Table Security Policies

| Table / Entity | Main Gov Admin | Owning Gov Department | Assigned Contractor | Other Contractors | Citizen | Public / Anon |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **`profiles`** | Full Read/Write | Org Members | Org Members | Org Members | Own Profile | Public Display |
| **`organizations`** | Full Read/Write | Read Details | Read Details | Read Details | Read Active Names | Read Active Names |
| **`organization_members`** | Full Read/Write | Own Org Members | Own Org Members | Denied | Denied | Denied |
| **`projects`** | Full Read/Write | Full Read/Write | Read Assigned | Denied | Denied (View Only) | Denied (View Only) |
| **`project_organizations`** | Full Read/Write | Full Read/Write | Read Assigned | Denied | Denied | Denied |
| **`tenders`** | Full Read/Write | Full Read/Write | Read Published | Read Published | Read Published | Read Published |
| **`tender_bids`** | Full Read/Write | Read Project Bids | Own Bids Only | **DENIED** | **DENIED** | **DENIED** |
| **`contracts`** | Full Read/Write | Full Read/Write | Read Own Contract | Denied | Denied | Denied |
| **`project_milestones`** | Full Read/Write | Full Read/Write | Read Assigned | Denied | Denied | Denied |
| **`progress_updates`** | Full Read/Write | Full Read/Approve | Submit / Read Own | Denied | Denied | Denied |
| **`delay_events`** | Full Read/Write | Full Read/Verify | Submit / Read Own | Denied | Denied | Denied |
| **`resource_items`** | Full Read/Write | Read All | Own Org Resources | Denied | Denied | Denied |
| **`project_resource_allocations`** | Full Read/Write | Read Project | Own Allocations | Denied | Denied | Denied |
| **`resource_usage_updates`** | Full Read/Write | Read / Verify | Submit / Read Own | Denied | Denied | Denied |
| **`project_workforce_updates`** | Full Read/Write | Read Project | Submit / Read Own | Denied | Denied | Denied |
| **`project_budget_heads`** | Full Read/Write | Full Read/Write | Denied | Denied | Denied | Denied |
| **`financial_updates`** | Full Read/Write | Full Read/Write | Denied | Denied | Denied | Denied |
| **`payment_claims`** | Full Read/Write | Review / Approve | Submit / Read Own | Denied | Denied | Denied |
| **`payments`** | Full Read/Write | Record / Read | Read Disbursed Own | Denied | Denied | Denied |
| **`inspections`** | Full Read/Write | Schedule / Execute | Read Completed | Denied | Denied | Denied |
| **`inspection_findings`** | Full Read/Write | Manage / Resolve | Read Findings | Denied | Denied | Denied |
| **`project_documents`** | Full Read/Write | Per Visibility | Per Visibility | Denied | Public Visible Only | Public Visible Only |
| **`complaints`** | Full Read/Write | Assigned Resolve | Denied | Denied | Own Complaints | Track with Token |
| **`complaint_updates`** | Full Read/Write | Full Read/Write | Denied | Denied | Citizen-Visible | Public Visible |
| **`litigations`** | Full Read/Write | Legal Org Only | Assigned Dispute | Denied | Denied | Denied |
| **`settlements`** | Full Read/Write | Legal Org Only | Read Terms | Denied | Denied | Denied |
| **`notifications`** | Own / Admin | Own Org / User | Own Org / User | Own Org / User | Own User | Denied |
| **`audit_logs`** | Read All | Read Org Scope | Read Org Scope | Denied | Denied | Denied |
| **`ai_analysis_runs`** | Full Read/Write | Read Project | Denied | Denied | Denied | Denied |
| **`ai_recommended_actions`** | Full Read/Write | Read / Feedback | Denied | Denied | Denied | Denied |
| **`ai_recommendation_feedback`** | Full Read/Write | Submit / Read | Denied | Denied | Denied | Denied |
| **`ai_action_outcomes`** | Full Read/Write | Verify / Read | Denied | Denied | Denied | Denied |

---

## 2. Storage Buckets RLS Matrix

| Storage Bucket | Government | Assigned Contractor | Other Contractors | Citizen | Public / Anon |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **`project-documents`** | Full Read/Write | Read / Upload Shared | Denied | Denied | Denied |
| **`tender-documents`** | Full Read/Write | Read Published | Read Published | Read Published | Read Published |
| **`bid-documents`** | Read Evaluator | Upload / Read Own | **STRICTLY DENIED** | **STRICTLY DENIED** | **STRICTLY DENIED** |
| **`progress-evidence`** | Full Read/Review | Upload / Read Own | Denied | Denied | Denied |
| **`inspection-evidence`** | Full Read/Upload | Read Only | Denied | Denied | Denied |
| **`complaint-evidence`** | Full Read/Manage | Denied | Denied | Upload / Read Own | Denied |
| **`public-project-assets`** | Full Read/Write | Read Only | Read Only | Read Only | Read Only |

---

## 3. Negative Security Invariants (Automated Guarantees)
1. **No Self-Approval**: Contractors attempting to execute `approve_progress_update`, `review_payment_claim`, or `award_contract` are blocked with `UNAUTHORIZED` or SQL privilege denial.
2. **Private Bid Isolation**: PostgREST queries by Contractor B targeting `tender_bids` submitted by Contractor A return empty rows (`0 rows`), preventing side-channel leakage.
3. **No Service-Role In Browser**: The frontend connects exclusively using `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key), enforcing RLS on every database interaction.
