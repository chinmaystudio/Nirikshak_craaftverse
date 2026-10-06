-- Migration 024_multi_tenant_gov_contractor_architecture.sql
-- NIRIKSHAK Multi-Tenant Architecture for Government & Contractor Roles
--
-- 1. Shared Government Authority scoping (all Pune officers share same projects).
-- 2. Isolated Contractor scoping (each company has own organization, bids and contracts).
-- 3. Robust Auth trigger: profiles created, pending access requests logged without failure.
-- 4. Transactional approval RPCs: approve_government_access_request, approve_contractor_access_request.
-- 5. Rigid RLS policies on projects, tenders, tender_bids, contracts, progress_updates, requests.

-- 1. Ensure Enum Values
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'contractor_engineer' AND enumtypid = 'public.app_role_enum'::regtype) THEN
        ALTER TYPE public.app_role_enum ADD VALUE 'contractor_engineer';
    END IF;
END $$;

-- 2. Organizations Table Extensions
ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS gstin TEXT;

-- Ensure Pune Infrastructure Monitoring Authority exists as the shared development Government Authority
INSERT INTO public.organizations (id, name, type, status, state, district, verified)
VALUES (
    'c675a05d-6c45-4008-b021-6b88825e3641',
    'Pune Infrastructure Monitoring Authority',
    'authority',
    'ACTIVE',
    'Maharashtra',
    'Pune',
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    status = 'ACTIVE',
    verified = true,
    state = 'Maharashtra',
    district = 'Pune',
    updated_at = now();

-- Ensure Seed Contractor Organizations have valid GSTIN and CIN for matching
UPDATE public.organizations
SET gstin = '27AABCA1234F1Z5', registration_number = 'U45200MH2018PTC312456', status = 'ACTIVE', verified = true
WHERE id = '602e1463-ed1f-48da-85f4-74fc2a5ab9cc' OR lower(name) = 'apex infrastructure pvt ltd';

UPDATE public.organizations
SET gstin = '27AABCB5678G1Z2', registration_number = 'U45201MH2015PLC264891', status = 'ACTIVE', verified = true
WHERE id = 'b53361b8-675e-4cd7-9166-d29b896fbac5' OR lower(name) = 'bharat urban engineering ltd';

UPDATE public.organizations
SET gstin = '27AABCC9012H1Z9', registration_number = 'U45202MH2019PTC328912', status = 'ACTIVE', verified = true
WHERE id = '6ec8475f-bdac-43a6-a085-751b68601db3' OR lower(name) = 'crestline infra projects pvt ltd';

-- 3. Organization Members - Enforce One Active Organization per User
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_members_one_active_per_user
    ON public.organization_members (user_id)
    WHERE status = 'active';

-- 4. Projects Table - Government Organization Scoping
ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS government_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_gov_org_id
    ON public.projects (government_organization_id);

-- Assign existing projects to Pune Authority if not assigned
UPDATE public.projects
SET government_organization_id = 'c675a05d-6c45-4008-b021-6b88825e3641'
WHERE government_organization_id IS NULL;

-- 5. Access Request Tables - Constraints and Columns
ALTER TABLE public.government_access_requests
    ADD COLUMN IF NOT EXISTS requested_role TEXT DEFAULT 'government_engineer';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.government_access_requests'::regclass
          AND conname = 'government_access_requests_user_id_key'
    ) THEN
        ALTER TABLE public.government_access_requests
            ADD CONSTRAINT government_access_requests_user_id_key UNIQUE (user_id);
    END IF;
END $$;

