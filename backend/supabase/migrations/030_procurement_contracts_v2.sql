-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 030_procurement_contracts_v2.sql
-- Domain: Procurement, Tenders, Bid Management, Tender & Bid Documents, Contracts
-- ==============================================================================

-- 1. Normalize tenders table
ALTER TABLE public.tenders
  ADD COLUMN IF NOT EXISTS government_organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS pre_bid_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS technical_opening_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS financial_opening_date TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS financial_requirements TEXT,
  ADD COLUMN IF NOT EXISTS published_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;

-- Backfill government_organization_id from issuing_organization_id where present
UPDATE public.tenders
SET government_organization_id = issuing_organization_id
WHERE government_organization_id IS NULL AND issuing_organization_id IS NOT NULL;

-- 2. Create tender_documents table
CREATE TABLE IF NOT EXISTS public.tender_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  document_id UUID,
  document_type TEXT NOT NULL DEFAULT 'NIT' CHECK (document_type IN ('NIT', 'RFP', 'BOQ', 'CORRIGENDUM', 'TECHNICAL_SPEC', 'OTHER')),
  title TEXT NOT NULL DEFAULT 'Tender Document',
  storage_path TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'PUBLIC' CHECK (visibility IN ('PUBLIC', 'REGISTERED_CONTRACTORS', 'GOV_INTERNAL')),
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tender_documents_tender_id ON public.tender_documents(tender_id);

-- 3. Normalize tender_bids table
ALTER TABLE public.tender_bids
  ADD COLUMN IF NOT EXISTS financial_proposal JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS combined_score NUMERIC(5, 2) CHECK (combined_score IS NULL OR (combined_score >= 0 AND combined_score <= 100)),
  ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES public.profiles(id);

-- Ensure non-negative bid amounts
DO $$ BEGIN
  ALTER TABLE public.tender_bids 
    DROP CONSTRAINT IF EXISTS chk_bid_amount_non_negative,
    ADD CONSTRAINT chk_bid_amount_non_negative CHECK (bid_amount >= 0);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. Create bid_documents table
CREATE TABLE IF NOT EXISTS public.bid_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bid_id UUID NOT NULL REFERENCES public.tender_bids(id) ON DELETE CASCADE,
  document_id UUID,
  document_type TEXT NOT NULL DEFAULT 'TECHNICAL_BID' CHECK (document_type IN ('TECHNICAL_BID', 'FINANCIAL_BID', 'EMD_RECEIPT', 'GST_COMPLIANCE', 'EXPERIENCE_CERTIFICATE', 'AFFIDAVIT', 'OTHER')),
  title TEXT NOT NULL DEFAULT 'Bid Attachment',
  storage_path TEXT NOT NULL,
  visibility TEXT NOT NULL DEFAULT 'CONTRACTOR_PRIVATE' CHECK (visibility IN ('CONTRACTOR_PRIVATE', 'EVALUATOR_ACCESSIBLE', 'PUBLIC_POST_AWARD')),
  uploaded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_bid_documents_bid_id ON public.bid_documents(bid_id);

-- 5. Normalize contracts table
ALTER TABLE public.contracts
  ADD COLUMN IF NOT EXISTS selected_bid_id UUID REFERENCES public.tender_bids(id),
  ADD COLUMN IF NOT EXISTS government_organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS scheduled_end_date DATE,
  ADD COLUMN IF NOT EXISTS actual_start_date DATE,
  ADD COLUMN IF NOT EXISTS actual_end_date DATE,
  ADD COLUMN IF NOT EXISTS retention_percentage NUMERIC(5, 2) DEFAULT 5.0 CHECK (retention_percentage IS NULL OR (retention_percentage >= 0 AND retention_percentage <= 100)),
  ADD COLUMN IF NOT EXISTS performance_security_amount NUMERIC(14, 2) CHECK (performance_security_amount IS NULL OR performance_security_amount >= 0),
  ADD COLUMN IF NOT EXISTS defect_liability_end_date DATE,
  ADD COLUMN IF NOT EXISTS awarded_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS awarded_at TIMESTAMPTZ;

-- Backfill scheduled_end_date from scheduled_completion_date
UPDATE public.contracts
SET scheduled_end_date = scheduled_completion_date
WHERE scheduled_end_date IS NULL AND scheduled_completion_date IS NOT NULL;

-- Backfill government_organization_id from project's government_organization_id
UPDATE public.contracts c
SET government_organization_id = p.government_organization_id
FROM public.projects p
WHERE c.project_id = p.id AND c.government_organization_id IS NULL;
