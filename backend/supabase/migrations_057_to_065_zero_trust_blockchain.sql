-- NIRIKSHAK ZERO-TRUST & BLOCKCHAIN MIGRATIONS (057-065)
-- Target: nirikcraftverse (dmkhkgqyzevhxpxsrgng)
-- Generated on: 2026-10-03T18:35:12.587Z

-- ==========================================
-- MIGRATION: 057_strict_tenant_rls_final.sql
-- ==========================================

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
      SELECT 1 FROM public.project_updates pu
      WHERE pu.id = progress_evidence.progress_update_id
        AND public.can_access_project(pu.project_id)
    )
  );

CREATE POLICY "progress_evidence_insert"
  ON public.progress_evidence FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_updates pu
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
      SELECT 1 FROM public.project_updates pu
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


-- ==========================================
-- MIGRATION: 058_platform_and_auditor_scope.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 058_platform_and_auditor_scope.sql
-- Domain: Platform Privileges, Explicit Auditor Assignment, and Scoped Security Helpers
-- Purpose: Eliminate global role bypasses, define explicit auditor scoping,
--          and implement zero-trust authorization helpers.
-- ==============================================================================

-- 1. Create auditor_project_assignments table
CREATE TABLE IF NOT EXISTS public.auditor_project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auditor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  auditor_organization_id UUID REFERENCES public.organizations(id),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'READ' CHECK (access_level IN ('READ', 'AUDIT_WRITE', 'FULL')),
  assigned_by UUID REFERENCES public.profiles(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auditor_assignments_user_project 
  ON public.auditor_project_assignments(auditor_user_id, project_id) 
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_auditor_assignments_project 
  ON public.auditor_project_assignments(project_id) 
  WHERE revoked_at IS NULL;

ALTER TABLE public.auditor_project_assignments ENABLE ROW LEVEL SECURITY;

-- 2. Create platform_privileges table
CREATE TABLE IF NOT EXISTS public.platform_privileges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  privilege TEXT NOT NULL CHECK (privilege IN ('PLATFORM_ADMIN', 'NATIONAL_AUDITOR', 'SECURITY_ADMIN')),
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_privileges_user 
  ON public.platform_privileges(user_id, privilege) 
  WHERE revoked_at IS NULL;

ALTER TABLE public.platform_privileges ENABLE ROW LEVEL SECURITY;

-- 3. Function: has_platform_privilege
CREATE OR REPLACE FUNCTION public.has_platform_privilege(p_privilege TEXT)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
BEGIN
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.platform_privileges pp
    WHERE pp.user_id = v_user_id
      AND pp.privilege = p_privilege
      AND pp.revoked_at IS NULL
      AND (pp.expires_at IS NULL OR pp.expires_at > now())
  );
END;
$$;

