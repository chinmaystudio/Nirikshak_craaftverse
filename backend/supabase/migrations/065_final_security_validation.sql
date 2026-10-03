-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 065_final_security_validation.sql
-- Domain: Production Zero-Trust & Blockchain Security Readiness Verification
-- Purpose: Stored procedure providing deep inspection of tenant isolation,
--          RLS completeness, blockchain anchor health, and audit integrity.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.verify_production_security_readiness()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tables_count INTEGER;
  v_rls_disabled_count INTEGER;
  v_views_count INTEGER;
  v_policies_count INTEGER;
  v_anchors_count INTEGER;
  v_outbox_pending_count INTEGER;
  v_broad_policies_count INTEGER;
  v_report JSONB;
BEGIN
  -- 1. Base tables count
  SELECT count(*) INTO v_tables_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

  -- 2. Tables without RLS
  SELECT count(*) INTO v_rls_disabled_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE t.schemaname = 'public' AND c.relrowsecurity = false;

  -- 3. Views count
  SELECT count(*) INTO v_views_count
  FROM information_schema.views
  WHERE table_schema = 'public';

  -- 4. Total policies count
  SELECT count(*) INTO v_policies_count
  FROM pg_policies
  WHERE schemaname = 'public';

  -- 5. Check for overly broad policies using is_government_user() alone in project tables
  SELECT count(*) INTO v_broad_policies_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('inspection_findings', 'project_documents', 'delay_events', 'environmental_clearances')
    AND (
      qual LIKE '%is_government_user()%' AND qual NOT LIKE '%can_access_project%' AND qual NOT LIKE '%can_manage_project%'
    );

  -- 6. Blockchain anchors and outbox status
  SELECT count(*) INTO v_anchors_count FROM public.blockchain_anchors;
  SELECT count(*) INTO v_outbox_pending_count FROM public.blockchain_anchor_outbox WHERE status = 'PENDING';

  v_report := jsonb_build_object(
    'total_tables', v_tables_count,
    'tables_without_rls', v_rls_disabled_count,
    'total_views', v_views_count,
    'total_policies', v_policies_count,
    'broad_policies_count', v_broad_policies_count,
    'blockchain_anchors_count', v_anchors_count,
    'blockchain_outbox_pending_count', v_outbox_pending_count,
    'zero_trust_status', CASE 
      WHEN v_rls_disabled_count = 0 AND v_broad_policies_count = 0 THEN 'SECURE' 
      ELSE 'ACTION_REQUIRED' 
    END,
    'timestamp', now()
  );

  RETURN v_report;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_production_security_readiness() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_production_security_readiness() TO authenticated, service_role;
