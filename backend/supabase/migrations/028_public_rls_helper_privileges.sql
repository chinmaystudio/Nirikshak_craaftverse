-- Anonymous reads of public projects evaluate the complete projects policy.
-- These helpers derive identity only from auth.uid() and return booleans/NULL;
-- granting EXECUTE lets RLS evaluate public rows without exposing private data.

GRANT EXECUTE ON FUNCTION public.get_user_organization_id() TO anon;
GRANT EXECUTE ON FUNCTION public.is_government_user() TO anon;
GRANT EXECUTE ON FUNCTION public.is_contractor_user() TO anon;
GRANT EXECUTE ON FUNCTION public.can_access_project(uuid) TO anon;
