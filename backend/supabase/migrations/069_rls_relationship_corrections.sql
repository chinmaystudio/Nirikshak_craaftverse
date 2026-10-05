-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 069_rls_relationship_corrections.sql
-- Domain: Row-Level Security Hierarchy & Parent Relationship Alignments
-- Purpose:
--   1. Correct progress_evidence RLS to join through public.progress_updates(id)
--      instead of obsolete project_updates
--   2. Enforce strict tenant boundaries for read, insert, and update operations
-- ==============================================================================

-- Drop previous policies on progress_evidence
DROP POLICY IF EXISTS "progress_evidence_select" ON public.progress_evidence;
DROP POLICY IF EXISTS "progress_evidence_insert" ON public.progress_evidence;
DROP POLICY IF EXISTS "progress_evidence_manage" ON public.progress_evidence;
DROP POLICY IF EXISTS "Progress evidence readable by project participants" ON public.progress_evidence;
DROP POLICY IF EXISTS "Contractor and gov can add progress evidence" ON public.progress_evidence;

-- 1. Progress Evidence SELECT: Project participants can view evidence
CREATE POLICY "progress_evidence_select"
  ON public.progress_evidence FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.progress_updates pu
      WHERE pu.id = progress_evidence.progress_update_id
        AND public.can_access_project(pu.project_id)
    )
  );

-- 2. Progress Evidence INSERT: Government project managers OR assigned contractor who owns the update
CREATE POLICY "progress_evidence_insert"
  ON public.progress_evidence FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.progress_updates pu
      WHERE pu.id = progress_evidence.progress_update_id
        AND (
          public.can_manage_project(pu.project_id)
          OR (
            public.can_access_project(pu.project_id)
            AND pu.contractor_organization_id = public.get_current_user_organization_id()
          )
        )
    )
  );

-- 3. Progress Evidence ALL / MANAGE: Only government officials managing the project
CREATE POLICY "progress_evidence_manage"
  ON public.progress_evidence FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.progress_updates pu
      WHERE pu.id = progress_evidence.progress_update_id
        AND public.can_manage_project(pu.project_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.progress_updates pu
      WHERE pu.id = progress_evidence.progress_update_id
        AND public.can_manage_project(pu.project_id)
    )
  );