ALTER TABLE public.contractor_access_requests
    ADD COLUMN IF NOT EXISTS requested_role TEXT DEFAULT 'contractor_admin';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.contractor_access_requests'::regclass
          AND conname = 'contractor_access_requests_user_id_key'
    ) THEN
        ALTER TABLE public.contractor_access_requests
            ADD CONSTRAINT contractor_access_requests_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 6. Robust Database Trigger on auth.users (handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_req_role TEXT;
    v_full_name TEXT;
    v_phone TEXT;
    v_district TEXT;
    v_state TEXT;
BEGIN
    v_req_role := COALESCE(
        NULLIF(new.raw_user_meta_data->>'requested_role', ''),
        NULLIF(new.raw_user_meta_data->>'role', ''),
        'citizen'
    );
    v_full_name := COALESCE(NULLIF(new.raw_user_meta_data->>'full_name', ''), new.email, 'User');
    v_phone := NULLIF(new.raw_user_meta_data->>'phone', '');
    v_district := COALESCE(NULLIF(new.raw_user_meta_data->>'district', ''), 'Pune');
    v_state := COALESCE(NULLIF(new.raw_user_meta_data->>'state', ''), 'Maharashtra');

    -- Create or update user profile
    INSERT INTO public.profiles (id, full_name, phone, avatar_url, city, state)
    VALUES (
        new.id,
        v_full_name,
        v_phone,
        NULLIF(new.raw_user_meta_data->>'avatar_url', ''),
        v_district,
        v_state
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        city = COALESCE(EXCLUDED.city, public.profiles.city),
        state = COALESCE(EXCLUDED.state, public.profiles.state),
        updated_at = now();

    -- Check if requesting a government clearance
    IF v_req_role IN ('government', 'government_admin', 'government_engineer', 'chief_engineer', 'project_officer', 'auditor') THEN
        INSERT INTO public.government_access_requests (
            user_id,
            employee_id,
            department,
            designation,
            official_email,
            state,
            district,
            status,
            requested_role
        ) VALUES (
            new.id,
            COALESCE(NULLIF(new.raw_user_meta_data->>'employee_id', ''), 'PENDING-' || upper(substr(new.id::text, 1, 8))),
            COALESCE(NULLIF(new.raw_user_meta_data->>'department', ''), 'Public Works Department (PWD)'),
            COALESCE(NULLIF(new.raw_user_meta_data->>'designation', ''), 'Executive Engineer'),
            COALESCE(NULLIF(new.email, ''), 'officer@gov.local'),
            v_state,
            v_district,
            'PENDING',
            v_req_role
        ) ON CONFLICT (user_id) DO UPDATE SET
            employee_id = EXCLUDED.employee_id,
            department = EXCLUDED.department,
            designation = EXCLUDED.designation,
            official_email = EXCLUDED.official_email,
            requested_role = EXCLUDED.requested_role;

    -- Check if requesting contractor onboarding
    ELSIF v_req_role IN ('contractor', 'contractor_admin', 'contractor_manager', 'contractor_engineer', 'contractor_site_engineer') THEN
        INSERT INTO public.contractor_access_requests (
            user_id,
            company_name,
            registration_cin,
            gstin,
            contractor_class,
            state,
            district,
            phone,
            status,
            requested_role
        ) VALUES (
            new.id,
            COALESCE(NULLIF(new.raw_user_meta_data->>'company_name', ''), 'Contractor Entity'),
            COALESCE(NULLIF(new.raw_user_meta_data->>'registration_cin', ''), 'PENDING-CIN-' || upper(substr(new.id::text, 1, 6))),
            COALESCE(NULLIF(new.raw_user_meta_data->>'gstin', ''), 'PENDING-GSTIN'),
            COALESCE(NULLIF(new.raw_user_meta_data->>'contractor_class', ''), 'Class 1 (Unlimited)'),
            v_state,
            v_district,
            v_phone,
            'PENDING',
            v_req_role
        ) ON CONFLICT (user_id) DO UPDATE SET
            company_name = EXCLUDED.company_name,
            registration_cin = EXCLUDED.registration_cin,
            gstin = EXCLUDED.gstin,
            phone = EXCLUDED.phone,
            requested_role = EXCLUDED.requested_role;
    END IF;

    RETURN new;
END;
$$;

-- 7. Server-Side Project Scoping Trigger (Requirement 7)
CREATE OR REPLACE FUNCTION public.set_project_gov_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_org_id UUID;
BEGIN
    v_user_org_id := public.get_user_organization_id();
    IF NEW.government_organization_id IS NULL THEN
        IF v_user_org_id IS NULL THEN
            RAISE EXCEPTION 'government_organization_id is required when no authenticated organization membership exists';
        END IF;
        NEW.government_organization_id := v_user_org_id;
    END IF;
    IF NEW.created_by IS NULL THEN
        NEW.created_by := (SELECT auth.uid());
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_project_gov_org ON public.projects;
CREATE TRIGGER trg_set_project_gov_org
    BEFORE INSERT ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.set_project_gov_org();

-- 8. Core Security Helper Functions
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT organization_id FROM public.organization_members
    WHERE user_id = (SELECT auth.uid())
      AND lower(status) = 'active'
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.app_role_enum
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT role FROM public.organization_members
    WHERE user_id = (SELECT auth.uid())
      AND lower(status) = 'active'
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_government_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members om
        JOIN public.organizations o ON om.organization_id = o.id
        WHERE om.user_id = (SELECT auth.uid())
          AND lower(om.status) = 'active'
          AND (o.type IN ('government', 'authority', 'ULB', 'PSU')
               OR om.role IN ('government_admin', 'project_officer', 'government_engineer', 'chief_engineer', 'auditor'))
    );
$$;

CREATE OR REPLACE FUNCTION public.is_contractor_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members om
        JOIN public.organizations o ON om.organization_id = o.id
        WHERE om.user_id = (SELECT auth.uid())
          AND lower(om.status) = 'active'
          AND (o.type = 'contractor'
               OR om.role IN ('contractor_admin', 'contractor_manager', 'contractor_engineer', 'contractor_site_engineer'))
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_project(p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = p_id
          AND public.is_government_user()
          AND (p.government_organization_id = public.get_user_organization_id() OR p.government_organization_id IS NULL)
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_project(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_org_id UUID := public.get_user_organization_id();
BEGIN
    IF public.is_government_user() THEN
        RETURN EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = p_id
              AND (p.government_organization_id = v_org_id OR p.government_organization_id IS NULL)
        );
    END IF;

    IF public.is_contractor_user() THEN
        RETURN EXISTS (
            SELECT 1 FROM public.project_organizations po
            WHERE po.project_id = p_id AND po.organization_id = v_org_id
        ) OR EXISTS (
            SELECT 1 FROM public.contracts c
            WHERE c.project_id = p_id AND c.contractor_organization_id = v_org_id
        );
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = p_id AND p.is_public = TRUE AND p.deleted_at IS NULL
    );
END;
$$;

-- 9. Transactional Government Approval RPC (Requirement 38)
CREATE OR REPLACE FUNCTION public.approve_government_access_request(
    request_id UUID,
    approved_role public.app_role_enum DEFAULT 'government_engineer'::public.app_role_enum
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID := (SELECT auth.uid());
    v_caller_role public.app_role_enum;
    v_gov_org_id UUID;
    v_req public.government_access_requests%ROWTYPE;
BEGIN
    -- Approval must always be performed by an authenticated administrator.
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: authentication is required';
    END IF;
    SELECT role INTO v_caller_role FROM public.organization_members
    WHERE user_id = v_caller_id AND status = 'active';
    IF v_caller_role <> 'government_admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only Government Administrators can approve officer access requests';
    END IF;

    -- Lock and retrieve request
    SELECT * INTO v_req FROM public.government_access_requests
    WHERE id = request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Government access request % not found', request_id;
    END IF;

    IF v_req.status <> 'PENDING' THEN
        RAISE EXCEPTION 'Request % has already been %', request_id, v_req.status;
    END IF;

    -- Resolve the authority from the authenticated administrator's membership.
    v_gov_org_id := public.get_user_organization_id();
    IF v_gov_org_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: administrator organization is missing';
    END IF;

    -- Create or reactivate active organization membership
    INSERT INTO public.organization_members (
        organization_id,
        user_id,
        role,
        status,
        created_at
    ) VALUES (
        v_gov_org_id,
        v_req.user_id,
        approved_role,
        'active',
        now()
    ) ON CONFLICT (organization_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        status = 'active';

    -- Mark request APPROVED
    UPDATE public.government_access_requests
    SET status = 'APPROVED',
        reviewed_by = v_caller_id,
        reviewed_at = now()
    WHERE id = request_id;

    -- Record audit log
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (
        COALESCE(v_caller_id, v_req.user_id),
        'APPROVE_GOVERNMENT_ACCESS',
        'government_access_requests',
        request_id,
        jsonb_build_object(
            'approved_user_id', v_req.user_id,
            'organization_id', v_gov_org_id,
            'role', approved_role::TEXT
        )
    );

    -- Notify approved user
    INSERT INTO public.notifications (
        organization_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        v_gov_org_id,
        'ACCESS_APPROVED',
        'Government Portal Clearance Approved',
        'Your NIRIKSHAK government officer clearance has been approved with role ' || approved_role::TEXT || '.',
        'organization_members',
        v_req.user_id,
        jsonb_build_object('role', approved_role::TEXT, 'organization_id', v_gov_org_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'request_id', request_id,
        'user_id', v_req.user_id,
        'organization_id', v_gov_org_id,
        'role', approved_role::TEXT,
        'status', 'APPROVED'
    );
END;
$$;

-- 10. Transactional Contractor Approval RPC (Requirement 39 & 40)
CREATE OR REPLACE FUNCTION public.approve_contractor_access_request(
    request_id UUID,
    approved_role public.app_role_enum DEFAULT 'contractor_admin'::public.app_role_enum
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID := (SELECT auth.uid());
    v_contractor_org_id UUID;
    v_req public.contractor_access_requests%ROWTYPE;
BEGIN
    -- Contractor verification must always be performed by an authenticated government user.
    IF v_caller_id IS NULL OR NOT public.is_government_user() OR public.get_user_role() <> 'government_admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only Government Administrators can verify contractor onboarding';
    END IF;

    -- Lock and retrieve request
    SELECT * INTO v_req FROM public.contractor_access_requests
    WHERE id = request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contractor access request % not found', request_id;
    END IF;

    IF v_req.status <> 'PENDING' THEN
        RAISE EXCEPTION 'Request % has already been %', request_id, v_req.status;
    END IF;

    -- Stable company resolution: match by GSTIN, CIN, or Name (Requirement 40)
    SELECT id INTO v_contractor_org_id
    FROM public.organizations
    WHERE type = 'contractor'
      AND (
          (v_req.gstin IS NOT NULL AND gstin = v_req.gstin)
          OR (v_req.registration_cin IS NOT NULL AND registration_number = v_req.registration_cin)
          OR (lower(btrim(name)) = lower(btrim(v_req.company_name)))
      )
    LIMIT 1;

    -- If no existing company organization exists, create one
    IF v_contractor_org_id IS NULL THEN
        INSERT INTO public.organizations (
            name,
            type,
            status,
            state,
            district,
            registration_number,
            gstin,
            verified
        ) VALUES (
            v_req.company_name,
            'contractor'::public.org_type,
            'ACTIVE',
            v_req.state,
            v_req.district,
            v_req.registration_cin,
            v_req.gstin,
            true
        ) RETURNING id INTO v_contractor_org_id;
    END IF;

    -- Create or reactivate active contractor organization membership
    INSERT INTO public.organization_members (
        organization_id,
        user_id,
        role,
        status,
        created_at
    ) VALUES (
        v_contractor_org_id,
        v_req.user_id,
        approved_role,
        'active',
        now()
    ) ON CONFLICT (organization_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        status = 'active';

    -- Mark request APPROVED
    UPDATE public.contractor_access_requests
    SET status = 'APPROVED',
        reviewed_by = v_caller_id,
        reviewed_at = now()
    WHERE id = request_id;

    -- Record audit log
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (
        COALESCE(v_caller_id, v_req.user_id),
        'APPROVE_CONTRACTOR_ACCESS',
        'contractor_access_requests',
        request_id,
        jsonb_build_object(
            'approved_user_id', v_req.user_id,
            'organization_id', v_contractor_org_id,
            'company_name', v_req.company_name,
            'role', approved_role::TEXT
        )
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
        v_contractor_org_id,
        'VENDOR_VERIFIED',
        'Contractor Organization Verified',
        'Your contractor organization ' || v_req.company_name || ' has been verified. You may now bid on public tenders and submit progress claims.',
        'organizations',
        v_contractor_org_id,
        jsonb_build_object('company_name', v_req.company_name, 'organization_id', v_contractor_org_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'request_id', request_id,
        'user_id', v_req.user_id,
        'organization_id', v_contractor_org_id,
        'company_name', v_req.company_name,
        'role', approved_role::TEXT,
        'status', 'APPROVED'
    );
END;
$$;

-- 11. Updated Secure Database Views (Requirements 14 & 15)
DROP VIEW IF EXISTS public.government_project_summary_view;
CREATE OR REPLACE VIEW public.government_project_summary_view AS
SELECT
    p.id,
    p.nirikshak_project_id,
    p.official_project_id,
    p.project_name,
    p.description,
    p.sector,
    p.subsector,
    p.project_type,
    p.ministry,
    p.department,
    p.project_authority,
    p.implementing_agency,
    p.executing_agency,
    p.contractor_concessionaire,
    p.operator,
    p.ownership_type,
    p.procurement_mode,
    p.award_date,
    p.planned_start_date,
    p.actual_start_date,
    p.original_completion_date,
    p.revised_completion_date,
    p.actual_completion_date,
    p.state,
    p.district,
    p.city,
    p.location_text,
    p.latitude,
    p.longitude,
    p.total_cost_inr_crore,
    p.original_cost_inr_crore,
    p.revised_cost_inr_crore,
    p.amount_spent_inr_crore,
    p.physical_progress_percent,
    p.financial_progress_percent,
    p.reported_status,
    p.normalized_status,
    p.record_scope,
    p.current_status_verified,
    p.quality_score,
    p.duplicate_review,
    p.source_record_id,
    p.primary_source_url,
    p.is_public,
    p.public_summary,
    p.published_at,
    p.published_by,
    p.version,
    p.government_organization_id,
    p.created_by,
    p.created_at,
    p.updated_at,
    p.deleted_at,
    (SELECT count(*) FROM public.complaints c WHERE c.project_id = p.id AND c.status NOT IN ('RESOLVED', 'CLOSED')) AS open_complaints_count,
    (SELECT count(*) FROM public.progress_updates pu WHERE pu.project_id = p.id AND pu.verification_status = 'SUBMITTED') AS pending_progress_updates_count,
    (SELECT count(*) FROM public.inspections i WHERE i.project_id = p.id AND i.status = 'SCHEDULED') AS pending_inspections_count,
    (SELECT count(*) FROM public.ai_insights ai WHERE ai.project_id = p.id AND ai.severity = 'HIGH' AND ai.status = 'ACTIVE') AS high_risk_ai_count
FROM public.projects p
WHERE p.deleted_at IS NULL
  AND p.government_organization_id = public.get_user_organization_id();

DROP VIEW IF EXISTS public.contractor_assigned_projects_view;
CREATE OR REPLACE VIEW public.contractor_assigned_projects_view AS
SELECT DISTINCT
    p.id,
    p.nirikshak_project_id,
    p.project_name,
    p.sector,
    p.subsector,
    p.project_authority,
    p.location_text,
    p.latitude,
    p.longitude,
    p.total_cost_inr_crore,
    p.physical_progress_percent,
    p.normalized_status,
    c.id AS contract_id,
    c.contract_number,
    c.contract_value,
    c.status AS contract_status,
    c.scheduled_completion_date
FROM public.projects p
LEFT JOIN public.contracts c ON c.project_id = p.id AND c.contractor_organization_id = public.get_user_organization_id()
LEFT JOIN public.project_organizations po ON po.project_id = p.id AND po.organization_id = public.get_user_organization_id()
WHERE p.deleted_at IS NULL
  AND (
      c.contractor_organization_id = public.get_user_organization_id()
      OR po.organization_id = public.get_user_organization_id()
  );

-- 12. Rigid Multi-Tenant Row Level Security Policies

-- Projects RLS
DROP POLICY IF EXISTS "Projects select policy" ON public.projects;
CREATE POLICY "Projects select policy" ON public.projects
    FOR SELECT TO public
    USING (
        (is_public = true AND deleted_at IS NULL)
        OR (public.is_government_user() AND (government_organization_id = public.get_user_organization_id() OR government_organization_id IS NULL))
        OR (public.is_contractor_user() AND public.can_access_project(id))
    );

DROP POLICY IF EXISTS "Government can insert projects" ON public.projects;
CREATE POLICY "Government can insert projects" ON public.projects
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_government_user()
    );

DROP POLICY IF EXISTS "Government can update projects" ON public.projects;
CREATE POLICY "Government can update projects" ON public.projects
    FOR UPDATE TO authenticated
    USING (
        public.is_government_user() AND (government_organization_id = public.get_user_organization_id() OR government_organization_id IS NULL)
    );

-- Tenders RLS
DROP POLICY IF EXISTS "Tenders select policy" ON public.tenders;
CREATE POLICY "Tenders select policy" ON public.tenders
    FOR SELECT TO public
    USING (
        (is_public = true AND deleted_at IS NULL)
        OR (public.is_government_user() AND (issuing_organization_id = public.get_user_organization_id() OR issuing_organization_id IS NULL))
    );

DROP POLICY IF EXISTS "Government manage tenders" ON public.tenders;
CREATE POLICY "Government manage tenders" ON public.tenders
    FOR ALL TO authenticated
    USING (
        public.is_government_user() AND (issuing_organization_id = public.get_user_organization_id() OR issuing_organization_id IS NULL)
    );

-- Tender Bids RLS (Contractor Isolation Rule - Requirement 11, 27)
DROP POLICY IF EXISTS "Contractor view own bids, Gov view all" ON public.tender_bids;
CREATE POLICY "Contractor view own bids, Gov view all" ON public.tender_bids
    FOR SELECT TO authenticated
    USING (
        (public.is_contractor_user() AND contractor_organization_id = public.get_user_organization_id())
        OR (public.is_government_user() AND EXISTS (
            SELECT 1 FROM public.tenders t
            WHERE t.id = tender_bids.tender_id
              AND (t.issuing_organization_id = public.get_user_organization_id() OR t.issuing_organization_id IS NULL)
        ))
    );

DROP POLICY IF EXISTS "Contractor insert bid" ON public.tender_bids;
CREATE POLICY "Contractor insert bid" ON public.tender_bids
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_contractor_user() AND contractor_organization_id = public.get_user_organization_id()
    );

DROP POLICY IF EXISTS "Contractor update own bid" ON public.tender_bids;
CREATE POLICY "Contractor update own bid" ON public.tender_bids
    FOR UPDATE TO authenticated
    USING (
        public.is_contractor_user() AND contractor_organization_id = public.get_user_organization_id() AND status = 'DRAFT'
    )
    WITH CHECK (
        contractor_organization_id = public.get_user_organization_id()
    );

-- Contracts RLS (Requirement 28: Contractor only sees own contract, Gov sees own project contracts)
DROP POLICY IF EXISTS "contracts_select" ON public.contracts;
CREATE POLICY "contracts_select" ON public.contracts
    FOR SELECT TO authenticated
    USING (
        (public.is_contractor_user() AND contractor_organization_id = public.get_user_organization_id())
        OR (public.is_government_user() AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = contracts.project_id
              AND (p.government_organization_id = public.get_user_organization_id() OR p.government_organization_id IS NULL)
        ))
    );

DROP POLICY IF EXISTS "contracts_gov_all" ON public.contracts;
CREATE POLICY "contracts_gov_all" ON public.contracts
    FOR ALL TO authenticated
    USING (
        public.is_government_user() AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = contracts.project_id
              AND (p.government_organization_id = public.get_user_organization_id() OR p.government_organization_id IS NULL)
        )
    );

-- Progress Updates RLS (Requirement 29)
DROP POLICY IF EXISTS "Progress updates select" ON public.progress_updates;
CREATE POLICY "Progress updates select" ON public.progress_updates
    FOR SELECT TO public
    USING (
        (public.is_contractor_user() AND contractor_organization_id = public.get_user_organization_id())
        OR (public.is_government_user() AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = progress_updates.project_id
              AND (p.government_organization_id = public.get_user_organization_id() OR p.government_organization_id IS NULL)
        ))
        OR (verification_status = 'APPROVED' AND EXISTS (
            SELECT 1 FROM public.projects p WHERE p.id = progress_updates.project_id AND p.is_public = true
        ))
    );

DROP POLICY IF EXISTS "Contractor insert progress" ON public.progress_updates;
CREATE POLICY "Contractor insert progress" ON public.progress_updates
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_contractor_user() AND contractor_organization_id = public.get_user_organization_id()
    );

DROP POLICY IF EXISTS "Government update progress" ON public.progress_updates;
CREATE POLICY "Government update progress" ON public.progress_updates
    FOR UPDATE TO authenticated
    USING (
        public.is_government_user() AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = progress_updates.project_id
              AND (p.government_organization_id = public.get_user_organization_id() OR p.government_organization_id IS NULL)
        )
    );

