-- 021_procurement_progress_ai.sql
-- Implements atomic contract award RPC, secure contractor progress update submission RPC,
-- AI job queue table, ai_insights audience extensions, and Realtime publications.

-- 1. AI Jobs Table for Async Nemotron Processing
CREATE TABLE IF NOT EXISTS public.ai_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    source_entity_type TEXT NOT NULL,
    source_entity_id UUID NOT NULL,
    task_type TEXT NOT NULL DEFAULT 'RISK_ASSESSMENT',
    status TEXT NOT NULL DEFAULT 'QUEUED',
    priority INTEGER NOT NULL DEFAULT 1,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    input_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error TEXT
);

-- AI Insights Audience & Risk extensions
ALTER TABLE public.ai_insights
    ADD COLUMN IF NOT EXISTS progress_update_id UUID REFERENCES public.progress_updates(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS risk_score NUMERIC,
    ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'MEDIUM',
    ADD COLUMN IF NOT EXISTS audience TEXT DEFAULT 'GOVERNMENT',
    ADD COLUMN IF NOT EXISTS government_status TEXT DEFAULT 'PENDING_REVIEW',
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- RLS for ai_jobs
ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Government and service can view ai_jobs" ON public.ai_jobs;
CREATE POLICY "Government and service can view ai_jobs" ON public.ai_jobs
    FOR SELECT TO authenticated
    USING (public.is_government_user());

DROP FUNCTION IF EXISTS public.award_contract(UUID, UUID);
DROP FUNCTION IF EXISTS public.submit_progress_update(UUID, NUMERIC, TEXT, UUID);

-- 2. Atomic Contract Award RPC
CREATE OR REPLACE FUNCTION public.award_contract(
    p_tender_id UUID,
    p_selected_bid_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := (SELECT auth.uid());
    v_tender public.tenders%ROWTYPE;
    v_bid public.tender_bids%ROWTYPE;
    v_contract public.contracts%ROWTYPE;
    v_contract_num TEXT;
    v_duration_months INTEGER;
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
    v_duration_months := 24;

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

    -- Notify the winning contractor
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
$$;
REVOKE ALL ON FUNCTION public.award_contract(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_contract(UUID, UUID) TO authenticated;

-- 3. Secure Progress Update Submission RPC
CREATE OR REPLACE FUNCTION public.submit_progress_update(
    p_project_id UUID,
    p_reported_progress NUMERIC,
    p_description TEXT,
    p_milestone_id UUID DEFAULT NULL
)
RETURNS public.progress_updates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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

    -- Queue automated asynchronous AI risk analysis
    INSERT INTO public.ai_jobs (
        project_id,
        source_entity_type,
        source_entity_id,
        task_type,
        status,
        priority
    ) VALUES (
        p_project_id,
        'progress_updates',
        v_update.id,
        'PROGRESS_RISK_AUDIT',
        'QUEUED',
        1
    );

    RETURN v_update;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_progress_update(UUID, NUMERIC, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_progress_update(UUID, NUMERIC, TEXT, UUID) TO authenticated;

-- 4. Publication Realtime Additions
DO $$
DECLARE v_table TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        EXECUTE 'CREATE PUBLICATION supabase_realtime';
    END IF;
    FOREACH v_table IN ARRAY ARRAY[
        'ai_jobs', 'ai_insights', 'contracts', 'complaints', 'complaint_updates', 'audit_logs'
    ] LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = v_table
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', v_table);
        END IF;
    END LOOP;
END $$;
