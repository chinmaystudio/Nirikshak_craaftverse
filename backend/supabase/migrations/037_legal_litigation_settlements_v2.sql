-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 037_legal_litigation_settlements_v2.sql
-- Domain: Legal Disputes, Court Litigation, Hearings & Structured Settlement Management
-- ==============================================================================

-- 1. Create litigations table
CREATE TABLE IF NOT EXISTS public.litigations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  case_number TEXT NOT NULL,
  case_title TEXT NOT NULL,
  court_or_forum TEXT NOT NULL,
  jurisdiction TEXT,
  litigation_type TEXT NOT NULL DEFAULT 'CONTRACT_DISPUTE' CHECK (litigation_type IN (
    'CONTRACT_DISPUTE', 'LAND_ACQUISITION', 'PAYMENT_DISPUTE', 'ENVIRONMENTAL',
    'PUBLIC_INTEREST', 'LABOUR', 'TAX', 'ARBITRATION', 'OTHER'
  )),
  filing_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN (
    'OPEN', 'UNDER_HEARING', 'STAY_ORDER', 'MEDIATION', 'SETTLED', 'DISMISSED', 'CLOSED'
  )),
  government_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  contractor_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  opposing_party TEXT NOT NULL,
  claimed_amount NUMERIC(14, 2) CHECK (claimed_amount IS NULL OR claimed_amount >= 0),
  risk_level TEXT DEFAULT 'MEDIUM' CHECK (risk_level IS NULL OR risk_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  summary TEXT,
  next_hearing_date DATE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_litigation_case UNIQUE (case_number, court_or_forum)
);

CREATE INDEX IF NOT EXISTS idx_litigations_project ON public.litigations(project_id, status);
CREATE INDEX IF NOT EXISTS idx_litigations_gov_org ON public.litigations(government_organization_id);
CREATE INDEX IF NOT EXISTS idx_litigations_contractor ON public.litigations(contractor_organization_id);

-- 2. Create litigation_events table
CREATE TABLE IF NOT EXISTS public.litigation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  litigation_id UUID NOT NULL REFERENCES public.litigations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL DEFAULT 'HEARING' CHECK (event_type IN ('HEARING', 'ORDER_ISSUED', 'PETITION_FILED', 'AFFIDAVIT_SUBMITTED', 'STAY_GRANTED', 'STAY_VACATED', 'MEDIATION_SESSION', 'OTHER')),
  event_date DATE NOT NULL DEFAULT CURRENT_DATE,
  summary TEXT NOT NULL,
  document_id UUID,
  next_action TEXT,
  next_action_due_date DATE,
  created_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_litigation_events_case ON public.litigation_events(litigation_id, event_date DESC);

-- 3. Create settlements table
CREATE TABLE IF NOT EXISTS public.settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  litigation_id UUID REFERENCES public.litigations(id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  settlement_number TEXT NOT NULL UNIQUE,
  settlement_type TEXT NOT NULL DEFAULT 'ARBITRATION_AWARD' CHECK (settlement_type IN ('MUTUAL_AGREEMENT', 'ARBITRATION_AWARD', 'COURT_DECREE', 'EX_GRATIA', 'OTHER')),
  proposed_amount NUMERIC(14, 2) CHECK (proposed_amount IS NULL OR proposed_amount >= 0),
  approved_amount NUMERIC(14, 2) CHECK (approved_amount IS NULL OR approved_amount >= 0),
  terms TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'PROPOSED' CHECK (status IN ('DRAFT', 'PROPOSED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'EXECUTED', 'CANCELLED')),
  proposed_by UUID REFERENCES public.profiles(id),
  proposed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  approved_by UUID REFERENCES public.profiles(id),
  approved_at TIMESTAMPTZ,
  effective_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_settlements_project ON public.settlements(project_id, status);
CREATE INDEX IF NOT EXISTS idx_settlements_litigation ON public.settlements(litigation_id);
