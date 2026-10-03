-- 004_projects.sql
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
