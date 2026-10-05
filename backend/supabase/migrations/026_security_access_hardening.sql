-- Security hardening follow-up for the multi-tenant model.
-- Apply this migration before exposing the production Data API.

-- Privileged workflow functions are never anonymous endpoints.
REVOKE EXECUTE ON FUNCTION public.approve_government_access_request(uuid, public.app_role_enum) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_contractor_access_request(uuid, public.app_role_enum) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_contract(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_progress_update(uuid, text, numeric, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.register_government_account(text, text, text, text, text, text, text, text, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.register_contractor_account(text, text, text, text, text, text, text, text, text, text, text) FROM anon, authenticated, PUBLIC;

-- Preserve the existing transactional implementations behind authenticated,
-- administrator-only wrappers. This also hardens databases where migration 024
-- was applied manually without a matching migration-history entry.
ALTER FUNCTION public.approve_government_access_request(uuid, public.app_role_enum)
  RENAME TO approve_government_access_request_internal;
ALTER FUNCTION public.approve_contractor_access_request(uuid, public.app_role_enum)
  RENAME TO approve_contractor_access_request_internal;

REVOKE ALL ON FUNCTION public.approve_government_access_request_internal(uuid, public.app_role_enum) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.approve_contractor_access_request_internal(uuid, public.app_role_enum) FROM anon, authenticated, PUBLIC;

CREATE FUNCTION public.approve_government_access_request(
  request_id uuid,
  approved_role public.app_role_enum DEFAULT 'government_engineer'::public.app_role_enum
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id uuid := (SELECT auth.uid());
  v_caller_role public.app_role_enum;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: authentication is required';
  END IF;
  SELECT role INTO v_caller_role
  FROM public.organization_members
  WHERE user_id = v_caller_id AND lower(status) = 'active'
  LIMIT 1;
  IF v_caller_role <> 'government_admin' THEN
    RAISE EXCEPTION 'Unauthorized: Government Administrator role is required';
  END IF;
  RETURN public.approve_government_access_request_internal(request_id, approved_role);
END;
$$;

CREATE FUNCTION public.approve_contractor_access_request(
  request_id uuid,
  approved_role public.app_role_enum DEFAULT 'contractor_admin'::public.app_role_enum
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id uuid := (SELECT auth.uid());
  v_caller_role public.app_role_enum;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: authentication is required';
  END IF;
  SELECT role INTO v_caller_role
  FROM public.organization_members
  WHERE user_id = v_caller_id AND lower(status) = 'active'
  LIMIT 1;
  IF v_caller_role <> 'government_admin' THEN
    RAISE EXCEPTION 'Unauthorized: Government Administrator role is required';
  END IF;
  RETURN public.approve_contractor_access_request_internal(request_id, approved_role);
END;
$$;

-- Keep the approval RPCs available only to authenticated callers; the function
-- bodies enforce government-admin authorization and reject NULL auth.uid().
GRANT EXECUTE ON FUNCTION public.approve_government_access_request(uuid, public.app_role_enum) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_contractor_access_request(uuid, public.app_role_enum) TO authenticated;

-- Views must evaluate access using the querying user's RLS context.
ALTER VIEW public.government_project_summary_view SET (security_invoker = true);
ALTER VIEW public.contractor_assigned_projects_view SET (security_invoker = true);
ALTER VIEW public.public_projects_view SET (security_invoker = true);

-- A user without an active organization membership must never inherit the
-- development Government authority through a view fallback.
CREATE OR REPLACE VIEW public.government_project_summary_view
WITH (security_invoker = true) AS
SELECT
  p.id, p.nirikshak_project_id, p.official_project_id, p.project_name,
  p.description, p.sector, p.subsector, p.project_type, p.ministry,
  p.department, p.project_authority, p.implementing_agency,
  p.executing_agency, p.contractor_concessionaire, p.operator,
  p.ownership_type, p.procurement_mode, p.award_date, p.planned_start_date,
  p.actual_start_date, p.original_completion_date, p.revised_completion_date,
  p.actual_completion_date, p.state, p.district, p.city, p.location_text,
  p.latitude, p.longitude, p.total_cost_inr_crore, p.original_cost_inr_crore,
  p.revised_cost_inr_crore, p.amount_spent_inr_crore,
  p.physical_progress_percent, p.financial_progress_percent,
  p.reported_status, p.normalized_status, p.record_scope,
  p.current_status_verified, p.quality_score, p.duplicate_review,
  p.source_record_id, p.primary_source_url, p.is_public, p.public_summary,
  p.published_at, p.published_by, p.version, p.government_organization_id,
  p.created_by, p.created_at, p.updated_at, p.deleted_at,
  (SELECT count(*) FROM public.complaints c
    WHERE c.project_id = p.id AND c.status NOT IN ('RESOLVED', 'CLOSED')) AS open_complaints_count,
  (SELECT count(*) FROM public.progress_updates pu
    WHERE pu.project_id = p.id AND pu.verification_status = 'SUBMITTED') AS pending_progress_updates_count,
  (SELECT count(*) FROM public.inspections i
    WHERE i.project_id = p.id AND i.status = 'SCHEDULED') AS pending_inspections_count,
  (SELECT count(*) FROM public.ai_insights ai
    WHERE ai.project_id = p.id AND ai.severity = 'HIGH' AND ai.status = 'ACTIVE') AS high_risk_ai_count
FROM public.projects p
WHERE p.deleted_at IS NULL
  AND p.government_organization_id = public.get_user_organization_id();

-- Do not expose private workflow relations directly through the anonymous Data API.
REVOKE ALL ON TABLE public.tender_bids, public.contracts, public.notifications,
  public.audit_logs, public.government_access_requests, public.contractor_access_requests,
  public.ai_runs, public.ai_insights FROM anon;
REVOKE ALL ON public.government_project_summary_view, public.contractor_assigned_projects_view FROM anon;

-- Explicitly preserve only the public project projection for anonymous users.
GRANT SELECT ON public.public_projects_view TO anon;
