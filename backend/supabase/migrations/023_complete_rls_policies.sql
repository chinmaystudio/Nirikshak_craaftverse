-- Migration 023_complete_rls_policies.sql
-- Completes missing RLS policies on financial_updates, contracts, inspections, and audit_logs

-- Financial updates
DROP POLICY IF EXISTS "financial_updates_select" ON public.financial_updates;
CREATE POLICY "financial_updates_select" ON public.financial_updates FOR SELECT
USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "financial_updates_gov_insert" ON public.financial_updates;
CREATE POLICY "financial_updates_gov_insert" ON public.financial_updates FOR INSERT
WITH CHECK (public.is_government_user());

DROP POLICY IF EXISTS "financial_updates_gov_update" ON public.financial_updates;
CREATE POLICY "financial_updates_gov_update" ON public.financial_updates FOR UPDATE
USING (public.is_government_user());

-- Contracts
DROP POLICY IF EXISTS "contracts_select" ON public.contracts;
CREATE POLICY "contracts_select" ON public.contracts FOR SELECT
USING (public.is_government_user() OR public.is_contractor_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "contracts_gov_all" ON public.contracts;
CREATE POLICY "contracts_gov_all" ON public.contracts FOR ALL
USING (public.is_government_user());

-- Inspections
DROP POLICY IF EXISTS "inspections_select" ON public.inspections;
CREATE POLICY "inspections_select" ON public.inspections FOR SELECT
USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "inspections_gov_all" ON public.inspections;
CREATE POLICY "inspections_gov_all" ON public.inspections FOR ALL
USING (public.is_government_user());

-- Audit logs
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT
USING (public.is_government_user());

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- Complaint updates
DROP POLICY IF EXISTS "complaint_updates_select" ON public.complaint_updates;
CREATE POLICY "complaint_updates_select" ON public.complaint_updates FOR SELECT
USING (true);

DROP POLICY IF EXISTS "complaint_updates_insert" ON public.complaint_updates;
CREATE POLICY "complaint_updates_insert" ON public.complaint_updates FOR INSERT
WITH CHECK (true);

