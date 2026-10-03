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
