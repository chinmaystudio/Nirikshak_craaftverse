-- Fix government project ownership checks used by award_contract.
-- project_organizations uses relationship_type, not role.
CREATE OR REPLACE FUNCTION public.can_manage_project(p_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public, pg_temp
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

  RETURN EXISTS (
    SELECT 1
    FROM public.projects p
    WHERE p.id = p_id
      AND p.deleted_at IS NULL
      AND (
        p.government_organization_id = v_org_id
        OR EXISTS (
          SELECT 1
          FROM public.project_organizations po
          WHERE po.project_id = p_id
            AND po.organization_id = v_org_id
            AND po.relationship_type IN ('OWNER', 'IMPLEMENTING_AGENCY')
            AND COALESCE(po.status, 'ACTIVE') = 'ACTIVE'
        )
      )
  );
END;
$$;

REVOKE ALL ON FUNCTION public.can_manage_project(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.can_manage_project(UUID) TO authenticated, service_role;
