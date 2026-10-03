-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 063_blockchain_rpc_integration.sql
-- Domain: RPC & Database Triggers for Hyperledger Fabric Outbox Enqueueing
-- Purpose: Atomically enqueue blockchain anchors alongside critical business state changes
-- ==============================================================================

-- 1. Helper Function: enqueue_blockchain_anchor
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

  v_audit_id := 'AUD-' || upper(p_entity_type) || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);

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
    p_payload_hash,
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

-- Grant execution to authenticated users & service role
GRANT EXECUTE ON FUNCTION public.enqueue_blockchain_anchor(UUID, TEXT, UUID, TEXT, TEXT, TEXT, JSONB, TEXT) TO authenticated, service_role;

-- 2. Trigger on Payments table for PAYMENT_RECORDED event
CREATE OR REPLACE FUNCTION public.trg_anchor_payment_recorded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload_hash TEXT;
  v_dedupe_key TEXT;
  v_payload JSONB;
BEGIN
  v_payload := jsonb_build_object(
    'payment_id', NEW.id,
    'payment_reference', NEW.payment_reference,
    'amount', NEW.amount,
    'payment_status', NEW.payment_status,
    'claim_id', NEW.payment_claim_id,
    'recorded_at', NEW.created_at
  );

  v_payload_hash := encode(digest(v_payload::text, 'sha256'), 'hex');
  v_dedupe_key := 'PAYMENT:' || NEW.id || ':RECORDED:' || COALESCE(NEW.payment_reference, NEW.id::text);

  PERFORM public.enqueue_blockchain_anchor(
    NEW.project_id,
    'PAYMENT',
    NEW.id,
    NEW.payment_reference,
    'PAYMENT_RECORDED',
    v_payload_hash,
    v_payload,
    v_dedupe_key
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_blockchain_anchor ON public.payments;
CREATE TRIGGER trg_payment_blockchain_anchor
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_anchor_payment_recorded();

-- 3. Trigger on Contracts table for CONTRACT_AWARDED event
CREATE OR REPLACE FUNCTION public.trg_anchor_contract_awarded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload_hash TEXT;
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

    v_payload_hash := encode(digest(v_payload::text, 'sha256'), 'hex');
    v_dedupe_key := 'CONTRACT:' || NEW.id || ':AWARDED:' || COALESCE(NEW.contract_number, NEW.id::text);

    PERFORM public.enqueue_blockchain_anchor(
      NEW.project_id,
      'CONTRACT',
      NEW.id,
      NEW.contract_number,
      'CONTRACT_AWARDED',
      v_payload_hash,
      v_payload,
      v_dedupe_key
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contract_blockchain_anchor ON public.contracts;
CREATE TRIGGER trg_contract_blockchain_anchor
  AFTER INSERT OR UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_anchor_contract_awarded();
