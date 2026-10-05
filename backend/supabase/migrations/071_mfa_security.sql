-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 071_mfa_security.sql
-- Domain: Multi-Factor Authentication (MFA) & Session Elevation
-- Purpose:
--   1. Support persistent MFA factor enrollment (TOTP)
--   2. Manage one-time MFA verification challenges and attempts
--   3. Provide secure session elevation function for sensitive operations
-- ==============================================================================

-- 1. Table for persistent enrolled MFA factors
CREATE TABLE IF NOT EXISTS public.user_mfa_factors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  factor_type TEXT NOT NULL DEFAULT 'TOTP' CHECK (factor_type IN ('TOTP', 'EMAIL_OTP', 'SECURITY_KEY')),
  secret TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK (status IN ('UNVERIFIED', 'VERIFIED', 'DISABLED')),
  enrolled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_used_at TIMESTAMPTZ,
  UNIQUE(user_id, factor_type)
);

CREATE INDEX IF NOT EXISTS idx_user_mfa_factors_user 
  ON public.user_mfa_factors(user_id);

ALTER TABLE public.user_mfa_factors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_mfa_factors_service_manage"
  ON public.user_mfa_factors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Function to elevate gateway session after verified MFA challenge
CREATE OR REPLACE FUNCTION public.elevate_gateway_session(
  p_session_token_hash TEXT,
  p_duration_minutes INTEGER DEFAULT 15
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.gateway_sessions
  SET 
    mfa_verified = true,
    mfa_verified_at = now(),
    elevated_until = now() + (p_duration_minutes || ' minutes')::interval,
    last_active_at = now()
  WHERE session_token_hash = p_session_token_hash
    AND revoked_at IS NULL
    AND expires_at > now();

  RETURN FOUND;
END;
$$;

REVOKE ALL ON FUNCTION public.elevate_gateway_session(TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.elevate_gateway_session(TEXT, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.elevate_gateway_session(TEXT, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.elevate_gateway_session(TEXT, INTEGER) TO service_role;
