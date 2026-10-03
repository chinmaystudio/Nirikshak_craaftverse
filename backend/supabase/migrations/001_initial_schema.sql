-- NIRIKSHAK Core PostgreSQL Schema
-- Migration 001: Initial Complete Relational Schema

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUMS
DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'citizen',
    'government_admin',
    'project_officer',
    'government_engineer',
    'chief_engineer',
    'auditor',
    'contractor_admin',
    'contractor_manager',
    'contractor_site_engineer'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE org_type AS ENUM (
    'government',
    'contractor',
    'consultant',
    'PSU',
    'ULB',
    'authority',
    'other'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE project_status AS ENUM (
    'PROPOSED',
    'DPR_STAGE',
    'APPROVED',
    'TENDERED',
    'AWARDED',
    'UNDER_CONSTRUCTION',
    'DELAYED',
    'STALLED',
    'SUSPENDED',
    'COMPLETED',
    'CANCELLED',
    'UNKNOWN',
    'OTHER'
  );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 3. PROFILES
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT 'User',
  phone TEXT,
  avatar_url TEXT,
  city TEXT,
  state TEXT,
  role user_role NOT NULL DEFAULT 'citizen',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. ORGANIZATIONS
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type org_type NOT NULL DEFAULT 'other',
  parent_id UUID REFERENCES public.organizations(id),
  registration_number TEXT,
  department TEXT,
  state TEXT,
  district TEXT,
  verified BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member',
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(organization_id, user_id)
);

