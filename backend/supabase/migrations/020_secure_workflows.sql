-- Secure access requests, progress reviews, tender bids, and Realtime setup.

ALTER TABLE public.government_access_requests
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.contractor_access_requests
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS government_access_requests_user_uidx
    ON public.government_access_requests (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS contractor_access_requests_user_uidx
    ON public.contractor_access_requests (user_id);

-- Auth creation and onboarding request creation succeed or fail as one transaction,
-- including when email confirmation means the browser has no session yet.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, avatar_url, city, state)
    VALUES (
        new.id,
        COALESCE(NULLIF(new.raw_user_meta_data->>'full_name', ''), new.email, 'Unknown'),
        NULLIF(new.raw_user_meta_data->>'phone', ''),
        NULLIF(new.raw_user_meta_data->>'avatar_url', ''),
        NULLIF(new.raw_user_meta_data->>'district', ''),
        NULLIF(new.raw_user_meta_data->>'state', '')
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name, phone = EXCLUDED.phone,
        city = EXCLUDED.city, state = EXCLUDED.state, updated_at = now();

    IF new.raw_user_meta_data->>'requested_role' = 'government_engineer' THEN
        INSERT INTO public.government_access_requests (
            user_id, employee_id, department, designation, official_email, state, district
        ) VALUES (
            new.id, new.raw_user_meta_data->>'employee_id', new.raw_user_meta_data->>'department',
            new.raw_user_meta_data->>'designation', new.email,
            new.raw_user_meta_data->>'state', new.raw_user_meta_data->>'district'
        ) ON CONFLICT (user_id) DO NOTHING;
    ELSIF new.raw_user_meta_data->>'requested_role' = 'contractor_admin' THEN
        INSERT INTO public.contractor_access_requests (
            user_id, company_name, registration_cin, gstin, contractor_class, state, district, phone
        ) VALUES (
            new.id, new.raw_user_meta_data->>'company_name', new.raw_user_meta_data->>'registration_cin',
            new.raw_user_meta_data->>'gstin', new.raw_user_meta_data->>'contractor_class',
            new.raw_user_meta_data->>'state', new.raw_user_meta_data->>'district',
            new.raw_user_meta_data->>'phone'
        ) ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN new;
END;
$$;

REVOKE ALL ON public.government_access_requests FROM anon, authenticated;
REVOKE ALL ON public.contractor_access_requests FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.government_access_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.contractor_access_requests TO authenticated;

DROP POLICY IF EXISTS "Users create own government access request" ON public.government_access_requests;
CREATE POLICY "Users create own government access request"
ON public.government_access_requests FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id AND status = 'PENDING' AND reviewed_by IS NULL AND reviewed_at IS NULL);

DROP POLICY IF EXISTS "Users view own government access request" ON public.government_access_requests;
CREATE POLICY "Users view own government access request"
ON public.government_access_requests FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id OR public.is_government_user());

DROP POLICY IF EXISTS "Government reviews government access requests" ON public.government_access_requests;
CREATE POLICY "Government reviews government access requests"
ON public.government_access_requests FOR UPDATE TO authenticated
USING (public.is_government_user())
WITH CHECK (public.is_government_user());

DROP POLICY IF EXISTS "Users create own contractor access request" ON public.contractor_access_requests;
CREATE POLICY "Users create own contractor access request"
ON public.contractor_access_requests FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id AND status = 'PENDING' AND reviewed_by IS NULL AND reviewed_at IS NULL);

DROP POLICY IF EXISTS "Users view own contractor access request" ON public.contractor_access_requests;
CREATE POLICY "Users view own contractor access request"
ON public.contractor_access_requests FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id OR public.is_government_user());

DROP POLICY IF EXISTS "Government reviews contractor access requests" ON public.contractor_access_requests;
CREATE POLICY "Government reviews contractor access requests"
ON public.contractor_access_requests FOR UPDATE TO authenticated
USING (public.is_government_user())
WITH CHECK (public.is_government_user());

CREATE UNIQUE INDEX IF NOT EXISTS tender_bids_reference_uidx
    ON public.tender_bids (bid_reference) WHERE bid_reference IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tender_bids_active_tender_org_uidx
    ON public.tender_bids (tender_id, contractor_organization_id) WHERE deleted_at IS NULL;

