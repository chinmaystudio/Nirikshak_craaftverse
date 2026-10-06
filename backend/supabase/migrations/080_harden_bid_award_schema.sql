-- Normalize columns required by the bid-award workflow.
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS selected_bid_id UUID REFERENCES public.tender_bids(id);

-- Replace the award RPC's older project_organizations.relationship reference
-- with the current relationship_type column.
CREATE OR REPLACE FUNCTION public.award_contract(p_tender_id UUID, p_selected_bid_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_tender public.tenders%ROWTYPE;
  v_bid public.tender_bids%ROWTYPE;
  v_contract public.contracts%ROWTYPE;
  v_contract_num TEXT;
BEGIN
  IF v_user_id IS NULL OR NOT public.is_government_user() THEN
    RAISE EXCEPTION 'Unauthorized: Active government membership required';
  END IF;

  SELECT * INTO v_tender
  FROM public.tenders
  WHERE id = p_tender_id AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tender % not found', p_tender_id;
  END IF;

  IF NOT public.can_manage_project(v_tender.project_id) THEN
    RAISE EXCEPTION 'Unauthorized: Your government authority does not own project % for tender %', v_tender.project_id, p_tender_id;
  END IF;

  IF v_tender.status = 'AWARDED' THEN
    RAISE EXCEPTION 'Tender is already awarded';
  END IF;

  SELECT * INTO v_bid
  FROM public.tender_bids
  WHERE id = p_selected_bid_id
    AND tender_id = p_tender_id
    AND deleted_at IS NULL
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bid % does not belong to tender %', p_selected_bid_id, p_tender_id;
  END IF;

  IF v_bid.status NOT IN ('SUBMITTED', 'UNDER_EVALUATION') THEN
    RAISE EXCEPTION 'Only submitted bids can be awarded (current status: %)', v_bid.status;
  END IF;

  UPDATE public.tender_bids
  SET status = 'SELECTED', updated_at = now()
  WHERE id = p_selected_bid_id;

  UPDATE public.tender_bids
  SET status = 'REJECTED', updated_at = now()
  WHERE tender_id = p_tender_id
    AND id <> p_selected_bid_id
    AND status IN ('SUBMITTED', 'UNDER_EVALUATION', 'DRAFT');

  v_contract_num := 'CNT-' || COALESCE(NULLIF(v_tender.tender_number, ''), to_char(CURRENT_DATE, 'YYYY'))
    || '-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 8));

  INSERT INTO public.contracts (
    project_id, tender_id, selected_bid_id, contractor_organization_id,
    government_organization_id, official_contract_id, contract_number,
    contract_title, contract_value, award_date, scheduled_start_date,
    scheduled_completion_date, status, version
  ) VALUES (
    v_tender.project_id, p_tender_id, p_selected_bid_id, v_bid.contractor_organization_id,
    COALESCE(v_tender.government_organization_id, v_tender.issuing_organization_id),
    v_contract_num, v_contract_num, v_tender.title, v_bid.bid_amount,
    CURRENT_DATE, CURRENT_DATE + 14, CURRENT_DATE + INTERVAL '24 months', 'ACTIVE', 1
  )
  RETURNING * INTO v_contract;

  INSERT INTO public.project_organizations (
    project_id, organization_id, relationship_type, status, effective_from
  ) VALUES (
    v_tender.project_id, v_bid.contractor_organization_id, 'CONTRACTOR', 'ACTIVE', now()
  )
  ON CONFLICT DO NOTHING;

  UPDATE public.tenders
  SET status = 'AWARDED', updated_at = now()
  WHERE id = p_tender_id;

  UPDATE public.projects
  SET normalized_status = 'UNDER_CONSTRUCTION', updated_at = now()
  WHERE id = v_tender.project_id
    AND normalized_status IN ('PROPOSED', 'TENDERED', 'APPROVED');

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
  VALUES (
    v_user_id, 'AWARD_CONTRACT', 'contracts', v_contract.id,
    jsonb_build_object('tender_id', p_tender_id, 'bid_id', p_selected_bid_id,
      'contract_number', v_contract_num, 'contract_value', v_bid.bid_amount,
      'contractor_organization_id', v_bid.contractor_organization_id)
  );

  RETURN jsonb_build_object(
    'success', true, 'contract_id', v_contract.id,
    'contract_number', v_contract_num, 'tender_id', p_tender_id,
    'contractor_organization_id', v_bid.contractor_organization_id,
    'contract_value', v_bid.bid_amount
  );
END;
$$;

REVOKE ALL ON FUNCTION public.award_contract(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_contract(UUID, UUID) TO authenticated, service_role;
