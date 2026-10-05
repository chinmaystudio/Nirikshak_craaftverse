-- ==============================================================================
-- NIRIKSHAK MIGRATION 025: COMPLETE SECURITY & TENANT HARDENING
-- Hardens search_path on all SECURITY DEFINER functions, enforces government
-- organization ownership on contract awards, adds audit logging to bids,
-- supports CLARIFICATION_REQUIRED on progress reviews, and provisions secure storage.
-- ==============================================================================

-- 1. Helper Aliases & Security Functions (Rule 15)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role_enum
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT public.get_user_role();
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT public.get_user_organization_id();
$$;

CREATE OR REPLACE FUNCTION public.can_review_progress(p_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT public.can_manage_project(p_project_id);
$$;

-- 2. Enforce Safe search_path on all existing SECURITY DEFINER functions (Rule 16)
ALTER FUNCTION public.get_user_role() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_organization_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_government_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_contractor_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_citizen() SET search_path = public, pg_temp;
ALTER FUNCTION public.can_access_project(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.can_manage_project(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.set_project_gov_org() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.approve_government_access_request(uuid, app_role_enum) SET search_path = public, pg_temp;
ALTER FUNCTION public.approve_contractor_access_request(uuid, app_role_enum) SET search_path = public, pg_temp;
ALTER FUNCTION public.register_government_account(text, text, text, text, text, text, text, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.register_contractor_account(text, text, text, text, text, text, text, text, text, text, text) SET search_path = public, pg_temp;

-- 3. Hardened award_contract (Rules 24, 25)
CREATE OR REPLACE FUNCTION public.award_contract(p_tender_id uuid, p_selected_bid_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_user_id UUID := (SELECT auth.uid());
    v_tender public.tenders%ROWTYPE;
    v_bid public.tender_bids%ROWTYPE;
    v_contract public.contracts%ROWTYPE;
    v_contract_num TEXT;
    v_duration_months INTEGER := 24;
BEGIN
    -- Validate caller is authenticated government official
    IF v_user_id IS NULL OR NOT public.is_government_user() THEN
        RAISE EXCEPTION 'Unauthorized: Active government membership required';
    END IF;

    -- Lock and validate tender
    SELECT * INTO v_tender FROM public.tenders
    WHERE id = p_tender_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tender % not found', p_tender_id;
    END IF;

    -- Rule 24: Verify Government organization owns tender/project
    IF NOT public.can_manage_project(v_tender.project_id) THEN
        RAISE EXCEPTION 'Unauthorized: Your government authority does not own project % for tender %', v_tender.project_id, p_tender_id;
    END IF;

    IF v_tender.status = 'AWARDED' THEN
        RAISE EXCEPTION 'Tender is already awarded';
    END IF;

    -- Lock and validate selected bid
    SELECT * INTO v_bid FROM public.tender_bids
    WHERE id = p_selected_bid_id AND tender_id = p_tender_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bid % does not belong to tender %', p_selected_bid_id, p_tender_id;
    END IF;

    IF v_bid.status NOT IN ('SUBMITTED', 'UNDER_EVALUATION') THEN
        RAISE EXCEPTION 'Only submitted bids can be awarded (current status: %)', v_bid.status;
    END IF;

    -- Mark selected bid as SELECTED
    UPDATE public.tender_bids
    SET status = 'SELECTED', updated_at = now()
    WHERE id = p_selected_bid_id;

    -- Mark all other submitted bids for this tender as REJECTED
    UPDATE public.tender_bids
    SET status = 'REJECTED', updated_at = now()
    WHERE tender_id = p_tender_id AND id <> p_selected_bid_id AND status IN ('SUBMITTED', 'UNDER_EVALUATION', 'DRAFT');

    -- Mark tender as AWARDED
    UPDATE public.tenders
    SET status = 'AWARDED', updated_at = now()
    WHERE id = p_tender_id;

    -- Generate official contract number
    v_contract_num := 'CNT-' || COALESCE(NULLIF(v_tender.tender_number, ''), to_char(CURRENT_DATE, 'YYYY')) || '-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 8));

    -- Create official contract
    INSERT INTO public.contracts (
        project_id,
        tender_id,
        contractor_organization_id,
        official_contract_id,
        contract_number,
        contract_title,
        contract_value,
        award_date,
        scheduled_start_date,
        scheduled_completion_date,
        status,
        version
    ) VALUES (
        v_tender.project_id,
        p_tender_id,
        v_bid.contractor_organization_id,
        v_contract_num,
        v_contract_num,
        v_tender.title,
        v_bid.bid_amount,
        CURRENT_DATE,
        CURRENT_DATE + interval '14 days',
        CURRENT_DATE + (v_duration_months || ' months')::interval,
        'ACTIVE',
        1
    )
    RETURNING * INTO v_contract;

    -- Create or update project_organizations assignment
    INSERT INTO public.project_organizations (
        project_id,
        organization_id,
        relationship,
        valid_from
    ) VALUES (
        v_tender.project_id,
        v_bid.contractor_organization_id,
        'primary_contractor',
        CURRENT_DATE
    )
    ON CONFLICT DO NOTHING;

    -- Update project status to active execution
    UPDATE public.projects
    SET normalized_status = 'IN_PROGRESS', updated_at = now()
    WHERE id = v_tender.project_id AND normalized_status IN ('PROPOSED', 'TENDERED', 'APPROVED');

    -- Insert audit trail
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (
        v_user_id,
        'AWARD_CONTRACT',
        'contracts',
        v_contract.id,
        jsonb_build_object(
            'tender_id', p_tender_id,
            'bid_id', p_selected_bid_id,
            'contract_number', v_contract_num,
            'contract_value', v_bid.bid_amount,
            'contractor_organization_id', v_bid.contractor_organization_id
        )
    );

    -- Notify winning contractor
    INSERT INTO public.notifications (
        organization_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        v_bid.contractor_organization_id,
        'CONTRACT_AWARDED',
        'Contract Awarded: ' || v_tender.title,
        'Your bid has been selected and contract ' || v_contract_num || ' has been awarded.',
        'contracts',
        v_contract.id,
        jsonb_build_object(
            'tender_id', p_tender_id,
            'contract_id', v_contract.id,
            'project_id', v_tender.project_id,
            'value', v_bid.bid_amount
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'contract_id', v_contract.id,
        'contract_number', v_contract_num,
        'tender_id', p_tender_id,
        'contractor_organization_id', v_bid.contractor_organization_id,
        'contract_value', v_bid.bid_amount
    );
END;
$function$;

-- 4. Hardened save_tender_bid (Rules 21, 22, 23)
CREATE OR REPLACE FUNCTION public.save_tender_bid(p_tender_id uuid, p_bid_amount numeric, p_technical_proposal text, p_status text DEFAULT 'DRAFT'::text)
RETURNS tender_bids
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_user_id UUID := (SELECT auth.uid());
    v_org_id UUID;
    v_tender public.tenders%ROWTYPE;
    v_bid public.tender_bids%ROWTYPE;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
    IF p_status NOT IN ('DRAFT', 'SUBMITTED') THEN RAISE EXCEPTION 'Invalid bid status'; END IF;
    IF p_bid_amount IS NULL OR p_bid_amount <= 0 THEN RAISE EXCEPTION 'Bid amount must be positive'; END IF;

    SELECT om.organization_id INTO v_org_id
    FROM public.organization_members om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.user_id = v_user_id
      AND lower(om.status) = 'active'
      AND (o.type = 'contractor' OR om.role IN ('contractor_admin', 'contractor_manager', 'contractor_site_engineer'))
    LIMIT 1;
    IF v_org_id IS NULL THEN RAISE EXCEPTION 'Active contractor membership required'; END IF;

    SELECT * INTO v_tender FROM public.tenders
    WHERE id = p_tender_id AND deleted_at IS NULL FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Tender not found'; END IF;
    IF v_tender.status <> 'PUBLISHED' OR (v_tender.bid_due_date IS NOT NULL AND v_tender.bid_due_date < CURRENT_DATE) THEN
        RAISE EXCEPTION 'Tender is not open for bids';
    END IF;

    INSERT INTO public.tender_bids (
        tender_id, contractor_organization_id, bid_reference, bid_amount,
        technical_proposal, status, submitted_by, submitted_at
    ) VALUES (
        p_tender_id, v_org_id,
        'NIR-BID-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 12)),
        p_bid_amount, nullif(btrim(p_technical_proposal), ''), p_status, v_user_id,
        CASE WHEN p_status = 'SUBMITTED' THEN now() ELSE NULL END
    )
    ON CONFLICT (tender_id, contractor_organization_id) WHERE deleted_at IS NULL
    DO UPDATE SET
        bid_amount = EXCLUDED.bid_amount,
        technical_proposal = EXCLUDED.technical_proposal,
        status = EXCLUDED.status,
        submitted_by = v_user_id,
        submitted_at = CASE WHEN EXCLUDED.status = 'SUBMITTED' THEN now() ELSE public.tender_bids.submitted_at END,
        updated_at = now()
    WHERE public.tender_bids.status = 'DRAFT'
    RETURNING * INTO v_bid;

    IF v_bid.id IS NULL THEN RAISE EXCEPTION 'Only draft bids can be changed'; END IF;

    -- Audit trail for bid submission / update (Rule 23)
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (
        v_user_id,
        CASE WHEN p_status = 'SUBMITTED' THEN 'BID_SUBMISSION' ELSE 'BID_SAVE_DRAFT' END,
        'tender_bids',
        v_bid.id,
        jsonb_build_object(
            'tender_id', p_tender_id,
            'bid_reference', v_bid.bid_reference,
            'contractor_org_id', v_org_id,
            'amount', p_bid_amount,
            'status', p_status
        )
    );

    RETURN v_bid;
END;
$function$;

-- 5. Hardened submit_progress_update (Rules 26, 27)
CREATE OR REPLACE FUNCTION public.submit_progress_update(p_project_id uuid, p_reported_progress numeric, p_description text, p_milestone_id uuid DEFAULT NULL::uuid)
RETURNS progress_updates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_user_id UUID := (SELECT auth.uid());
    v_org_id UUID;
    v_update public.progress_updates%ROWTYPE;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Validate reported progress percentage
    IF p_reported_progress IS NULL OR p_reported_progress < 0 OR p_reported_progress > 100 THEN
        RAISE EXCEPTION 'Reported progress must be between 0 and 100 percent';
    END IF;

    -- Get active contractor organization ID for caller
    SELECT om.organization_id INTO v_org_id
    FROM public.organization_members om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.user_id = v_user_id
      AND lower(om.status) = 'active'
      AND (o.type = 'contractor' OR om.role IN ('contractor_admin', 'contractor_manager', 'contractor_site_engineer'))
    LIMIT 1;

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Active contractor organization membership required';
    END IF;

    -- Verify contractor is assigned to this project
    IF NOT EXISTS (
        SELECT 1 FROM public.contracts
        WHERE project_id = p_project_id AND contractor_organization_id = v_org_id AND status = 'ACTIVE'
    ) AND NOT EXISTS (
        SELECT 1 FROM public.project_organizations
        WHERE project_id = p_project_id AND organization_id = v_org_id
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Contractor organization % is not assigned to project %', v_org_id, p_project_id;
    END IF;

    -- Verify milestone if provided
    IF p_milestone_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.project_milestones
            WHERE id = p_milestone_id AND project_id = p_project_id AND deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'Milestone % does not belong to project %', p_milestone_id, p_project_id;
        END IF;
    END IF;

    -- Insert progress update with SUBMITTED verification status
    INSERT INTO public.progress_updates (
        project_id,
        contractor_organization_id,
        milestone_id,
        reported_progress,
        description,
        submitted_by,
        submitted_at,
        verification_status
    ) VALUES (
        p_project_id,
        v_org_id,
        p_milestone_id,
        p_reported_progress,
        p_description,
        v_user_id,
        now(),
        'SUBMITTED'
    )
    RETURNING * INTO v_update;

    -- Insert audit log
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (
        v_user_id,
        'PROGRESS_SUBMISSION',
        'progress_updates',
        v_update.id,
        jsonb_build_object(
            'project_id', p_project_id,
            'reported_progress', p_reported_progress,
            'milestone_id', p_milestone_id
        )
    );

    -- Notify government reviewers
    INSERT INTO public.notifications (
        type,
        title,
        message,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        'PROGRESS_SUBMITTED',
        'New Progress Update Submitted',
        'Contractor submitted ' || p_reported_progress || '% progress claim for project audit review.',
        'progress_updates',
        v_update.id,
        jsonb_build_object('project_id', p_project_id, 'update_id', v_update.id)
    );

    RETURN v_update;
END;
$function$;

-- 6. Hardened approve_progress_update (Rules 28, 29)
CREATE OR REPLACE FUNCTION public.approve_progress_update(p_update_id uuid, p_decision text, p_verified_progress numeric DEFAULT NULL::numeric, p_review_notes text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_reviewer_id UUID := (SELECT auth.uid());
    v_update public.progress_updates%ROWTYPE;
    v_verified_progress NUMERIC;
    v_new_project_progress NUMERIC;
BEGIN
    IF v_reviewer_id IS NULL OR NOT public.is_government_user() THEN
        RAISE EXCEPTION 'Unauthorized: active government membership required';
    END IF;
    IF p_decision NOT IN ('APPROVED', 'REJECTED', 'CLARIFICATION_REQUIRED') THEN
        RAISE EXCEPTION 'Invalid review decision: must be APPROVED, REJECTED, or CLARIFICATION_REQUIRED';
    END IF;

    SELECT * INTO v_update FROM public.progress_updates WHERE id = p_update_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Progress update not found'; END IF;
    IF v_update.verification_status NOT IN ('SUBMITTED', 'CLARIFICATION_REQUIRED') THEN
        RAISE EXCEPTION 'Progress update has already reached terminal verification state';
    END IF;

    -- Verify government reviewer has authority over this project
    IF NOT public.can_manage_project(v_update.project_id) THEN
        RAISE EXCEPTION 'Unauthorized: Your government authority does not manage this project';
    END IF;

    v_verified_progress := CASE WHEN p_decision = 'APPROVED'
        THEN COALESCE(p_verified_progress, v_update.reported_progress)
        ELSE NULL END;

    IF v_verified_progress IS NOT NULL AND (v_verified_progress < 0 OR v_verified_progress > 100) THEN
        RAISE EXCEPTION 'Verified progress must be between 0 and 100';
    END IF;

    UPDATE public.progress_updates SET
        verification_status = p_decision,
        verified_progress = v_verified_progress,
        reviewed_by = v_reviewer_id,
        reviewed_at = now(),
        review_notes = p_review_notes,
        updated_at = now()
    WHERE id = p_update_id;

    -- Critical Invariant (Rule 29): Only APPROVED updates modify official physical_progress_percent
    IF p_decision = 'APPROVED' AND v_update.milestone_id IS NOT NULL THEN
        UPDATE public.project_milestones SET
            verified_progress = v_verified_progress,
            status = CASE WHEN v_verified_progress >= 100 THEN 'COMPLETED' ELSE 'IN_PROGRESS' END,
            actual_end_date = CASE WHEN v_verified_progress >= 100 THEN CURRENT_DATE ELSE actual_end_date END,
            updated_at = now()
        WHERE id = v_update.milestone_id;

        SELECT AVG(verified_progress) INTO v_new_project_progress FROM public.project_milestones
        WHERE project_id = v_update.project_id AND deleted_at IS NULL AND verified_progress IS NOT NULL;

        UPDATE public.projects SET
            physical_progress_percent = round(v_new_project_progress, 2),
            current_status_verified = (v_new_project_progress IS NOT NULL),
            updated_at = now()
        WHERE id = v_update.project_id;
    END IF;

    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (
        v_reviewer_id,
        'PROGRESS_REVIEW',
        'progress_updates',
        p_update_id,
        jsonb_build_object('decision', p_decision, 'verified_progress', v_verified_progress, 'notes', p_review_notes)
    );

    -- Notify contractor organization
    INSERT INTO public.notifications (
        organization_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        v_update.contractor_organization_id,
        'PROGRESS_REVIEWED',
        'Progress Update ' || p_decision,
        'Government authority recorded decision: ' || p_decision || COALESCE(' (Verified: ' || v_verified_progress || '%)', ''),
        'progress_updates',
        p_update_id,
        jsonb_build_object('decision', p_decision, 'verified_progress', v_verified_progress, 'project_id', v_update.project_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'progress_update_id', p_update_id,
        'decision', p_decision,
        'verified_progress', v_verified_progress,
        'reviewed_by', v_reviewer_id
    );
END;
$function$;

-- 7. Provision Storage Buckets (Rules 41-44)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('progress-evidence', 'progress-evidence', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('contractor-documents', 'contractor-documents', false, 20971520, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('government-documents', 'government-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('complaint-evidence', 'complaint-evidence', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),
  ('public-documents', 'public-documents', true, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;
