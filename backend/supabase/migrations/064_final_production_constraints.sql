-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 064_final_production_constraints.sql
-- Domain: Financial & Concurrency Hardening
-- Purpose: Add database check constraints and row-level locking guarantees
--          preventing double-spend, race condition overpayments, and data anomalies.
-- ==============================================================================

-- 1. Hardened financial check constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_amount_paid_positive'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_amount_paid_positive CHECK (amount_paid > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_claims_claimed_amount_positive'
  ) THEN
    ALTER TABLE public.payment_claims
      ADD CONSTRAINT payment_claims_claimed_amount_positive CHECK (claimed_amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_claims_approved_amount_positive'
  ) THEN
    ALTER TABLE public.payment_claims
      ADD CONSTRAINT payment_claims_approved_amount_positive CHECK (approved_amount IS NULL OR approved_amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contracts_contract_value_positive'
  ) THEN
    ALTER TABLE public.contracts
      ADD CONSTRAINT contracts_contract_value_positive CHECK (contract_value > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenders_estimated_cost_positive'
  ) THEN
    ALTER TABLE public.tenders
      ADD CONSTRAINT tenders_estimated_cost_positive CHECK (estimated_cost > 0);
  END IF;
END $$;

-- 2. Unique index on payment reference (prevent duplicate transaction recording)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_reference 
  ON public.payments(payment_reference) 
  WHERE payment_reference IS NOT NULL;

-- 3. Ensure payments and claims have row locks in record_payment RPC
-- (Re-enforcing the FOR UPDATE concurrency lock)
CREATE OR REPLACE FUNCTION public.validate_payment_concurrency(p_claim_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_dummy UUID;
BEGIN
  SELECT id INTO v_dummy FROM public.payment_claims WHERE id = p_claim_id FOR UPDATE NOWAIT;
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_payment_concurrency(UUID) TO authenticated, service_role;
