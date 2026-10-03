-- 017_rls.sql
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.app_role_enum AS $$
    SELECT role FROM public.organization_members
    WHERE user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_government_user()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members om
        JOIN public.organizations o ON om.organization_id = o.id
        WHERE om.user_id = auth.uid()
          AND (o.type IN ('government', 'authority', 'ULB', 'PSU')
               OR om.role IN ('government_admin', 'project_officer', 'government_engineer', 'chief_engineer', 'auditor'))
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_contractor_user()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members om
        JOIN public.organizations o ON om.organization_id = o.id
        WHERE om.user_id = auth.uid()
          AND (o.type = 'contractor'
               OR om.role IN ('contractor_admin', 'contractor_manager', 'contractor_site_engineer'))
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_citizen()
RETURNS BOOLEAN AS $$
    SELECT NOT (public.is_government_user() OR public.is_contractor_user());
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_access_project(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF public.is_government_user() THEN
        RETURN TRUE;
    END IF;
    IF public.is_contractor_user() THEN
        RETURN EXISTS (
            SELECT 1 FROM public.project_organizations po
            WHERE po.project_id = p_id
              AND po.organization_id = public.get_user_organization_id()
        ) OR EXISTS (
            SELECT 1 FROM public.contracts c
            WHERE c.project_id = p_id
              AND c.contractor_organization_id = public.get_user_organization_id()
        );
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = p_id AND is_public = TRUE AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_manage_project(p_id UUID)
RETURNS BOOLEAN AS $$
    SELECT public.is_government_user();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delay_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_clearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Projects Policies
DROP POLICY IF EXISTS "Projects select policy" ON public.projects;
CREATE POLICY "Projects select policy" ON public.projects FOR SELECT
USING (
    is_public = TRUE
    OR public.is_government_user()
    OR (public.is_contractor_user() AND public.can_access_project(id))
);

DROP POLICY IF EXISTS "Government can insert projects" ON public.projects;
CREATE POLICY "Government can insert projects" ON public.projects FOR INSERT
WITH CHECK (public.is_government_user());

DROP POLICY IF EXISTS "Government can update projects" ON public.projects;
CREATE POLICY "Government can update projects" ON public.projects FOR UPDATE
USING (public.is_government_user());

-- Public Projects View
CREATE OR REPLACE VIEW public.public_projects_view AS
SELECT
    p.id,
    p.nirikshak_project_id,
    p.official_project_id,
    p.project_name,
    COALESCE(p.public_summary, p.description) AS public_description,
    p.sector,
    p.subsector,
    p.project_authority,
    p.implementing_agency,
    p.contractor_concessionaire,
    p.state,
    p.district,
    p.city,
    p.location_text,
    p.latitude,
    p.longitude,
    p.total_cost_inr_crore,
    p.physical_progress_percent,
    p.normalized_status,
    p.award_date,
    p.planned_start_date,
    p.original_completion_date,
    p.revised_completion_date,
    p.actual_completion_date,
    p.current_status_verified,
    p.quality_score,
    p.primary_source_url,
    p.updated_at
FROM public.projects p
WHERE p.is_public = TRUE AND p.deleted_at IS NULL;

-- Government Summary View
CREATE OR REPLACE VIEW public.government_project_summary_view AS
SELECT
    p.*,
    (SELECT COUNT(*) FROM public.complaints c WHERE c.project_id = p.id AND c.status NOT IN ('RESOLVED', 'CLOSED')) AS open_complaints_count,
    (SELECT COUNT(*) FROM public.progress_updates pu WHERE pu.project_id = p.id AND pu.verification_status = 'SUBMITTED') AS pending_progress_updates_count,
    (SELECT COUNT(*) FROM public.inspections i WHERE i.project_id = p.id AND i.status = 'SCHEDULED') AS pending_inspections_count,
    (SELECT COUNT(*) FROM public.ai_insights ai WHERE ai.project_id = p.id AND ai.severity = 'HIGH' AND ai.status = 'ACTIVE') AS high_risk_ai_count
FROM public.projects p
WHERE p.deleted_at IS NULL;

-- Contractor Assigned Projects View
CREATE OR REPLACE VIEW public.contractor_assigned_projects_view AS
SELECT
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
JOIN public.contracts c ON c.project_id = p.id
WHERE c.contractor_organization_id = public.get_user_organization_id()
  AND p.deleted_at IS NULL;

-- Complaints Policies
DROP POLICY IF EXISTS "Citizen read own complaints or public" ON public.complaints;
CREATE POLICY "Citizen read own complaints or public" ON public.complaints FOR SELECT
USING (
    user_id = auth.uid()
    OR public.is_government_user()
    OR (public.is_contractor_user() AND assigned_organization_id = public.get_user_organization_id())
);

DROP POLICY IF EXISTS "Anyone can insert complaint" ON public.complaints;
CREATE POLICY "Anyone can insert complaint" ON public.complaints FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Government can update complaint" ON public.complaints;
CREATE POLICY "Government can update complaint" ON public.complaints FOR UPDATE
USING (
    public.is_government_user()
    OR (public.is_contractor_user() AND assigned_organization_id = public.get_user_organization_id())
);

-- Tenders & Bids Policies
DROP POLICY IF EXISTS "Tenders select policy" ON public.tenders;
CREATE POLICY "Tenders select policy" ON public.tenders FOR SELECT
USING (is_public = TRUE OR public.is_government_user() OR public.is_contractor_user());

DROP POLICY IF EXISTS "Government manage tenders" ON public.tenders;
CREATE POLICY "Government manage tenders" ON public.tenders FOR ALL
USING (public.is_government_user());

DROP POLICY IF EXISTS "Contractor view own bids, Gov view all" ON public.tender_bids;
CREATE POLICY "Contractor view own bids, Gov view all" ON public.tender_bids FOR SELECT
USING (
    public.is_government_user()
    OR contractor_organization_id = public.get_user_organization_id()
);

DROP POLICY IF EXISTS "Contractor insert bid" ON public.tender_bids;
CREATE POLICY "Contractor insert bid" ON public.tender_bids FOR INSERT
WITH CHECK (
    public.is_contractor_user()
    AND contractor_organization_id = public.get_user_organization_id()
);

-- Progress Updates Policies
DROP POLICY IF EXISTS "Progress updates select" ON public.progress_updates;
CREATE POLICY "Progress updates select" ON public.progress_updates FOR SELECT
USING (
    public.is_government_user()
    OR contractor_organization_id = public.get_user_organization_id()
    OR verification_status = 'APPROVED'
);

DROP POLICY IF EXISTS "Contractor insert progress" ON public.progress_updates;
CREATE POLICY "Contractor insert progress" ON public.progress_updates FOR INSERT
WITH CHECK (
    public.is_contractor_user()
    AND contractor_organization_id = public.get_user_organization_id()
);

DROP POLICY IF EXISTS "Government update progress" ON public.progress_updates;
CREATE POLICY "Government update progress" ON public.progress_updates FOR UPDATE
USING (public.is_government_user());

-- Contracts Policies
DROP POLICY IF EXISTS "Contracts view policy" ON public.contracts;
CREATE POLICY "Contracts view policy" ON public.contracts FOR SELECT
USING (
    public.is_government_user()
    OR contractor_organization_id = public.get_user_organization_id()
);

DROP POLICY IF EXISTS "Government manage contracts" ON public.contracts;
CREATE POLICY "Government manage contracts" ON public.contracts FOR ALL
USING (public.is_government_user());

-- Organizations & Members Policies
DROP POLICY IF EXISTS "Organizations viewable by all" ON public.organizations;
CREATE POLICY "Organizations viewable by all" ON public.organizations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Organization members viewable by members or gov" ON public.organization_members;
CREATE POLICY "Organization members viewable by members or gov" ON public.organization_members FOR SELECT
USING (user_id = auth.uid() OR public.is_government_user());

-- Notifications Policy
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT
USING (user_id = auth.uid());

-- Milestones Policy
DROP POLICY IF EXISTS "Milestones viewable by project access" ON public.project_milestones;
CREATE POLICY "Milestones viewable by project access" ON public.project_milestones FOR SELECT
USING (public.can_access_project(project_id));

DROP POLICY IF EXISTS "Government can manage milestones" ON public.project_milestones;
CREATE POLICY "Government can manage milestones" ON public.project_milestones FOR ALL
USING (public.is_government_user());

-- Atomic Progress Approval Procedure
CREATE OR REPLACE FUNCTION public.approve_progress_update(
    p_update_id UUID,
    p_decision TEXT,
    p_verified_progress NUMERIC,
    p_review_notes TEXT,
    p_reviewer_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_update RECORD;
    v_new_project_progress NUMERIC;
    v_result JSONB;
BEGIN
    IF NOT public.is_government_user() THEN
        RAISE EXCEPTION 'Unauthorized: Only government officers can review progress';
    END IF;

    SELECT * INTO v_update FROM public.progress_updates WHERE id = p_update_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Progress update not found';
    END IF;

    UPDATE public.progress_updates
    SET verification_status = p_decision,
        verified_progress = p_verified_progress,
        reviewed_by = p_reviewer_id,
        reviewed_at = now(),
        review_notes = p_review_notes,
        updated_at = now()
    WHERE id = p_update_id;

    IF p_decision = 'APPROVED' AND v_update.milestone_id IS NOT NULL THEN
        UPDATE public.project_milestones
        SET verified_progress = p_verified_progress,
            status = CASE WHEN p_verified_progress >= 100 THEN 'COMPLETED' ELSE 'IN_PROGRESS' END,
            actual_end_date = CASE WHEN p_verified_progress >= 100 THEN CURRENT_DATE ELSE actual_end_date END,
            updated_at = now()
        WHERE id = v_update.milestone_id;

        SELECT COALESCE(AVG(verified_progress), 0) INTO v_new_project_progress
        FROM public.project_milestones
        WHERE project_id = v_update.project_id AND deleted_at IS NULL;

        UPDATE public.projects
        SET physical_progress_percent = ROUND(v_new_project_progress, 2),
            current_status_verified = TRUE,
            updated_at = now()
        WHERE id = v_update.project_id;
    END IF;

    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (
        p_reviewer_id,
        'PROGRESS_REVIEW',
        'progress_updates',
        p_update_id,
        jsonb_build_object('decision', p_decision, 'verified_progress', p_verified_progress, 'notes', p_review_notes)
    );

    v_result := jsonb_build_object(
        'success', true,
        'progress_update_id', p_update_id,
        'decision', p_decision,
        'verified_progress', p_verified_progress
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
