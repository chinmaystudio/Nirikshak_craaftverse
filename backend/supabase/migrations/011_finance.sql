-- 011_finance.sql
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
