-- Remove PostgreSQL's default PUBLIC EXECUTE privilege from SECURITY DEFINER
-- functions. Only authenticated application workflows retain direct access.

REVOKE EXECUTE ON FUNCTION public.approve_government_access_request(uuid, public.app_role_enum) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_contractor_access_request(uuid, public.app_role_enum) FROM anon, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.can_access_project(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_manage_project(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_review_progress(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_current_user_organization_id() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_organization_id() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_citizen() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_contractor_user() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_government_user() FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.approve_government_access_request(uuid, public.app_role_enum) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_contractor_access_request(uuid, public.app_role_enum) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_project(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_project(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_review_progress(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_citizen() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_contractor_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_government_user() TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.set_project_gov_org() FROM anon, authenticated, PUBLIC;
