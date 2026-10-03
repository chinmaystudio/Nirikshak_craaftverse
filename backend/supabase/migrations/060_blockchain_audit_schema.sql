-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 060_blockchain_audit_schema.sql
-- Domain: Hyperledger Fabric Blockchain Audit Anchors Schema
-- Purpose: Store immutable cryptographic audit anchors and transaction proofs
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.blockchain_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id TEXT UNIQUE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_external_id TEXT,
  event_type TEXT NOT NULL,
  canonical_version INTEGER NOT NULL DEFAULT 1,
  payload_hash TEXT NOT NULL,
  hash_algorithm TEXT NOT NULL DEFAULT 'SHA-256',
  anchor_nonce TEXT,
  fabric_network TEXT DEFAULT 'nirikshak-fabric',
  channel_name TEXT DEFAULT 'nirikshakchannel',
  chaincode_name TEXT DEFAULT 'nirikshak-audit',
  transaction_id TEXT UNIQUE,
  block_number BIGINT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'CONFIRMED', 'FAILED', 'DEAD_LETTER')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_project_id 
  ON public.blockchain_anchors(project_id);

CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_entity 
  ON public.blockchain_anchors(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_status 
  ON public.blockchain_anchors(status);

CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_audit_id 
  ON public.blockchain_anchors(audit_id);

CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_tx_id 
  ON public.blockchain_anchors(transaction_id) 
  WHERE transaction_id IS NOT NULL;

ALTER TABLE public.blockchain_anchors ENABLE ROW LEVEL SECURITY;
