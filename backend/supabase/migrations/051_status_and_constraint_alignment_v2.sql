-- ============================================================================
-- Migration: 051_status_and_constraint_alignment_v2.sql
-- Description: Status Transition Safety Guards & Unique Consistency Constraints
-- ============================================================================

-- 1. Status Transition Safety Guards Trigger
CREATE OR REPLACE FUNCTION public.validate_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Payment claims: irreversible from PAID
    IF TG_TABLE_NAME = 'payment_claims' THEN
        IF OLD.status = 'PAID' AND NEW.status <> 'PAID' THEN
            RAISE EXCEPTION 'Illegal status transition: Claim % is already fully paid.', OLD.claim_number;
        END IF;
        IF OLD.status = 'PARTIALLY_PAID' AND NEW.status IN ('DRAFT', 'SUBMITTED') THEN
            RAISE EXCEPTION 'Illegal status transition: Partially paid claim % cannot revert to %.', OLD.claim_number, NEW.status;
        END IF;
    END IF;

    -- Tenders: cannot revert from AWARDED
    IF TG_TABLE_NAME = 'tenders' THEN
        IF OLD.status = 'AWARDED' AND NEW.status IN ('DRAFT', 'PUBLISHED', 'UNDER_EVALUATION') THEN
            RAISE EXCEPTION 'Illegal status transition: Awarded tender % cannot revert to %.', OLD.tender_number, NEW.status;
        END IF;
    END IF;

    -- Progress Updates: cannot revert from APPROVED
    IF TG_TABLE_NAME = 'progress_updates' THEN
        IF OLD.verification_status = 'APPROVED' AND NEW.verification_status IN ('SUBMITTED', 'UNDER_REVIEW') THEN
            RAISE EXCEPTION 'Illegal status transition: Approved progress update % cannot revert to %.', OLD.id, NEW.verification_status;
        END IF;
    END IF;

    -- Settlements: cannot revert from EXECUTED
    IF TG_TABLE_NAME = 'settlements' THEN
        IF OLD.status = 'EXECUTED' AND NEW.status <> 'EXECUTED' THEN
            RAISE EXCEPTION 'Illegal status transition: Executed settlement cannot revert.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_payment_claims_status') THEN
        CREATE TRIGGER trg_validate_payment_claims_status
            BEFORE UPDATE OF status ON public.payment_claims
            FOR EACH ROW EXECUTE FUNCTION public.validate_status_transition();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_tenders_status') THEN
        CREATE TRIGGER trg_validate_tenders_status
            BEFORE UPDATE OF status ON public.tenders
            FOR EACH ROW EXECUTE FUNCTION public.validate_status_transition();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_progress_status') THEN
        CREATE TRIGGER trg_validate_progress_status
            BEFORE UPDATE OF verification_status ON public.progress_updates
            FOR EACH ROW EXECUTE FUNCTION public.validate_status_transition();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_settlements_status') THEN
        CREATE TRIGGER trg_validate_settlements_status
            BEFORE UPDATE OF status ON public.settlements
            FOR EACH ROW EXECUTE FUNCTION public.validate_status_transition();
    END IF;
END $$;

-- 2. Backfill sequence_number from display_order if different
UPDATE public.project_milestones 
SET sequence_number = display_order 
WHERE display_order IS NOT NULL AND sequence_number <> display_order;

-- 3. Unique Consistency Constraints & Indices
CREATE UNIQUE INDEX IF NOT EXISTS uq_contracts_active_tender 
    ON public.contracts (tender_id) 
    WHERE (status = 'ACTIVE' AND tender_id IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tender_bids_selected 
    ON public.tender_bids (tender_id) 
    WHERE (status = 'SELECTED');

CREATE UNIQUE INDEX IF NOT EXISTS uq_project_milestones_sequence 
    ON public.project_milestones (project_id, sequence_number) 
    WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_reference 
    ON public.payments (payment_reference) 
    WHERE (payment_reference IS NOT NULL);
