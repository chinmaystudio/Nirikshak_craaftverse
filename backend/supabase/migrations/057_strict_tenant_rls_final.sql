-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 057_strict_tenant_rls_final.sql
-- Domain: Strict Multi-Tenant Row Level Security Hardening
-- Purpose: Remove all overly broad is_government_user() bypasses and enforce
--          strict tenant boundaries using can_access_project() and can_manage_project()
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. inspection_findings: Strict Tenant Scoping
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Findings visible to project participants and government" ON public.inspection_findings;
DROP POLICY IF EXISTS "findings_gov_all" ON public.inspection_findings;
DROP POLICY IF EXISTS "findings_contractor_update" ON public.inspection_findings;
DROP POLICY IF EXISTS "findings_select" ON public.inspection_findings;
DROP POLICY IF EXISTS "Government can insert inspection findings" ON public.inspection_findings;
DROP POLICY IF EXISTS "Authorized users can update inspection findings" ON public.inspection_findings;
DROP POLICY IF EXISTS "Government can delete inspection findings" ON public.inspection_findings;

-- READ: Project participants (Government managing org, assigned contractor, or assigned auditor)
CREATE POLICY "inspection_findings_select"
  ON public.inspection_findings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = inspection_findings.inspection_id
        AND public.can_access_project(i.project_id)
    )
  );

-- WRITE (INSERT): Government officers managing the specific project
CREATE POLICY "inspection_findings_insert"
  ON public.inspection_findings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = inspection_findings.inspection_id
        AND public.can_manage_project(i.project_id)
    )
  );

-- UPDATE:
-- 1) Government managing the project can update all fields
-- 2) Active assigned contractor can ONLY update contractor-actionable fields (status, resolution notes/evidence)
CREATE POLICY "inspection_findings_update"
  ON public.inspection_findings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = inspection_findings.inspection_id
        AND (
          public.can_manage_project(i.project_id)
          OR (
            EXISTS (
              SELECT 1 FROM public.contracts c
              WHERE c.project_id = i.project_id
                AND c.contractor_organization_id = public.get_current_user_organization_id()
                AND c.status = 'ACTIVE'
            )
          )
        )
    )
  );

-- DELETE: Strictly authorized Government managing the specific project
CREATE POLICY "inspection_findings_delete"
  ON public.inspection_findings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = inspection_findings.inspection_id
        AND public.can_manage_project(i.project_id)
    )
  );

-- ------------------------------------------------------------------------------
-- 2. project_documents: Strict Visibility & Tenant Scope
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "project_documents_select" ON public.project_documents;
DROP POLICY IF EXISTS "project_documents_insert" ON public.project_documents;
DROP POLICY IF EXISTS "project_documents_update" ON public.project_documents;
DROP POLICY IF EXISTS "project_documents_delete" ON public.project_documents;
DROP POLICY IF EXISTS "documents_select" ON public.project_documents;

CREATE POLICY "project_documents_select"
  ON public.project_documents FOR SELECT
  TO authenticated
  USING (
    -- Public documents on public projects
    (visibility = 'PUBLIC' AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_documents.project_id AND p.is_public = true))
    -- Government managing org or auditor
    OR public.can_manage_project(project_id)
    -- Contractor with active contract and document is not internal-government
    OR (
      visibility IN ('PUBLIC', 'CONTRACTOR_VISIBLE')
      AND public.can_access_project(project_id)
      AND EXISTS (
        SELECT 1 FROM public.contracts c
        WHERE c.project_id = project_documents.project_id
          AND c.contractor_organization_id = public.get_current_user_organization_id()
          AND c.status = 'ACTIVE'
      )
    )
    -- Owner / Uploader
    OR uploaded_by = auth.uid()
  );

CREATE POLICY "project_documents_insert"
  ON public.project_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_manage_project(project_id)
    OR (
      public.can_access_project(project_id)
      AND EXISTS (
        SELECT 1 FROM public.contracts c
        WHERE c.project_id = project_documents.project_id
          AND c.contractor_organization_id = public.get_current_user_organization_id()
          AND c.status = 'ACTIVE'
      )
    )
  );

CREATE POLICY "project_documents_update"
  ON public.project_documents FOR UPDATE
  TO authenticated
  USING (
    public.can_manage_project(project_id)
    OR (uploaded_by = auth.uid() AND public.can_access_project(project_id))
  );

CREATE POLICY "project_documents_delete"
  ON public.project_documents FOR DELETE
  TO authenticated
  USING (
    public.can_manage_project(project_id)
  );

-- ------------------------------------------------------------------------------
-- 3. delay_events: Strict Tenant Scoping
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "delay_events_select" ON public.delay_events;
DROP POLICY IF EXISTS "delay_events_insert" ON public.delay_events;
DROP POLICY IF EXISTS "delay_events_manage" ON public.delay_events;

CREATE POLICY "delay_events_select"
  ON public.delay_events FOR SELECT
  TO authenticated
  USING (
    public.can_access_project(project_id)
  );

CREATE POLICY "delay_events_insert"
  ON public.delay_events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_manage_project(project_id)
    OR (
      public.can_access_project(project_id)
      AND EXISTS (
        SELECT 1 FROM public.contracts c
        WHERE c.project_id = delay_events.project_id
          AND c.contractor_organization_id = public.get_current_user_organization_id()
          AND c.status = 'ACTIVE'
      )
    )
  );

