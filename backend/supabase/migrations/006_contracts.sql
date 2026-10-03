-- 006_contracts.sql
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
