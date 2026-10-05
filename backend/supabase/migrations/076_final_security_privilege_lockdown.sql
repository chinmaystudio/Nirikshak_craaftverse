-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 076_final_security_privilege_lockdown.sql
-- Domain: Final Production Privilege Isolation & RPC Lockdown
-- Purpose:
--   1. Ensure zero direct client access (anon/authenticated) to user_mfa_factors.
--   2. Enforce exclusive execution rights for service_role on critical security RPCs.
--   3. Lock down blockchain outbox and internal queues.
-- ==============================================================================

-- 1. Lock down user_mfa_factors table
REVOKE ALL ON public.user_mfa_factors FROM PUBLIC;
REVOKE ALL ON public.user_mfa_factors FROM anon;
REVOKE ALL ON public.user_mfa_factors FROM authenticated;
GRANT ALL ON public.user_mfa_factors TO service_role;

DROP POLICY IF EXISTS "user_mfa_factors_user_read" ON public.user_mfa_factors;
DROP POLICY IF EXISTS "user_mfa_factors_owner_read" ON public.user_mfa_factors;
DROP POLICY IF EXISTS "user_mfa_factors_service_manage" ON public.user_mfa_factors;

ALTER TABLE public.user_mfa_factors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "user_mfa_factors_service_role_all"
  ON public.user_mfa_factors
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. Lock down critical internal security RPCs
DO $$
BEGIN
  -- enqueue_blockchain_anchor
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'enqueue_blockchain_anchor') THEN
    REVOKE ALL ON FUNCTION public.enqueue_blockchain_anchor FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.enqueue_blockchain_anchor FROM anon;
    REVOKE ALL ON FUNCTION public.enqueue_blockchain_anchor FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.enqueue_blockchain_anchor TO service_role;
  END IF;

  -- claim_blockchain_outbox_jobs
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'claim_blockchain_outbox_jobs') THEN
    REVOKE ALL ON FUNCTION public.claim_blockchain_outbox_jobs FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.claim_blockchain_outbox_jobs FROM anon;
    REVOKE ALL ON FUNCTION public.claim_blockchain_outbox_jobs FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.claim_blockchain_outbox_jobs TO service_role;
  END IF;

  -- recover_stale_blockchain_jobs
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'recover_stale_blockchain_jobs') THEN
    REVOKE ALL ON FUNCTION public.recover_stale_blockchain_jobs FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.recover_stale_blockchain_jobs FROM anon;
    REVOKE ALL ON FUNCTION public.recover_stale_blockchain_jobs FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.recover_stale_blockchain_jobs TO service_role;
  END IF;

  -- elevate_gateway_session
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'elevate_gateway_session') THEN
    REVOKE ALL ON FUNCTION public.elevate_gateway_session FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.elevate_gateway_session FROM anon;
    REVOKE ALL ON FUNCTION public.elevate_gateway_session FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.elevate_gateway_session TO service_role;
  END IF;

  -- revoke_gateway_session
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'revoke_gateway_session') THEN
    REVOKE ALL ON FUNCTION public.revoke_gateway_session FROM PUBLIC;
    REVOKE ALL ON FUNCTION public.revoke_gateway_session FROM anon;
    REVOKE ALL ON FUNCTION public.revoke_gateway_session FROM authenticated;
    GRANT EXECUTE ON FUNCTION public.revoke_gateway_session TO service_role;
  END IF;
END $$;
