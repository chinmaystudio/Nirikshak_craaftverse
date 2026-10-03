-- 005_tenders.sql
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
