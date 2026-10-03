-- 008_progress.sql
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
