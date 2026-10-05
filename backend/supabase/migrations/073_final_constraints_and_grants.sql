-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 073_final_constraints_and_grants.sql
-- Domain: Final Production Grants, Definer Security, and Access Constraints
-- Purpose:
--   1. Explicitly revoke any residual permissions from anon and authenticated
--      on blockchain, session, and MFA tables.
--   2. Grant explicit full management access to service_role.
-- ==============================================================================

-- 1. Explicit Revocations on Internal Security Tables
REVOKE ALL ON public.blockchain_anchor_outbox FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.blockchain_anchors FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.gateway_sessions FROM anon, authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON public.mfa_challenges FROM anon, authenticated;
REVOKE ALL ON public.user_mfa_factors FROM anon, authenticated;

-- 2. Explicit Grants for service_role
GRANT ALL ON public.blockchain_anchors TO service_role;
GRANT ALL ON public.blockchain_anchor_outbox TO service_role;
GRANT ALL ON public.gateway_sessions TO service_role;
GRANT ALL ON public.mfa_challenges TO service_role;
GRANT ALL ON public.user_mfa_factors TO service_role;

-- 3. Controlled Read Grants for Authenticated Users (subject to RLS policies)
GRANT SELECT ON public.blockchain_anchors TO authenticated;
GRANT SELECT ON public.gateway_sessions TO authenticated;
GRANT SELECT ON public.mfa_challenges TO authenticated;
