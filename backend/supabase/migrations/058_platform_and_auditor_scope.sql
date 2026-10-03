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
