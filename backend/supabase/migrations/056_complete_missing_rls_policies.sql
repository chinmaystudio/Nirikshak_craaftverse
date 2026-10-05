-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 056_complete_missing_rls_policies.sql
-- Domain: Complete RLS Policies on Tables with Enabled RLS but Missing Policies
-- ==============================================================================

-- 1. inspection_findings
DROP POLICY IF EXISTS "Findings visible to project participants and government" ON public.inspection_findings;
CREATE POLICY "Findings visible to project participants and government"
  ON public.inspection_findings FOR SELECT
  TO authenticated
  USING (
    public.is_government_user() OR
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = inspection_findings.inspection_id
        AND public.can_access_project(i.project_id)
    )
  );

DROP POLICY IF EXISTS "Government can insert inspection findings" ON public.inspection_findings;
CREATE POLICY "Government can insert inspection findings"
  ON public.inspection_findings FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_government_user() OR
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = inspection_findings.inspection_id
        AND public.can_manage_project(i.project_id)
    )
  );

DROP POLICY IF EXISTS "Authorized users can update inspection findings" ON public.inspection_findings;
CREATE POLICY "Authorized users can update inspection findings"
  ON public.inspection_findings FOR UPDATE
  TO authenticated
  USING (
    public.is_government_user() OR
    EXISTS (
      SELECT 1 FROM public.inspections i
      JOIN public.contracts c ON c.project_id = i.project_id
      WHERE i.id = inspection_findings.inspection_id
        AND c.contractor_organization_id = public.get_current_user_organization_id()
        AND c.status = 'ACTIVE'
    )
  );

DROP POLICY IF EXISTS "Government can delete inspection findings" ON public.inspection_findings;
CREATE POLICY "Government can delete inspection findings"
  ON public.inspection_findings FOR DELETE
  TO authenticated
  USING (
    public.is_government_user() AND
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = inspection_findings.inspection_id
        AND public.can_manage_project(i.project_id)
    )
  );

-- 2. project_documents
DROP POLICY IF EXISTS "Project documents readable by participants" ON public.project_documents;
CREATE POLICY "Project documents readable by participants"
  ON public.project_documents FOR SELECT
  TO authenticated
  USING (
    public.is_government_user() OR
    public.can_access_project(project_id)
  );

DROP POLICY IF EXISTS "Authorized stakeholders can upload project documents" ON public.project_documents;
CREATE POLICY "Authorized stakeholders can upload project documents"
  ON public.project_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_government_user() OR
    (public.is_contractor_user() AND public.can_access_project(project_id))
  );

DROP POLICY IF EXISTS "Document owners and government can update project documents" ON public.project_documents;
CREATE POLICY "Document owners and government can update project documents"
  ON public.project_documents FOR UPDATE
  TO authenticated
  USING (
    public.is_government_user() OR
    uploaded_by = auth.uid()
  );

DROP POLICY IF EXISTS "Government can delete project documents" ON public.project_documents;
CREATE POLICY "Government can delete project documents"
  ON public.project_documents FOR DELETE
  TO authenticated
  USING (
    public.is_government_user() AND public.can_manage_project(project_id)
  );

-- 3. delay_events
DROP POLICY IF EXISTS "Delay events readable by project stakeholders" ON public.delay_events;
CREATE POLICY "Delay events readable by project stakeholders"
  ON public.delay_events FOR SELECT
  TO authenticated
  USING (
    public.is_government_user() OR
    public.can_access_project(project_id)
  );

DROP POLICY IF EXISTS "Delay events insertable by project contractors and gov" ON public.delay_events;
CREATE POLICY "Delay events insertable by project contractors and gov"
  ON public.delay_events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_government_user() OR
    (public.is_contractor_user() AND public.can_access_project(project_id))
  );

DROP POLICY IF EXISTS "Government can manage delay events" ON public.delay_events;
CREATE POLICY "Government can manage delay events"
  ON public.delay_events FOR ALL
  TO authenticated
  USING (public.is_government_user());

-- 4. Environmental Domain (clearances, baselines, commitments, observations, incidents)
DROP POLICY IF EXISTS "Environmental clearances readable by participants" ON public.environmental_clearances;
CREATE POLICY "Environmental clearances readable by participants"
  ON public.environmental_clearances FOR SELECT
  TO authenticated
  USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "Government manages environmental clearances" ON public.environmental_clearances;
CREATE POLICY "Government manages environmental clearances"
  ON public.environmental_clearances FOR ALL
  TO authenticated
  USING (public.is_government_user() AND public.can_manage_project(project_id));

DROP POLICY IF EXISTS "Environmental baselines readable by participants" ON public.environmental_baselines;
CREATE POLICY "Environmental baselines readable by participants"
  ON public.environmental_baselines FOR SELECT
  TO authenticated
  USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "Government manages environmental baselines" ON public.environmental_baselines;
CREATE POLICY "Government manages environmental baselines"
  ON public.environmental_baselines FOR ALL
  TO authenticated
  USING (public.is_government_user() AND public.can_manage_project(project_id));

DROP POLICY IF EXISTS "Environmental commitments readable by participants" ON public.environmental_commitments;
CREATE POLICY "Environmental commitments readable by participants"
  ON public.environmental_commitments FOR SELECT
  TO authenticated
  USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "Government manages environmental commitments" ON public.environmental_commitments;
CREATE POLICY "Government manages environmental commitments"
  ON public.environmental_commitments FOR ALL
  TO authenticated
  USING (public.is_government_user() AND public.can_manage_project(project_id));

DROP POLICY IF EXISTS "Environmental observations readable by participants" ON public.environmental_observations;
CREATE POLICY "Environmental observations readable by participants"
  ON public.environmental_observations FOR SELECT
  TO authenticated
  USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "Stakeholders report environmental observations" ON public.environmental_observations;
