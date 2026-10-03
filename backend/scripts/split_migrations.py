import os
import sys

# Directory to save migrations
migrations_dir = r"E:\Nirikshak\backend\supabase\migrations"
os.makedirs(migrations_dir, exist_ok=True)

migrations = {}

migrations['001_extensions.sql'] = """-- 001_extensions.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
"""

migrations['002_profiles.sql'] = """-- 002_profiles.sql
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    city TEXT,
    state TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        COALESCE(new.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
"""

migrations['003_organizations.sql'] = """-- 003_organizations.sql
DO $$ BEGIN
    CREATE TYPE public.org_type_enum AS ENUM (
        'government', 'contractor', 'consultant', 'PSU', 'ULB', 'authority', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.app_role_enum AS ENUM (
        'citizen',
        'government_admin',
        'project_officer',
        'government_engineer',
        'chief_engineer',
        'auditor',
        'contractor_admin',
        'contractor_manager',
        'contractor_site_engineer'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type public.org_type_enum NOT NULL DEFAULT 'other',
    parent_id UUID REFERENCES public.organizations(id),
    registration_number TEXT,
    department TEXT,
    state TEXT,
    district TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role_enum NOT NULL DEFAULT 'citizen',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, user_id)
);
"""

migrations['004_projects.sql'] = """-- 004_projects.sql
DO $$ BEGIN
    CREATE TYPE public.project_status_enum AS ENUM (
        'PROPOSED', 'DPR_STAGE', 'APPROVED', 'TENDERED', 'AWARDED',
        'UNDER_CONSTRUCTION', 'DELAYED', 'STALLED', 'SUSPENDED',
        'COMPLETED', 'CANCELLED', 'UNKNOWN', 'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_code TEXT UNIQUE NOT NULL,
    source_name TEXT NOT NULL,
    publisher TEXT,
    exact_url TEXT,
    years_covered TEXT,
    geography TEXT,
    evidence_quality TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nirikshak_project_id TEXT UNIQUE NOT NULL,
    official_project_id TEXT,
    project_name TEXT NOT NULL,
    description TEXT,
    sector TEXT,
    subsector TEXT,
    project_type TEXT,
    ministry TEXT,
    department TEXT,
    project_authority TEXT,
    implementing_agency TEXT,
    executing_agency TEXT,
    contractor_concessionaire TEXT,
    operator TEXT,
    ownership_type TEXT,
    procurement_mode TEXT,
    award_date DATE,
    planned_start_date DATE,
    actual_start_date DATE,
    original_completion_date DATE,
    revised_completion_date DATE,
    actual_completion_date DATE,
    state TEXT,
    district TEXT,
    city TEXT,
    location_text TEXT,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    total_cost_inr_crore NUMERIC,
    original_cost_inr_crore NUMERIC,
    revised_cost_inr_crore NUMERIC,
    amount_spent_inr_crore NUMERIC,
    physical_progress_percent NUMERIC,
    financial_progress_percent NUMERIC,
    reported_status TEXT,
    normalized_status TEXT DEFAULT 'UNKNOWN',
    record_scope TEXT,
    current_status_verified BOOLEAN DEFAULT FALSE,
    quality_score NUMERIC,
    duplicate_review TEXT,
    source_record_id TEXT,
    primary_source_url TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    public_summary TEXT,
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES auth.users(id),
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.project_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL,
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    alias_text TEXT NOT NULL,
    alias_type TEXT,
    source_id UUID REFERENCES public.sources(id),
    source_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    observation_date DATE,
    update_type TEXT,
    status_reported TEXT,
    status_normalized TEXT,
    physical_progress_percent NUMERIC,
    schedule_variance_days INTEGER,
    update_text TEXT,
    source_id UUID REFERENCES public.sources(id),
    source_record_id TEXT,
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.source_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    observed_value TEXT,
    observed_unit TEXT,
    observation_date DATE,
    source_retrieval_date DATE,
    source_id UUID REFERENCES public.sources(id),
    source_record_id TEXT,
    source_url TEXT,
    raw_field_name TEXT,
    transform_note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    sha256 TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    rows_total INTEGER DEFAULT 0,
    rows_success INTEGER DEFAULT 0,
    rows_failed INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.project_import_staging (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES public.import_batches(id),
    source_sheet TEXT,
    raw_row JSONB,
    validation_status TEXT DEFAULT 'PENDING',
    validation_errors JSONB,
    imported_project_id UUID REFERENCES public.projects(id),
    created_at TIMESTAMPTZ DEFAULT now()
);
"""

