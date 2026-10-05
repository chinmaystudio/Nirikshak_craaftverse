-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 066_blockchain_runtime_correctness.sql
-- Domain: Blockchain Runtime Correctness & Single Canonical Hash Architecture
-- Purpose:
--   1. Allow payload_hash to be deferred until canonical serialization by worker
--   2. Drop and recreate payment blockchain trigger with actual payment columns
--   3. Align enqueue_blockchain_anchor with single audit ID and pending payload_hash
-- ==============================================================================

-- 1. Modify blockchain_anchors to allow pending placeholder hash
ALTER TABLE public.blockchain_anchors 
  ALTER COLUMN payload_hash DROP NOT NULL;

ALTER TABLE public.blockchain_anchors 
  ALTER COLUMN payload_hash SET DEFAULT 'PENDING_CANONICAL_HASH';

-- 2. Drop legacy trigger on payments
DROP TRIGGER IF EXISTS trg_payment_blockchain_anchor ON public.payments;
DROP FUNCTION IF EXISTS public.trg_anchor_payment_recorded();

-- 3. Recreate enqueue_blockchain_anchor with single audit ID and deferred canonical hash
CREATE OR REPLACE FUNCTION public.enqueue_blockchain_anchor(
  p_project_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_entity_external_id TEXT,
  p_event_type TEXT,
  p_payload_hash TEXT,
  p_minimal_payload JSONB,
  p_dedupe_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_anchor_id UUID;
  v_audit_id TEXT;
  v_existing_anchor_id UUID;
  v_target_hash TEXT;
BEGIN
  -- Idempotency check via dedupe_key in outbox
  SELECT anchor_id INTO v_existing_anchor_id
  FROM public.blockchain_anchor_outbox
  WHERE dedupe_key = p_dedupe_key;

  IF v_existing_anchor_id IS NOT NULL THEN
    SELECT audit_id INTO v_audit_id FROM public.blockchain_anchors WHERE id = v_existing_anchor_id;
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'anchor_id', v_existing_anchor_id,
      'audit_id', v_audit_id,
      'status', 'ALREADY_ENQUEUED'
    );
  END IF;

  -- Generate single authoritative audit ID in DB (Format: AUD-<ENTITY>-<16-HEX>)
  v_audit_id := 'AUD-' || upper(p_entity_type) || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);
  v_target_hash := COALESCE(p_payload_hash, 'PENDING_CANONICAL_HASH');

  -- Insert Anchor record
  INSERT INTO public.blockchain_anchors (
    audit_id,
    project_id,
    entity_type,
    entity_id,
    entity_external_id,
    event_type,
    canonical_version,
    payload_hash,
    status
  ) VALUES (
    v_audit_id,
    p_project_id,
    p_entity_type,
    p_entity_id,
    p_entity_external_id,
    p_event_type,
    1,
    v_target_hash,
    'PENDING'
  )
  RETURNING id INTO v_anchor_id;

  -- Insert into Transactional Outbox
  INSERT INTO public.blockchain_anchor_outbox (
    dedupe_key,
    anchor_id,
    project_id,
    entity_type,
    entity_id,
    event_type,
    minimal_payload,
    status
  ) VALUES (
    p_dedupe_key,
    v_anchor_id,
    p_project_id,
    p_entity_type,
    p_entity_id,
    p_event_type,
    p_minimal_payload,
    'PENDING'
  )
  ON CONFLICT (dedupe_key) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'idempotent', false,
    'anchor_id', v_anchor_id,
    'audit_id', v_audit_id,
    'status', 'PENDING'
  );
END;
$$;

-- 4. Corrected Trigger on Payments using actual database columns
-- Actual schema: id, payment_claim_id, project_id, contractor_organization_id, amount_paid, payment_reference, payment_date, payment_method, recorded_by, created_at
CREATE OR REPLACE FUNCTION public.trg_anchor_payment_recorded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_dedupe_key TEXT;
  v_payload JSONB;
BEGIN
  v_payload := jsonb_build_object(
    'payment_id', NEW.id,
    'payment_claim_id', NEW.payment_claim_id,
    'project_id', NEW.project_id,
    'contractor_organization_id', NEW.contractor_organization_id,
    'amount_paid', NEW.amount_paid,
    'payment_reference', NEW.payment_reference,
    'payment_date', NEW.payment_date,
    'payment_method', NEW.payment_method,
    'recorded_by', NEW.recorded_by,
    'created_at', NEW.created_at
  );

  v_dedupe_key := 'PAYMENT:' || NEW.id || ':RECORDED:' || COALESCE(NEW.payment_reference, NEW.id::text);

  PERFORM public.enqueue_blockchain_anchor(
    NEW.project_id,
    'PAYMENT',
    NEW.id,
    NEW.payment_reference,
    'PAYMENT_RECORDED',
    'PENDING_CANONICAL_HASH',
    v_payload,
    v_dedupe_key
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_blockchain_anchor
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_anchor_payment_recorded();

-- 5. Updated Contract Award trigger using deferred canonical hash
CREATE OR REPLACE FUNCTION public.trg_anchor_contract_awarded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_dedupe_key TEXT;
  v_payload JSONB;
BEGIN
  IF NEW.status IN ('ACTIVE', 'SIGNED') AND (OLD IS NULL OR OLD.status <> NEW.status) THEN
    v_payload := jsonb_build_object(
      'contract_id', NEW.id,
      'contract_number', NEW.contract_number,
      'contract_value', NEW.contract_value,
      'contractor_organization_id', NEW.contractor_organization_id,
      'awarded_at', NEW.created_at
    );

    v_dedupe_key := 'CONTRACT:' || NEW.id || ':AWARDED:' || COALESCE(NEW.contract_number, NEW.id::text);

    PERFORM public.enqueue_blockchain_anchor(
      NEW.project_id,
      'CONTRACT',
      NEW.id,
      NEW.contract_number,
      'CONTRACT_AWARDED',
      'PENDING_CANONICAL_HASH',
      v_payload,
      v_dedupe_key
    );
  END IF;

  RETURN NEW;
END;
$$;