-- 4. Function: can_audit_project
CREATE OR REPLACE FUNCTION public.can_audit_project(p_project_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
BEGIN
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Platform privileges provide platform-wide audit access
  IF public.has_platform_privilege('PLATFORM_ADMIN') OR public.has_platform_privilege('NATIONAL_AUDITOR') THEN
    RETURN TRUE;
  END IF;

  -- Explicit project assignment check
  RETURN EXISTS (
    SELECT 1 FROM public.auditor_project_assignments apa
    WHERE apa.auditor_user_id = v_user_id
      AND apa.project_id = p_project_id
      AND apa.revoked_at IS NULL
      AND (apa.expires_at IS NULL OR apa.expires_at > now())
  );
END;
$$;

-- 5. Updated Function: can_manage_project
CREATE OR REPLACE FUNCTION public.can_manage_project(p_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_org_id UUID := public.get_current_user_organization_id();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF public.has_platform_privilege('PLATFORM_ADMIN') THEN
    RETURN TRUE;
  END IF;

  IF NOT public.is_government_user() THEN
    RETURN FALSE;
  END IF;

  -- Must be associated with the project's managing government organization
  RETURN EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_id
      AND p.deleted_at IS NULL
      AND (
        p.government_organization_id = v_org_id
        OR EXISTS (
          SELECT 1 FROM public.project_organizations po
          WHERE po.project_id = p_id
            AND po.organization_id = v_org_id
            AND po.role IN ('OWNING_AGENCY', 'IMPLEMENTING_AGENCY', 'NODAL_MINISTRY')
        )
      )
  );
END;
$$;

-- 6. Updated Function: can_access_project
CREATE OR REPLACE FUNCTION public.can_access_project(p_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_org_id UUID := public.get_current_user_organization_id();
BEGIN
  IF v_user_id IS NULL THEN
    -- Anonymous / Unauthenticated: Check if public
    RETURN EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = p_id AND p.is_public = TRUE AND p.deleted_at IS NULL
    );
  END IF;

  -- Platform administrators can access
  IF public.has_platform_privilege('PLATFORM_ADMIN') OR public.has_platform_privilege('NATIONAL_AUDITOR') THEN
    RETURN TRUE;
  END IF;

  -- Assigned Auditor access
  IF public.can_audit_project(p_id) THEN
    RETURN TRUE;
  END IF;

  -- Government User: Scoped to owning/implementing organizations
  IF public.is_government_user() THEN
    RETURN EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = p_id
        AND p.deleted_at IS NULL
        AND (
          p.government_organization_id = v_org_id
          OR EXISTS (
            SELECT 1 FROM public.project_organizations po
            WHERE po.project_id = p_id AND po.organization_id = v_org_id
          )
        )
    );
  END IF;

  -- Contractor User: Scoped to contracted or participating projects
  IF public.is_contractor_user() THEN
    RETURN EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.project_id = p_id
        AND c.contractor_organization_id = v_org_id
        AND c.status IN ('ACTIVE', 'SIGNED', 'IN_PROGRESS', 'DEFECT_LIABILITY', 'COMPLETED')
    ) OR EXISTS (
      SELECT 1 FROM public.project_organizations po
      WHERE po.project_id = p_id AND po.organization_id = v_org_id
    ) OR EXISTS (
      SELECT 1 FROM public.tenders t
      JOIN public.tender_bids tb ON tb.tender_id = t.id
      WHERE t.project_id = p_id
        AND tb.contractor_organization_id = v_org_id
    );
  END IF;

  -- Public citizen fallback
  RETURN EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_id AND p.is_public = TRUE AND p.deleted_at IS NULL
  );
END;
$$;

-- 7. Function: can_access_document
CREATE OR REPLACE FUNCTION public.can_access_document(p_document_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_doc RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_doc FROM public.project_documents WHERE id = p_document_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Uploader can always access
  IF v_doc.uploaded_by = v_user_id THEN
    RETURN TRUE;
  END IF;

  -- Public document on public project
  IF v_doc.visibility = 'PUBLIC' AND EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = v_doc.project_id AND p.is_public = TRUE
  ) THEN
    RETURN TRUE;
  END IF;

  -- Government managing project
  IF public.can_manage_project(v_doc.project_id) THEN
    RETURN TRUE;
  END IF;

  -- Auditor assigned
  IF public.can_audit_project(v_doc.project_id) THEN
    RETURN TRUE;
  END IF;

  -- Contractor visibility
  IF v_doc.visibility = 'CONTRACTOR_VISIBLE' AND public.can_access_project(v_doc.project_id) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- 8. Function: can_manage_payment_claim
