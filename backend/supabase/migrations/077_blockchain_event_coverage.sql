-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 077_blockchain_event_coverage.sql
-- Domain: Comprehensive Blockchain Anchor Event Coverage
-- Purpose:
--   Implement transactional outbox enqueue triggers for high-value lifecycle events:
--   1. projects: PROJECT_CREATED, PROJECT_COMPLETED
--   2. tenders: TENDER_PUBLISHED
--   3. tender_bids: BID_SUBMITTED, BID_SELECTED
--   4. progress_updates: PROGRESS_SUBMITTED, PROGRESS_APPROVED
--   5. inspections: INSPECTION_COMPLETED
--   6. payment_claims: PAYMENT_CLAIM_SUBMITTED, PAYMENT_CLAIM_APPROVED
--   7. litigations: LITIGATION_CREATED
--   8. settlements: SETTLEMENT_APPROVED
--   9. ai_analysis_runs: AI_ANALYSIS_COMPLETED
--   10. ai_action_outcomes: AI_OUTCOME_RECORDED
--   11. project_documents: DOCUMENT_FINALIZED (strictly requiring sha256 checksum)
-- ==============================================================================

-- 1. Projects Triggers (PROJECT_CREATED, PROJECT_COMPLETED)
CREATE OR REPLACE FUNCTION public.trg_anchor_projects_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload JSONB;
  v_dedupe_key TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_payload := jsonb_build_object(
      'project_id', NEW.id,
      'project_name', NEW.project_name,
      'approved_cost_inr_crore', NEW.approved_cost_inr_crore,
      'status', COALESCE(NEW.normalized_status::text, NEW.reported_status, 'DRAFT'),
      'created_at', NEW.created_at
    );
    v_dedupe_key := 'PROJECT:' || NEW.id || ':CREATED';

    PERFORM public.enqueue_blockchain_anchor(
      NEW.id,
      'PROJECT',
      NEW.id,
      NEW.nirikshak_project_id,
      'PROJECT_CREATED',
      'PENDING_CANONICAL_HASH',
      v_payload,
      v_dedupe_key
    );

  ELSIF TG_OP = 'UPDATE' AND (NEW.normalized_status = 'COMPLETED' OR NEW.reported_status = 'COMPLETED')
         AND (OLD.normalized_status <> 'COMPLETED' AND OLD.reported_status <> 'COMPLETED') THEN
    v_payload := jsonb_build_object(
      'project_id', NEW.id,
      'project_name', NEW.project_name,
      'status', 'COMPLETED',
      'actual_completion_date', NEW.actual_completion_date,
      'amount_spent_inr_crore', NEW.amount_spent_inr_crore
    );
    v_dedupe_key := 'PROJECT:' || NEW.id || ':COMPLETED';

    PERFORM public.enqueue_blockchain_anchor(
      NEW.id,
      'PROJECT',
      NEW.id,
      NEW.nirikshak_project_id,
      'PROJECT_COMPLETED',
      'PENDING_CANONICAL_HASH',
      v_payload,
      v_dedupe_key
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_projects_blockchain_anchor ON public.projects;
CREATE TRIGGER trg_projects_blockchain_anchor
  AFTER INSERT OR UPDATE OF normalized_status, reported_status ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_anchor_projects_lifecycle();

-- 2. Tenders Trigger (TENDER_PUBLISHED)
CREATE OR REPLACE FUNCTION public.trg_anchor_tenders_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload JSONB;
  v_dedupe_key TEXT;
BEGIN
  IF (TG_OP = 'INSERT' AND NEW.status = 'PUBLISHED') OR
     (TG_OP = 'UPDATE' AND NEW.status = 'PUBLISHED' AND (OLD IS NULL OR OLD.status <> 'PUBLISHED')) THEN
    v_payload := jsonb_build_object(
      'tender_id', NEW.id,
      'project_id', NEW.project_id,
      'tender_number', NEW.tender_number,
      'title', NEW.title,
      'estimated_value_inr_crore', NEW.estimated_value_inr_crore,
      'status', NEW.status,
      'published_at', COALESCE(NEW.published_at, NEW.created_at)
    );
    v_dedupe_key := 'TENDER:' || NEW.id || ':PUBLISHED';

    PERFORM public.enqueue_blockchain_anchor(
      NEW.project_id,
      'TENDER',
      NEW.id,
      NEW.tender_number,
      'TENDER_PUBLISHED',
      'PENDING_CANONICAL_HASH',
      v_payload,
      v_dedupe_key
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tenders_blockchain_anchor ON public.tenders;
CREATE TRIGGER trg_tenders_blockchain_anchor
  AFTER INSERT OR UPDATE OF status ON public.tenders
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_anchor_tenders_lifecycle();

-- 3. Tender Bids Trigger (BID_SUBMITTED, BID_SELECTED)
CREATE OR REPLACE FUNCTION public.trg_anchor_tender_bids_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_project_id UUID;
  v_payload JSONB;
  v_dedupe_key TEXT;
BEGIN
  SELECT project_id INTO v_project_id FROM public.tenders WHERE id = NEW.tender_id;

  IF TG_OP = 'INSERT' THEN
    v_payload := jsonb_build_object(
      'bid_id', NEW.id,
      'tender_id', NEW.tender_id,
      'contractor_organization_id', NEW.contractor_organization_id,
      'bid_amount', NEW.bid_amount,
      'bid_reference', NEW.bid_reference,
      'status', NEW.status,
      'submitted_at', COALESCE(NEW.submitted_at, now())
    );
    v_dedupe_key := 'BID:' || NEW.id || ':SUBMITTED';

    IF v_project_id IS NOT NULL THEN
      PERFORM public.enqueue_blockchain_anchor(
        v_project_id,
        'BID',
        NEW.id,
        NEW.bid_reference,
        'BID_SUBMITTED',
        'PENDING_CANONICAL_HASH',
        v_payload,
        v_dedupe_key
      );
    END IF;

  ELSIF TG_OP = 'UPDATE' AND NEW.status IN ('SELECTED', 'ACCEPTED') AND (OLD IS NULL OR OLD.status NOT IN ('SELECTED', 'ACCEPTED')) THEN
    v_payload := jsonb_build_object(
      'bid_id', NEW.id,
      'tender_id', NEW.tender_id,
      'contractor_organization_id', NEW.contractor_organization_id,
      'bid_amount', NEW.bid_amount,
      'status', NEW.status
    );
    v_dedupe_key := 'BID:' || NEW.id || ':SELECTED';

    IF v_project_id IS NOT NULL THEN
      PERFORM public.enqueue_blockchain_anchor(
        v_project_id,
        'BID',
        NEW.id,
        NEW.bid_reference,
        'BID_SELECTED',
        'PENDING_CANONICAL_HASH',
        v_payload,
        v_dedupe_key
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_tender_bids_blockchain_anchor ON public.tender_bids;
CREATE TRIGGER trg_tender_bids_blockchain_anchor
  AFTER INSERT OR UPDATE OF status ON public.tender_bids
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_anchor_tender_bids_lifecycle();

-- 4. Progress Updates Trigger (PROGRESS_SUBMITTED, PROGRESS_APPROVED)
CREATE OR REPLACE FUNCTION public.trg_anchor_progress_updates_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload JSONB;
  v_dedupe_key TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_payload := jsonb_build_object(
      'progress_id', NEW.id,
      'project_id', NEW.project_id,
      'milestone_id', NEW.milestone_id,
      'contractor_organization_id', NEW.contractor_organization_id,
      'reported_progress', NEW.reported_progress,
      'verification_status', COALESCE(NEW.verification_status, 'PENDING'),
      'submitted_at', COALESCE(NEW.submitted_at, NEW.created_at, now())
    );
    v_dedupe_key := 'PROGRESS:' || NEW.id || ':SUBMITTED';

    PERFORM public.enqueue_blockchain_anchor(
      NEW.project_id,
      'PROGRESS_UPDATE',
      NEW.id,
      NEW.id::text,
      'PROGRESS_SUBMITTED',
      'PENDING_CANONICAL_HASH',
      v_payload,
      v_dedupe_key
    );

  ELSIF TG_OP = 'UPDATE' AND NEW.verification_status IN ('VERIFIED', 'APPROVED') AND (OLD IS NULL OR OLD.verification_status NOT IN ('VERIFIED', 'APPROVED')) THEN
    v_payload := jsonb_build_object(
      'progress_id', NEW.id,
      'project_id', NEW.project_id,
      'milestone_id', NEW.milestone_id,
      'contractor_organization_id', NEW.contractor_organization_id,
      'reported_progress', NEW.reported_progress,
      'verified_progress', NEW.verified_progress,
      'verification_status', NEW.verification_status,
      'reviewed_at', COALESCE(NEW.reviewed_at, now())
    );
    v_dedupe_key := 'PROGRESS:' || NEW.id || ':APPROVED';

    PERFORM public.enqueue_blockchain_anchor(
      NEW.project_id,
      'PROGRESS_UPDATE',
      NEW.id,
      NEW.id::text,
      'PROGRESS_APPROVED',
      'PENDING_CANONICAL_HASH',
      v_payload,
      v_dedupe_key
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_progress_updates_blockchain_anchor ON public.progress_updates;
CREATE TRIGGER trg_progress_updates_blockchain_anchor
  AFTER INSERT OR UPDATE OF verification_status ON public.progress_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_anchor_progress_updates_lifecycle();

-- 5. Inspections Trigger (INSPECTION_COMPLETED)
CREATE OR REPLACE FUNCTION public.trg_anchor_inspections_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload JSONB;
  v_dedupe_key TEXT;
BEGIN
  IF (NEW.status IN ('COMPLETED', 'VERIFIED', 'SUBMITTED') AND (OLD IS NULL OR OLD.status NOT IN ('COMPLETED', 'VERIFIED', 'SUBMITTED'))) THEN
    v_payload := jsonb_build_object(
      'inspection_id', NEW.id,
      'project_id', NEW.project_id,
      'milestone_id', NEW.milestone_id,
      'inspection_type', NEW.inspection_type,
      'inspection_date', NEW.inspection_date,
      'overall_result', NEW.overall_result,
      'status', NEW.status
    );
    v_dedupe_key := 'INSPECTION:' || NEW.id || ':COMPLETED';

    PERFORM public.enqueue_blockchain_anchor(
      NEW.project_id,
      'INSPECTION',
      NEW.id,
      NEW.id::text,
      'INSPECTION_COMPLETED',
      'PENDING_CANONICAL_HASH',
      v_payload,
      v_dedupe_key
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_inspections_blockchain_anchor ON public.inspections;
CREATE TRIGGER trg_inspections_blockchain_anchor
  AFTER INSERT OR UPDATE OF status ON public.inspections
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_anchor_inspections_lifecycle();

-- 6. Payment Claims Trigger (PAYMENT_CLAIM_SUBMITTED, PAYMENT_CLAIM_APPROVED)
CREATE OR REPLACE FUNCTION public.trg_anchor_payment_claims_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload JSONB;
  v_dedupe_key TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_payload := jsonb_build_object(
      'claim_id', NEW.id,
      'claim_number', NEW.claim_number,
      'project_id', NEW.project_id,
      'contract_id', NEW.contract_id,
      'claimed_amount', NEW.claimed_amount,
      'status', NEW.status,
      'submitted_at', NEW.submitted_at
    );
    v_dedupe_key := 'PAYMENT_CLAIM:' || NEW.id || ':SUBMITTED';

    PERFORM public.enqueue_blockchain_anchor(
      NEW.project_id,
      'PAYMENT_CLAIM',
      NEW.id,
      NEW.claim_number,
      'PAYMENT_CLAIM_SUBMITTED',
      'PENDING_CANONICAL_HASH',
      v_payload,
      v_dedupe_key
    );

  ELSIF TG_OP = 'UPDATE' AND NEW.status IN ('APPROVED', 'VERIFIED') AND (OLD IS NULL OR OLD.status NOT IN ('APPROVED', 'VERIFIED')) THEN
    v_payload := jsonb_build_object(
      'claim_id', NEW.id,
      'claim_number', NEW.claim_number,
      'project_id', NEW.project_id,
      'approved_amount', NEW.approved_amount,
      'status', NEW.status,
      'approved_at', COALESCE(NEW.approved_at, now())
    );
    v_dedupe_key := 'PAYMENT_CLAIM:' || NEW.id || ':APPROVED';

    PERFORM public.enqueue_blockchain_anchor(
      NEW.project_id,
      'PAYMENT_CLAIM',
      NEW.id,
      NEW.claim_number,
      'PAYMENT_CLAIM_APPROVED',
      'PENDING_CANONICAL_HASH',
      v_payload,
      v_dedupe_key
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_claims_blockchain_anchor ON public.payment_claims;
CREATE TRIGGER trg_payment_claims_blockchain_anchor
  AFTER INSERT OR UPDATE OF status ON public.payment_claims
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_anchor_payment_claims_lifecycle();

-- 7. Litigations Trigger (LITIGATION_CREATED)
CREATE OR REPLACE FUNCTION public.trg_anchor_litigations_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload JSONB;
  v_dedupe_key TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_payload := jsonb_build_object(
      'litigation_id', NEW.id,
      'project_id', NEW.project_id,
      'case_number', NEW.case_number,
      'case_title', NEW.case_title,
      'litigation_type', NEW.litigation_type,
      'claimed_amount', NEW.claimed_amount,
      'status', NEW.status,
      'filing_date', NEW.filing_date
    );
    v_dedupe_key := 'LITIGATION:' || NEW.id || ':CREATED';

    PERFORM public.enqueue_blockchain_anchor(
      NEW.project_id,
      'LITIGATION',
      NEW.id,
      NEW.case_number,
      'LITIGATION_CREATED',
      'PENDING_CANONICAL_HASH',
      v_payload,
      v_dedupe_key
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_litigations_blockchain_anchor ON public.litigations;
CREATE TRIGGER trg_litigations_blockchain_anchor
  AFTER INSERT ON public.litigations
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_anchor_litigations_lifecycle();

-- 8. Settlements Trigger (SETTLEMENT_APPROVED)
CREATE OR REPLACE FUNCTION public.trg_anchor_settlements_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload JSONB;
  v_dedupe_key TEXT;
BEGIN
  IF (NEW.status IN ('APPROVED', 'SETTLED', 'EXECUTED') AND (OLD IS NULL OR OLD.status NOT IN ('APPROVED', 'SETTLED', 'EXECUTED'))) THEN
    v_payload := jsonb_build_object(
      'settlement_id', NEW.id,
      'project_id', NEW.project_id,
      'litigation_id', NEW.litigation_id,
      'settlement_number', NEW.settlement_number,
      'approved_amount', NEW.approved_amount,
      'status', NEW.status,
      'approved_at', COALESCE(NEW.approved_at, now())
    );
    v_dedupe_key := 'SETTLEMENT:' || NEW.id || ':APPROVED';

    PERFORM public.enqueue_blockchain_anchor(
      NEW.project_id,
      'SETTLEMENT',
      NEW.id,
      NEW.settlement_number,
      'SETTLEMENT_APPROVED',
      'PENDING_CANONICAL_HASH',
      v_payload,
      v_dedupe_key
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_settlements_blockchain_anchor ON public.settlements;
CREATE TRIGGER trg_settlements_blockchain_anchor
  AFTER INSERT OR UPDATE OF status ON public.settlements
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_anchor_settlements_lifecycle();

-- 9. AI Analysis Runs Trigger (AI_ANALYSIS_COMPLETED)
CREATE OR REPLACE FUNCTION public.trg_anchor_ai_analysis_runs_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload JSONB;
  v_dedupe_key TEXT;
BEGIN
  IF (NEW.status = 'COMPLETED' AND (OLD IS NULL OR OLD.status <> 'COMPLETED')) THEN
    v_payload := jsonb_build_object(
      'analysis_run_id', NEW.id,
      'project_id', NEW.project_id,
      'analysis_id', NEW.analysis_id,
      'service_version', NEW.service_version,
      'status', NEW.status,
      'context_hash', NEW.context_hash,
      'rl_policy_version', NEW.rl_policy_version,
      'completed_at', COALESCE(NEW.completed_at, now())
    );
    v_dedupe_key := 'AI_ANALYSIS:' || NEW.id || ':COMPLETED';

    PERFORM public.enqueue_blockchain_anchor(
      NEW.project_id,
      'AI_ANALYSIS',
      NEW.id,
      NEW.analysis_id,
      'AI_ANALYSIS_COMPLETED',
      'PENDING_CANONICAL_HASH',
      v_payload,
      v_dedupe_key
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_analysis_runs_blockchain_anchor ON public.ai_analysis_runs;
CREATE TRIGGER trg_ai_analysis_runs_blockchain_anchor
  AFTER INSERT OR UPDATE OF status ON public.ai_analysis_runs
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_anchor_ai_analysis_runs_lifecycle();

-- 10. AI Action Outcomes Trigger (AI_OUTCOME_RECORDED)
CREATE OR REPLACE FUNCTION public.trg_anchor_ai_action_outcomes_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload JSONB;
  v_dedupe_key TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    v_payload := jsonb_build_object(
      'outcome_id', NEW.id,
      'project_id', NEW.project_id,
      'analysis_run_id', NEW.analysis_run_id,
      'action', NEW.action,
      'reward', NEW.reward,
      'verified_at', NEW.verified_at,
      'created_at', NEW.created_at
    );
    v_dedupe_key := 'AI_OUTCOME:' || NEW.id || ':RECORDED';

    PERFORM public.enqueue_blockchain_anchor(
      NEW.project_id,
      'AI_OUTCOME',
      NEW.id,
      NEW.id::text,
      'AI_OUTCOME_RECORDED',
      'PENDING_CANONICAL_HASH',
      v_payload,
      v_dedupe_key
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_ai_action_outcomes_blockchain_anchor ON public.ai_action_outcomes;
CREATE TRIGGER trg_ai_action_outcomes_blockchain_anchor
  AFTER INSERT ON public.ai_action_outcomes
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_anchor_ai_action_outcomes_lifecycle();

-- 11. Project Documents Trigger (DOCUMENT_FINALIZED with sha256 checksum)
CREATE OR REPLACE FUNCTION public.trg_anchor_project_documents_lifecycle()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload JSONB;
  v_dedupe_key TEXT;
BEGIN
  -- Strict requirement: only finalize if sha256 is present and valid
  IF NEW.sha256 IS NOT NULL AND length(trim(NEW.sha256)) = 64 THEN
    IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND (OLD.sha256 IS NULL OR OLD.sha256 <> NEW.sha256)) THEN
      v_payload := jsonb_build_object(
        'document_id', NEW.id,
        'project_id', NEW.project_id,
        'title', NEW.title,
        'document_type', NEW.document_type,
        'sha256', NEW.sha256,
        'storage_bucket', NEW.storage_bucket,
        'version_number', NEW.version_number,
        'created_at', NEW.created_at
      );
      v_dedupe_key := 'DOCUMENT:' || NEW.id || ':FINALIZED:' || NEW.sha256;

      PERFORM public.enqueue_blockchain_anchor(
        NEW.project_id,
        'DOCUMENT',
        NEW.id,
        NEW.title,
        'DOCUMENT_FINALIZED',
        'PENDING_CANONICAL_HASH',
        v_payload,
        v_dedupe_key
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_project_documents_blockchain_anchor ON public.project_documents;
CREATE TRIGGER trg_project_documents_blockchain_anchor
  AFTER INSERT OR UPDATE OF sha256 ON public.project_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_anchor_project_documents_lifecycle();