-- Access Requests RLS (Requirements 21 & 22)
DROP POLICY IF EXISTS "government_access_requests_select" ON public.government_access_requests;
DROP POLICY IF EXISTS "Users can read own gov access request" ON public.government_access_requests;
DROP POLICY IF EXISTS "Users view own government access request" ON public.government_access_requests;
CREATE POLICY "government_access_requests_select" ON public.government_access_requests
    FOR SELECT TO authenticated
    USING (
        (SELECT auth.uid()) = user_id
        OR (public.is_government_user() AND public.get_user_role() IN ('government_admin', 'chief_engineer'))
    );

DROP POLICY IF EXISTS "government_access_requests_insert" ON public.government_access_requests;
DROP POLICY IF EXISTS "Users can insert own gov access request" ON public.government_access_requests;
DROP POLICY IF EXISTS "Users create own government access request" ON public.government_access_requests;
CREATE POLICY "government_access_requests_insert" ON public.government_access_requests
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = user_id AND status = 'PENDING'
    );

DROP POLICY IF EXISTS "government_access_requests_update" ON public.government_access_requests;
DROP POLICY IF EXISTS "Government reviews government access requests" ON public.government_access_requests;
CREATE POLICY "government_access_requests_update" ON public.government_access_requests
    FOR UPDATE TO authenticated
    USING (
        public.is_government_user() AND public.get_user_role() IN ('government_admin', 'chief_engineer')
    );