CREATE POLICY "Stakeholders report environmental observations"
  ON public.environmental_observations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_government_user() OR (public.is_contractor_user() AND public.can_access_project(project_id)));

DROP POLICY IF EXISTS "Government manages environmental observations" ON public.environmental_observations;
CREATE POLICY "Government manages environmental observations"
  ON public.environmental_observations FOR UPDATE
  TO authenticated
  USING (public.is_government_user());

DROP POLICY IF EXISTS "Environmental incidents readable by participants" ON public.environmental_incidents;
CREATE POLICY "Environmental incidents readable by participants"
  ON public.environmental_incidents FOR SELECT
  TO authenticated
  USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "Stakeholders report environmental incidents" ON public.environmental_incidents;
CREATE POLICY "Stakeholders report environmental incidents"
  ON public.environmental_incidents FOR INSERT
  TO authenticated
  WITH CHECK (public.is_government_user() OR (public.is_contractor_user() AND public.can_access_project(project_id)));

DROP POLICY IF EXISTS "Government manages environmental incidents" ON public.environmental_incidents;
CREATE POLICY "Government manages environmental incidents"
  ON public.environmental_incidents FOR UPDATE
  TO authenticated
  USING (public.is_government_user());

-- 5. Progress Evidence & Complaint Evidence
DROP POLICY IF EXISTS "Progress evidence readable by project participants" ON public.progress_evidence;
CREATE POLICY "Progress evidence readable by project participants"
  ON public.progress_evidence FOR SELECT
  TO authenticated
  USING (
    public.is_government_user() OR
    EXISTS (
      SELECT 1 FROM public.progress_updates pu
      WHERE pu.id = progress_evidence.progress_update_id
        AND public.can_access_project(pu.project_id)
    )
  );

DROP POLICY IF EXISTS "Contractor and gov can add progress evidence" ON public.progress_evidence;
CREATE POLICY "Contractor and gov can add progress evidence"
  ON public.progress_evidence FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_government_user() OR
    (
      public.is_contractor_user() AND
      EXISTS (
        SELECT 1 FROM public.progress_updates pu
        WHERE pu.id = progress_evidence.progress_update_id
          AND public.can_access_project(pu.project_id)
      )
    )
  );

DROP POLICY IF EXISTS "Complaint evidence readable by complaint parties" ON public.complaint_evidence;
CREATE POLICY "Complaint evidence readable by complaint parties"
  ON public.complaint_evidence FOR SELECT
  TO authenticated
  USING (
    public.is_government_user() OR
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = complaint_evidence.complaint_id
        AND (c.user_id = auth.uid() OR public.can_access_project(c.project_id))
    )
  );

DROP POLICY IF EXISTS "Authenticated users can submit complaint evidence" ON public.complaint_evidence;
CREATE POLICY "Authenticated users can submit complaint evidence"
  ON public.complaint_evidence FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- 6. Project Metadata Tables (aliases, organizations, updates)
DROP POLICY IF EXISTS "Project aliases readable by participants" ON public.project_aliases;
CREATE POLICY "Project aliases readable by participants"
  ON public.project_aliases FOR SELECT
  TO authenticated
  USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "Government manages project aliases" ON public.project_aliases;
CREATE POLICY "Government manages project aliases"
  ON public.project_aliases FOR ALL
  TO authenticated
  USING (public.is_government_user());

DROP POLICY IF EXISTS "Project organizations readable by participants" ON public.project_organizations;
CREATE POLICY "Project organizations readable by participants"
  ON public.project_organizations FOR SELECT
  TO authenticated
  USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "Government manages project organizations" ON public.project_organizations;
CREATE POLICY "Government manages project organizations"
  ON public.project_organizations FOR ALL
  TO authenticated
  USING (public.is_government_user());

DROP POLICY IF EXISTS "Project updates readable by participants" ON public.project_updates;
CREATE POLICY "Project updates readable by participants"
  ON public.project_updates FOR SELECT
  TO authenticated
  USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "Government manages project updates" ON public.project_updates;
CREATE POLICY "Government manages project updates"
  ON public.project_updates FOR ALL
  TO authenticated
  USING (public.is_government_user());

-- 7. Legacy AI & Ingestion Staging Tables
DROP POLICY IF EXISTS "AI runs managed by gov and service role" ON public.ai_runs;
CREATE POLICY "AI runs managed by gov and service role"
  ON public.ai_runs FOR ALL
  TO authenticated, service_role
  USING (public.is_government_user() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "AI insights managed by gov and service role" ON public.ai_insights;
CREATE POLICY "AI insights managed by gov and service role"
  ON public.ai_insights FOR ALL
  TO authenticated, service_role
  USING (public.is_government_user() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Sources managed by gov and service role" ON public.sources;
CREATE POLICY "Sources managed by gov and service role"
  ON public.sources FOR ALL
  TO authenticated, service_role
  USING (public.is_government_user() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Source observations managed by gov and service role" ON public.source_observations;
CREATE POLICY "Source observations managed by gov and service role"
  ON public.source_observations FOR ALL
  TO authenticated, service_role
  USING (public.is_government_user() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Import batches managed by gov and service role" ON public.import_batches;
CREATE POLICY "Import batches managed by gov and service role"
  ON public.import_batches FOR ALL
  TO authenticated, service_role
  USING (public.is_government_user() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Import staging managed by gov and service role" ON public.project_import_staging;
CREATE POLICY "Import staging managed by gov and service role"
  ON public.project_import_staging FOR ALL
  TO authenticated, service_role
  USING (public.is_government_user() OR auth.role() = 'service_role');