migrations['005_tenders.sql'] = """-- 005_tenders.sql
CREATE TABLE IF NOT EXISTS public.tenders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    official_tender_id TEXT,
    tender_number TEXT NOT NULL,
    title TEXT NOT NULL,
    issuing_organization_id UUID REFERENCES public.organizations(id),
    estimated_value_inr_crore NUMERIC,
    publication_date DATE,
    bid_due_date DATE,
    status TEXT NOT NULL DEFAULT 'PUBLISHED',
    is_public BOOLEAN DEFAULT TRUE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.tender_bids (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
    contractor_organization_id UUID NOT NULL REFERENCES public.organizations(id),
    bid_amount NUMERIC NOT NULL,
    technical_score NUMERIC,
    financial_score NUMERIC,
    status TEXT NOT NULL DEFAULT 'SUBMITTED',
    submitted_by UUID REFERENCES auth.users(id),
    submitted_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
"""

migrations['006_contracts.sql'] = """-- 006_contracts.sql
CREATE TABLE IF NOT EXISTS public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    tender_id UUID REFERENCES public.tenders(id),
    contractor_organization_id UUID NOT NULL REFERENCES public.organizations(id),
    official_contract_id TEXT,
    contract_number TEXT NOT NULL,
    contract_title TEXT NOT NULL,
    contract_value NUMERIC,
    award_date DATE,
    scheduled_start_date DATE,
    scheduled_completion_date DATE,
    actual_completion_date DATE,
    status TEXT NOT NULL DEFAULT 'ACTIVE',
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
"""

migrations['007_milestones.sql'] = """-- 007_milestones.sql
CREATE TABLE IF NOT EXISTS public.project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    milestone_name TEXT NOT NULL,
    description TEXT,
    milestone_type TEXT,
    planned_start_date DATE,
    planned_end_date DATE,
    revised_end_date DATE,
    actual_start_date DATE,
    actual_end_date DATE,
    planned_progress NUMERIC DEFAULT 0,
    verified_progress NUMERIC DEFAULT 0,
    planned_cost NUMERIC,
    actual_cost NUMERIC,
    status TEXT DEFAULT 'PENDING',
    display_order INTEGER DEFAULT 1,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);
"""

migrations['008_progress.sql'] = """-- 008_progress.sql
CREATE TABLE IF NOT EXISTS public.progress_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES public.project_milestones(id),
    contractor_organization_id UUID NOT NULL REFERENCES public.organizations(id),
    reported_progress NUMERIC NOT NULL,
    description TEXT,
    submitted_by UUID REFERENCES auth.users(id),
    submitted_at TIMESTAMPTZ DEFAULT now(),
    verification_status TEXT DEFAULT 'SUBMITTED',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    verified_progress NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.progress_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    progress_update_id UUID NOT NULL REFERENCES public.progress_updates(id) ON DELETE CASCADE,
    evidence_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    captured_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
"""

migrations['009_complaints.sql'] = """-- 009_complaints.sql
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number TEXT UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    severity TEXT DEFAULT 'MEDIUM',
    status TEXT DEFAULT 'SUBMITTED',
    assigned_organization_id UUID REFERENCES public.organizations(id),
    assigned_user_id UUID REFERENCES auth.users(id),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.complaint_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.complaint_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id),
    previous_status TEXT,
    new_status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
"""

migrations['010_inspections.sql'] = """-- 010_inspections.sql
CREATE TABLE IF NOT EXISTS public.inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    inspection_type TEXT NOT NULL,
    scheduled_date DATE,
    inspection_date DATE,
    inspector_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'SCHEDULED',
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.inspection_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
    category TEXT,
    severity TEXT DEFAULT 'MEDIUM',
    description TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    evidence_path TEXT,
    required_action TEXT,
    deadline DATE,
    status TEXT DEFAULT 'OPEN',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);
"""

migrations['011_finance.sql'] = """-- 011_finance.sql
CREATE TABLE IF NOT EXISTS public.financial_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    observation_date DATE,
    reported_cost_inr_crore NUMERIC,
    original_cost_inr_crore NUMERIC,
    revised_cost_inr_crore NUMERIC,
    amount_spent_inr_crore NUMERIC,
    budget_allocation_inr_crore NUMERIC,
    cost_overrun_inr_crore NUMERIC,
    cost_overrun_percent NUMERIC,
    source_id UUID REFERENCES public.sources(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.delay_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    observation_date DATE,
    delay_category TEXT NOT NULL,
    delay_reason TEXT,
    delay_days INTEGER,
    affected_milestone TEXT,
    evidence_text TEXT,
    source_id UUID REFERENCES public.sources(id),
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
"""