DROP POLICY IF EXISTS "contractor_access_requests_select" ON public.contractor_access_requests;
DROP POLICY IF EXISTS "Users can read own contractor access request" ON public.contractor_access_requests;
DROP POLICY IF EXISTS "Users view own contractor access request" ON public.contractor_access_requests;
CREATE POLICY "contractor_access_requests_select" ON public.contractor_access_requests
    FOR SELECT TO authenticated
    USING (
        (SELECT auth.uid()) = user_id
        OR (public.is_government_user() AND public.get_user_role() IN ('government_admin', 'chief_engineer'))
    );

DROP POLICY IF EXISTS "contractor_access_requests_insert" ON public.contractor_access_requests;
DROP POLICY IF EXISTS "Users can insert own contractor access request" ON public.contractor_access_requests;
DROP POLICY IF EXISTS "Users create own contractor access request" ON public.contractor_access_requests;
CREATE POLICY "contractor_access_requests_insert" ON public.contractor_access_requests
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = user_id AND status = 'PENDING'
    );

DROP POLICY IF EXISTS "contractor_access_requests_update" ON public.contractor_access_requests;
DROP POLICY IF EXISTS "Government reviews contractor access requests" ON public.contractor_access_requests;
CREATE POLICY "contractor_access_requests_update" ON public.contractor_access_requests
    FOR UPDATE TO authenticated
    USING (
        public.is_government_user() AND public.get_user_role() IN ('government_admin', 'chief_engineer')
    );

