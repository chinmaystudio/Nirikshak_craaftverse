-- ============================================================================
-- Migration: 053_v2_runtime_views_indexes.sql
-- Description: Enforce Security Invoker on Views & Multi-tenant Performance Indexes
-- ============================================================================

-- 1. Enforce security_invoker = true across all sensitive Database V2 views
-- This ensures that views strictly evaluate underlying RLS policies in caller context.
ALTER VIEW public.government_project_dashboard_view SET (security_invoker = true);
ALTER VIEW public.contractor_assigned_projects_view SET (security_invoker = true);
ALTER VIEW public.project_finance_summary_view SET (security_invoker = true);
ALTER VIEW public.project_progress_summary_view SET (security_invoker = true);
ALTER VIEW public.tender_catalog_view SET (security_invoker = true);

-- 2. Performance Composite Indexes for High-Frequency V2 Queries
CREATE INDEX IF NOT EXISTS idx_payments_claim_amount 
    ON public.payments (payment_claim_id, amount_paid);

CREATE INDEX IF NOT EXISTS idx_resource_usage_verified 
    ON public.resource_usage_updates (project_id, verification_status, observation_date DESC);

CREATE INDEX IF NOT EXISTS idx_inspection_findings_open_severity 
    ON public.inspection_findings (inspection_id, status, severity)
    WHERE status IN ('OPEN', 'ACTION_REQUIRED');

CREATE INDEX IF NOT EXISTS idx_delay_events_active 
    ON public.delay_events (project_id, status)
    WHERE status IN ('OPEN', 'UNDER_INVESTIGATION');