migrations['012_environment.sql'] = """-- 012_environment.sql
CREATE TABLE IF NOT EXISTS public.environmental_clearances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    clearance_type TEXT NOT NULL,
    issuing_authority TEXT,
    reference_number TEXT,
    issued_date DATE,
    valid_until DATE,
    status TEXT,
    conditions JSONB,
    document_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.environmental_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    metric TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    measured_at TIMESTAMPTZ,
    source TEXT,
    source_document_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.environmental_commitments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    commitment TEXT NOT NULL,
    expected_value NUMERIC,
    actual_value NUMERIC,
    unit TEXT,
    deadline DATE,
    source_document_id UUID,
    status TEXT DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.environmental_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    metric TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    source_type TEXT NOT NULL,
    observed_at TIMESTAMPTZ DEFAULT now(),
    submitted_by UUID REFERENCES auth.users(id),
    evidence_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.environmental_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    incident_type TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'MEDIUM',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    reported_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'REPORTED',
    detected_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
"""

migrations['013_documents.sql'] = """-- 013_documents.sql
CREATE TABLE IF NOT EXISTS public.project_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    title TEXT NOT NULL,
    document_date DATE,
    publisher TEXT,
    storage_path TEXT,
    external_url TEXT,
    sha256 TEXT,
    is_public BOOLEAN DEFAULT FALSE,
    uploaded_by UUID REFERENCES auth.users(id),
    source_id UUID REFERENCES public.sources(id),
    created_at TIMESTAMPTZ DEFAULT now()
);
"""

migrations['014_notifications.sql'] = """-- 014_notifications.sql
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);
"""

migrations['015_ai.sql'] = """-- 015_ai.sql
CREATE TABLE IF NOT EXISTS public.ai_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    task TEXT NOT NULL,
    provider TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_version TEXT DEFAULT 'v1',
    input_hash TEXT,
    status TEXT DEFAULT 'PENDING',
    input_tokens INTEGER,
    output_tokens INTEGER,
    latency_ms INTEGER,
    error TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    ai_run_id UUID REFERENCES public.ai_runs(id) ON DELETE SET NULL,
    insight_type TEXT NOT NULL,
    title TEXT NOT NULL,
    summary TEXT NOT NULL,
    severity TEXT DEFAULT 'MEDIUM',
    confidence NUMERIC DEFAULT 0.85,
    evidence JSONB DEFAULT '[]'::jsonb,
    recommended_actions JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMPTZ DEFAULT now()
);
"""

migrations['016_audit.sql'] = """-- 016_audit.sql
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id),
    actor_organization_id UUID REFERENCES public.organizations(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);
"""

migrations['017_rls.sql'] = """-- 017_rls.sql
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
"""

migrations['018_indexes.sql'] = """-- 018_indexes.sql
CREATE INDEX IF NOT EXISTS idx_projects_nirikshak_id ON public.projects(nirikshak_project_id);
CREATE INDEX IF NOT EXISTS idx_projects_normalized_status ON public.projects(normalized_status);
CREATE INDEX IF NOT EXISTS idx_projects_state ON public.projects(state);
CREATE INDEX IF NOT EXISTS idx_projects_district ON public.projects(district);
CREATE INDEX IF NOT EXISTS idx_projects_city ON public.projects(city);
CREATE INDEX IF NOT EXISTS idx_projects_sector ON public.projects(sector);
CREATE INDEX IF NOT EXISTS idx_projects_authority ON public.projects(project_authority);
CREATE INDEX IF NOT EXISTS idx_projects_contractor ON public.projects(contractor_concessionaire);
CREATE INDEX IF NOT EXISTS idx_projects_award_date ON public.projects(award_date);
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON public.projects(is_public);

CREATE INDEX IF NOT EXISTS idx_project_updates_project_id ON public.project_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_project_id ON public.progress_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_milestone_id ON public.progress_updates(milestone_id);
CREATE INDEX IF NOT EXISTS idx_complaints_project_id ON public.complaints(project_id);
CREATE INDEX IF NOT EXISTS idx_complaints_ref_number ON public.complaints(reference_number);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON public.contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_org_id ON public.contracts(contractor_organization_id);
CREATE INDEX IF NOT EXISTS idx_tenders_project_id ON public.tenders(project_id);
CREATE INDEX IF NOT EXISTS idx_source_observations_project_id ON public.source_observations(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON public.project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_project_id ON public.ai_insights(project_id);
"""

if __name__ == '__main__':
    for filename, sql in migrations.items():
        path = os.path.join(migrations_dir, filename)
        with open(path, 'w', encoding='utf-8') as f:
            f.write(sql)
        print(f"Generated {filename} ({len(sql)} bytes)")
    print("All 18 migration files written to backend/supabase/migrations successfully.")
