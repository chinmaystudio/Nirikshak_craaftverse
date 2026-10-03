-- 007_milestones.sql
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
