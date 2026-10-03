-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 062_blockchain_rls.sql
-- Domain: Row Level Security for Blockchain Anchors and Outbox Tables
-- Purpose: Restrict ledger audit verification access to authorized tenants
--          and prevent arbitrary client insertions to the ledger tables.
-- ==============================================================================

-- 1. blockchain_anchors RLS
DROP POLICY IF EXISTS "blockchain_anchors_select" ON public.blockchain_anchors;
DROP POLICY IF EXISTS "blockchain_anchors_write" ON public.blockchain_anchors;

-- Authenticated Users: Scoped by Project Access & Role Boundaries
CREATE POLICY "blockchain_anchors_select"
  ON public.blockchain_anchors FOR SELECT
  TO authenticated
  USING (
    -- Platform Admin / National Auditor
    public.has_platform_privilege('PLATFORM_ADMIN')
    OR public.has_platform_privilege('NATIONAL_AUDITOR')
    -- Assigned Auditor
    OR (project_id IS NOT NULL AND public.can_audit_project(project_id))
    -- Government Managing Organization
    OR (project_id IS NOT NULL AND public.can_manage_project(project_id))
    -- Contractor assigned to the project for non-confidential project events
    OR (
      project_id IS NOT NULL
      AND public.is_contractor_user()
      AND public.can_access_project(project_id)
      AND event_type NOT IN ('LITIGATION_CREATED', 'SETTLEMENT_APPROVED', 'INTERNAL_GOV_DECISION')
    )
  );

-- Only backend service-role / internal worker may insert or modify anchors
CREATE POLICY "blockchain_anchors_service_role_all"
  ON public.blockchain_anchors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. blockchain_anchor_outbox RLS
DROP POLICY IF EXISTS "blockchain_outbox_service_role_all" ON public.blockchain_anchor_outbox;

-- Only backend worker may access the outbox table
CREATE POLICY "blockchain_outbox_service_role_all"
  ON public.blockchain_anchor_outbox FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