-- 13. Grant Permissions to Authenticated and Anon
GRANT SELECT ON public.government_project_summary_view TO authenticated, anon;
GRANT SELECT ON public.contractor_assigned_projects_view TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.government_access_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.contractor_access_requests TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_government_access_request(UUID, public.app_role_enum) TO authenticated;
-- 14. Registration RPCs (Requirement 4, 9, 18, 19)
CREATE OR REPLACE FUNCTION public.register_government_account(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_employee_id TEXT,
    p_department TEXT,
    p_designation TEXT,
    p_state TEXT DEFAULT 'Maharashtra',
    p_district TEXT DEFAULT 'Pune',
    p_requested_role TEXT DEFAULT 'government_engineer'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_enc_pass TEXT;
    v_existing_id UUID;
BEGIN
    IF p_email IS NULL OR btrim(p_email) = '' THEN
        RAISE EXCEPTION 'Email is required';
    END IF;
    IF p_password IS NULL OR length(p_password) < 8 THEN
        RAISE EXCEPTION 'Password must be at least 8 characters long';
    END IF;
    IF p_full_name IS NULL OR btrim(p_full_name) = '' THEN
        RAISE EXCEPTION 'Full official name is required';
    END IF;
    IF p_employee_id IS NULL OR btrim(p_employee_id) = '' THEN
        RAISE EXCEPTION 'Employee ID is required';
    END IF;

    SELECT id INTO v_existing_id
    FROM auth.users
    WHERE lower(email) = lower(btrim(p_email))
    LIMIT 1;

    v_enc_pass := extensions.crypt(p_password, extensions.gen_salt('bf'));

    IF v_existing_id IS NOT NULL THEN
        UPDATE auth.users
        SET encrypted_password = v_enc_pass,
            raw_user_meta_data = jsonb_build_object(
                'full_name', btrim(p_full_name),
                'requested_role', p_requested_role,
                'employee_id', btrim(p_employee_id),
                'department', btrim(p_department),
                'designation', btrim(p_designation),
                'state', p_state,
                'district', p_district
            ),
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            updated_at = now()
        WHERE id = v_existing_id;
        v_user_id := v_existing_id;
    ELSE
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token,
            is_sso_user
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            lower(btrim(p_email)),
            v_enc_pass,
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object(
                'full_name', btrim(p_full_name),
                'requested_role', p_requested_role,
                'employee_id', btrim(p_employee_id),
                'department', btrim(p_department),
                'designation', btrim(p_designation),
                'state', p_state,
                'district', p_district
            ),
            now(),
            now(),
            '',
            '',
            '',
            '',
            false
        );
    END IF;

    INSERT INTO public.government_access_requests (
        user_id,
        employee_id,
        department,
        designation,
        official_email,
        state,
        district,
        status,
        requested_role
    ) VALUES (
        v_user_id,
        btrim(p_employee_id),
        btrim(p_department),
        btrim(p_designation),
        lower(btrim(p_email)),
        p_state,
        p_district,
        'PENDING',
        p_requested_role
    ) ON CONFLICT (user_id) DO UPDATE SET
        employee_id = EXCLUDED.employee_id,
        department = EXCLUDED.department,
        designation = EXCLUDED.designation,
        official_email = EXCLUDED.official_email,
        requested_role = EXCLUDED.requested_role,
        status = 'PENDING';

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'email', lower(btrim(p_email)),
        'message', 'Registration request submitted. Your Government access is pending administrator approval.'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.register_contractor_account(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_phone TEXT,
    p_company_name TEXT,
    p_registration_cin TEXT,
    p_gstin TEXT,
    p_contractor_class TEXT DEFAULT 'Class 1 (Unlimited)',
    p_state TEXT DEFAULT 'Maharashtra',
    p_district TEXT DEFAULT 'Pune',
    p_requested_role TEXT DEFAULT 'contractor_admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_enc_pass TEXT;
    v_existing_id UUID;
BEGIN
    IF p_email IS NULL OR btrim(p_email) = '' THEN
        RAISE EXCEPTION 'Email is required';
    END IF;
    IF p_password IS NULL OR length(p_password) < 8 THEN
        RAISE EXCEPTION 'Password must be at least 8 characters long';
    END IF;
    IF p_full_name IS NULL OR btrim(p_full_name) = '' THEN
        RAISE EXCEPTION 'Full name is required';
    END IF;
    IF p_company_name IS NULL OR btrim(p_company_name) = '' THEN
        RAISE EXCEPTION 'Company name is required';
    END IF;

    SELECT id INTO v_existing_id
    FROM auth.users
    WHERE lower(email) = lower(btrim(p_email))
    LIMIT 1;

    v_enc_pass := extensions.crypt(p_password, extensions.gen_salt('bf'));

    IF v_existing_id IS NOT NULL THEN
        UPDATE auth.users
        SET encrypted_password = v_enc_pass,
            raw_user_meta_data = jsonb_build_object(
                'full_name', btrim(p_full_name),
                'requested_role', p_requested_role,
                'phone', btrim(p_phone),
                'company_name', btrim(p_company_name),
                'registration_cin', btrim(p_registration_cin),
                'gstin', btrim(p_gstin),
                'contractor_class', p_contractor_class,
                'state', p_state,
                'district', p_district
            ),
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            updated_at = now()
        WHERE id = v_existing_id;
        v_user_id := v_existing_id;
    ELSE
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token,
            is_sso_user
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            lower(btrim(p_email)),
            v_enc_pass,
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object(
                'full_name', btrim(p_full_name),
                'requested_role', p_requested_role,
                'phone', btrim(p_phone),
                'company_name', btrim(p_company_name),
                'registration_cin', btrim(p_registration_cin),
                'gstin', btrim(p_gstin),
                'contractor_class', p_contractor_class,
                'state', p_state,
                'district', p_district
            ),
            now(),
            now(),
            '',
            '',
            '',
            '',
            false
        );
    END IF;

    INSERT INTO public.contractor_access_requests (
        user_id,
        company_name,
        registration_cin,
        gstin,
        contractor_class,
        state,
        district,
        phone,
        status,
        requested_role
    ) VALUES (
        v_user_id,
        btrim(p_company_name),
        btrim(p_registration_cin),
        btrim(p_gstin),
        p_contractor_class,
        p_state,
        p_district,
        p_phone,
        'PENDING',
        p_requested_role
    ) ON CONFLICT (user_id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        registration_cin = EXCLUDED.registration_cin,
        gstin = EXCLUDED.gstin,
        phone = EXCLUDED.phone,
        contractor_class = EXCLUDED.contractor_class,
        requested_role = EXCLUDED.requested_role,
        status = 'PENDING';

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'email', lower(btrim(p_email)),
        'message', 'Your contractor organization verification is pending.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_government_account(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_contractor_account(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_contractor_access_request(UUID, public.app_role_enum) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_organization_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_government_user() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_contractor_user() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_access_project(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_project(UUID) TO authenticated, anon;
