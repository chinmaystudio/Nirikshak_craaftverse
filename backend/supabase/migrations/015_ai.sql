-- 015_ai.sql
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