DROP POLICY IF EXISTS "Contractor update own bid" ON public.tender_bids;
CREATE POLICY "Contractor update own bid" ON public.tender_bids FOR UPDATE TO authenticated
USING (contractor_organization_id = public.get_user_organization_id() AND status = 'DRAFT')
WITH CHECK (contractor_organization_id = public.get_user_organization_id());

CREATE OR REPLACE FUNCTION public.save_tender_bid(
    p_tender_id UUID,
    p_bid_amount NUMERIC,
    p_technical_proposal TEXT,
    p_status TEXT DEFAULT 'DRAFT'
)
RETURNS public.tender_bids
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
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
    RETURN v_bid;
END;
$$;
REVOKE ALL ON FUNCTION public.save_tender_bid(UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_tender_bid(UUID, NUMERIC, TEXT, TEXT) TO authenticated;

DROP FUNCTION IF EXISTS public.approve_progress_update(UUID, TEXT, NUMERIC, TEXT, UUID);
CREATE OR REPLACE FUNCTION public.approve_progress_update(
    p_update_id UUID,
    p_decision TEXT,
    p_verified_progress NUMERIC DEFAULT NULL,
    p_review_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_reviewer_id UUID := (SELECT auth.uid());
    v_update public.progress_updates%ROWTYPE;
    v_verified_progress NUMERIC;
    v_new_project_progress NUMERIC;
BEGIN
    IF v_reviewer_id IS NULL OR NOT public.is_government_user() THEN
        RAISE EXCEPTION 'Unauthorized: active government membership required';
    END IF;
    IF p_decision NOT IN ('APPROVED', 'REJECTED') THEN RAISE EXCEPTION 'Invalid review decision'; END IF;

    SELECT * INTO v_update FROM public.progress_updates WHERE id = p_update_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Progress update not found'; END IF;
    IF v_update.verification_status <> 'SUBMITTED' THEN RAISE EXCEPTION 'Progress update has already been reviewed'; END IF;

    v_verified_progress := CASE WHEN p_decision = 'APPROVED'
        THEN COALESCE(p_verified_progress, v_update.reported_progress)
        ELSE NULL END;
    IF v_verified_progress IS NOT NULL AND (v_verified_progress < 0 OR v_verified_progress > 100) THEN
        RAISE EXCEPTION 'Verified progress must be between 0 and 100';
    END IF;

    UPDATE public.progress_updates SET
        verification_status = p_decision, verified_progress = v_verified_progress,
        reviewed_by = v_reviewer_id, reviewed_at = now(), review_notes = p_review_notes, updated_at = now()
    WHERE id = p_update_id;

    IF p_decision = 'APPROVED' AND v_update.milestone_id IS NOT NULL THEN
        UPDATE public.project_milestones SET verified_progress = v_verified_progress,
            status = CASE WHEN v_verified_progress >= 100 THEN 'COMPLETED' ELSE 'IN_PROGRESS' END,
            actual_end_date = CASE WHEN v_verified_progress >= 100 THEN CURRENT_DATE ELSE actual_end_date END,
            updated_at = now() WHERE id = v_update.milestone_id;
        SELECT AVG(verified_progress) INTO v_new_project_progress FROM public.project_milestones
        WHERE project_id = v_update.project_id AND deleted_at IS NULL AND verified_progress IS NOT NULL;
        UPDATE public.projects SET physical_progress_percent = round(v_new_project_progress, 2),
            current_status_verified = (v_new_project_progress IS NOT NULL), updated_at = now()
        WHERE id = v_update.project_id;
    END IF;

    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (v_reviewer_id, 'PROGRESS_REVIEW', 'progress_updates', p_update_id,
        jsonb_build_object('decision', p_decision, 'verified_progress', v_verified_progress, 'notes', p_review_notes));
    RETURN jsonb_build_object('success', true, 'progress_update_id', p_update_id,
        'decision', p_decision, 'verified_progress', v_verified_progress, 'reviewed_by', v_reviewer_id);
END;
$$;
REVOKE ALL ON FUNCTION public.approve_progress_update(UUID, TEXT, NUMERIC, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_progress_update(UUID, TEXT, NUMERIC, TEXT) TO authenticated;

DO $$
DECLARE v_table TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        EXECUTE 'CREATE PUBLICATION supabase_realtime';
    END IF;
    FOREACH v_table IN ARRAY ARRAY[
        'tenders', 'tender_bids', 'progress_updates', 'project_milestones',
        'notifications', 'government_access_requests', 'contractor_access_requests'
    ] LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = v_table
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', v_table);
        END IF;
    END LOOP;
END $$;
