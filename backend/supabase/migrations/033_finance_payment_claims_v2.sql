-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 033_finance_payment_claims_v2.sql
-- Domain: Budget Heads, Financial Updates, Payment Claims, Payment Documents, Payments
-- ==============================================================================

-- 1. Create project_budget_heads table
CREATE TABLE IF NOT EXISTS public.project_budget_heads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  budget_code TEXT NOT NULL,
  budget_head TEXT NOT NULL,
  description TEXT,
  sanctioned_amount_inr_crore NUMERIC(14, 2) NOT NULL DEFAULT 0.0 CHECK (sanctioned_amount_inr_crore >= 0),
  revised_amount_inr_crore NUMERIC(14, 2) CHECK (revised_amount_inr_crore IS NULL OR revised_amount_inr_crore >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_project_budget_code UNIQUE (project_id, budget_code)
);

CREATE INDEX IF NOT EXISTS idx_budget_heads_project ON public.project_budget_heads(project_id);

-- 2. Normalize financial_updates table
ALTER TABLE public.financial_updates
  ADD COLUMN IF NOT EXISTS budget_head_id UUID REFERENCES public.project_budget_heads(id),
  ADD COLUMN IF NOT EXISTS planned_expenditure_inr_crore NUMERIC(14, 2) CHECK (planned_expenditure_inr_crore IS NULL OR planned_expenditure_inr_crore >= 0),
  ADD COLUMN IF NOT EXISTS actual_expenditure_inr_crore NUMERIC(14, 2) CHECK (actual_expenditure_inr_crore IS NULL OR actual_expenditure_inr_crore >= 0),
  ADD COLUMN IF NOT EXISTS cost_variance_inr_crore NUMERIC(14, 2),
  ADD COLUMN IF NOT EXISTS cost_variance_percent NUMERIC(7, 2);

-- 3. Create payment_claims table
CREATE TABLE IF NOT EXISTS public.payment_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  claim_number TEXT NOT NULL UNIQUE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contract_id UUID REFERENCES public.contracts(id) ON DELETE RESTRICT,
  contractor_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  milestone_id UUID REFERENCES public.project_milestones(id) ON DELETE SET NULL,
  claim_type TEXT NOT NULL DEFAULT 'RA_BILL' CHECK (claim_type IN ('RA_BILL', 'MILESTONE_PAYMENT', 'FINAL_BILL', 'ADVANCE', 'RETENTION_RELEASE', 'OTHER')),
  claimed_amount NUMERIC(14, 2) NOT NULL CHECK (claimed_amount > 0),
  verified_amount NUMERIC(14, 2) CHECK (verified_amount IS NULL OR verified_amount >= 0),
  approved_amount NUMERIC(14, 2) CHECK (approved_amount IS NULL OR approved_amount >= 0),
  status TEXT NOT NULL DEFAULT 'SUBMITTED' CHECK (status IN ('DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_REQUIRED', 'VERIFIED', 'APPROVED', 'REJECTED', 'PAID')),
  description TEXT,
  submitted_by UUID REFERENCES public.profiles(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payment_claims_project ON public.payment_claims(project_id, status);
CREATE INDEX IF NOT EXISTS idx_payment_claims_contractor ON public.payment_claims(contractor_organization_id, status);

-- 4. Create payment_claim_documents table
CREATE TABLE IF NOT EXISTS public.payment_claim_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_claim_id UUID NOT NULL REFERENCES public.payment_claims(id) ON DELETE CASCADE,
  document_id UUID,
  document_type TEXT NOT NULL DEFAULT 'INVOICE' CHECK (document_type IN ('INVOICE', 'MEASUREMENT_BOOK', 'QUALITY_TEST_CERTIFICATE', 'TAX_INVOICE', 'LABOR_CESS_RECEIPT', 'OTHER')),
  title TEXT NOT NULL DEFAULT 'Payment Voucher',
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_claim_docs_claim ON public.payment_claim_documents(payment_claim_id);

-- 5. Create payments table
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_claim_id UUID NOT NULL REFERENCES public.payment_claims(id) ON DELETE RESTRICT,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE RESTRICT,
  contractor_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  amount_paid NUMERIC(14, 2) NOT NULL CHECK (amount_paid > 0),
  payment_reference TEXT NOT NULL UNIQUE,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'PFMS_RTGS' CHECK (payment_method IN ('PFMS_RTGS', 'TREASURY_CHALLAN', 'NEFT', 'LETTER_OF_CREDIT', 'OTHER')),
  recorded_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_project ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_claim ON public.payments(payment_claim_id);
