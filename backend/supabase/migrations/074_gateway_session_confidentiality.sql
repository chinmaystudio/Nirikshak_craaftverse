-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 074_gateway_session_confidentiality.sql
-- Domain: Gateway Session & MFA Challenge Confidentiality Lockdown
-- Purpose:
--   1. Zero direct SELECT privilege for authenticated users on gateway_sessions.
--   2. Zero access for anon on gateway_sessions.
--   3. Only service_role can SELECT/INSERT/UPDATE/DELETE gateway_sessions.
--   4. Drop any RLS policy that permits user SELECT on gateway_sessions.
--   5. Lock down mfa_challenges completely: zero access for anon & authenticated;
--      only service_role retains management privilege.
--   6. Invalidate all legacy gateway sessions to force secure re-authentication.
-- ==============================================================================

-- 1. Invalidate all active gateway sessions before locking down
UPDATE public.gateway_sessions
SET revoked_at = now()
WHERE revoked_at IS NULL;

-- 2. Revoke all permissions on gateway_sessions from anon, authenticated, PUBLIC
REVOKE ALL ON public.gateway_sessions FROM PUBLIC;
REVOKE ALL ON public.gateway_sessions FROM anon;
REVOKE ALL ON public.gateway_sessions FROM authenticated;

-- 3. Ensure service_role has exclusive full access
GRANT ALL ON public.gateway_sessions TO service_role;

-- 4. Drop any user SELECT policies on gateway_sessions
DROP POLICY IF EXISTS "gateway_sessions_user_select" ON public.gateway_sessions;
DROP POLICY IF EXISTS "Users can read own active session" ON public.gateway_sessions;
DROP POLICY IF EXISTS "gateway_sessions_owner_read" ON public.gateway_sessions;
DROP POLICY IF EXISTS "gateway_sessions_select_policy" ON public.gateway_sessions;

-- 5. Ensure gateway_sessions has RLS enabled with service_role management policy
ALTER TABLE public.gateway_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "gateway_sessions_service_role_all" ON public.gateway_sessions;
CREATE POLICY "gateway_sessions_service_role_all"
  ON public.gateway_sessions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 6. Lock down mfa_challenges
REVOKE ALL ON public.mfa_challenges FROM PUBLIC;
REVOKE ALL ON public.mfa_challenges FROM anon;
REVOKE ALL ON public.mfa_challenges FROM authenticated;

GRANT ALL ON public.mfa_challenges TO service_role;

DROP POLICY IF EXISTS "mfa_challenges_user_select" ON public.mfa_challenges;
DROP POLICY IF EXISTS "Users can read own mfa challenges" ON public.mfa_challenges;
DROP POLICY IF EXISTS "mfa_challenges_owner_read" ON public.mfa_challenges;

ALTER TABLE public.mfa_challenges ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mfa_challenges_service_role_all" ON public.mfa_challenges;
CREATE POLICY "mfa_challenges_service_role_all"
  ON public.mfa_challenges
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
