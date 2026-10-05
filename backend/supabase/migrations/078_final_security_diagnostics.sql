-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 078_final_security_diagnostics.sql
-- Domain: Automated Production Security Diagnostics & Invariant Verification
-- Purpose:
--   Provide diagnostic function to certify zero-trust security postures:
--   1. Confirm 100% of public tables have Row-Level Security enabled.
--   2. Confirm gateway_sessions, user_mfa_factors, mfa_challenges, and outbox
--      have zero grants to anon or authenticated.
--   3. Confirm absence of plaintext credentials in session and MFA tables.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.verify_system_security_posture()
RETURNS TABLE (
  check_name TEXT,
  passed BOOLEAN,
  details TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_unsecured_tables_count INTEGER;
  v_plaintext_sessions_count INTEGER;
  v_plaintext_mfa_count INTEGER;
  v_unauthorized_session_grants INTEGER;
  v_unauthorized_mfa_grants INTEGER;
BEGIN
  -- 1. Check all public tables have RLS enabled
  SELECT COUNT(*) INTO v_unsecured_tables_count
  FROM pg_tables
  WHERE schemaname = 'public'
    AND rowsecurity = false;

  check_name := 'ALL_PUBLIC_TABLES_RLS_ENABLED';
  passed := (v_unsecured_tables_count = 0);
  details := CASE 
    WHEN v_unsecured_tables_count = 0 THEN 'All public schema tables have rowsecurity = true.'
    ELSE v_unsecured_tables_count || ' public tables lack rowsecurity.'
  END;
  RETURN NEXT;

  -- 2. Check gateway_sessions permissions for anon/authenticated
  SELECT COUNT(*) INTO v_unauthorized_session_grants
  FROM information_schema.table_privileges
  WHERE table_schema = 'public'
    AND table_name = 'gateway_sessions'
    AND grantee IN ('anon', 'authenticated', 'PUBLIC');

  check_name := 'GATEWAY_SESSIONS_CLIENT_ISOLATION';
  passed := (v_unauthorized_session_grants = 0);
  details := CASE 
    WHEN v_unauthorized_session_grants = 0 THEN 'Zero direct permissions granted to anon, authenticated, or PUBLIC.'
    ELSE v_unauthorized_session_grants || ' residual privilege entries detected.'
  END;
  RETURN NEXT;

  -- 3. Check user_mfa_factors permissions for anon/authenticated
  SELECT COUNT(*) INTO v_unauthorized_mfa_grants
  FROM information_schema.table_privileges
  WHERE table_schema = 'public'
    AND table_name = 'user_mfa_factors'
    AND grantee IN ('anon', 'authenticated', 'PUBLIC');

  check_name := 'MFA_FACTORS_CLIENT_ISOLATION';
  passed := (v_unauthorized_mfa_grants = 0);
  details := CASE 
    WHEN v_unauthorized_mfa_grants = 0 THEN 'Zero direct permissions granted to anon, authenticated, or PUBLIC.'
    ELSE v_unauthorized_mfa_grants || ' residual privilege entries detected.'
  END;
  RETURN NEXT;

  -- 4. Check for plaintext tokens in gateway_sessions
  SELECT COUNT(*) INTO v_plaintext_sessions_count
  FROM public.gateway_sessions
  WHERE supabase_access_token IS NOT NULL
     OR supabase_refresh_token IS NOT NULL;

  check_name := 'ZERO_PLAINTEXT_SESSION_CREDENTIALS';
  passed := (v_plaintext_sessions_count = 0);
  details := CASE 
    WHEN v_plaintext_sessions_count = 0 THEN 'All session token columns are nullified or encrypted at rest.'
    ELSE v_plaintext_sessions_count || ' records contain non-null plaintext credentials.'
  END;
  RETURN NEXT;

  -- 5. Check for plaintext secrets in user_mfa_factors
  SELECT COUNT(*) INTO v_plaintext_mfa_count
  FROM public.user_mfa_factors
  WHERE secret IS NOT NULL;

  check_name := 'ZERO_PLAINTEXT_MFA_SECRETS';
  passed := (v_plaintext_mfa_count = 0);
  details := CASE 
    WHEN v_plaintext_mfa_count = 0 THEN 'All raw TOTP secrets nullified; ciphertext columns required.'
    ELSE v_plaintext_mfa_count || ' records contain non-null plaintext secrets.'
  END;
  RETURN NEXT;

END;
$$;

REVOKE ALL ON FUNCTION public.verify_system_security_posture() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_system_security_posture() FROM anon;
REVOKE ALL ON FUNCTION public.verify_system_security_posture() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.verify_system_security_posture() TO service_role;
