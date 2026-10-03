-- 019_realtime_and_workflow.sql
-- (Applied directly to Supabase PostgreSQL)
CREATE TABLE IF NOT EXISTS public.government_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id TEXT NOT NULL,
    department TEXT NOT NULL,
    designation TEXT NOT NULL,
    official_email TEXT NOT NULL,
    state TEXT DEFAULT 'Maharashtra',
    district TEXT DEFAULT 'Pune',
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.contractor_access_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    company_name TEXT NOT NULL,
    registration_cin TEXT NOT NULL,
    gstin TEXT NOT NULL,
    contractor_class TEXT NOT NULL,
    state TEXT DEFAULT 'Maharashtra',
    district TEXT DEFAULT 'Pune',
    phone TEXT,
    status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.government_access_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contractor_access_requests ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS eligibility_criteria TEXT;
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS technical_requirements TEXT;
ALTER TABLE public.tenders ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.tender_bids ADD COLUMN IF NOT EXISTS bid_reference TEXT;
ALTER TABLE public.tender_bids ADD COLUMN IF NOT EXISTS technical_proposal TEXT;
ALTER TABLE public.tender_bids ADD COLUMN IF NOT EXISTS documents JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
