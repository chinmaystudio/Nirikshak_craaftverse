# NIRIKSHAK Database V2 Migration Plan

## 1. Migration History Preservation Guarantee
In accordance with strict production safety requirements:
- **Migrations `001_initial_schema.sql` through `028_public_rls_helper_privileges.sql` are immutable.** They represent frozen historical schema states and have not been modified or renumbered.
- **Database V2 work begins at `029_database_v2_foundation.sql` through `046_seed_support_v2.sql`.**

---

## 2. Ordered Migration Sequence

| Sequence | File Name | Target Domains / Changes | Safety & Compatibility |
| :---: | :--- | :--- | :--- |
| **029** | `029_database_v2_foundation.sql` | Project lifecycle status enums, normalization of `projects` (`approved_cost`, `priority`, `public_visibility`), `project_organizations`. | Non-destructive column additions; updates existing rows with safe defaults. |
| **030** | `030_procurement_contracts_v2.sql` | Tender normalization, `tender_documents`, bid normalization (`financial_proposal`, `combined_score`), `bid_documents`, `contracts` normalization. | Reuses existing tables, adds missing fields required by application. |
| **031** | `031_milestones_progress_delays_v2.sql` | `project_milestones` weights & ranges, `progress_updates` normalization, `progress_evidence`, `delay_events`. | Preserves canonical `reported_progress` / `verified_progress`. |
| **032** | `032_resources_workforce_v2.sql` | `resource_items`, `project_resource_allocations`, `resource_usage_updates`, `project_workforce_updates`. | New tables; aggregate labor updates with zero worker surveillance. |
| **033** | `033_finance_payment_claims_v2.sql` | `project_budget_heads`, `financial_updates` (planned vs actual), `payment_claims`, `payment_claim_documents`, `payments`. | Complete RA bill lifecycle; prevents contractor self-approval. |
| **034** | `034_inspections_documents_v2.sql` | `inspections` normalization, `inspection_findings` severity & action status, `project_documents` storage metadata & visibility. | Aligns AI defect counts strictly with open inspection findings. |
| **035** | `035_environment_compliance_v2.sql` | `environmental_clearances`, `environmental_baselines`, `environmental_observations`, `environmental_incidents`. | Dedicated environmental compliance and monitoring tables. |
| **036** | `036_complaints_v2.sql` | `complaints` normalization, tracking token, `complaint_updates`, `complaint_evidence`. | Fixes head count queries to prevent data/count destructuring errors. |
| **037** | `037_legal_litigation_settlements_v2.sql` | `litigations`, `litigation_events`, `settlements`. | Comprehensive dispute and stay-order management with strict access control. |
| **038** | `038_notifications_audit_v2.sql` | `notifications` normalization, `audit_logs` expansion (`actor_organization_id`, `old_value`, `new_value`, `ip_hash`). | Guarantees tamper-evident traceability for high-impact events. |
| **039** | `039_ai_intelligence_lifecycle_v2.sql` | `ai_analysis_runs`, `ai_recommended_actions`, `ai_recommendation_feedback`, `ai_action_outcomes`, `ai_context_snapshots`. | Separates human feedback from final verified outcome LinUCB learning. |
| **040** | `040_external_telemetry_v2.sql` | `external_data_sources`, `external_observations`. | Real GIS, weather, and remote sensing telemetry integration point. |
| **041** | `041_views_v2.sql` | `public_projects_view`, `project_progress_summary_view`, `project_finance_summary_view`, `tender_catalog_view`, `government_project_dashboard_view`, `contractor_assigned_projects_view`. | Sanitized public presentation & aggregated operational dashboards. |
| **042** | `042_rls_v2.sql` | Comprehensive Row Level Security on all new V2 entities. | Enforces multi-tenant organizational isolation and contractor bid privacy. |
| **043** | `043_secure_rpc_v2.sql` | `submit_payment_claim`, `review_payment_claim`, `record_payment`, `mark_notification_read`. | Atomic, audited, `SECURITY DEFINER` procedures with fixed `search_path`. |
| **044** | `044_storage_policies_v2.sql` | Provision storage buckets (`project-documents`, `tender-documents`, `bid-documents`, etc.) and storage RLS. | Prevents unauthorized file access across competitor contractors and public. |
| **045** | `045_realtime_indexes_v2.sql` | Composite performance indexes & Supabase Realtime publication. | Sub-second dashboard queries and live UI reactive synchronization. |
| **046** | `046_seed_support_v2.sql` | Full lifecycle development seeds for all personas. | Enables instant E2E automated test runs and demo verification. |

---

## 3. Data Migration & Rollback Strategy
1. **Zero Data Loss**: All migration steps use `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`, and idempotent triggers.
2. **Backwards Compatibility**: Legacy fields remain populated via triggers or views until downstream microservices completely switch to V2.
3. **Audit Readiness**: Every migration script can be applied sequentially on an empty Supabase instance or on top of an existing database running `028`.
