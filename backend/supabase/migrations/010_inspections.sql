-- 010_inspections.sql
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
