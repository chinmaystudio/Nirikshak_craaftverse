-- Remove legacy permissive SELECT policies. PostgreSQL ORs permissive policies,
-- so a later restrictive-looking policy cannot close an earlier global grant.
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('projects', 'tender_bids', 'litigations')
      AND cmd = 'SELECT'
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.litigations ENABLE ROW LEVEL SECURITY;

CREATE POLICY projects_release_select ON public.projects
  FOR SELECT TO authenticated
  USING (
    deleted_at IS NULL AND (
      is_public = true
      OR public.can_manage_project(id)
      OR public.can_audit_project(id)
      OR (public.is_contractor_user() AND public.can_access_project(id))
    )
  );

CREATE POLICY projects_release_public_select ON public.projects
  FOR SELECT TO anon
  USING (is_public = true AND deleted_at IS NULL);

DROP POLICY IF EXISTS projects_gov_insert ON public.projects;
DROP POLICY IF EXISTS projects_gov_update ON public.projects;
DROP POLICY IF EXISTS projects_gov_delete ON public.projects;
DROP POLICY IF EXISTS "Government can insert projects" ON public.projects;
DROP POLICY IF EXISTS "Government can update projects" ON public.projects;

CREATE POLICY projects_release_insert ON public.projects
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_government_user()
    AND government_organization_id = public.get_current_user_organization_id()
  );

CREATE POLICY projects_release_update ON public.projects
  FOR UPDATE TO authenticated
  USING (public.can_manage_project(id))
  WITH CHECK (
    public.is_government_user()
    AND government_organization_id = public.get_current_user_organization_id()
  );

CREATE POLICY bids_release_select ON public.tender_bids
  FOR SELECT TO authenticated
  USING (
    (public.is_contractor_user() AND contractor_organization_id = public.get_current_user_organization_id())
    OR (
      public.is_government_user()
      AND EXISTS (
        SELECT 1 FROM public.tenders t
        WHERE t.id = tender_bids.tender_id
          AND public.can_manage_project(t.project_id)
      )
    )
  );

DROP POLICY IF EXISTS bids_contractor_insert ON public.tender_bids;

CREATE POLICY litigations_release_select ON public.litigations
  FOR SELECT TO authenticated
  USING (
    public.can_manage_project(project_id)
    OR (
      public.is_contractor_user()
      AND contractor_organization_id = public.get_current_user_organization_id()
      AND public.can_access_project(project_id)
    )
    OR public.can_audit_project(project_id)
  );