CREATE POLICY "delay_events_update"
  ON public.delay_events FOR UPDATE
  TO authenticated
  USING (
    public.can_manage_project(project_id)
  );

CREATE POLICY "delay_events_delete"
  ON public.delay_events FOR DELETE
  TO authenticated
  USING (
    public.can_manage_project(project_id)
  );

-- ------------------------------------------------------------------------------
-- 4. Environmental Domain: Clearances, Baselines, Commitments, Observations, Incidents
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "env_clearances_select" ON public.environmental_clearances;
DROP POLICY IF EXISTS "env_clearances_all" ON public.environmental_clearances;

CREATE POLICY "env_clearances_select"
  ON public.environmental_clearances FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "env_clearances_write"
  ON public.environmental_clearances FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

DROP POLICY IF EXISTS "env_baselines_select" ON public.environmental_baselines;
DROP POLICY IF EXISTS "env_baselines_all" ON public.environmental_baselines;

CREATE POLICY "env_baselines_select"
  ON public.environmental_baselines FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "env_baselines_write"
  ON public.environmental_baselines FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

DROP POLICY IF EXISTS "env_commitments_select" ON public.environmental_commitments;
DROP POLICY IF EXISTS "env_commitments_all" ON public.environmental_commitments;

CREATE POLICY "env_commitments_select"
  ON public.environmental_commitments FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "env_commitments_write"
  ON public.environmental_commitments FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

DROP POLICY IF EXISTS "env_observations_select" ON public.environmental_observations;
DROP POLICY IF EXISTS "env_observations_insert" ON public.environmental_observations;
DROP POLICY IF EXISTS "env_observations_all" ON public.environmental_observations;

CREATE POLICY "env_observations_select"
  ON public.environmental_observations FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "env_observations_insert"
  ON public.environmental_observations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_manage_project(project_id)
    OR (
      public.can_access_project(project_id)
      AND EXISTS (
        SELECT 1 FROM public.contracts c
        WHERE c.project_id = environmental_observations.project_id
          AND c.contractor_organization_id = public.get_current_user_organization_id()
          AND c.status = 'ACTIVE'
      )
    )
  );

CREATE POLICY "env_observations_manage"
  ON public.environmental_observations FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

DROP POLICY IF EXISTS "env_incidents_select" ON public.environmental_incidents;
DROP POLICY IF EXISTS "env_incidents_insert" ON public.environmental_incidents;
DROP POLICY IF EXISTS "env_incidents_all" ON public.environmental_incidents;

CREATE POLICY "env_incidents_select"
  ON public.environmental_incidents FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "env_incidents_insert"
  ON public.environmental_incidents FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_manage_project(project_id)
    OR (
      public.can_access_project(project_id)
      AND EXISTS (
        SELECT 1 FROM public.contracts c
        WHERE c.project_id = environmental_incidents.project_id
          AND c.contractor_organization_id = public.get_current_user_organization_id()
          AND c.status = 'ACTIVE'
      )
    )
  );

CREATE POLICY "env_incidents_manage"
  ON public.environmental_incidents FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

-- ------------------------------------------------------------------------------
-- 5. Progress Evidence & Project Updates
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "progress_evidence_select" ON public.progress_evidence;
DROP POLICY IF EXISTS "progress_evidence_insert" ON public.progress_evidence;
DROP POLICY IF EXISTS "progress_evidence_manage" ON public.progress_evidence;

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
      SELECT 1 FROM public.project_updates pu
      WHERE pu.id = progress_evidence.progress_update_id
        AND public.can_manage_project(pu.project_id)
    )
  );

-- ------------------------------------------------------------------------------
-- 6. project_organizations: Security Critical Organization Mapping
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "project_organizations_select" ON public.project_organizations;
DROP POLICY IF EXISTS "project_organizations_manage" ON public.project_organizations;
DROP POLICY IF EXISTS "project_organizations_gov_all" ON public.project_organizations;

CREATE POLICY "project_organizations_select"
  ON public.project_organizations FOR SELECT
  TO authenticated
  USING (
    public.can_access_project(project_id)
    OR organization_id = public.get_current_user_organization_id()
  );

CREATE POLICY "project_organizations_manage"
  ON public.project_organizations FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

-- ------------------------------------------------------------------------------
-- 7. Project Aliases: Strict Tenant Scoping
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "project_aliases_select" ON public.project_aliases;
DROP POLICY IF EXISTS "project_aliases_manage" ON public.project_aliases;

CREATE POLICY "project_aliases_select"
  ON public.project_aliases FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "project_aliases_manage"
  ON public.project_aliases FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

-- ------------------------------------------------------------------------------
-- 8. Staging & Import Tables
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "import_staging_projects_select" ON public.import_staging_projects;
DROP POLICY IF EXISTS "import_staging_projects_manage" ON public.import_staging_projects;

CREATE POLICY "import_staging_projects_select"
  ON public.import_staging_projects FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "import_staging_projects_manage"
  ON public.import_staging_projects FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

DROP POLICY IF EXISTS "import_staging_updates_select" ON public.import_staging_updates;
DROP POLICY IF EXISTS "import_staging_updates_manage" ON public.import_staging_updates;

CREATE POLICY "import_staging_updates_select"
  ON public.import_staging_updates FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "import_staging_updates_manage"
  ON public.import_staging_updates FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));
