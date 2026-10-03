-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 055_fix_payment_claims_audit_entity_uuid.sql
-- Domain: Audit Log Entity ID UUID Integrity for Payment Claims RPCs
-- ==============================================================================

-- 1. Submit Payment Claim (Contractor Only) - Fixed entity_id UUID type
CREATE OR REPLACE FUNCTION public.submit_payment_claim(
  p_project_id UUID,
  p_claimed_amount NUMERIC,
  p_claim_type TEXT DEFAULT 'RA_BILL',
  p_description TEXT DEFAULT NULL,
  p_milestone_id UUID DEFAULT NULL
)
RETURNS public.payment_claims
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_contract_id UUID;
  v_claim_ref TEXT;
  v_new_claim public.payment_claims;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  v_org_id := public.get_current_user_organization_id();
  IF v_org_id IS NULL OR NOT public.is_contractor_user() THEN
    RAISE EXCEPTION 'Only active contractor organization members can submit payment claims.';
  END IF;

  -- Verify active contract on project
  SELECT id INTO v_contract_id
  FROM public.contracts
  WHERE project_id = p_project_id AND contractor_organization_id = v_org_id AND status = 'ACTIVE'
  LIMIT 1;

  IF v_contract_id IS NULL THEN
    RAISE EXCEPTION 'No active contract found for your organization on this project.';
  END IF;

  IF p_claimed_amount <= 0 THEN
    RAISE EXCEPTION 'Claimed amount must be greater than zero.';
  END IF;

  -- Generate sequential claim reference
  v_claim_ref := 'NRK-CLM-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6);

  INSERT INTO public.payment_claims (
    claim_number,
    project_id,
    contract_id,
    contractor_organization_id,
    milestone_id,
    claim_type,
    claimed_amount,
    status,
    description,
    submitted_by,
    submitted_at
  ) VALUES (
    v_claim_ref,
    p_project_id,
    v_contract_id,
    v_org_id,
    p_milestone_id,
    p_claim_type,
    p_claimed_amount,
    'SUBMITTED',
    p_description,
    v_user_id,
    now()
  )
  RETURNING * INTO v_new_claim;

  -- Audit log entry with entity_id as UUID
  INSERT INTO public.audit_logs (
    actor_id, actor_organization_id, action, entity_type, entity_id, project_id, new_value
  ) VALUES (
    v_user_id, v_org_id, 'PAYMENT_CLAIM_SUBMITTED', 'payment_claims', v_new_claim.id, p_project_id,
    jsonb_build_object('claim_number', v_claim_ref, 'claimed_amount', p_claimed_amount)
  );

  RETURN v_new_claim;
END;
$$;

-- 2. Review Payment Claim (Authorized Government Finance / Admin Role) - Fixed entity_id UUID type
CREATE OR REPLACE FUNCTION public.review_payment_claim(
  p_claim_id UUID,
  p_decision TEXT,
  p_verified_amount NUMERIC DEFAULT NULL,
  p_approved_amount NUMERIC DEFAULT NULL,
  p_review_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_claim RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  v_org_id := public.get_current_user_organization_id();
  IF v_org_id IS NULL OR NOT public.is_government_user() THEN
    RAISE EXCEPTION 'Only authorized government officials can review payment claims.';
  END IF;

  SELECT * INTO v_claim FROM public.payment_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment claim not found.';
  END IF;

  IF NOT public.can_manage_project(v_claim.project_id) THEN
    RAISE EXCEPTION 'You lack authority to review payment claims for this project.';
  END IF;

  IF p_decision NOT IN ('VERIFIED', 'APPROVED', 'REJECTED', 'CLARIFICATION_REQUIRED') THEN
    RAISE EXCEPTION 'Invalid review decision.';
  END IF;

  IF p_decision = 'APPROVED' THEN
    IF p_approved_amount IS NULL OR p_approved_amount <= 0 OR p_approved_amount > v_claim.claimed_amount THEN
      RAISE EXCEPTION 'Approved amount must be positive and cannot exceed claimed amount.';
    END IF;

    UPDATE public.payment_claims
    SET status = 'APPROVED',
        verified_amount = COALESCE(p_verified_amount, p_approved_amount),
        approved_amount = p_approved_amount,
        reviewed_by = v_user_id,
        reviewed_at = now(),
        review_notes = p_review_notes,
        approved_by = v_user_id,
        approved_at = now(),
        updated_at = now()
    WHERE id = p_claim_id;
  ELSE
    UPDATE public.payment_claims
    SET status = p_decision,
        verified_amount = p_verified_amount,
        reviewed_by = v_user_id,
        reviewed_at = now(),
        review_notes = p_review_notes,
        updated_at = now()
    WHERE id = p_claim_id;
  END IF;

  -- Audit log entry with entity_id as UUID
  INSERT INTO public.audit_logs (
    actor_id, actor_organization_id, action, entity_type, entity_id, project_id, new_value
  ) VALUES (
    v_user_id, v_org_id, 'PAYMENT_CLAIM_REVIEWED', 'payment_claims', p_claim_id, v_claim.project_id,
    jsonb_build_object('decision', p_decision, 'approved_amount', p_approved_amount)
  );

  RETURN jsonb_build_object('success', true, 'claim_id', p_claim_id, 'status', p_decision);
END;
$$;

-- Ensure proper permissions on the updated RPCs
GRANT EXECUTE ON FUNCTION public.submit_payment_claim(UUID, NUMERIC, TEXT, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.review_payment_claim(UUID, TEXT, NUMERIC, NUMERIC, TEXT) TO authenticated, service_role;
