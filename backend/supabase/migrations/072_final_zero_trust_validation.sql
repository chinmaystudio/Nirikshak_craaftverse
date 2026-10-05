-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 072_final_zero_trust_validation.sql
-- Domain: Outbox State Synchronization & Zero-Trust Status Enforcement
-- Purpose:
--   1. Enforce that when outbox becomes DEAD_LETTER, the associated anchor
--      record status is also synchronously updated to DEAD_LETTER.
--   2. Validate table-level RLS coverage across all public schema tables.
-- ==============================================================================

-- 1. Trigger to synchronize DEAD_LETTER status to blockchain_anchors
CREATE OR REPLACE FUNCTION public.trg_sync_dead_letter_anchor()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NEW.status = 'DEAD_LETTER' AND (OLD IS NULL OR OLD.status <> 'DEAD_LETTER') THEN
    UPDATE public.blockchain_anchors
    SET 
      status = 'DEAD_LETTER',
      last_error = COALESCE(NEW.last_error, 'OUTBOX_DEAD_LETTER: Max retry attempts exceeded without Fabric confirmation.')
    WHERE id = NEW.anchor_id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_dead_letter_anchor ON public.blockchain_anchor_outbox;
CREATE TRIGGER trg_sync_dead_letter_anchor
  AFTER UPDATE OF status ON public.blockchain_anchor_outbox
  FOR EACH ROW
  WHEN (NEW.status = 'DEAD_LETTER')
  EXECUTE FUNCTION public.trg_sync_dead_letter_anchor();

-- 2. Zero-Trust verification helper
CREATE OR REPLACE FUNCTION public.verify_all_tables_rls_enabled()
RETURNS TABLE (
  table_name TEXT,
  rls_enabled BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.tablename::TEXT,
    t.rowsecurity::BOOLEAN
  FROM pg_tables t
  WHERE t.schemaname = 'public'
  ORDER BY t.tablename;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_all_tables_rls_enabled() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.verify_all_tables_rls_enabled() FROM anon;
REVOKE ALL ON FUNCTION public.verify_all_tables_rls_enabled() FROM authenticated;
GRANT EXECUTE ON FUNCTION public.verify_all_tables_rls_enabled() TO service_role;