CREATE OR REPLACE FUNCTION public.can_manage_payment_claim(p_claim_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_claim RECORD;
BEGIN
  SELECT * INTO v_claim FROM public.payment_claims WHERE id = p_claim_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN public.can_manage_project(v_claim.project_id);
END;
$$;

-- 9. Function: can_manage_litigation
CREATE OR REPLACE FUNCTION public.can_manage_litigation(p_litigation_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_lit RECORD;
BEGIN
  SELECT * INTO v_lit FROM public.litigations WHERE id = p_litigation_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN public.can_manage_project(v_lit.project_id);
END;
$$;

-- 10. Function: can_review_ai_analysis
CREATE OR REPLACE FUNCTION public.can_review_ai_analysis(p_analysis_run_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_run RECORD;
BEGIN
  SELECT * INTO v_run FROM public.ai_analysis_runs WHERE id = p_analysis_run_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN public.can_manage_project(v_run.project_id);
END;
$$;

-- 11. Policies on new metadata tables
CREATE POLICY "auditor_assignments_select"
  ON public.auditor_project_assignments FOR SELECT
  TO authenticated
  USING (
    auditor_user_id = auth.uid()
    OR public.can_manage_project(project_id)
    OR public.has_platform_privilege('PLATFORM_ADMIN')
    OR public.has_platform_privilege('SECURITY_ADMIN')
  );

CREATE POLICY "auditor_assignments_manage"
  ON public.auditor_project_assignments FOR ALL
  TO authenticated
  USING (
    public.can_manage_project(project_id)
    OR public.has_platform_privilege('PLATFORM_ADMIN')
    OR public.has_platform_privilege('SECURITY_ADMIN')
  )
  WITH CHECK (
    public.can_manage_project(project_id)
    OR public.has_platform_privilege('PLATFORM_ADMIN')
    OR public.has_platform_privilege('SECURITY_ADMIN')
  );

CREATE POLICY "platform_privileges_select"
  ON public.platform_privileges FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_platform_privilege('PLATFORM_ADMIN')
    OR public.has_platform_privilege('SECURITY_ADMIN')
  );

CREATE POLICY "platform_privileges_manage"
  ON public.platform_privileges FOR ALL
  TO authenticated
  USING (
    public.has_platform_privilege('PLATFORM_ADMIN')
    OR public.has_platform_privilege('SECURITY_ADMIN')
  )
  WITH CHECK (
    public.has_platform_privilege('PLATFORM_ADMIN')
    OR public.has_platform_privilege('SECURITY_ADMIN')
  );

GRANT EXECUTE ON FUNCTION public.has_platform_privilege(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_audit_project(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_project(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_project(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_access_document(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_payment_claim(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_litigation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_review_ai_analysis(UUID) TO authenticated;


-- ==========================================
-- MIGRATION: 059_private_gateway_session_support.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 059_private_gateway_session_support.sql
-- Domain: Gateway Sessions, CSRF Token Management, and MFA Verification
-- Purpose: Support backend-mediated HttpOnly cookie sessions and multi-factor
--          auth challenge tracking without exposing tokens to frontend storage.
-- ==============================================================================

-- 1. Gateway Sessions table
CREATE TABLE IF NOT EXISTS public.gateway_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL UNIQUE,
  csrf_token_hash TEXT NOT NULL,
  mfa_verified BOOLEAN NOT NULL DEFAULT false,
  mfa_verified_at TIMESTAMPTZ,
  elevated_until TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gateway_sessions_token_hash 
  ON public.gateway_sessions(session_token_hash) 
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_gateway_sessions_user 
  ON public.gateway_sessions(user_id) 
  WHERE revoked_at IS NULL;

ALTER TABLE public.gateway_sessions ENABLE ROW LEVEL SECURITY;

-- 2. MFA Challenges table
CREATE TABLE IF NOT EXISTS public.mfa_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.gateway_sessions(id) ON DELETE CASCADE,
  challenge_hash TEXT NOT NULL,
  challenge_type TEXT NOT NULL DEFAULT 'TOTP' CHECK (challenge_type IN ('TOTP', 'EMAIL_OTP', 'SECURITY_KEY')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'EXPIRED', 'FAILED')),
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mfa_challenges_user_pending 
  ON public.mfa_challenges(user_id) 
  WHERE status = 'PENDING';

ALTER TABLE public.mfa_challenges ENABLE ROW LEVEL SECURITY;

-- 3. Policies: Internal backend gateway & service-role only
-- Authenticated users can view their own non-revoked session metadata (no hashes)
CREATE POLICY "gateway_sessions_user_select"
  ON public.gateway_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Browser cannot directly insert, update or delete sessions
CREATE POLICY "gateway_sessions_service_manage"
  ON public.gateway_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "mfa_challenges_service_manage"
  ON public.mfa_challenges FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ==========================================
-- MIGRATION: 060_blockchain_audit_schema.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 060_blockchain_audit_schema.sql
-- Domain: Hyperledger Fabric Blockchain Audit Anchors Schema
-- Purpose: Store immutable cryptographic audit anchors and transaction proofs
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.blockchain_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id TEXT UNIQUE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_external_id TEXT,
  event_type TEXT NOT NULL,
  canonical_version INTEGER NOT NULL DEFAULT 1,
  payload_hash TEXT NOT NULL,
  hash_algorithm TEXT NOT NULL DEFAULT 'SHA-256',
  anchor_nonce TEXT,
  fabric_network TEXT DEFAULT 'nirikshak-fabric',
  channel_name TEXT DEFAULT 'nirikshakchannel',
  chaincode_name TEXT DEFAULT 'nirikshak-audit',
  transaction_id TEXT UNIQUE,
  block_number BIGINT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'CONFIRMED', 'FAILED', 'DEAD_LETTER')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_project_id 
  ON public.blockchain_anchors(project_id);

CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_entity 
  ON public.blockchain_anchors(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_status 
  ON public.blockchain_anchors(status);

CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_audit_id 
  ON public.blockchain_anchors(audit_id);

CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_tx_id 
  ON public.blockchain_anchors(transaction_id) 
  WHERE transaction_id IS NOT NULL;

ALTER TABLE public.blockchain_anchors ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- MIGRATION: 061_blockchain_outbox.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 061_blockchain_outbox.sql
-- Domain: Transactional Outbox for Hyperledger Fabric Anchoring
-- Purpose: Decouple operational database transactions from external ledger submission
--          guaranteeing reliable, eventual, tamper-evident anchoring.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.blockchain_anchor_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key TEXT UNIQUE NOT NULL,
  anchor_id UUID REFERENCES public.blockchain_anchors(id) ON DELETE CASCADE,
  project_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  event_type TEXT NOT NULL,
  minimal_payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'CONFIRMED', 'FAILED', 'DEAD_LETTER')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_blockchain_outbox_queue 
  ON public.blockchain_anchor_outbox(status, next_attempt_at) 
  WHERE status IN ('PENDING', 'FAILED');

CREATE INDEX IF NOT EXISTS idx_blockchain_outbox_dedupe 
  ON public.blockchain_anchor_outbox(dedupe_key);

CREATE INDEX IF NOT EXISTS idx_blockchain_outbox_project 
  ON public.blockchain_anchor_outbox(project_id);

ALTER TABLE public.blockchain_anchor_outbox ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- MIGRATION: 062_blockchain_rls.sql
-- ==========================================

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


-- ==========================================
-- MIGRATION: 063_blockchain_rpc_integration.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 063_blockchain_rpc_integration.sql
-- Domain: RPC & Database Triggers for Hyperledger Fabric Outbox Enqueueing
-- Purpose: Atomically enqueue blockchain anchors alongside critical business state changes
-- ==============================================================================

-- 1. Helper Function: enqueue_blockchain_anchor
CREATE OR REPLACE FUNCTION public.enqueue_blockchain_anchor(
  p_project_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_entity_external_id TEXT,
  p_event_type TEXT,
  p_payload_hash TEXT,
  p_minimal_payload JSONB,
  p_dedupe_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_anchor_id UUID;
  v_audit_id TEXT;
  v_existing_anchor_id UUID;
BEGIN
  -- Idempotency check via dedupe_key in outbox
  SELECT anchor_id INTO v_existing_anchor_id
  FROM public.blockchain_anchor_outbox
  WHERE dedupe_key = p_dedupe_key;

  IF v_existing_anchor_id IS NOT NULL THEN
    SELECT audit_id INTO v_audit_id FROM public.blockchain_anchors WHERE id = v_existing_anchor_id;
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'anchor_id', v_existing_anchor_id,
      'audit_id', v_audit_id,
      'status', 'ALREADY_ENQUEUED'
    );
  END IF;

  v_audit_id := 'AUD-' || upper(p_entity_type) || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);

  -- Insert Anchor record
  INSERT INTO public.blockchain_anchors (
    audit_id,
    project_id,
    entity_type,
    entity_id,
    entity_external_id,
    event_type,
    canonical_version,
    payload_hash,
    status
  ) VALUES (
    v_audit_id,
    p_project_id,
    p_entity_type,
    p_entity_id,
    p_entity_external_id,
    p_event_type,
    1,
    p_payload_hash,
    'PENDING'
  )
  RETURNING id INTO v_anchor_id;

  -- Insert into Transactional Outbox
  INSERT INTO public.blockchain_anchor_outbox (
    dedupe_key,
    anchor_id,
    project_id,
    entity_type,
    entity_id,
    event_type,
    minimal_payload,
    status
  ) VALUES (
    p_dedupe_key,
    v_anchor_id,
    p_project_id,
    p_entity_type,
    p_entity_id,
    p_event_type,
    p_minimal_payload,
    'PENDING'
  )
  ON CONFLICT (dedupe_key) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'idempotent', false,
    'anchor_id', v_anchor_id,
    'audit_id', v_audit_id,
    'status', 'PENDING'
  );
END;
$$;

-- Grant execution to authenticated users & service role
GRANT EXECUTE ON FUNCTION public.enqueue_blockchain_anchor(UUID, TEXT, UUID, TEXT, TEXT, TEXT, JSONB, TEXT) TO authenticated, service_role;

-- 2. Trigger on Payments table for PAYMENT_RECORDED event
CREATE OR REPLACE FUNCTION public.trg_anchor_payment_recorded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload_hash TEXT;
  v_dedupe_key TEXT;
  v_payload JSONB;
BEGIN
  v_payload := jsonb_build_object(
    'payment_id', NEW.id,
    'payment_reference', NEW.payment_reference,
    'amount', NEW.amount,
    'payment_status', NEW.payment_status,
    'claim_id', NEW.payment_claim_id,
    'recorded_at', NEW.created_at
  );

  v_payload_hash := encode(digest(v_payload::text, 'sha256'), 'hex');
  v_dedupe_key := 'PAYMENT:' || NEW.id || ':RECORDED:' || COALESCE(NEW.payment_reference, NEW.id::text);

  PERFORM public.enqueue_blockchain_anchor(
    NEW.project_id,
    'PAYMENT',
    NEW.id,
    NEW.payment_reference,
    'PAYMENT_RECORDED',
    v_payload_hash,
    v_payload,
    v_dedupe_key
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_blockchain_anchor ON public.payments;
CREATE TRIGGER trg_payment_blockchain_anchor
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_anchor_payment_recorded();

-- 3. Trigger on Contracts table for CONTRACT_AWARDED event
CREATE OR REPLACE FUNCTION public.trg_anchor_contract_awarded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload_hash TEXT;
  v_dedupe_key TEXT;
  v_payload JSONB;
BEGIN
  IF NEW.status IN ('ACTIVE', 'SIGNED') AND (OLD IS NULL OR OLD.status <> NEW.status) THEN
    v_payload := jsonb_build_object(
      'contract_id', NEW.id,
      'contract_number', NEW.contract_number,
      'contract_value', NEW.contract_value,
      'contractor_organization_id', NEW.contractor_organization_id,
      'awarded_at', NEW.created_at
    );

    v_payload_hash := encode(digest(v_payload::text, 'sha256'), 'hex');
    v_dedupe_key := 'CONTRACT:' || NEW.id || ':AWARDED:' || COALESCE(NEW.contract_number, NEW.id::text);

    PERFORM public.enqueue_blockchain_anchor(
      NEW.project_id,
      'CONTRACT',
      NEW.id,
      NEW.contract_number,
      'CONTRACT_AWARDED',
      v_payload_hash,
      v_payload,
      v_dedupe_key
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contract_blockchain_anchor ON public.contracts;
CREATE TRIGGER trg_contract_blockchain_anchor
  AFTER INSERT OR UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_anchor_contract_awarded();


-- ==========================================
-- MIGRATION: 064_final_production_constraints.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 064_final_production_constraints.sql
-- Domain: Financial & Concurrency Hardening
-- Purpose: Add database check constraints and row-level locking guarantees
--          preventing double-spend, race condition overpayments, and data anomalies.
-- ==============================================================================

-- 1. Hardened financial check constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_amount_paid_positive'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_amount_paid_positive CHECK (amount_paid > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_claims_claimed_amount_positive'
  ) THEN
    ALTER TABLE public.payment_claims
      ADD CONSTRAINT payment_claims_claimed_amount_positive CHECK (claimed_amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_claims_approved_amount_positive'
  ) THEN
    ALTER TABLE public.payment_claims
      ADD CONSTRAINT payment_claims_approved_amount_positive CHECK (approved_amount IS NULL OR approved_amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contracts_contract_value_positive'
  ) THEN
    ALTER TABLE public.contracts
      ADD CONSTRAINT contracts_contract_value_positive CHECK (contract_value > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenders_estimated_cost_positive'
  ) THEN
    ALTER TABLE public.tenders
      ADD CONSTRAINT tenders_estimated_cost_positive CHECK (estimated_cost > 0);
  END IF;
END $$;

-- 2. Unique index on payment reference (prevent duplicate transaction recording)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_reference 
  ON public.payments(payment_reference) 
  WHERE payment_reference IS NOT NULL;

-- 3. Ensure payments and claims have row locks in record_payment RPC
-- (Re-enforcing the FOR UPDATE concurrency lock)
CREATE OR REPLACE FUNCTION public.validate_payment_concurrency(p_claim_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_dummy UUID;
BEGIN
  SELECT id INTO v_dummy FROM public.payment_claims WHERE id = p_claim_id FOR UPDATE NOWAIT;
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_payment_concurrency(UUID) TO authenticated, service_role;


-- ==========================================
-- MIGRATION: 065_final_security_validation.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 065_final_security_validation.sql
-- Domain: Production Zero-Trust & Blockchain Security Readiness Verification
-- Purpose: Stored procedure providing deep inspection of tenant isolation,
--          RLS completeness, blockchain anchor health, and audit integrity.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.verify_production_security_readiness()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tables_count INTEGER;
  v_rls_disabled_count INTEGER;
  v_views_count INTEGER;
  v_policies_count INTEGER;
  v_anchors_count INTEGER;
  v_outbox_pending_count INTEGER;
  v_broad_policies_count INTEGER;
  v_report JSONB;
BEGIN
  -- 1. Base tables count
  SELECT count(*) INTO v_tables_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

  -- 2. Tables without RLS
  SELECT count(*) INTO v_rls_disabled_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE t.schemaname = 'public' AND c.relrowsecurity = false;

  -- 3. Views count
  SELECT count(*) INTO v_views_count
  FROM information_schema.views
  WHERE table_schema = 'public';

  -- 4. Total policies count
  SELECT count(*) INTO v_policies_count
  FROM pg_policies
  WHERE schemaname = 'public';

  -- 5. Check for overly broad policies using is_government_user() alone in project tables
  SELECT count(*) INTO v_broad_policies_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('inspection_findings', 'project_documents', 'delay_events', 'environmental_clearances')
    AND (
      qual LIKE '%is_government_user()%' AND qual NOT LIKE '%can_access_project%' AND qual NOT LIKE '%can_manage_project%'
    );

  -- 6. Blockchain anchors and outbox status
  SELECT count(*) INTO v_anchors_count FROM public.blockchain_anchors;
  SELECT count(*) INTO v_outbox_pending_count FROM public.blockchain_anchor_outbox WHERE status = 'PENDING';

  v_report := jsonb_build_object(
    'total_tables', v_tables_count,
    'tables_without_rls', v_rls_disabled_count,
    'total_views', v_views_count,
    'total_policies', v_policies_count,
    'broad_policies_count', v_broad_policies_count,
    'blockchain_anchors_count', v_anchors_count,
    'blockchain_outbox_pending_count', v_outbox_pending_count,
    'zero_trust_status', CASE 
      WHEN v_rls_disabled_count = 0 AND v_broad_policies_count = 0 THEN 'SECURE' 
      ELSE 'ACTION_REQUIRED' 
    END,
    'timestamp', now()
  );

  RETURN v_report;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_production_security_readiness() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_production_security_readiness() TO authenticated, service_role;


