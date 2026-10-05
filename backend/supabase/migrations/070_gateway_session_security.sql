-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 070_gateway_session_security.sql
-- Domain: Opaque Backend Gateway Session Architecture
-- Purpose:
--   1. Support opaque random session tokens where browser receives only raw opaque cookie
--   2. Store only SHA-256(session_token) in database
--   3. Store server-managed Supabase credentials and token lifetimes securely
--   4. Provide fast session lookup and atomic revocation
-- ==============================================================================

-- 1. Ensure all session columns exist
ALTER TABLE public.gateway_sessions 
  ADD COLUMN IF NOT EXISTS supabase_access_token TEXT,
  ADD COLUMN IF NOT EXISTS supabase_refresh_token TEXT,
  ADD COLUMN IF NOT EXISTS access_token_expires_at TIMESTAMPTZ;

-- 2. Index on active sessions
CREATE INDEX IF NOT EXISTS idx_gateway_sessions_active_lookup
  ON public.gateway_sessions(session_token_hash)
  WHERE revoked_at IS NULL;

-- 3. Revoke function for atomic session termination
CREATE OR REPLACE FUNCTION public.revoke_gateway_session(
  p_session_token_hash TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.gateway_sessions
  SET revoked_at = now()
  WHERE session_token_hash = p_session_token_hash
    AND revoked_at IS NULL;

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_gateway_session(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.revoke_gateway_session(TEXT) FROM anon;
REVOKE ALL ON FUNCTION public.revoke_gateway_session(TEXT) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.revoke_gateway_session(TEXT) TO service_role;
