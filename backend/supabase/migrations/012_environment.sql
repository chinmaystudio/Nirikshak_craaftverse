-- 012_environment.sql
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
