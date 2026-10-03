-- ============================================================================
-- Migration: 054_production_validation_helpers.sql
-- Description: Production Schema Health Verification Stored Procedure
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_production_schema_health()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_tables_count INTEGER;
    v_rls_disabled_count INTEGER;
    v_views_count INTEGER;
    v_report JSONB;
BEGIN
    SELECT count(*) INTO v_tables_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

    -- Check for public tables missing RLS
    SELECT count(*) INTO v_rls_disabled_count
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.schemaname = 'public' AND c.relrowsecurity = false;

    SELECT count(*) INTO v_views_count
    FROM information_schema.views
    WHERE table_schema = 'public';

    v_report := jsonb_build_object(
        'total_tables', v_tables_count,
        'tables_without_rls', v_rls_disabled_count,
        'total_views', v_views_count,
        'security_status', CASE WHEN v_rls_disabled_count = 0 THEN 'HEALTHY' ELSE 'ACTION_REQUIRED' END,
        'timestamp', now()
    );

    RETURN v_report;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_production_schema_health() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_production_schema_health() TO authenticated, service_role;
