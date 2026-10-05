-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 068_blockchain_worker_claiming.sql
-- Domain: Concurrency-Safe Outbox Claiming & Stale Job Recovery
-- Purpose:
--   1. Provide atomic, concurrency-safe FOR UPDATE SKIP LOCKED job claiming
--   2. Provide stale job recovery for interrupted/crashed worker processes
--   3. Restrict outbox processing execution strictly to service_role
-- ==============================================================================

-- 1. Atomic job claiming function with FOR UPDATE SKIP LOCKED
CREATE OR REPLACE FUNCTION public.claim_blockchain_outbox_jobs(
  p_worker_id TEXT,
  p_batch_size INTEGER DEFAULT 10
)
RETURNS TABLE (
  id UUID,
  dedupe_key TEXT,
  anchor_id UUID,
  project_id UUID,
  entity_type TEXT,
  entity_id UUID,
  event_type TEXT,
  minimal_payload JSONB,
  attempt_count INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  WITH claimable AS (
    SELECT o.id
    FROM public.blockchain_anchor_outbox o
    WHERE o.status IN ('PENDING', 'FAILED')
      AND o.next_attempt_at <= now()
    ORDER BY o.next_attempt_at ASC
    LIMIT p_batch_size
    FOR UPDATE SKIP LOCKED
  ),
  updated AS (
    UPDATE public.blockchain_anchor_outbox o
    SET 
      status = 'PROCESSING',
      locked_at = now(),
      locked_by = p_worker_id
    FROM claimable c
    WHERE o.id = c.id
    RETURNING 
      o.id,
      o.dedupe_key,
      o.anchor_id,
      o.project_id,
      o.entity_type,
      o.entity_id,
      o.event_type,
      o.minimal_payload,
      o.attempt_count
  )
  SELECT * FROM updated;
END;
$$;

-- 2. Stale job recovery function
CREATE OR REPLACE FUNCTION public.recover_stale_blockchain_jobs(
  p_timeout_interval INTERVAL DEFAULT INTERVAL '5 minutes'
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_recovered_count INTEGER;
BEGIN
  WITH stale_jobs AS (
    SELECT id
    FROM public.blockchain_anchor_outbox
    WHERE status = 'PROCESSING'
      AND locked_at < (now() - p_timeout_interval)
    FOR UPDATE SKIP LOCKED
  ),
  recovered AS (
    UPDATE public.blockchain_anchor_outbox o
    SET
      status = 'FAILED',
      locked_at = NULL,
      locked_by = NULL,
      last_error = 'JOB_ABANDONED_OR_TIMED_OUT: Worker lock timed out and job was automatically recovered for retry.',
      next_attempt_at = now()
    FROM stale_jobs s
    WHERE o.id = s.id
    RETURNING o.id
  )
  SELECT count(*) INTO v_recovered_count FROM recovered;

  RETURN v_recovered_count;
END;
$$;

-- 3. Grants: service_role only
REVOKE ALL ON FUNCTION public.claim_blockchain_outbox_jobs(TEXT, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.claim_blockchain_outbox_jobs(TEXT, INTEGER) FROM anon;
REVOKE ALL ON FUNCTION public.claim_blockchain_outbox_jobs(TEXT, INTEGER) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.claim_blockchain_outbox_jobs(TEXT, INTEGER) TO service_role;

REVOKE ALL ON FUNCTION public.recover_stale_blockchain_jobs(INTERVAL) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.recover_stale_blockchain_jobs(INTERVAL) FROM anon;
REVOKE ALL ON FUNCTION public.recover_stale_blockchain_jobs(INTERVAL) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.recover_stale_blockchain_jobs(INTERVAL) TO service_role;
