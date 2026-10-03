-- ============================================================================
-- Migration: 049_finance_integrity_v2.sql
-- Description: Financial Disbursement Security, Overpayment Protection & Partial Payment Flow
-- ============================================================================

-- 1. Add PARTIALLY_PAID to payment_claims status check
ALTER TABLE public.payment_claims
  DROP CONSTRAINT IF EXISTS payment_claims_status_check;

ALTER TABLE public.payment_claims
  ADD CONSTRAINT payment_claims_status_check
  CHECK (status = ANY (ARRAY['DRAFT'::text, 'SUBMITTED'::text, 'UNDER_REVIEW'::text, 'CLARIFICATION_REQUIRED'::text, 'VERIFIED'::text, 'APPROVED'::text, 'PARTIALLY_PAID'::text, 'PAID'::text, 'REJECTED'::text]));

-- 2. Fully Hardened record_payment RPC Procedure
CREATE OR REPLACE FUNCTION public.record_payment(
  p_claim_id UUID,
  p_amount_paid NUMERIC,
  p_payment_reference TEXT,
  p_payment_method TEXT DEFAULT 'PFMS_RTGS'
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_claim RECORD;
  v_already_paid NUMERIC;
  v_remaining NUMERIC;
  v_new_status TEXT;
  v_payment public.payments;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL OR NOT public.is_government_user() THEN
    RAISE EXCEPTION 'Only authorized government officials can record disbursements.';
  END IF;

  v_org_id := public.get_current_user_organization_id();

  -- Lock claim for update to prevent concurrent race conditions
  SELECT * INTO v_claim FROM public.payment_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment claim not found.';
  END IF;

  -- Phase 11: Government Org cross-tenant security check
  IF NOT public.can_manage_project(v_claim.project_id) THEN
    RAISE EXCEPTION 'Unauthorized: Your government authority does not manage project %', v_claim.project_id;
  END IF;

  -- Verify claim is eligible for payment
  IF v_claim.status NOT IN ('APPROVED', 'PARTIALLY_PAID') THEN
    RAISE EXCEPTION 'Payments can only be recorded against approved or partially paid claims (current status: %).', v_claim.status;
  END IF;

  IF p_amount_paid <= 0 THEN
    RAISE EXCEPTION 'Amount paid must be greater than zero.';
  END IF;

  -- Phase 12: Payment Amount Integrity & Overpayment Protection
  SELECT COALESCE(SUM(amount_paid), 0) INTO v_already_paid
  FROM public.payments
  WHERE payment_claim_id = p_claim_id;

  v_remaining := v_claim.approved_amount - v_already_paid;

  IF p_amount_paid > v_remaining THEN
    RAISE EXCEPTION 'Payment amount (%) exceeds remaining approved balance (%) for claim %.',
      p_amount_paid, v_remaining, v_claim.claim_number;
  END IF;

  -- Insert payment record
  INSERT INTO public.payments (
    payment_claim_id,
    project_id,
    contractor_organization_id,
    amount_paid,
    payment_reference,
    payment_date,
    payment_method,
    recorded_by
  ) VALUES (
    p_claim_id,
    v_claim.project_id,
    v_claim.contractor_organization_id,
    p_amount_paid,
    p_payment_reference,
    CURRENT_DATE,
    p_payment_method,
    v_user_id
  )
  RETURNING * INTO v_payment;

  -- Phase 13: Determine whether claim is fully paid or partially paid
  IF (v_already_paid + p_amount_paid) >= v_claim.approved_amount THEN
    v_new_status := 'PAID';
  ELSE
    v_new_status := 'PARTIALLY_PAID';
  END IF;

  UPDATE public.payment_claims
  SET status = v_new_status, updated_at = now()
  WHERE id = p_claim_id;

  -- Audit log entry
  INSERT INTO public.audit_logs (
    actor_id, actor_organization_id, action, entity_type, entity_id, project_id, new_value
  ) VALUES (
    v_user_id, v_org_id, 'PAYMENT_RECORDED', 'payments', v_payment.id, v_claim.project_id,
    jsonb_build_object(
      'payment_reference', p_payment_reference,
      'amount_paid', p_amount_paid,
      'already_paid_prior', v_already_paid,
      'claim_status', v_new_status
    )
  );

  RETURN v_payment;
END;
$$;