-- 5. SOURCES & IMPORT STAGING
CREATE TABLE IF NOT EXISTS public.sources (
  id TEXT PRIMARY KEY,
  source_code TEXT,
  source_name TEXT NOT NULL,
  publisher TEXT,
  exact_url TEXT,
  years_covered TEXT,
  geography TEXT,
  evidence_quality TEXT,
  verified BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.import_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  sha256 TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  rows_total INTEGER NOT NULL DEFAULT 0,
  rows_success INTEGER NOT NULL DEFAULT 0,
  rows_failed INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.project_import_staging (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID REFERENCES public.import_batches(id),
  source_sheet TEXT,
  raw_row JSONB NOT NULL,
  validation_status TEXT NOT NULL DEFAULT 'PENDING',
  validation_errors JSONB,
  imported_project_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. PROJECTS (Core System of Record)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nirikshak_project_id TEXT UNIQUE NOT NULL,
  official_project_id TEXT,
  project_name TEXT NOT NULL,
  description TEXT,
  sector TEXT,
  subsector TEXT,
  project_type TEXT,
  ministry TEXT,
  department TEXT,
  project_authority TEXT,
  implementing_agency TEXT,
  executing_agency TEXT,
  contractor_concessionaire TEXT,
  operator TEXT,
  ownership_type TEXT,
  procurement_mode TEXT,
  award_date DATE,
  planned_start_date DATE,
  actual_start_date DATE,
  original_completion_date DATE,
  revised_completion_date DATE,
  actual_completion_date DATE,
  state TEXT,
  district TEXT,
  city TEXT,
  location_text TEXT,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  total_cost_inr_crore NUMERIC,
  original_cost_inr_crore NUMERIC,
  revised_cost_inr_crore NUMERIC,
  amount_spent_inr_crore NUMERIC,
  physical_progress_percent NUMERIC,
  financial_progress_percent NUMERIC,
  reported_status TEXT,
  normalized_status project_status NOT NULL DEFAULT 'UNKNOWN',
  record_scope TEXT,
  current_status_verified BOOLEAN NOT NULL DEFAULT FALSE,
  quality_score NUMERIC,
  duplicate_review TEXT,
  source_record_id TEXT,
  primary_source_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  public_summary TEXT,
  published_at TIMESTAMPTZ,
  published_by UUID REFERENCES auth.users(id),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1
);

-- 7. PROJECT ALIASES & UPDATES
CREATE TABLE IF NOT EXISTS public.project_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  alias_text TEXT NOT NULL,
  alias_type TEXT DEFAULT 'COMMON',
  source_id TEXT REFERENCES public.sources(id),
  source_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  observation_date DATE,
  update_type TEXT,
  status_reported TEXT,
  status_normalized project_status,
  physical_progress_percent NUMERIC,
  schedule_variance_days TEXT,
  update_text TEXT,
  source_id TEXT REFERENCES public.sources(id),
  source_record_id TEXT,
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.project_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  relationship TEXT NOT NULL, -- 'owner', 'implementing_agency', 'contractor', 'consultant', 'auditor'
  valid_from DATE,
  valid_to DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.source_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  observed_value TEXT,
  observed_unit TEXT,
  observation_date DATE,
  source_retrieval_date DATE,
  source_id TEXT REFERENCES public.sources(id),
  source_record_id TEXT,
  source_url TEXT,
  raw_field_name TEXT,
  transform_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. TENDERS & CONTRACTS
CREATE TABLE IF NOT EXISTS public.tenders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  official_tender_id TEXT,
  tender_number TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  issuing_organization_id UUID REFERENCES public.organizations(id),
  estimated_value_inr_crore NUMERIC,
  publication_date DATE,
  bid_due_date DATE,
  status TEXT NOT NULL DEFAULT 'PUBLISHED', -- 'DRAFT', 'PUBLISHED', 'CLOSED', 'AWARDED'
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.tender_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tender_id UUID NOT NULL REFERENCES public.tenders(id) ON DELETE CASCADE,
  contractor_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  bid_amount NUMERIC NOT NULL,
  technical_score NUMERIC,
  financial_score NUMERIC,
  status TEXT NOT NULL DEFAULT 'SUBMITTED', -- 'SUBMITTED', 'UNDER_EVALUATION', 'ACCEPTED', 'REJECTED'
  proposal_summary TEXT,
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tender_id UUID REFERENCES public.tenders(id),
  contractor_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  official_contract_id TEXT,
  contract_number TEXT NOT NULL,
  contract_title TEXT NOT NULL,
  contract_value NUMERIC NOT NULL,
  award_date DATE,
  scheduled_start_date DATE,
  scheduled_completion_date DATE,
  actual_completion_date DATE,
  status TEXT NOT NULL DEFAULT 'ACTIVE', -- 'ACTIVE', 'COMPLETED', 'TERMINATED'
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

-- 9. MILESTONES & PROGRESS
CREATE TABLE IF NOT EXISTS public.project_milestones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_name TEXT NOT NULL,
  description TEXT,
  milestone_type TEXT DEFAULT 'CONSTRUCTION',
  planned_start_date DATE,
  planned_end_date DATE,
  revised_end_date DATE,
  actual_start_date DATE,
  actual_end_date DATE,
  planned_progress NUMERIC NOT NULL DEFAULT 0,
  verified_progress NUMERIC NOT NULL DEFAULT 0,
  planned_cost NUMERIC,
  actual_cost NUMERIC,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING', 'IN_PROGRESS', 'COMPLETED', 'DELAYED'
  display_order INTEGER NOT NULL DEFAULT 1,
  weightage NUMERIC NOT NULL DEFAULT 10.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.progress_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  milestone_id UUID REFERENCES public.project_milestones(id) ON DELETE CASCADE,
  contractor_organization_id UUID REFERENCES public.organizations(id),
  reported_progress NUMERIC NOT NULL,
  description TEXT,
  submitted_by UUID REFERENCES auth.users(id),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  verification_status TEXT NOT NULL DEFAULT 'SUBMITTED', -- 'SUBMITTED', 'APPROVED', 'REJECTED', 'REQUEST_CLARIFICATION'
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  verified_progress NUMERIC,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.progress_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  progress_update_id UUID NOT NULL REFERENCES public.progress_updates(id) ON DELETE CASCADE,
  evidence_type TEXT NOT NULL DEFAULT 'photo', -- 'photo', 'video', 'report', 'invoice', 'sensor', 'drone'
  storage_path TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. COMPLAINTS & GRIEVANCES
CREATE TABLE IF NOT EXISTS public.complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reference_number TEXT UNIQUE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  user_id UUID REFERENCES auth.users(id),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  severity TEXT NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  status TEXT NOT NULL DEFAULT 'SUBMITTED', -- 'SUBMITTED', 'UNDER_REVIEW', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'REJECTED', 'CLOSED'
  assigned_organization_id UUID REFERENCES public.organizations(id),
  assigned_user_id UUID REFERENCES auth.users(id),
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  upvotes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.complaint_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  file_path TEXT NOT NULL,
  evidence_type TEXT NOT NULL DEFAULT 'photo',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.complaint_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  actor_id UUID REFERENCES auth.users(id),
  status_from TEXT,
  status_to TEXT NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. INSPECTIONS
CREATE TABLE IF NOT EXISTS public.inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL DEFAULT 'ROUTINE',
  scheduled_date DATE,
  inspection_date DATE,
  inspector_id UUID REFERENCES auth.users(id),
  status TEXT NOT NULL DEFAULT 'SCHEDULED', -- 'SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'
  summary TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.inspection_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'MEDIUM', -- 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'
  description TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  evidence_path TEXT,
  required_action TEXT,
  deadline DATE,
  status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. FINANCE & DELAYS
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
  source_id TEXT REFERENCES public.sources(id),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.delay_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  observation_date DATE,
  delay_category TEXT NOT NULL,
  delay_reason TEXT NOT NULL,
  delay_days INTEGER,
  affected_milestone TEXT,
  evidence_text TEXT,
  source_id TEXT REFERENCES public.sources(id),
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. ENVIRONMENT
CREATE TABLE IF NOT EXISTS public.environmental_clearances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  proposal_id TEXT,
  clearance_type TEXT NOT NULL,
  application_date DATE,
  decision_date DATE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  issuing_authority TEXT,
  conditions TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.environmental_baselines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  metric TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  measured_at TIMESTAMPTZ DEFAULT NOW(),
  source TEXT,
  source_document_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.environmental_commitments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  commitment TEXT NOT NULL,
  expected_value NUMERIC,
  actual_value NUMERIC,
  unit TEXT,
  deadline DATE,
  source_document_id UUID,
  status TEXT NOT NULL DEFAULT 'OPEN', -- 'OPEN', 'COMPLIED', 'BREACHED'
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. DOCUMENTS & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.project_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL,
  title TEXT NOT NULL,
  document_date DATE,
  publisher TEXT,
  storage_path TEXT,
  external_url TEXT,
  sha256 TEXT,
  is_public BOOLEAN NOT NULL DEFAULT TRUE,
  uploaded_by UUID REFERENCES auth.users(id),
  source_id TEXT REFERENCES public.sources(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. AI LAYER
CREATE TABLE IF NOT EXISTS public.ai_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  task TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'openrouter',
  model TEXT,
  prompt_version TEXT,
  input_hash TEXT,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  input_tokens INTEGER,
  output_tokens INTEGER,
  latency_ms INTEGER,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  ai_run_id UUID REFERENCES public.ai_runs(id),
  insight_type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'MEDIUM',
  confidence NUMERIC DEFAULT 0.85,
  evidence JSONB NOT NULL DEFAULT '[]'::jsonb,
  recommended_actions JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id),
  actor_organization_id UUID REFERENCES public.organizations(id),
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  old_value JSONB,
  new_value JSONB,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 17. VIEWS
CREATE OR REPLACE VIEW public.public_projects_view AS
SELECT
  p.id,
  p.nirikshak_project_id,
  p.project_name,
  p.sector,
  p.subsector,
  p.project_authority,
  p.state,
  p.district,
  p.city,
  p.location_text,
  p.latitude,
  p.longitude,
  p.normalized_status,
  p.physical_progress_percent,
  p.total_cost_inr_crore,
  p.original_completion_date,
  p.revised_completion_date,
  p.actual_completion_date,
  p.contractor_concessionaire,
  p.quality_score,
  p.current_status_verified,
  p.public_summary,
  p.primary_source_url,
  p.updated_at
FROM public.projects p
WHERE p.is_public = TRUE AND p.deleted_at IS NULL;

CREATE OR REPLACE VIEW public.government_project_summary_view AS
SELECT
  p.id,
  p.nirikshak_project_id,
  p.official_project_id,
  p.project_name,
  p.sector,
  p.subsector,
  p.project_authority,
  p.implementing_agency,
  p.contractor_concessionaire,
  p.state,
  p.district,
  p.city,
  p.latitude,
  p.longitude,
  p.total_cost_inr_crore,
  p.amount_spent_inr_crore,
  p.physical_progress_percent,
  p.financial_progress_percent,
  p.normalized_status,
  p.reported_status,
  p.award_date,
  p.original_completion_date,
  p.revised_completion_date,
  p.quality_score,
  p.current_status_verified,
  p.is_public,
  p.created_at,
  p.updated_at,
  COUNT(DISTINCT c.id) AS total_complaints,
  COUNT(DISTINCT pu.id) FILTER (WHERE pu.verification_status = 'SUBMITTED') AS pending_progress_reviews
FROM public.projects p
LEFT JOIN public.complaints c ON c.project_id = p.id
LEFT JOIN public.progress_updates pu ON pu.project_id = p.id
WHERE p.deleted_at IS NULL
GROUP BY p.id;

CREATE OR REPLACE VIEW public.contractor_assigned_projects_view AS
SELECT
  p.id,
  p.nirikshak_project_id,
  p.project_name,
  p.sector,
  p.subsector,
  p.project_authority,
  p.location_text,
  p.total_cost_inr_crore,
  p.physical_progress_percent,
  p.normalized_status,
  p.original_completion_date,
  p.revised_completion_date,
  po.organization_id AS contractor_org_id,
  c.contract_number,
  c.contract_value
FROM public.projects p
JOIN public.project_organizations po ON po.project_id = p.id AND po.relationship = 'contractor'
LEFT JOIN public.contracts c ON c.project_id = p.id AND c.contractor_organization_id = po.organization_id
WHERE p.deleted_at IS NULL;

-- 18. RLS HELPER FUNCTIONS
CREATE OR REPLACE FUNCTION public.auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_government_user()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('government_admin', 'project_officer', 'government_engineer', 'chief_engineer', 'auditor')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_contractor_user()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
      AND role IN ('contractor_admin', 'contractor_manager', 'contractor_site_engineer')
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_citizen()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'citizen'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.belongs_to_organization(target_org_id UUID)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = auth.uid() AND organization_id = target_org_id AND status = 'active'
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_access_project(p_id UUID)
RETURNS boolean AS $$
  SELECT (
    public.is_government_user()
    OR EXISTS (
      SELECT 1 FROM public.project_organizations po
      JOIN public.organization_members om ON om.organization_id = po.organization_id
      WHERE po.project_id = p_id AND om.user_id = auth.uid() AND om.status = 'active'
    )
    OR EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = p_id AND p.is_public = TRUE AND p.deleted_at IS NULL
    )
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- 19. ATOMIC PROGRESS REVIEW RPC
CREATE OR REPLACE FUNCTION public.approve_progress_update(
  p_update_id UUID,
  p_decision TEXT,
  p_verified_progress NUMERIC,
  p_review_notes TEXT
)
RETURNS JSONB AS $$
DECLARE
  v_project_id UUID;
  v_milestone_id UUID;
  v_contractor_org_id UUID;
  v_new_project_progress NUMERIC;
BEGIN
  IF NOT public.is_government_user() THEN
    RAISE EXCEPTION 'Access denied. Only government officers can review contractor progress.';
  END IF;

  SELECT project_id, milestone_id, contractor_organization_id
  INTO v_project_id, v_milestone_id, v_contractor_org_id
  FROM public.progress_updates
  WHERE id = p_update_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Progress update not found.';
  END IF;

  UPDATE public.progress_updates
  SET
    verification_status = p_decision,
    verified_progress = CASE WHEN p_decision = 'APPROVED' THEN p_verified_progress ELSE verified_progress END,
    review_notes = p_review_notes,
    reviewed_by = auth.uid(),
    reviewed_at = NOW(),
    updated_at = NOW()
  WHERE id = p_update_id;

  IF p_decision = 'APPROVED' AND v_milestone_id IS NOT NULL THEN
    UPDATE public.project_milestones
    SET
      verified_progress = p_verified_progress,
      status = CASE WHEN p_verified_progress >= 100 THEN 'COMPLETED' ELSE 'IN_PROGRESS' END,
      updated_at = NOW()
    WHERE id = v_milestone_id;

    SELECT COALESCE(SUM(verified_progress * weightage) / NULLIF(SUM(weightage), 0), p_verified_progress)
    INTO v_new_project_progress
    FROM public.project_milestones
    WHERE project_id = v_project_id AND deleted_at IS NULL;

    UPDATE public.projects
    SET
      physical_progress_percent = ROUND(v_new_project_progress, 2),
      current_status_verified = TRUE,
      updated_at = NOW()
    WHERE id = v_project_id;
  END IF;

  INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
  VALUES (
    auth.uid(),
    'PROGRESS_REVIEW_' || p_decision,
    'progress_updates',
    p_update_id,
    jsonb_build_object(
      'decision', p_decision,
      'verified_progress', p_verified_progress,
      'notes', p_review_notes,
      'project_id', v_project_id
    )
  );

  IF v_contractor_org_id IS NOT NULL THEN
    INSERT INTO public.notifications (organization_id, type, title, message, entity_type, entity_id)
    VALUES (
      v_contractor_org_id,
      'PROGRESS_REVIEWED',
      'Progress Submission ' || p_decision,
      'Government officer reviewed progress report: ' || p_decision || '. ' || COALESCE(p_review_notes, ''),
      'projects',
      v_project_id
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'decision', p_decision,
    'project_id', v_project_id,
    'verified_progress', p_verified_progress
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 20. PROFILE AUTO-CREATION ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Citizen User'),
    COALESCE((new.raw_user_meta_data->>'role')::user_role, 'citizen')
  )
  ON CONFLICT (id) DO UPDATE
  SET full_name = EXCLUDED.full_name;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 21. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tender_bids ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.complaint_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspection_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delay_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_clearances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_commitments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.environmental_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- 22. RLS POLICIES
CREATE POLICY profiles_select ON public.profiles FOR SELECT USING (true);
CREATE POLICY profiles_update_own ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY orgs_select ON public.organizations FOR SELECT USING (true);
CREATE POLICY orgs_gov_all ON public.organizations FOR ALL USING (public.is_government_user());

CREATE POLICY projects_select ON public.projects FOR SELECT
USING (
  (is_public = TRUE AND deleted_at IS NULL)
  OR public.is_government_user()
  OR EXISTS (
    SELECT 1 FROM public.project_organizations po
    JOIN public.organization_members om ON om.organization_id = po.organization_id
    WHERE po.project_id = projects.id AND om.user_id = auth.uid() AND om.status = 'active'
  )
);
CREATE POLICY projects_gov_insert ON public.projects FOR INSERT WITH CHECK (public.is_government_user());
CREATE POLICY projects_gov_update ON public.projects FOR UPDATE USING (public.is_government_user());
CREATE POLICY projects_gov_delete ON public.projects FOR DELETE USING (public.is_government_user());

CREATE POLICY aliases_select ON public.project_aliases FOR SELECT USING (true);
CREATE POLICY aliases_gov_all ON public.project_aliases FOR ALL USING (public.is_government_user());

CREATE POLICY updates_select ON public.project_updates FOR SELECT USING (true);
CREATE POLICY updates_gov_all ON public.project_updates FOR ALL USING (public.is_government_user());

CREATE POLICY proj_orgs_select ON public.project_organizations FOR SELECT USING (true);
CREATE POLICY proj_orgs_gov_all ON public.project_organizations FOR ALL USING (public.is_government_user());

CREATE POLICY source_obs_select ON public.source_observations FOR SELECT USING (true);
CREATE POLICY source_obs_gov_all ON public.source_observations FOR ALL USING (public.is_government_user());

CREATE POLICY sources_select ON public.sources FOR SELECT USING (true);
CREATE POLICY sources_gov_all ON public.sources FOR ALL USING (public.is_government_user());

CREATE POLICY tenders_select ON public.tenders FOR SELECT
USING (
  (is_public = TRUE AND deleted_at IS NULL)
  OR public.is_government_user()
  OR public.is_contractor_user()
);
CREATE POLICY tenders_gov_all ON public.tenders FOR ALL USING (public.is_government_user());

CREATE POLICY bids_select ON public.tender_bids FOR SELECT
USING (
  public.is_government_user()
  OR (submitted_by = auth.uid())
  OR public.belongs_to_organization(contractor_organization_id)
);
CREATE POLICY bids_contractor_insert ON public.tender_bids FOR INSERT
WITH CHECK (public.is_contractor_user() OR auth.uid() IS NOT NULL);

CREATE POLICY contracts_select ON public.contracts FOR SELECT
USING (
  public.is_government_user()
  OR public.belongs_to_organization(contractor_organization_id)
  OR public.is_citizen()
);
CREATE POLICY contracts_gov_all ON public.contracts FOR ALL USING (public.is_government_user());

CREATE POLICY milestones_select ON public.project_milestones FOR SELECT
USING (public.can_access_project(project_id));
CREATE POLICY milestones_gov_all ON public.project_milestones FOR ALL USING (public.is_government_user());

CREATE POLICY progress_select ON public.progress_updates FOR SELECT
USING (
  public.is_government_user()
  OR (submitted_by = auth.uid())
  OR (contractor_organization_id IS NOT NULL AND public.belongs_to_organization(contractor_organization_id))
  OR verification_status = 'APPROVED'
);
CREATE POLICY progress_contractor_insert ON public.progress_updates FOR INSERT
WITH CHECK (
  public.is_contractor_user()
  OR public.is_government_user()
  OR auth.uid() IS NOT NULL
);
CREATE POLICY progress_gov_update ON public.progress_updates FOR UPDATE USING (public.is_government_user());

CREATE POLICY progress_evidence_select ON public.progress_evidence FOR SELECT USING (true);
CREATE POLICY progress_evidence_insert ON public.progress_evidence FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY complaints_select ON public.complaints FOR SELECT
USING (
  is_public = TRUE
  OR user_id = auth.uid()
  OR public.is_government_user()
);
CREATE POLICY complaints_insert ON public.complaints FOR INSERT WITH CHECK (true);
CREATE POLICY complaints_update ON public.complaints FOR UPDATE USING (public.is_government_user() OR user_id = auth.uid());

CREATE POLICY complaint_evidence_all ON public.complaint_evidence FOR ALL USING (true);
CREATE POLICY complaint_updates_select ON public.complaint_updates FOR SELECT USING (true);
CREATE POLICY complaint_updates_gov ON public.complaint_updates FOR INSERT WITH CHECK (public.is_government_user() OR auth.uid() IS NOT NULL);

CREATE POLICY inspections_select ON public.inspections FOR SELECT USING (public.is_government_user() OR public.can_access_project(project_id));
CREATE POLICY inspections_gov_all ON public.inspections FOR ALL USING (public.is_government_user());

CREATE POLICY findings_select ON public.inspection_findings FOR SELECT USING (true);
CREATE POLICY findings_gov_all ON public.inspection_findings FOR ALL USING (public.is_government_user());

CREATE POLICY finance_select ON public.financial_updates FOR SELECT USING (public.is_government_user() OR public.can_access_project(project_id));
CREATE POLICY finance_gov_all ON public.financial_updates FOR ALL USING (public.is_government_user());

CREATE POLICY delays_select ON public.delay_events FOR SELECT USING (true);
CREATE POLICY delays_gov_all ON public.delay_events FOR ALL USING (public.is_government_user());

CREATE POLICY env_clearances_select ON public.environmental_clearances FOR SELECT USING (true);
CREATE POLICY env_clearances_gov ON public.environmental_clearances FOR ALL USING (public.is_government_user());

CREATE POLICY env_baselines_select ON public.environmental_baselines FOR SELECT USING (true);
CREATE POLICY env_commitments_select ON public.environmental_commitments FOR SELECT USING (true);
CREATE POLICY env_observations_select ON public.environmental_observations FOR SELECT USING (true);
CREATE POLICY env_observations_insert ON public.environmental_observations FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY env_incidents_select ON public.environmental_incidents FOR SELECT USING (true);
CREATE POLICY env_incidents_insert ON public.environmental_incidents FOR INSERT WITH CHECK (true);

CREATE POLICY documents_select ON public.project_documents FOR SELECT USING (is_public = TRUE OR public.is_government_user() OR public.can_access_project(project_id));
CREATE POLICY documents_gov_all ON public.project_documents FOR ALL USING (public.is_government_user());

CREATE POLICY notifications_select ON public.notifications FOR SELECT
USING (
  user_id = auth.uid()
  OR (organization_id IS NOT NULL AND public.belongs_to_organization(organization_id))
);
CREATE POLICY notifications_update ON public.notifications FOR UPDATE
USING (
  user_id = auth.uid()
  OR (organization_id IS NOT NULL AND public.belongs_to_organization(organization_id))
);

CREATE POLICY ai_runs_select ON public.ai_runs FOR SELECT USING (public.is_government_user() OR public.is_contractor_user());
CREATE POLICY ai_insights_select ON public.ai_insights FOR SELECT USING (public.is_government_user() OR public.can_access_project(project_id));
CREATE POLICY audit_select ON public.audit_logs FOR SELECT USING (public.is_government_user());
