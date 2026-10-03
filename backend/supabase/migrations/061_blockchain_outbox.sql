-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 061_blockchain_outbox.sql
-- Domain: Transactional Outbox for Hyperledger Fabric Anchoring
-- Purpose: Decouple operational database transactions from external ledger submission
--          guaranteeing reliable, eventual, tamper-evident anchoring.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.blockchain_anchor_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key TEXT UNIQUE NOT NULL,
  anchor_id UUID REFERENCES public.blockchain_anchors(id) ON DELETE CASCADE,
  project_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  event_type TEXT NOT NULL,
  minimal_payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'CONFIRMED', 'FAILED', 'DEAD_LETTER')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_blockchain_outbox_queue 
  ON public.blockchain_anchor_outbox(status, next_attempt_at) 
  WHERE status IN ('PENDING', 'FAILED');

CREATE INDEX IF NOT EXISTS idx_blockchain_outbox_dedupe 
  ON public.blockchain_anchor_outbox(dedupe_key);

CREATE INDEX IF NOT EXISTS idx_blockchain_outbox_project 
  ON public.blockchain_anchor_outbox(project_id);

ALTER TABLE public.blockchain_anchor_outbox ENABLE ROW LEVEL SECURITY;
