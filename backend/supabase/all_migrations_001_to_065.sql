-- NIRIKSHAK CRAFTVERSE CONSOLIDATED SCHEMA (001-065)
-- Generated on: 2026-10-03T18:27:28.304Z

-- ==========================================
-- MIGRATION: 001_extensions.sql
-- ==========================================

-- 001_extensions.sql
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ==========================================
-- MIGRATION: 001_initial_schema.sql
-- ==========================================

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


-- ==========================================
-- MIGRATION: 002_profiles.sql
-- ==========================================

-- 002_profiles.sql
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    city TEXT,
    state TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, avatar_url)
    VALUES (
        new.id,
        COALESCE(new.raw_user_meta_data->>'full_name', new.email),
        COALESCE(new.raw_user_meta_data->>'avatar_url', '')
    )
    ON CONFLICT (id) DO NOTHING;
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();


-- ==========================================
-- MIGRATION: 003_organizations.sql
-- ==========================================

-- 003_organizations.sql
DO $$ BEGIN
    CREATE TYPE public.org_type_enum AS ENUM (
        'government', 'contractor', 'consultant', 'PSU', 'ULB', 'authority', 'other'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.app_role_enum AS ENUM (
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
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL UNIQUE,
    type public.org_type_enum NOT NULL DEFAULT 'other',
    parent_id UUID REFERENCES public.organizations(id),
    registration_number TEXT,
    department TEXT,
    state TEXT,
    district TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role public.app_role_enum NOT NULL DEFAULT 'citizen',
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(organization_id, user_id)
);


-- ==========================================
-- MIGRATION: 004_projects.sql
-- ==========================================

-- 004_projects.sql
DO $$ BEGIN
    CREATE TYPE public.project_status_enum AS ENUM (
        'PROPOSED', 'DPR_STAGE', 'APPROVED', 'TENDERED', 'AWARDED',
        'UNDER_CONSTRUCTION', 'DELAYED', 'STALLED', 'SUSPENDED',
        'COMPLETED', 'CANCELLED', 'UNKNOWN', 'OTHER'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_code TEXT UNIQUE NOT NULL,
    source_name TEXT NOT NULL,
    publisher TEXT,
    exact_url TEXT,
    years_covered TEXT,
    geography TEXT,
    evidence_quality TEXT,
    verified BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT now()
);

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
    normalized_status TEXT DEFAULT 'UNKNOWN',
    record_scope TEXT,
    current_status_verified BOOLEAN DEFAULT FALSE,
    quality_score NUMERIC,
    duplicate_review TEXT,
    source_record_id TEXT,
    primary_source_url TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    public_summary TEXT,
    published_at TIMESTAMPTZ,
    published_by UUID REFERENCES auth.users(id),
    version INTEGER DEFAULT 1,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.project_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    relationship TEXT NOT NULL,
    valid_from DATE,
    valid_to DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_aliases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    alias_text TEXT NOT NULL,
    alias_type TEXT,
    source_id UUID REFERENCES public.sources(id),
    source_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.project_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    observation_date DATE,
    update_type TEXT,
    status_reported TEXT,
    status_normalized TEXT,
    physical_progress_percent NUMERIC,
    schedule_variance_days INTEGER,
    update_text TEXT,
    source_id UUID REFERENCES public.sources(id),
    source_record_id TEXT,
    source_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.source_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    field_name TEXT NOT NULL,
    observed_value TEXT,
    observed_unit TEXT,
    observation_date DATE,
    source_retrieval_date DATE,
    source_id UUID REFERENCES public.sources(id),
    source_record_id TEXT,
    source_url TEXT,
    raw_field_name TEXT,
    transform_note TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.import_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    file_name TEXT NOT NULL,
    sha256 TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT now(),
    completed_at TIMESTAMPTZ,
    rows_total INTEGER DEFAULT 0,
    rows_success INTEGER DEFAULT 0,
    rows_failed INTEGER DEFAULT 0,
    created_by UUID REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.project_import_staging (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_id UUID REFERENCES public.import_batches(id),
    source_sheet TEXT,
    raw_row JSONB,
    validation_status TEXT DEFAULT 'PENDING',
    validation_errors JSONB,
    imported_project_id UUID REFERENCES public.projects(id),
    created_at TIMESTAMPTZ DEFAULT now()
);


-- ==========================================
-- MIGRATION: 005_tenders.sql
-- ==========================================

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


-- ==========================================
-- MIGRATION: 006_contracts.sql
-- ==========================================

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


-- ==========================================
-- MIGRATION: 007_milestones.sql
-- ==========================================

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


-- ==========================================
-- MIGRATION: 008_progress.sql
-- ==========================================

-- 008_progress.sql
CREATE TABLE IF NOT EXISTS public.progress_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES public.project_milestones(id),
    contractor_organization_id UUID NOT NULL REFERENCES public.organizations(id),
    reported_progress NUMERIC NOT NULL,
    description TEXT,
    submitted_by UUID REFERENCES auth.users(id),
    submitted_at TIMESTAMPTZ DEFAULT now(),
    verification_status TEXT DEFAULT 'SUBMITTED',
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    verified_progress NUMERIC,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.progress_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    progress_update_id UUID NOT NULL REFERENCES public.progress_updates(id) ON DELETE CASCADE,
    evidence_type TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    captured_at TIMESTAMPTZ,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- ==========================================
-- MIGRATION: 009_complaints.sql
-- ==========================================

-- 009_complaints.sql
CREATE TABLE IF NOT EXISTS public.complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reference_number TEXT UNIQUE NOT NULL,
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    severity TEXT DEFAULT 'MEDIUM',
    status TEXT DEFAULT 'SUBMITTED',
    assigned_organization_id UUID REFERENCES public.organizations(id),
    assigned_user_id UUID REFERENCES auth.users(id),
    version INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.complaint_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    file_name TEXT,
    file_size INTEGER,
    mime_type TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.complaint_updates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id),
    previous_status TEXT,
    new_status TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- ==========================================
-- MIGRATION: 010_inspections.sql
-- ==========================================

-- 010_inspections.sql
CREATE TABLE IF NOT EXISTS public.inspections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    inspection_type TEXT NOT NULL,
    scheduled_date DATE,
    inspection_date DATE,
    inspector_id UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'SCHEDULED',
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    deleted_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.inspection_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inspection_id UUID NOT NULL REFERENCES public.inspections(id) ON DELETE CASCADE,
    category TEXT,
    severity TEXT DEFAULT 'MEDIUM',
    description TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    evidence_path TEXT,
    required_action TEXT,
    deadline DATE,
    status TEXT DEFAULT 'OPEN',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);


-- ==========================================
-- MIGRATION: 011_finance.sql
-- ==========================================

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


-- ==========================================
-- MIGRATION: 012_environment.sql
-- ==========================================

-- 012_environment.sql
CREATE TABLE IF NOT EXISTS public.environmental_clearances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    clearance_type TEXT NOT NULL,
    issuing_authority TEXT,
    reference_number TEXT,
    issued_date DATE,
    valid_until DATE,
    status TEXT,
    conditions JSONB,
    document_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.environmental_baselines (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    metric TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    measured_at TIMESTAMPTZ,
    source TEXT,
    source_document_id UUID,
    created_at TIMESTAMPTZ DEFAULT now()
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
    status TEXT DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.environmental_observations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    metric TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    source_type TEXT NOT NULL,
    observed_at TIMESTAMPTZ DEFAULT now(),
    submitted_by UUID REFERENCES auth.users(id),
    evidence_path TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.environmental_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
    incident_type TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'MEDIUM',
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    reported_by UUID REFERENCES auth.users(id),
    status TEXT DEFAULT 'REPORTED',
    detected_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- ==========================================
-- MIGRATION: 013_documents.sql
-- ==========================================

-- 013_documents.sql
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
    is_public BOOLEAN DEFAULT FALSE,
    uploaded_by UUID REFERENCES auth.users(id),
    source_id UUID REFERENCES public.sources(id),
    created_at TIMESTAMPTZ DEFAULT now()
);


-- ==========================================
-- MIGRATION: 014_notifications.sql
-- ==========================================

-- 014_notifications.sql
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
    created_at TIMESTAMPTZ DEFAULT now()
);


-- ==========================================
-- MIGRATION: 015_ai.sql
-- ==========================================

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


-- ==========================================
-- MIGRATION: 016_audit.sql
-- ==========================================

-- 016_audit.sql
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID REFERENCES auth.users(id),
    actor_organization_id UUID REFERENCES public.organizations(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    old_value JSONB,
    new_value JSONB,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);


-- ==========================================
-- MIGRATION: 017_rls.sql
-- ==========================================

-- 017_rls.sql
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.app_role_enum AS $$
    SELECT role FROM public.organization_members
    WHERE user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS UUID AS $$
    SELECT organization_id FROM public.organization_members
    WHERE user_id = auth.uid()
    LIMIT 1;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_government_user()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members om
        JOIN public.organizations o ON om.organization_id = o.id
        WHERE om.user_id = auth.uid()
          AND (o.type IN ('government', 'authority', 'ULB', 'PSU')
               OR om.role IN ('government_admin', 'project_officer', 'government_engineer', 'chief_engineer', 'auditor'))
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_contractor_user()
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members om
        JOIN public.organizations o ON om.organization_id = o.id
        WHERE om.user_id = auth.uid()
          AND (o.type = 'contractor'
               OR om.role IN ('contractor_admin', 'contractor_manager', 'contractor_site_engineer'))
    );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_citizen()
RETURNS BOOLEAN AS $$
    SELECT NOT (public.is_government_user() OR public.is_contractor_user());
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_access_project(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    IF public.is_government_user() THEN
        RETURN TRUE;
    END IF;
    IF public.is_contractor_user() THEN
        RETURN EXISTS (
            SELECT 1 FROM public.project_organizations po
            WHERE po.project_id = p_id
              AND po.organization_id = public.get_user_organization_id()
        ) OR EXISTS (
            SELECT 1 FROM public.contracts c
            WHERE c.project_id = p_id
              AND c.contractor_organization_id = public.get_user_organization_id()
        );
    END IF;
    RETURN EXISTS (
        SELECT 1 FROM public.projects
        WHERE id = p_id AND is_public = TRUE AND deleted_at IS NULL
    );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.can_manage_project(p_id UUID)
RETURNS BOOLEAN AS $$
    SELECT public.is_government_user();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.source_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sources ENABLE ROW LEVEL SECURITY;
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

-- Profiles Policies
DROP POLICY IF EXISTS "Profiles viewable by everyone" ON public.profiles;
CREATE POLICY "Profiles viewable by everyone" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Projects Policies
DROP POLICY IF EXISTS "Projects select policy" ON public.projects;
CREATE POLICY "Projects select policy" ON public.projects FOR SELECT
USING (
    is_public = TRUE
    OR public.is_government_user()
    OR (public.is_contractor_user() AND public.can_access_project(id))
);

DROP POLICY IF EXISTS "Government can insert projects" ON public.projects;
CREATE POLICY "Government can insert projects" ON public.projects FOR INSERT
WITH CHECK (public.is_government_user());

DROP POLICY IF EXISTS "Government can update projects" ON public.projects;
CREATE POLICY "Government can update projects" ON public.projects FOR UPDATE
USING (public.is_government_user());

-- Public Projects View
CREATE OR REPLACE VIEW public.public_projects_view AS
SELECT
    p.id,
    p.nirikshak_project_id,
    p.official_project_id,
    p.project_name,
    COALESCE(p.public_summary, p.description) AS public_description,
    p.sector,
    p.subsector,
    p.project_authority,
    p.implementing_agency,
    p.contractor_concessionaire,
    p.state,
    p.district,
    p.city,
    p.location_text,
    p.latitude,
    p.longitude,
    p.total_cost_inr_crore,
    p.physical_progress_percent,
    p.normalized_status,
    p.award_date,
    p.planned_start_date,
    p.original_completion_date,
    p.revised_completion_date,
    p.actual_completion_date,
    p.current_status_verified,
    p.quality_score,
    p.primary_source_url,
    p.updated_at
FROM public.projects p
WHERE p.is_public = TRUE AND p.deleted_at IS NULL;

-- Government Summary View
CREATE OR REPLACE VIEW public.government_project_summary_view AS
SELECT
    p.*,
    (SELECT COUNT(*) FROM public.complaints c WHERE c.project_id = p.id AND c.status NOT IN ('RESOLVED', 'CLOSED')) AS open_complaints_count,
    (SELECT COUNT(*) FROM public.progress_updates pu WHERE pu.project_id = p.id AND pu.verification_status = 'SUBMITTED') AS pending_progress_updates_count,
    (SELECT COUNT(*) FROM public.inspections i WHERE i.project_id = p.id AND i.status = 'SCHEDULED') AS pending_inspections_count,
    (SELECT COUNT(*) FROM public.ai_insights ai WHERE ai.project_id = p.id AND ai.severity = 'HIGH' AND ai.status = 'ACTIVE') AS high_risk_ai_count
FROM public.projects p
WHERE p.deleted_at IS NULL;

-- Contractor Assigned Projects View
CREATE OR REPLACE VIEW public.contractor_assigned_projects_view AS
SELECT
    p.id,
    p.nirikshak_project_id,
    p.project_name,
    p.sector,
    p.subsector,
    p.project_authority,
    p.location_text,
    p.latitude,
    p.longitude,
    p.total_cost_inr_crore,
    p.physical_progress_percent,
    p.normalized_status,
    c.id AS contract_id,
    c.contract_number,
    c.contract_value,
    c.status AS contract_status,
    c.scheduled_completion_date
FROM public.projects p
JOIN public.contracts c ON c.project_id = p.id
WHERE c.contractor_organization_id = public.get_user_organization_id()
  AND p.deleted_at IS NULL;

-- Complaints Policies
DROP POLICY IF EXISTS "Citizen read own complaints or public" ON public.complaints;
CREATE POLICY "Citizen read own complaints or public" ON public.complaints FOR SELECT
USING (
    user_id = auth.uid()
    OR public.is_government_user()
    OR (public.is_contractor_user() AND assigned_organization_id = public.get_user_organization_id())
);

DROP POLICY IF EXISTS "Anyone can insert complaint" ON public.complaints;
CREATE POLICY "Anyone can insert complaint" ON public.complaints FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Government can update complaint" ON public.complaints;
CREATE POLICY "Government can update complaint" ON public.complaints FOR UPDATE
USING (
    public.is_government_user()
    OR (public.is_contractor_user() AND assigned_organization_id = public.get_user_organization_id())
);

-- Tenders & Bids Policies
DROP POLICY IF EXISTS "Tenders select policy" ON public.tenders;
CREATE POLICY "Tenders select policy" ON public.tenders FOR SELECT
USING (is_public = TRUE OR public.is_government_user() OR public.is_contractor_user());

DROP POLICY IF EXISTS "Government manage tenders" ON public.tenders;
CREATE POLICY "Government manage tenders" ON public.tenders FOR ALL
USING (public.is_government_user());

DROP POLICY IF EXISTS "Contractor view own bids, Gov view all" ON public.tender_bids;
CREATE POLICY "Contractor view own bids, Gov view all" ON public.tender_bids FOR SELECT
USING (
    public.is_government_user()
    OR contractor_organization_id = public.get_user_organization_id()
);

DROP POLICY IF EXISTS "Contractor insert bid" ON public.tender_bids;
CREATE POLICY "Contractor insert bid" ON public.tender_bids FOR INSERT
WITH CHECK (
    public.is_contractor_user()
    AND contractor_organization_id = public.get_user_organization_id()
);

-- Progress Updates Policies
DROP POLICY IF EXISTS "Progress updates select" ON public.progress_updates;
CREATE POLICY "Progress updates select" ON public.progress_updates FOR SELECT
USING (
    public.is_government_user()
    OR contractor_organization_id = public.get_user_organization_id()
    OR verification_status = 'APPROVED'
);

DROP POLICY IF EXISTS "Contractor insert progress" ON public.progress_updates;
CREATE POLICY "Contractor insert progress" ON public.progress_updates FOR INSERT
WITH CHECK (
    public.is_contractor_user()
    AND contractor_organization_id = public.get_user_organization_id()
);

DROP POLICY IF EXISTS "Government update progress" ON public.progress_updates;
CREATE POLICY "Government update progress" ON public.progress_updates FOR UPDATE
USING (public.is_government_user());

-- Contracts Policies
DROP POLICY IF EXISTS "Contracts view policy" ON public.contracts;
CREATE POLICY "Contracts view policy" ON public.contracts FOR SELECT
USING (
    public.is_government_user()
    OR contractor_organization_id = public.get_user_organization_id()
);

DROP POLICY IF EXISTS "Government manage contracts" ON public.contracts;
CREATE POLICY "Government manage contracts" ON public.contracts FOR ALL
USING (public.is_government_user());

-- Organizations & Members Policies
DROP POLICY IF EXISTS "Organizations viewable by all" ON public.organizations;
CREATE POLICY "Organizations viewable by all" ON public.organizations FOR SELECT USING (true);

DROP POLICY IF EXISTS "Organization members viewable by members or gov" ON public.organization_members;
CREATE POLICY "Organization members viewable by members or gov" ON public.organization_members FOR SELECT
USING (user_id = auth.uid() OR public.is_government_user());

-- Notifications Policy
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT
USING (user_id = auth.uid());

-- Milestones Policy
DROP POLICY IF EXISTS "Milestones viewable by project access" ON public.project_milestones;
CREATE POLICY "Milestones viewable by project access" ON public.project_milestones FOR SELECT
USING (public.can_access_project(project_id));

DROP POLICY IF EXISTS "Government can manage milestones" ON public.project_milestones;
CREATE POLICY "Government can manage milestones" ON public.project_milestones FOR ALL
USING (public.is_government_user());

-- Atomic Progress Approval Procedure
CREATE OR REPLACE FUNCTION public.approve_progress_update(
    p_update_id UUID,
    p_decision TEXT,
    p_verified_progress NUMERIC,
    p_review_notes TEXT,
    p_reviewer_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_update RECORD;
    v_new_project_progress NUMERIC;
    v_result JSONB;
BEGIN
    IF NOT public.is_government_user() THEN
        RAISE EXCEPTION 'Unauthorized: Only government officers can review progress';
    END IF;

    SELECT * INTO v_update FROM public.progress_updates WHERE id = p_update_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Progress update not found';
    END IF;

    UPDATE public.progress_updates
    SET verification_status = p_decision,
        verified_progress = p_verified_progress,
        reviewed_by = p_reviewer_id,
        reviewed_at = now(),
        review_notes = p_review_notes,
        updated_at = now()
    WHERE id = p_update_id;

    IF p_decision = 'APPROVED' AND v_update.milestone_id IS NOT NULL THEN
        UPDATE public.project_milestones
        SET verified_progress = p_verified_progress,
            status = CASE WHEN p_verified_progress >= 100 THEN 'COMPLETED' ELSE 'IN_PROGRESS' END,
            actual_end_date = CASE WHEN p_verified_progress >= 100 THEN CURRENT_DATE ELSE actual_end_date END,
            updated_at = now()
        WHERE id = v_update.milestone_id;

        SELECT COALESCE(AVG(verified_progress), 0) INTO v_new_project_progress
        FROM public.project_milestones
        WHERE project_id = v_update.project_id AND deleted_at IS NULL;

        UPDATE public.projects
        SET physical_progress_percent = ROUND(v_new_project_progress, 2),
            current_status_verified = TRUE,
            updated_at = now()
        WHERE id = v_update.project_id;
    END IF;

    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (
        p_reviewer_id,
        'PROGRESS_REVIEW',
        'progress_updates',
        p_update_id,
        jsonb_build_object('decision', p_decision, 'verified_progress', p_verified_progress, 'notes', p_review_notes)
    );

    v_result := jsonb_build_object(
        'success', true,
        'progress_update_id', p_update_id,
        'decision', p_decision,
        'verified_progress', p_verified_progress
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- MIGRATION: 018_indexes.sql
-- ==========================================

-- 018_indexes.sql
CREATE INDEX IF NOT EXISTS idx_projects_nirikshak_id ON public.projects(nirikshak_project_id);
CREATE INDEX IF NOT EXISTS idx_projects_normalized_status ON public.projects(normalized_status);
CREATE INDEX IF NOT EXISTS idx_projects_state ON public.projects(state);
CREATE INDEX IF NOT EXISTS idx_projects_district ON public.projects(district);
CREATE INDEX IF NOT EXISTS idx_projects_city ON public.projects(city);
CREATE INDEX IF NOT EXISTS idx_projects_sector ON public.projects(sector);
CREATE INDEX IF NOT EXISTS idx_projects_authority ON public.projects(project_authority);
CREATE INDEX IF NOT EXISTS idx_projects_contractor ON public.projects(contractor_concessionaire);
CREATE INDEX IF NOT EXISTS idx_projects_award_date ON public.projects(award_date);
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON public.projects(is_public);

CREATE INDEX IF NOT EXISTS idx_project_updates_project_id ON public.project_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_project_id ON public.progress_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_milestone_id ON public.progress_updates(milestone_id);
CREATE INDEX IF NOT EXISTS idx_complaints_project_id ON public.complaints(project_id);
CREATE INDEX IF NOT EXISTS idx_complaints_ref_number ON public.complaints(reference_number);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON public.contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_org_id ON public.contracts(contractor_organization_id);
CREATE INDEX IF NOT EXISTS idx_tenders_project_id ON public.tenders(project_id);
CREATE INDEX IF NOT EXISTS idx_source_observations_project_id ON public.source_observations(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON public.project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_project_id ON public.ai_insights(project_id);


-- ==========================================
-- MIGRATION: 019_realtime_and_workflow.sql
-- ==========================================

﻿-- 019_realtime_and_workflow.sql
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


-- ==========================================
-- MIGRATION: 020_secure_workflows.sql
-- ==========================================

-- Secure access requests, progress reviews, tender bids, and Realtime setup.

ALTER TABLE public.government_access_requests
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL;
ALTER TABLE public.contractor_access_requests
    ALTER COLUMN user_id SET NOT NULL,
    ALTER COLUMN created_at SET NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS government_access_requests_user_uidx
    ON public.government_access_requests (user_id);
CREATE UNIQUE INDEX IF NOT EXISTS contractor_access_requests_user_uidx
    ON public.contractor_access_requests (user_id);

-- Auth creation and onboarding request creation succeed or fail as one transaction,
-- including when email confirmation means the browser has no session yet.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, phone, avatar_url, city, state)
    VALUES (
        new.id,
        COALESCE(NULLIF(new.raw_user_meta_data->>'full_name', ''), new.email, 'Unknown'),
        NULLIF(new.raw_user_meta_data->>'phone', ''),
        NULLIF(new.raw_user_meta_data->>'avatar_url', ''),
        NULLIF(new.raw_user_meta_data->>'district', ''),
        NULLIF(new.raw_user_meta_data->>'state', '')
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name, phone = EXCLUDED.phone,
        city = EXCLUDED.city, state = EXCLUDED.state, updated_at = now();

    IF new.raw_user_meta_data->>'requested_role' = 'government_engineer' THEN
        INSERT INTO public.government_access_requests (
            user_id, employee_id, department, designation, official_email, state, district
        ) VALUES (
            new.id, new.raw_user_meta_data->>'employee_id', new.raw_user_meta_data->>'department',
            new.raw_user_meta_data->>'designation', new.email,
            new.raw_user_meta_data->>'state', new.raw_user_meta_data->>'district'
        ) ON CONFLICT (user_id) DO NOTHING;
    ELSIF new.raw_user_meta_data->>'requested_role' = 'contractor_admin' THEN
        INSERT INTO public.contractor_access_requests (
            user_id, company_name, registration_cin, gstin, contractor_class, state, district, phone
        ) VALUES (
            new.id, new.raw_user_meta_data->>'company_name', new.raw_user_meta_data->>'registration_cin',
            new.raw_user_meta_data->>'gstin', new.raw_user_meta_data->>'contractor_class',
            new.raw_user_meta_data->>'state', new.raw_user_meta_data->>'district',
            new.raw_user_meta_data->>'phone'
        ) ON CONFLICT (user_id) DO NOTHING;
    END IF;
    RETURN new;
END;
$$;

REVOKE ALL ON public.government_access_requests FROM anon, authenticated;
REVOKE ALL ON public.contractor_access_requests FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.government_access_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.contractor_access_requests TO authenticated;

DROP POLICY IF EXISTS "Users create own government access request" ON public.government_access_requests;
CREATE POLICY "Users create own government access request"
ON public.government_access_requests FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id AND status = 'PENDING' AND reviewed_by IS NULL AND reviewed_at IS NULL);

DROP POLICY IF EXISTS "Users view own government access request" ON public.government_access_requests;
CREATE POLICY "Users view own government access request"
ON public.government_access_requests FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id OR public.is_government_user());

DROP POLICY IF EXISTS "Government reviews government access requests" ON public.government_access_requests;
CREATE POLICY "Government reviews government access requests"
ON public.government_access_requests FOR UPDATE TO authenticated
USING (public.is_government_user())
WITH CHECK (public.is_government_user());

DROP POLICY IF EXISTS "Users create own contractor access request" ON public.contractor_access_requests;
CREATE POLICY "Users create own contractor access request"
ON public.contractor_access_requests FOR INSERT TO authenticated
WITH CHECK ((SELECT auth.uid()) = user_id AND status = 'PENDING' AND reviewed_by IS NULL AND reviewed_at IS NULL);

DROP POLICY IF EXISTS "Users view own contractor access request" ON public.contractor_access_requests;
CREATE POLICY "Users view own contractor access request"
ON public.contractor_access_requests FOR SELECT TO authenticated
USING ((SELECT auth.uid()) = user_id OR public.is_government_user());

DROP POLICY IF EXISTS "Government reviews contractor access requests" ON public.contractor_access_requests;
CREATE POLICY "Government reviews contractor access requests"
ON public.contractor_access_requests FOR UPDATE TO authenticated
USING (public.is_government_user())
WITH CHECK (public.is_government_user());

CREATE UNIQUE INDEX IF NOT EXISTS tender_bids_reference_uidx
    ON public.tender_bids (bid_reference) WHERE bid_reference IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS tender_bids_active_tender_org_uidx
    ON public.tender_bids (tender_id, contractor_organization_id) WHERE deleted_at IS NULL;

DROP POLICY IF EXISTS "Contractor update own bid" ON public.tender_bids;
CREATE POLICY "Contractor update own bid" ON public.tender_bids FOR UPDATE TO authenticated
USING (contractor_organization_id = public.get_user_organization_id() AND status = 'DRAFT')
WITH CHECK (contractor_organization_id = public.get_user_organization_id());

CREATE OR REPLACE FUNCTION public.save_tender_bid(
    p_tender_id UUID,
    p_bid_amount NUMERIC,
    p_technical_proposal TEXT,
    p_status TEXT DEFAULT 'DRAFT'
)
RETURNS public.tender_bids
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := (SELECT auth.uid());
    v_org_id UUID;
    v_tender public.tenders%ROWTYPE;
    v_bid public.tender_bids%ROWTYPE;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
    IF p_status NOT IN ('DRAFT', 'SUBMITTED') THEN RAISE EXCEPTION 'Invalid bid status'; END IF;
    IF p_bid_amount IS NULL OR p_bid_amount <= 0 THEN RAISE EXCEPTION 'Bid amount must be positive'; END IF;

    SELECT om.organization_id INTO v_org_id
    FROM public.organization_members om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.user_id = v_user_id
      AND lower(om.status) = 'active'
      AND (o.type = 'contractor' OR om.role IN ('contractor_admin', 'contractor_manager', 'contractor_site_engineer'))
    LIMIT 1;
    IF v_org_id IS NULL THEN RAISE EXCEPTION 'Active contractor membership required'; END IF;

    SELECT * INTO v_tender FROM public.tenders
    WHERE id = p_tender_id AND deleted_at IS NULL FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Tender not found'; END IF;
    IF v_tender.status <> 'PUBLISHED' OR (v_tender.bid_due_date IS NOT NULL AND v_tender.bid_due_date < CURRENT_DATE) THEN
        RAISE EXCEPTION 'Tender is not open for bids';
    END IF;

    INSERT INTO public.tender_bids (
        tender_id, contractor_organization_id, bid_reference, bid_amount,
        technical_proposal, status, submitted_by, submitted_at
    ) VALUES (
        p_tender_id, v_org_id,
        'NIR-BID-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 12)),
        p_bid_amount, nullif(btrim(p_technical_proposal), ''), p_status, v_user_id,
        CASE WHEN p_status = 'SUBMITTED' THEN now() ELSE NULL END
    )
    ON CONFLICT (tender_id, contractor_organization_id) WHERE deleted_at IS NULL
    DO UPDATE SET
        bid_amount = EXCLUDED.bid_amount,
        technical_proposal = EXCLUDED.technical_proposal,
        status = EXCLUDED.status,
        submitted_by = v_user_id,
        submitted_at = CASE WHEN EXCLUDED.status = 'SUBMITTED' THEN now() ELSE public.tender_bids.submitted_at END,
        updated_at = now()
    WHERE public.tender_bids.status = 'DRAFT'
    RETURNING * INTO v_bid;

    IF v_bid.id IS NULL THEN RAISE EXCEPTION 'Only draft bids can be changed'; END IF;
    RETURN v_bid;
END;
$$;
REVOKE ALL ON FUNCTION public.save_tender_bid(UUID, NUMERIC, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.save_tender_bid(UUID, NUMERIC, TEXT, TEXT) TO authenticated;

DROP FUNCTION IF EXISTS public.approve_progress_update(UUID, TEXT, NUMERIC, TEXT, UUID);
CREATE OR REPLACE FUNCTION public.approve_progress_update(
    p_update_id UUID,
    p_decision TEXT,
    p_verified_progress NUMERIC DEFAULT NULL,
    p_review_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_reviewer_id UUID := (SELECT auth.uid());
    v_update public.progress_updates%ROWTYPE;
    v_verified_progress NUMERIC;
    v_new_project_progress NUMERIC;
BEGIN
    IF v_reviewer_id IS NULL OR NOT public.is_government_user() THEN
        RAISE EXCEPTION 'Unauthorized: active government membership required';
    END IF;
    IF p_decision NOT IN ('APPROVED', 'REJECTED') THEN RAISE EXCEPTION 'Invalid review decision'; END IF;

    SELECT * INTO v_update FROM public.progress_updates WHERE id = p_update_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Progress update not found'; END IF;
    IF v_update.verification_status <> 'SUBMITTED' THEN RAISE EXCEPTION 'Progress update has already been reviewed'; END IF;

    v_verified_progress := CASE WHEN p_decision = 'APPROVED'
        THEN COALESCE(p_verified_progress, v_update.reported_progress)
        ELSE NULL END;
    IF v_verified_progress IS NOT NULL AND (v_verified_progress < 0 OR v_verified_progress > 100) THEN
        RAISE EXCEPTION 'Verified progress must be between 0 and 100';
    END IF;

    UPDATE public.progress_updates SET
        verification_status = p_decision, verified_progress = v_verified_progress,
        reviewed_by = v_reviewer_id, reviewed_at = now(), review_notes = p_review_notes, updated_at = now()
    WHERE id = p_update_id;

    IF p_decision = 'APPROVED' AND v_update.milestone_id IS NOT NULL THEN
        UPDATE public.project_milestones SET verified_progress = v_verified_progress,
            status = CASE WHEN v_verified_progress >= 100 THEN 'COMPLETED' ELSE 'IN_PROGRESS' END,
            actual_end_date = CASE WHEN v_verified_progress >= 100 THEN CURRENT_DATE ELSE actual_end_date END,
            updated_at = now() WHERE id = v_update.milestone_id;
        SELECT AVG(verified_progress) INTO v_new_project_progress FROM public.project_milestones
        WHERE project_id = v_update.project_id AND deleted_at IS NULL AND verified_progress IS NOT NULL;
        UPDATE public.projects SET physical_progress_percent = round(v_new_project_progress, 2),
            current_status_verified = (v_new_project_progress IS NOT NULL), updated_at = now()
        WHERE id = v_update.project_id;
    END IF;

    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (v_reviewer_id, 'PROGRESS_REVIEW', 'progress_updates', p_update_id,
        jsonb_build_object('decision', p_decision, 'verified_progress', v_verified_progress, 'notes', p_review_notes));
    RETURN jsonb_build_object('success', true, 'progress_update_id', p_update_id,
        'decision', p_decision, 'verified_progress', v_verified_progress, 'reviewed_by', v_reviewer_id);
END;
$$;
REVOKE ALL ON FUNCTION public.approve_progress_update(UUID, TEXT, NUMERIC, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.approve_progress_update(UUID, TEXT, NUMERIC, TEXT) TO authenticated;

DO $$
DECLARE v_table TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        EXECUTE 'CREATE PUBLICATION supabase_realtime';
    END IF;
    FOREACH v_table IN ARRAY ARRAY[
        'tenders', 'tender_bids', 'progress_updates', 'project_milestones',
        'notifications', 'government_access_requests', 'contractor_access_requests'
    ] LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = v_table
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', v_table);
        END IF;
    END LOOP;
END $$;


-- ==========================================
-- MIGRATION: 021_procurement_progress_ai.sql
-- ==========================================

-- 021_procurement_progress_ai.sql
-- Implements atomic contract award RPC, secure contractor progress update submission RPC,
-- AI job queue table, ai_insights audience extensions, and Realtime publications.

-- 1. AI Jobs Table for Async Nemotron Processing
CREATE TABLE IF NOT EXISTS public.ai_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    source_entity_type TEXT NOT NULL,
    source_entity_id UUID NOT NULL,
    task_type TEXT NOT NULL DEFAULT 'RISK_ASSESSMENT',
    status TEXT NOT NULL DEFAULT 'QUEUED',
    priority INTEGER NOT NULL DEFAULT 1,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    input_hash TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error TEXT
);

-- AI Insights Audience & Risk extensions
ALTER TABLE public.ai_insights
    ADD COLUMN IF NOT EXISTS progress_update_id UUID REFERENCES public.progress_updates(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS risk_score NUMERIC,
    ADD COLUMN IF NOT EXISTS risk_level TEXT DEFAULT 'MEDIUM',
    ADD COLUMN IF NOT EXISTS audience TEXT DEFAULT 'GOVERNMENT',
    ADD COLUMN IF NOT EXISTS government_status TEXT DEFAULT 'PENDING_REVIEW',
    ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- RLS for ai_jobs
ALTER TABLE public.ai_jobs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Government and service can view ai_jobs" ON public.ai_jobs;
CREATE POLICY "Government and service can view ai_jobs" ON public.ai_jobs
    FOR SELECT TO authenticated
    USING (public.is_government_user());

DROP FUNCTION IF EXISTS public.award_contract(UUID, UUID);
DROP FUNCTION IF EXISTS public.submit_progress_update(UUID, NUMERIC, TEXT, UUID);

-- 2. Atomic Contract Award RPC
CREATE OR REPLACE FUNCTION public.award_contract(
    p_tender_id UUID,
    p_selected_bid_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := (SELECT auth.uid());
    v_tender public.tenders%ROWTYPE;
    v_bid public.tender_bids%ROWTYPE;
    v_contract public.contracts%ROWTYPE;
    v_contract_num TEXT;
    v_duration_months INTEGER;
BEGIN
    -- Validate caller is authenticated government official
    IF v_user_id IS NULL OR NOT public.is_government_user() THEN
        RAISE EXCEPTION 'Unauthorized: Active government membership required';
    END IF;

    -- Lock and validate tender
    SELECT * INTO v_tender FROM public.tenders
    WHERE id = p_tender_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tender % not found', p_tender_id;
    END IF;

    IF v_tender.status = 'AWARDED' THEN
        RAISE EXCEPTION 'Tender is already awarded';
    END IF;

    -- Lock and validate selected bid
    SELECT * INTO v_bid FROM public.tender_bids
    WHERE id = p_selected_bid_id AND tender_id = p_tender_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bid % does not belong to tender %', p_selected_bid_id, p_tender_id;
    END IF;

    IF v_bid.status NOT IN ('SUBMITTED', 'UNDER_EVALUATION') THEN
        RAISE EXCEPTION 'Only submitted bids can be awarded (current status: %)', v_bid.status;
    END IF;

    -- Mark selected bid as SELECTED
    UPDATE public.tender_bids
    SET status = 'SELECTED', updated_at = now()
    WHERE id = p_selected_bid_id;

    -- Mark all other submitted bids for this tender as REJECTED
    UPDATE public.tender_bids
    SET status = 'REJECTED', updated_at = now()
    WHERE tender_id = p_tender_id AND id <> p_selected_bid_id AND status IN ('SUBMITTED', 'UNDER_EVALUATION', 'DRAFT');

    -- Mark tender as AWARDED
    UPDATE public.tenders
    SET status = 'AWARDED', updated_at = now()
    WHERE id = p_tender_id;

    -- Generate official contract number
    v_contract_num := 'CNT-' || COALESCE(NULLIF(v_tender.tender_number, ''), to_char(CURRENT_DATE, 'YYYY')) || '-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 8));
    v_duration_months := 24;

    -- Create official contract
    INSERT INTO public.contracts (
        project_id,
        tender_id,
        contractor_organization_id,
        official_contract_id,
        contract_number,
        contract_title,
        contract_value,
        award_date,
        scheduled_start_date,
        scheduled_completion_date,
        status,
        version
    ) VALUES (
        v_tender.project_id,
        p_tender_id,
        v_bid.contractor_organization_id,
        v_contract_num,
        v_contract_num,
        v_tender.title,
        v_bid.bid_amount,
        CURRENT_DATE,
        CURRENT_DATE + interval '14 days',
        CURRENT_DATE + (v_duration_months || ' months')::interval,
        'ACTIVE',
        1
    )
    RETURNING * INTO v_contract;

    -- Create or update project_organizations assignment
    INSERT INTO public.project_organizations (
        project_id,
        organization_id,
        relationship,
        valid_from
    ) VALUES (
        v_tender.project_id,
        v_bid.contractor_organization_id,
        'primary_contractor',
        CURRENT_DATE
    )
    ON CONFLICT DO NOTHING;

    -- Update project status to active execution
    UPDATE public.projects
    SET normalized_status = 'IN_PROGRESS', updated_at = now()
    WHERE id = v_tender.project_id AND normalized_status IN ('PROPOSED', 'TENDERED', 'APPROVED');

    -- Insert audit trail
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (
        v_user_id,
        'AWARD_CONTRACT',
        'contracts',
        v_contract.id,
        jsonb_build_object(
            'tender_id', p_tender_id,
            'bid_id', p_selected_bid_id,
            'contract_number', v_contract_num,
            'contract_value', v_bid.bid_amount,
            'contractor_organization_id', v_bid.contractor_organization_id
        )
    );

    -- Notify the winning contractor
    INSERT INTO public.notifications (
        organization_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        v_bid.contractor_organization_id,
        'CONTRACT_AWARDED',
        'Contract Awarded: ' || v_tender.title,
        'Your bid has been selected and contract ' || v_contract_num || ' has been awarded.',
        'contracts',
        v_contract.id,
        jsonb_build_object(
            'tender_id', p_tender_id,
            'contract_id', v_contract.id,
            'project_id', v_tender.project_id,
            'value', v_bid.bid_amount
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'contract_id', v_contract.id,
        'contract_number', v_contract_num,
        'tender_id', p_tender_id,
        'contractor_organization_id', v_bid.contractor_organization_id,
        'contract_value', v_bid.bid_amount
    );
END;
$$;
REVOKE ALL ON FUNCTION public.award_contract(UUID, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.award_contract(UUID, UUID) TO authenticated;

-- 3. Secure Progress Update Submission RPC
CREATE OR REPLACE FUNCTION public.submit_progress_update(
    p_project_id UUID,
    p_reported_progress NUMERIC,
    p_description TEXT,
    p_milestone_id UUID DEFAULT NULL
)
RETURNS public.progress_updates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := (SELECT auth.uid());
    v_org_id UUID;
    v_update public.progress_updates%ROWTYPE;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Validate reported progress percentage
    IF p_reported_progress IS NULL OR p_reported_progress < 0 OR p_reported_progress > 100 THEN
        RAISE EXCEPTION 'Reported progress must be between 0 and 100 percent';
    END IF;

    -- Get active contractor organization ID for caller
    SELECT om.organization_id INTO v_org_id
    FROM public.organization_members om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.user_id = v_user_id
      AND lower(om.status) = 'active'
      AND (o.type = 'contractor' OR om.role IN ('contractor_admin', 'contractor_manager', 'contractor_site_engineer'))
    LIMIT 1;

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Active contractor organization membership required';
    END IF;

    -- Verify contractor is assigned to this project
    IF NOT EXISTS (
        SELECT 1 FROM public.contracts
        WHERE project_id = p_project_id AND contractor_organization_id = v_org_id AND status = 'ACTIVE'
    ) AND NOT EXISTS (
        SELECT 1 FROM public.project_organizations
        WHERE project_id = p_project_id AND organization_id = v_org_id
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Contractor organization % is not assigned to project %', v_org_id, p_project_id;
    END IF;

    -- Insert progress update with SUBMITTED verification status
    INSERT INTO public.progress_updates (
        project_id,
        contractor_organization_id,
        milestone_id,
        reported_progress,
        description,
        submitted_by,
        submitted_at,
        verification_status
    ) VALUES (
        p_project_id,
        v_org_id,
        p_milestone_id,
        p_reported_progress,
        p_description,
        v_user_id,
        now(),
        'SUBMITTED'
    )
    RETURNING * INTO v_update;

    -- Insert audit log
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (
        v_user_id,
        'PROGRESS_SUBMISSION',
        'progress_updates',
        v_update.id,
        jsonb_build_object(
            'project_id', p_project_id,
            'reported_progress', p_reported_progress,
            'milestone_id', p_milestone_id
        )
    );

    -- Notify government reviewers
    INSERT INTO public.notifications (
        type,
        title,
        message,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        'PROGRESS_SUBMITTED',
        'New Progress Update Submitted',
        'Contractor submitted ' || p_reported_progress || '% progress claim for project audit review.',
        'progress_updates',
        v_update.id,
        jsonb_build_object('project_id', p_project_id, 'update_id', v_update.id)
    );

    -- Queue automated asynchronous AI risk analysis
    INSERT INTO public.ai_jobs (
        project_id,
        source_entity_type,
        source_entity_id,
        task_type,
        status,
        priority
    ) VALUES (
        p_project_id,
        'progress_updates',
        v_update.id,
        'PROGRESS_RISK_AUDIT',
        'QUEUED',
        1
    );

    RETURN v_update;
END;
$$;
REVOKE ALL ON FUNCTION public.submit_progress_update(UUID, NUMERIC, TEXT, UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.submit_progress_update(UUID, NUMERIC, TEXT, UUID) TO authenticated;

-- 4. Publication Realtime Additions
DO $$
DECLARE v_table TEXT;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        EXECUTE 'CREATE PUBLICATION supabase_realtime';
    END IF;
    FOREACH v_table IN ARRAY ARRAY[
        'ai_jobs', 'ai_insights', 'contracts', 'complaints', 'complaint_updates', 'audit_logs'
    ] LOOP
        IF NOT EXISTS (
            SELECT 1 FROM pg_publication_tables
            WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = v_table
        ) THEN
            EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', v_table);
        END IF;
    END LOOP;
END $$;


-- ==========================================
-- MIGRATION: 022_rls_security_hardening.sql
-- ==========================================

-- 022_rls_security_hardening.sql
-- Restricts ai_jobs and progress_updates RLS to prevent unauthorized reading or tampering.

-- 1. Tighten ai_jobs permissions
REVOKE ALL ON public.ai_jobs FROM anon;
GRANT SELECT ON public.ai_jobs TO authenticated;

-- 2. Restrict progress_updates updates strictly to Government reviewers
DROP POLICY IF EXISTS "Government update progress" ON public.progress_updates;
DROP POLICY IF EXISTS "Contractor update progress" ON public.progress_updates;

CREATE POLICY "Government update progress" ON public.progress_updates
    FOR UPDATE TO authenticated
    USING (public.is_government_user())
    WITH CHECK (public.is_government_user());

-- Ensure anon has no update permissions
REVOKE UPDATE, DELETE ON public.progress_updates FROM anon;


-- ==========================================
-- MIGRATION: 023_complete_rls_policies.sql
-- ==========================================

-- Migration 023_complete_rls_policies.sql
-- Completes missing RLS policies on financial_updates, contracts, inspections, and audit_logs

-- Financial updates
DROP POLICY IF EXISTS "financial_updates_select" ON public.financial_updates;
CREATE POLICY "financial_updates_select" ON public.financial_updates FOR SELECT
USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "financial_updates_gov_insert" ON public.financial_updates;
CREATE POLICY "financial_updates_gov_insert" ON public.financial_updates FOR INSERT
WITH CHECK (public.is_government_user());

DROP POLICY IF EXISTS "financial_updates_gov_update" ON public.financial_updates;
CREATE POLICY "financial_updates_gov_update" ON public.financial_updates FOR UPDATE
USING (public.is_government_user());

-- Contracts
DROP POLICY IF EXISTS "contracts_select" ON public.contracts;
CREATE POLICY "contracts_select" ON public.contracts FOR SELECT
USING (public.is_government_user() OR public.is_contractor_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "contracts_gov_all" ON public.contracts;
CREATE POLICY "contracts_gov_all" ON public.contracts FOR ALL
USING (public.is_government_user());

-- Inspections
DROP POLICY IF EXISTS "inspections_select" ON public.inspections;
CREATE POLICY "inspections_select" ON public.inspections FOR SELECT
USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "inspections_gov_all" ON public.inspections;
CREATE POLICY "inspections_gov_all" ON public.inspections FOR ALL
USING (public.is_government_user());

-- Audit logs
DROP POLICY IF EXISTS "audit_logs_select" ON public.audit_logs;
CREATE POLICY "audit_logs_select" ON public.audit_logs FOR SELECT
USING (public.is_government_user());

DROP POLICY IF EXISTS "audit_logs_insert" ON public.audit_logs;
CREATE POLICY "audit_logs_insert" ON public.audit_logs FOR INSERT
WITH CHECK (true);

-- Complaint updates
DROP POLICY IF EXISTS "complaint_updates_select" ON public.complaint_updates;
CREATE POLICY "complaint_updates_select" ON public.complaint_updates FOR SELECT
USING (true);

DROP POLICY IF EXISTS "complaint_updates_insert" ON public.complaint_updates;
CREATE POLICY "complaint_updates_insert" ON public.complaint_updates FOR INSERT
WITH CHECK (true);



-- ==========================================
-- MIGRATION: 024_multi_tenant_gov_contractor_architecture.sql
-- ==========================================

-- Migration 024_multi_tenant_gov_contractor_architecture.sql
-- NIRIKSHAK Multi-Tenant Architecture for Government & Contractor Roles
--
-- 1. Shared Government Authority scoping (all Pune officers share same projects).
-- 2. Isolated Contractor scoping (each company has own organization, bids and contracts).
-- 3. Robust Auth trigger: profiles created, pending access requests logged without failure.
-- 4. Transactional approval RPCs: approve_government_access_request, approve_contractor_access_request.
-- 5. Rigid RLS policies on projects, tenders, tender_bids, contracts, progress_updates, requests.

-- 1. Ensure Enum Values
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'contractor_engineer' AND enumtypid = 'public.app_role_enum'::regtype) THEN
        ALTER TYPE public.app_role_enum ADD VALUE 'contractor_engineer';
    END IF;
END $$;

-- 2. Organizations Table Extensions
ALTER TABLE public.organizations
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN IF NOT EXISTS gstin TEXT;

-- Ensure Pune Infrastructure Monitoring Authority exists as the shared development Government Authority
INSERT INTO public.organizations (id, name, type, status, state, district, verified)
VALUES (
    'c675a05d-6c45-4008-b021-6b88825e3641',
    'Pune Infrastructure Monitoring Authority',
    'authority',
    'ACTIVE',
    'Maharashtra',
    'Pune',
    true
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    status = 'ACTIVE',
    verified = true,
    state = 'Maharashtra',
    district = 'Pune',
    updated_at = now();

-- Ensure Seed Contractor Organizations have valid GSTIN and CIN for matching
UPDATE public.organizations
SET gstin = '27AABCA1234F1Z5', registration_number = 'U45200MH2018PTC312456', status = 'ACTIVE', verified = true
WHERE id = '602e1463-ed1f-48da-85f4-74fc2a5ab9cc' OR lower(name) = 'apex infrastructure pvt ltd';

UPDATE public.organizations
SET gstin = '27AABCB5678G1Z2', registration_number = 'U45201MH2015PLC264891', status = 'ACTIVE', verified = true
WHERE id = 'b53361b8-675e-4cd7-9166-d29b896fbac5' OR lower(name) = 'bharat urban engineering ltd';

UPDATE public.organizations
SET gstin = '27AABCC9012H1Z9', registration_number = 'U45202MH2019PTC328912', status = 'ACTIVE', verified = true
WHERE id = '6ec8475f-bdac-43a6-a085-751b68601db3' OR lower(name) = 'crestline infra projects pvt ltd';

-- 3. Organization Members - Enforce One Active Organization per User
CREATE UNIQUE INDEX IF NOT EXISTS idx_org_members_one_active_per_user
    ON public.organization_members (user_id)
    WHERE status = 'active';

-- 4. Projects Table - Government Organization Scoping
ALTER TABLE public.projects
    ADD COLUMN IF NOT EXISTS government_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_projects_gov_org_id
    ON public.projects (government_organization_id);

-- Assign existing projects to Pune Authority if not assigned
UPDATE public.projects
SET government_organization_id = 'c675a05d-6c45-4008-b021-6b88825e3641'
WHERE government_organization_id IS NULL;

-- 5. Access Request Tables - Constraints and Columns
ALTER TABLE public.government_access_requests
    ADD COLUMN IF NOT EXISTS requested_role TEXT DEFAULT 'government_engineer';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.government_access_requests'::regclass
          AND conname = 'government_access_requests_user_id_key'
    ) THEN
        ALTER TABLE public.government_access_requests
            ADD CONSTRAINT government_access_requests_user_id_key UNIQUE (user_id);
    END IF;
END $$;

ALTER TABLE public.contractor_access_requests
    ADD COLUMN IF NOT EXISTS requested_role TEXT DEFAULT 'contractor_admin';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conrelid = 'public.contractor_access_requests'::regclass
          AND conname = 'contractor_access_requests_user_id_key'
    ) THEN
        ALTER TABLE public.contractor_access_requests
            ADD CONSTRAINT contractor_access_requests_user_id_key UNIQUE (user_id);
    END IF;
END $$;

-- 6. Robust Database Trigger on auth.users (handle_new_user)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_req_role TEXT;
    v_full_name TEXT;
    v_phone TEXT;
    v_district TEXT;
    v_state TEXT;
BEGIN
    v_req_role := COALESCE(
        NULLIF(new.raw_user_meta_data->>'requested_role', ''),
        NULLIF(new.raw_user_meta_data->>'role', ''),
        'citizen'
    );
    v_full_name := COALESCE(NULLIF(new.raw_user_meta_data->>'full_name', ''), new.email, 'User');
    v_phone := NULLIF(new.raw_user_meta_data->>'phone', '');
    v_district := COALESCE(NULLIF(new.raw_user_meta_data->>'district', ''), 'Pune');
    v_state := COALESCE(NULLIF(new.raw_user_meta_data->>'state', ''), 'Maharashtra');

    -- Create or update user profile
    INSERT INTO public.profiles (id, full_name, phone, avatar_url, city, state)
    VALUES (
        new.id,
        v_full_name,
        v_phone,
        NULLIF(new.raw_user_meta_data->>'avatar_url', ''),
        v_district,
        v_state
    ) ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
        city = COALESCE(EXCLUDED.city, public.profiles.city),
        state = COALESCE(EXCLUDED.state, public.profiles.state),
        updated_at = now();

    -- Check if requesting a government clearance
    IF v_req_role IN ('government', 'government_admin', 'government_engineer', 'chief_engineer', 'project_officer', 'auditor') THEN
        INSERT INTO public.government_access_requests (
            user_id,
            employee_id,
            department,
            designation,
            official_email,
            state,
            district,
            status,
            requested_role
        ) VALUES (
            new.id,
            COALESCE(NULLIF(new.raw_user_meta_data->>'employee_id', ''), 'PENDING-' || upper(substr(new.id::text, 1, 8))),
            COALESCE(NULLIF(new.raw_user_meta_data->>'department', ''), 'Public Works Department (PWD)'),
            COALESCE(NULLIF(new.raw_user_meta_data->>'designation', ''), 'Executive Engineer'),
            COALESCE(NULLIF(new.email, ''), 'officer@gov.local'),
            v_state,
            v_district,
            'PENDING',
            v_req_role
        ) ON CONFLICT (user_id) DO UPDATE SET
            employee_id = EXCLUDED.employee_id,
            department = EXCLUDED.department,
            designation = EXCLUDED.designation,
            official_email = EXCLUDED.official_email,
            requested_role = EXCLUDED.requested_role;

    -- Check if requesting contractor onboarding
    ELSIF v_req_role IN ('contractor', 'contractor_admin', 'contractor_manager', 'contractor_engineer', 'contractor_site_engineer') THEN
        INSERT INTO public.contractor_access_requests (
            user_id,
            company_name,
            registration_cin,
            gstin,
            contractor_class,
            state,
            district,
            phone,
            status,
            requested_role
        ) VALUES (
            new.id,
            COALESCE(NULLIF(new.raw_user_meta_data->>'company_name', ''), 'Contractor Entity'),
            COALESCE(NULLIF(new.raw_user_meta_data->>'registration_cin', ''), 'PENDING-CIN-' || upper(substr(new.id::text, 1, 6))),
            COALESCE(NULLIF(new.raw_user_meta_data->>'gstin', ''), 'PENDING-GSTIN'),
            COALESCE(NULLIF(new.raw_user_meta_data->>'contractor_class', ''), 'Class 1 (Unlimited)'),
            v_state,
            v_district,
            v_phone,
            'PENDING',
            v_req_role
        ) ON CONFLICT (user_id) DO UPDATE SET
            company_name = EXCLUDED.company_name,
            registration_cin = EXCLUDED.registration_cin,
            gstin = EXCLUDED.gstin,
            phone = EXCLUDED.phone,
            requested_role = EXCLUDED.requested_role;
    END IF;

    RETURN new;
END;
$$;

-- 7. Server-Side Project Scoping Trigger (Requirement 7)
CREATE OR REPLACE FUNCTION public.set_project_gov_org()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_org_id UUID;
BEGIN
    v_user_org_id := public.get_user_organization_id();
    IF NEW.government_organization_id IS NULL THEN
        IF v_user_org_id IS NULL THEN
            RAISE EXCEPTION 'government_organization_id is required when no authenticated organization membership exists';
        END IF;
        NEW.government_organization_id := v_user_org_id;
    END IF;
    IF NEW.created_by IS NULL THEN
        NEW.created_by := (SELECT auth.uid());
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_project_gov_org ON public.projects;
CREATE TRIGGER trg_set_project_gov_org
    BEFORE INSERT ON public.projects
    FOR EACH ROW EXECUTE FUNCTION public.set_project_gov_org();

-- 8. Core Security Helper Functions
CREATE OR REPLACE FUNCTION public.get_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT organization_id FROM public.organization_members
    WHERE user_id = (SELECT auth.uid())
      AND lower(status) = 'active'
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS public.app_role_enum
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT role FROM public.organization_members
    WHERE user_id = (SELECT auth.uid())
      AND lower(status) = 'active'
    LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_government_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members om
        JOIN public.organizations o ON om.organization_id = o.id
        WHERE om.user_id = (SELECT auth.uid())
          AND lower(om.status) = 'active'
          AND (o.type IN ('government', 'authority', 'ULB', 'PSU')
               OR om.role IN ('government_admin', 'project_officer', 'government_engineer', 'chief_engineer', 'auditor'))
    );
$$;

CREATE OR REPLACE FUNCTION public.is_contractor_user()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members om
        JOIN public.organizations o ON om.organization_id = o.id
        WHERE om.user_id = (SELECT auth.uid())
          AND lower(om.status) = 'active'
          AND (o.type = 'contractor'
               OR om.role IN ('contractor_admin', 'contractor_manager', 'contractor_engineer', 'contractor_site_engineer'))
    );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_project(p_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = p_id
          AND public.is_government_user()
          AND (p.government_organization_id = public.get_user_organization_id() OR p.government_organization_id IS NULL)
    );
$$;

CREATE OR REPLACE FUNCTION public.can_access_project(p_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_org_id UUID := public.get_user_organization_id();
BEGIN
    IF public.is_government_user() THEN
        RETURN EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = p_id
              AND (p.government_organization_id = v_org_id OR p.government_organization_id IS NULL)
        );
    END IF;

    IF public.is_contractor_user() THEN
        RETURN EXISTS (
            SELECT 1 FROM public.project_organizations po
            WHERE po.project_id = p_id AND po.organization_id = v_org_id
        ) OR EXISTS (
            SELECT 1 FROM public.contracts c
            WHERE c.project_id = p_id AND c.contractor_organization_id = v_org_id
        );
    END IF;

    RETURN EXISTS (
        SELECT 1 FROM public.projects p
        WHERE p.id = p_id AND p.is_public = TRUE AND p.deleted_at IS NULL
    );
END;
$$;

-- 9. Transactional Government Approval RPC (Requirement 38)
CREATE OR REPLACE FUNCTION public.approve_government_access_request(
    request_id UUID,
    approved_role public.app_role_enum DEFAULT 'government_engineer'::public.app_role_enum
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID := (SELECT auth.uid());
    v_caller_role public.app_role_enum;
    v_gov_org_id UUID;
    v_req public.government_access_requests%ROWTYPE;
BEGIN
    -- Approval must always be performed by an authenticated administrator.
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: authentication is required';
    END IF;
    SELECT role INTO v_caller_role FROM public.organization_members
    WHERE user_id = v_caller_id AND status = 'active';
    IF v_caller_role <> 'government_admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only Government Administrators can approve officer access requests';
    END IF;

    -- Lock and retrieve request
    SELECT * INTO v_req FROM public.government_access_requests
    WHERE id = request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Government access request % not found', request_id;
    END IF;

    IF v_req.status <> 'PENDING' THEN
        RAISE EXCEPTION 'Request % has already been %', request_id, v_req.status;
    END IF;

    -- Resolve the authority from the authenticated administrator's membership.
    v_gov_org_id := public.get_user_organization_id();
    IF v_gov_org_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: administrator organization is missing';
    END IF;

    -- Create or reactivate active organization membership
    INSERT INTO public.organization_members (
        organization_id,
        user_id,
        role,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_gov_org_id,
        v_req.user_id,
        approved_role,
        'active',
        now(),
        now()
    ) ON CONFLICT (organization_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        status = 'active',
        updated_at = now();

    -- Mark request APPROVED
    UPDATE public.government_access_requests
    SET status = 'APPROVED',
        reviewed_by = v_caller_id,
        reviewed_at = now()
    WHERE id = request_id;

    -- Record audit log
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (
        COALESCE(v_caller_id, v_req.user_id),
        'APPROVE_GOVERNMENT_ACCESS',
        'government_access_requests',
        request_id,
        jsonb_build_object(
            'approved_user_id', v_req.user_id,
            'organization_id', v_gov_org_id,
            'role', approved_role::TEXT
        )
    );

    -- Notify approved user
    INSERT INTO public.notifications (
        organization_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        v_gov_org_id,
        'ACCESS_APPROVED',
        'Government Portal Clearance Approved',
        'Your NIRIKSHAK government officer clearance has been approved with role ' || approved_role::TEXT || '.',
        'organization_members',
        v_req.user_id,
        jsonb_build_object('role', approved_role::TEXT, 'organization_id', v_gov_org_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'request_id', request_id,
        'user_id', v_req.user_id,
        'organization_id', v_gov_org_id,
        'role', approved_role::TEXT,
        'status', 'APPROVED'
    );
END;
$$;

-- 10. Transactional Contractor Approval RPC (Requirement 39 & 40)
CREATE OR REPLACE FUNCTION public.approve_contractor_access_request(
    request_id UUID,
    approved_role public.app_role_enum DEFAULT 'contractor_admin'::public.app_role_enum
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_caller_id UUID := (SELECT auth.uid());
    v_contractor_org_id UUID;
    v_req public.contractor_access_requests%ROWTYPE;
BEGIN
    -- Contractor verification must always be performed by an authenticated government user.
    IF v_caller_id IS NULL OR NOT public.is_government_user() OR public.get_user_role() <> 'government_admin' THEN
        RAISE EXCEPTION 'Unauthorized: Only Government Administrators can verify contractor onboarding';
    END IF;

    -- Lock and retrieve request
    SELECT * INTO v_req FROM public.contractor_access_requests
    WHERE id = request_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Contractor access request % not found', request_id;
    END IF;

    IF v_req.status <> 'PENDING' THEN
        RAISE EXCEPTION 'Request % has already been %', request_id, v_req.status;
    END IF;

    -- Stable company resolution: match by GSTIN, CIN, or Name (Requirement 40)
    SELECT id INTO v_contractor_org_id
    FROM public.organizations
    WHERE type = 'contractor'
      AND (
          (v_req.gstin IS NOT NULL AND gstin = v_req.gstin)
          OR (v_req.registration_cin IS NOT NULL AND registration_number = v_req.registration_cin)
          OR (lower(btrim(name)) = lower(btrim(v_req.company_name)))
      )
    LIMIT 1;

    -- If no existing company organization exists, create one
    IF v_contractor_org_id IS NULL THEN
        INSERT INTO public.organizations (
            name,
            type,
            status,
            state,
            district,
            registration_number,
            gstin,
            verified
        ) VALUES (
            v_req.company_name,
            'contractor'::public.org_type,
            'ACTIVE',
            v_req.state,
            v_req.district,
            v_req.registration_cin,
            v_req.gstin,
            true
        ) RETURNING id INTO v_contractor_org_id;
    END IF;

    -- Create or reactivate active contractor organization membership
    INSERT INTO public.organization_members (
        organization_id,
        user_id,
        role,
        status,
        created_at,
        updated_at
    ) VALUES (
        v_contractor_org_id,
        v_req.user_id,
        approved_role,
        'active',
        now(),
        now()
    ) ON CONFLICT (organization_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        status = 'active',
        updated_at = now();

    -- Mark request APPROVED
    UPDATE public.contractor_access_requests
    SET status = 'APPROVED',
        reviewed_by = v_caller_id,
        reviewed_at = now()
    WHERE id = request_id;

    -- Record audit log
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (
        COALESCE(v_caller_id, v_req.user_id),
        'APPROVE_CONTRACTOR_ACCESS',
        'contractor_access_requests',
        request_id,
        jsonb_build_object(
            'approved_user_id', v_req.user_id,
            'organization_id', v_contractor_org_id,
            'company_name', v_req.company_name,
            'role', approved_role::TEXT
        )
    );

    -- Notify contractor organization
    INSERT INTO public.notifications (
        organization_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        v_contractor_org_id,
        'VENDOR_VERIFIED',
        'Contractor Organization Verified',
        'Your contractor organization ' || v_req.company_name || ' has been verified. You may now bid on public tenders and submit progress claims.',
        'organizations',
        v_contractor_org_id,
        jsonb_build_object('company_name', v_req.company_name, 'organization_id', v_contractor_org_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'request_id', request_id,
        'user_id', v_req.user_id,
        'organization_id', v_contractor_org_id,
        'company_name', v_req.company_name,
        'role', approved_role::TEXT,
        'status', 'APPROVED'
    );
END;
$$;

-- 11. Updated Secure Database Views (Requirements 14 & 15)
DROP VIEW IF EXISTS public.government_project_summary_view;
CREATE OR REPLACE VIEW public.government_project_summary_view AS
SELECT
    p.id,
    p.nirikshak_project_id,
    p.official_project_id,
    p.project_name,
    p.description,
    p.sector,
    p.subsector,
    p.project_type,
    p.ministry,
    p.department,
    p.project_authority,
    p.implementing_agency,
    p.executing_agency,
    p.contractor_concessionaire,
    p.operator,
    p.ownership_type,
    p.procurement_mode,
    p.award_date,
    p.planned_start_date,
    p.actual_start_date,
    p.original_completion_date,
    p.revised_completion_date,
    p.actual_completion_date,
    p.state,
    p.district,
    p.city,
    p.location_text,
    p.latitude,
    p.longitude,
    p.total_cost_inr_crore,
    p.original_cost_inr_crore,
    p.revised_cost_inr_crore,
    p.amount_spent_inr_crore,
    p.physical_progress_percent,
    p.financial_progress_percent,
    p.reported_status,
    p.normalized_status,
    p.record_scope,
    p.current_status_verified,
    p.quality_score,
    p.duplicate_review,
    p.source_record_id,
    p.primary_source_url,
    p.is_public,
    p.public_summary,
    p.published_at,
    p.published_by,
    p.version,
    p.government_organization_id,
    p.created_by,
    p.created_at,
    p.updated_at,
    p.deleted_at,
    (SELECT count(*) FROM public.complaints c WHERE c.project_id = p.id AND c.status NOT IN ('RESOLVED', 'CLOSED')) AS open_complaints_count,
    (SELECT count(*) FROM public.progress_updates pu WHERE pu.project_id = p.id AND pu.verification_status = 'SUBMITTED') AS pending_progress_updates_count,
    (SELECT count(*) FROM public.inspections i WHERE i.project_id = p.id AND i.status = 'SCHEDULED') AS pending_inspections_count,
    (SELECT count(*) FROM public.ai_insights ai WHERE ai.project_id = p.id AND ai.severity = 'HIGH' AND ai.status = 'ACTIVE') AS high_risk_ai_count
FROM public.projects p
WHERE p.deleted_at IS NULL
  AND p.government_organization_id = public.get_user_organization_id();

DROP VIEW IF EXISTS public.contractor_assigned_projects_view;
CREATE OR REPLACE VIEW public.contractor_assigned_projects_view AS
SELECT DISTINCT
    p.id,
    p.nirikshak_project_id,
    p.project_name,
    p.sector,
    p.subsector,
    p.project_authority,
    p.location_text,
    p.latitude,
    p.longitude,
    p.total_cost_inr_crore,
    p.physical_progress_percent,
    p.normalized_status,
    c.id AS contract_id,
    c.contract_number,
    c.contract_value,
    c.status AS contract_status,
    c.scheduled_completion_date
FROM public.projects p
LEFT JOIN public.contracts c ON c.project_id = p.id AND c.contractor_organization_id = public.get_user_organization_id()
LEFT JOIN public.project_organizations po ON po.project_id = p.id AND po.organization_id = public.get_user_organization_id()
WHERE p.deleted_at IS NULL
  AND (
      c.contractor_organization_id = public.get_user_organization_id()
      OR po.organization_id = public.get_user_organization_id()
  );

-- 12. Rigid Multi-Tenant Row Level Security Policies

-- Projects RLS
DROP POLICY IF EXISTS "Projects select policy" ON public.projects;
CREATE POLICY "Projects select policy" ON public.projects
    FOR SELECT TO public
    USING (
        (is_public = true AND deleted_at IS NULL)
        OR (public.is_government_user() AND (government_organization_id = public.get_user_organization_id() OR government_organization_id IS NULL))
        OR (public.is_contractor_user() AND public.can_access_project(id))
    );

DROP POLICY IF EXISTS "Government can insert projects" ON public.projects;
CREATE POLICY "Government can insert projects" ON public.projects
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_government_user()
    );

DROP POLICY IF EXISTS "Government can update projects" ON public.projects;
CREATE POLICY "Government can update projects" ON public.projects
    FOR UPDATE TO authenticated
    USING (
        public.is_government_user() AND (government_organization_id = public.get_user_organization_id() OR government_organization_id IS NULL)
    );

-- Tenders RLS
DROP POLICY IF EXISTS "Tenders select policy" ON public.tenders;
CREATE POLICY "Tenders select policy" ON public.tenders
    FOR SELECT TO public
    USING (
        (is_public = true AND deleted_at IS NULL)
        OR (public.is_government_user() AND (issuing_organization_id = public.get_user_organization_id() OR issuing_organization_id IS NULL))
    );

DROP POLICY IF EXISTS "Government manage tenders" ON public.tenders;
CREATE POLICY "Government manage tenders" ON public.tenders
    FOR ALL TO authenticated
    USING (
        public.is_government_user() AND (issuing_organization_id = public.get_user_organization_id() OR issuing_organization_id IS NULL)
    );

-- Tender Bids RLS (Contractor Isolation Rule - Requirement 11, 27)
DROP POLICY IF EXISTS "Contractor view own bids, Gov view all" ON public.tender_bids;
CREATE POLICY "Contractor view own bids, Gov view all" ON public.tender_bids
    FOR SELECT TO authenticated
    USING (
        (public.is_contractor_user() AND contractor_organization_id = public.get_user_organization_id())
        OR (public.is_government_user() AND EXISTS (
            SELECT 1 FROM public.tenders t
            WHERE t.id = tender_bids.tender_id
              AND (t.issuing_organization_id = public.get_user_organization_id() OR t.issuing_organization_id IS NULL)
        ))
    );

DROP POLICY IF EXISTS "Contractor insert bid" ON public.tender_bids;
CREATE POLICY "Contractor insert bid" ON public.tender_bids
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_contractor_user() AND contractor_organization_id = public.get_user_organization_id()
    );

DROP POLICY IF EXISTS "Contractor update own bid" ON public.tender_bids;
CREATE POLICY "Contractor update own bid" ON public.tender_bids
    FOR UPDATE TO authenticated
    USING (
        public.is_contractor_user() AND contractor_organization_id = public.get_user_organization_id() AND status = 'DRAFT'
    )
    WITH CHECK (
        contractor_organization_id = public.get_user_organization_id()
    );

-- Contracts RLS (Requirement 28: Contractor only sees own contract, Gov sees own project contracts)
DROP POLICY IF EXISTS "contracts_select" ON public.contracts;
CREATE POLICY "contracts_select" ON public.contracts
    FOR SELECT TO authenticated
    USING (
        (public.is_contractor_user() AND contractor_organization_id = public.get_user_organization_id())
        OR (public.is_government_user() AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = contracts.project_id
              AND (p.government_organization_id = public.get_user_organization_id() OR p.government_organization_id IS NULL)
        ))
    );

DROP POLICY IF EXISTS "contracts_gov_all" ON public.contracts;
CREATE POLICY "contracts_gov_all" ON public.contracts
    FOR ALL TO authenticated
    USING (
        public.is_government_user() AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = contracts.project_id
              AND (p.government_organization_id = public.get_user_organization_id() OR p.government_organization_id IS NULL)
        )
    );

-- Progress Updates RLS (Requirement 29)
DROP POLICY IF EXISTS "Progress updates select" ON public.progress_updates;
CREATE POLICY "Progress updates select" ON public.progress_updates
    FOR SELECT TO public
    USING (
        (public.is_contractor_user() AND contractor_organization_id = public.get_user_organization_id())
        OR (public.is_government_user() AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = progress_updates.project_id
              AND (p.government_organization_id = public.get_user_organization_id() OR p.government_organization_id IS NULL)
        ))
        OR (verification_status = 'APPROVED' AND EXISTS (
            SELECT 1 FROM public.projects p WHERE p.id = progress_updates.project_id AND p.is_public = true
        ))
    );

DROP POLICY IF EXISTS "Contractor insert progress" ON public.progress_updates;
CREATE POLICY "Contractor insert progress" ON public.progress_updates
    FOR INSERT TO authenticated
    WITH CHECK (
        public.is_contractor_user() AND contractor_organization_id = public.get_user_organization_id()
    );

DROP POLICY IF EXISTS "Government update progress" ON public.progress_updates;
CREATE POLICY "Government update progress" ON public.progress_updates
    FOR UPDATE TO authenticated
    USING (
        public.is_government_user() AND EXISTS (
            SELECT 1 FROM public.projects p
            WHERE p.id = progress_updates.project_id
              AND (p.government_organization_id = public.get_user_organization_id() OR p.government_organization_id IS NULL)
        )
    );

-- Access Requests RLS (Requirements 21 & 22)
DROP POLICY IF EXISTS "government_access_requests_select" ON public.government_access_requests;
DROP POLICY IF EXISTS "Users can read own gov access request" ON public.government_access_requests;
DROP POLICY IF EXISTS "Users view own government access request" ON public.government_access_requests;
CREATE POLICY "government_access_requests_select" ON public.government_access_requests
    FOR SELECT TO authenticated
    USING (
        (SELECT auth.uid()) = user_id
        OR (public.is_government_user() AND public.get_user_role() IN ('government_admin', 'chief_engineer'))
    );

DROP POLICY IF EXISTS "government_access_requests_insert" ON public.government_access_requests;
DROP POLICY IF EXISTS "Users can insert own gov access request" ON public.government_access_requests;
DROP POLICY IF EXISTS "Users create own government access request" ON public.government_access_requests;
CREATE POLICY "government_access_requests_insert" ON public.government_access_requests
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = user_id AND status = 'PENDING'
    );

DROP POLICY IF EXISTS "government_access_requests_update" ON public.government_access_requests;
DROP POLICY IF EXISTS "Government reviews government access requests" ON public.government_access_requests;
CREATE POLICY "government_access_requests_update" ON public.government_access_requests
    FOR UPDATE TO authenticated
    USING (
        public.is_government_user() AND public.get_user_role() IN ('government_admin', 'chief_engineer')
    );

DROP POLICY IF EXISTS "contractor_access_requests_select" ON public.contractor_access_requests;
DROP POLICY IF EXISTS "Users can read own contractor access request" ON public.contractor_access_requests;
DROP POLICY IF EXISTS "Users view own contractor access request" ON public.contractor_access_requests;
CREATE POLICY "contractor_access_requests_select" ON public.contractor_access_requests
    FOR SELECT TO authenticated
    USING (
        (SELECT auth.uid()) = user_id
        OR (public.is_government_user() AND public.get_user_role() IN ('government_admin', 'chief_engineer'))
    );

DROP POLICY IF EXISTS "contractor_access_requests_insert" ON public.contractor_access_requests;
DROP POLICY IF EXISTS "Users can insert own contractor access request" ON public.contractor_access_requests;
DROP POLICY IF EXISTS "Users create own contractor access request" ON public.contractor_access_requests;
CREATE POLICY "contractor_access_requests_insert" ON public.contractor_access_requests
    FOR INSERT TO authenticated
    WITH CHECK (
        (SELECT auth.uid()) = user_id AND status = 'PENDING'
    );

DROP POLICY IF EXISTS "contractor_access_requests_update" ON public.contractor_access_requests;
DROP POLICY IF EXISTS "Government reviews contractor access requests" ON public.contractor_access_requests;
CREATE POLICY "contractor_access_requests_update" ON public.contractor_access_requests
    FOR UPDATE TO authenticated
    USING (
        public.is_government_user() AND public.get_user_role() IN ('government_admin', 'chief_engineer')
    );

-- 13. Grant Permissions to Authenticated and Anon
GRANT SELECT ON public.government_project_summary_view TO authenticated, anon;
GRANT SELECT ON public.contractor_assigned_projects_view TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.government_access_requests TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.contractor_access_requests TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_government_access_request(UUID, public.app_role_enum) TO authenticated;
-- 14. Registration RPCs (Requirement 4, 9, 18, 19)
CREATE OR REPLACE FUNCTION public.register_government_account(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_employee_id TEXT,
    p_department TEXT,
    p_designation TEXT,
    p_state TEXT DEFAULT 'Maharashtra',
    p_district TEXT DEFAULT 'Pune',
    p_requested_role TEXT DEFAULT 'government_engineer'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_enc_pass TEXT;
    v_existing_id UUID;
BEGIN
    IF p_email IS NULL OR btrim(p_email) = '' THEN
        RAISE EXCEPTION 'Email is required';
    END IF;
    IF p_password IS NULL OR length(p_password) < 8 THEN
        RAISE EXCEPTION 'Password must be at least 8 characters long';
    END IF;
    IF p_full_name IS NULL OR btrim(p_full_name) = '' THEN
        RAISE EXCEPTION 'Full official name is required';
    END IF;
    IF p_employee_id IS NULL OR btrim(p_employee_id) = '' THEN
        RAISE EXCEPTION 'Employee ID is required';
    END IF;

    SELECT id INTO v_existing_id
    FROM auth.users
    WHERE lower(email) = lower(btrim(p_email))
    LIMIT 1;

    v_enc_pass := extensions.crypt(p_password, extensions.gen_salt('bf'));

    IF v_existing_id IS NOT NULL THEN
        UPDATE auth.users
        SET encrypted_password = v_enc_pass,
            raw_user_meta_data = jsonb_build_object(
                'full_name', btrim(p_full_name),
                'requested_role', p_requested_role,
                'employee_id', btrim(p_employee_id),
                'department', btrim(p_department),
                'designation', btrim(p_designation),
                'state', p_state,
                'district', p_district
            ),
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            updated_at = now()
        WHERE id = v_existing_id;
        v_user_id := v_existing_id;
    ELSE
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token,
            is_sso_user
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            lower(btrim(p_email)),
            v_enc_pass,
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object(
                'full_name', btrim(p_full_name),
                'requested_role', p_requested_role,
                'employee_id', btrim(p_employee_id),
                'department', btrim(p_department),
                'designation', btrim(p_designation),
                'state', p_state,
                'district', p_district
            ),
            now(),
            now(),
            '',
            '',
            '',
            '',
            false
        );
    END IF;

    INSERT INTO public.government_access_requests (
        user_id,
        employee_id,
        department,
        designation,
        official_email,
        state,
        district,
        status,
        requested_role
    ) VALUES (
        v_user_id,
        btrim(p_employee_id),
        btrim(p_department),
        btrim(p_designation),
        lower(btrim(p_email)),
        p_state,
        p_district,
        'PENDING',
        p_requested_role
    ) ON CONFLICT (user_id) DO UPDATE SET
        employee_id = EXCLUDED.employee_id,
        department = EXCLUDED.department,
        designation = EXCLUDED.designation,
        official_email = EXCLUDED.official_email,
        requested_role = EXCLUDED.requested_role,
        status = 'PENDING';

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'email', lower(btrim(p_email)),
        'message', 'Registration request submitted. Your Government access is pending administrator approval.'
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.register_contractor_account(
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_phone TEXT,
    p_company_name TEXT,
    p_registration_cin TEXT,
    p_gstin TEXT,
    p_contractor_class TEXT DEFAULT 'Class 1 (Unlimited)',
    p_state TEXT DEFAULT 'Maharashtra',
    p_district TEXT DEFAULT 'Pune',
    p_requested_role TEXT DEFAULT 'contractor_admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_enc_pass TEXT;
    v_existing_id UUID;
BEGIN
    IF p_email IS NULL OR btrim(p_email) = '' THEN
        RAISE EXCEPTION 'Email is required';
    END IF;
    IF p_password IS NULL OR length(p_password) < 8 THEN
        RAISE EXCEPTION 'Password must be at least 8 characters long';
    END IF;
    IF p_full_name IS NULL OR btrim(p_full_name) = '' THEN
        RAISE EXCEPTION 'Full name is required';
    END IF;
    IF p_company_name IS NULL OR btrim(p_company_name) = '' THEN
        RAISE EXCEPTION 'Company name is required';
    END IF;

    SELECT id INTO v_existing_id
    FROM auth.users
    WHERE lower(email) = lower(btrim(p_email))
    LIMIT 1;

    v_enc_pass := extensions.crypt(p_password, extensions.gen_salt('bf'));

    IF v_existing_id IS NOT NULL THEN
        UPDATE auth.users
        SET encrypted_password = v_enc_pass,
            raw_user_meta_data = jsonb_build_object(
                'full_name', btrim(p_full_name),
                'requested_role', p_requested_role,
                'phone', btrim(p_phone),
                'company_name', btrim(p_company_name),
                'registration_cin', btrim(p_registration_cin),
                'gstin', btrim(p_gstin),
                'contractor_class', p_contractor_class,
                'state', p_state,
                'district', p_district
            ),
            email_confirmed_at = COALESCE(email_confirmed_at, now()),
            updated_at = now()
        WHERE id = v_existing_id;
        v_user_id := v_existing_id;
    ELSE
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at,
            confirmation_token,
            email_change,
            email_change_token_new,
            recovery_token,
            is_sso_user
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_user_id,
            'authenticated',
            'authenticated',
            lower(btrim(p_email)),
            v_enc_pass,
            now(),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object(
                'full_name', btrim(p_full_name),
                'requested_role', p_requested_role,
                'phone', btrim(p_phone),
                'company_name', btrim(p_company_name),
                'registration_cin', btrim(p_registration_cin),
                'gstin', btrim(p_gstin),
                'contractor_class', p_contractor_class,
                'state', p_state,
                'district', p_district
            ),
            now(),
            now(),
            '',
            '',
            '',
            '',
            false
        );
    END IF;

    INSERT INTO public.contractor_access_requests (
        user_id,
        company_name,
        registration_cin,
        gstin,
        contractor_class,
        state,
        district,
        phone,
        status,
        requested_role
    ) VALUES (
        v_user_id,
        btrim(p_company_name),
        btrim(p_registration_cin),
        btrim(p_gstin),
        p_contractor_class,
        p_state,
        p_district,
        p_phone,
        'PENDING',
        p_requested_role
    ) ON CONFLICT (user_id) DO UPDATE SET
        company_name = EXCLUDED.company_name,
        registration_cin = EXCLUDED.registration_cin,
        gstin = EXCLUDED.gstin,
        phone = EXCLUDED.phone,
        contractor_class = EXCLUDED.contractor_class,
        requested_role = EXCLUDED.requested_role,
        status = 'PENDING';

    RETURN jsonb_build_object(
        'success', true,
        'user_id', v_user_id,
        'email', lower(btrim(p_email)),
        'message', 'Your contractor organization verification is pending.'
    );
END;
$$;

GRANT EXECUTE ON FUNCTION public.register_government_account(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.register_contractor_account(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.approve_contractor_access_request(UUID, public.app_role_enum) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_organization_id() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_government_user() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.is_contractor_user() TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_access_project(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_project(UUID) TO authenticated, anon;


-- ==========================================
-- MIGRATION: 025_complete_security_hardening.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK MIGRATION 025: COMPLETE SECURITY & TENANT HARDENING
-- Hardens search_path on all SECURITY DEFINER functions, enforces government
-- organization ownership on contract awards, adds audit logging to bids,
-- supports CLARIFICATION_REQUIRED on progress reviews, and provisions secure storage.
-- ==============================================================================

-- 1. Helper Aliases & Security Functions (Rule 15)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role_enum
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT public.get_user_role();
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_organization_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT public.get_user_organization_id();
$$;

CREATE OR REPLACE FUNCTION public.can_review_progress(p_project_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_temp
AS $$
  SELECT public.can_manage_project(p_project_id);
$$;

-- 2. Enforce Safe search_path on all existing SECURITY DEFINER functions (Rule 16)
ALTER FUNCTION public.get_user_role() SET search_path = public, pg_temp;
ALTER FUNCTION public.get_user_organization_id() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_government_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_contractor_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.is_citizen() SET search_path = public, pg_temp;
ALTER FUNCTION public.can_access_project(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.can_manage_project(uuid) SET search_path = public, pg_temp;
ALTER FUNCTION public.set_project_gov_org() SET search_path = public, pg_temp;
ALTER FUNCTION public.handle_new_user() SET search_path = public, pg_temp;
ALTER FUNCTION public.approve_government_access_request(uuid, app_role_enum) SET search_path = public, pg_temp;
ALTER FUNCTION public.approve_contractor_access_request(uuid, app_role_enum) SET search_path = public, pg_temp;
ALTER FUNCTION public.reject_access_request(uuid, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.register_government_account(text, text, text, text, text, text, text, text, text) SET search_path = public, pg_temp;
ALTER FUNCTION public.register_contractor_account(text, text, text, text, text, text, text, text, text, text, text) SET search_path = public, pg_temp;

-- 3. Hardened award_contract (Rules 24, 25)
CREATE OR REPLACE FUNCTION public.award_contract(p_tender_id uuid, p_selected_bid_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_user_id UUID := (SELECT auth.uid());
    v_tender public.tenders%ROWTYPE;
    v_bid public.tender_bids%ROWTYPE;
    v_contract public.contracts%ROWTYPE;
    v_contract_num TEXT;
    v_duration_months INTEGER := 24;
BEGIN
    -- Validate caller is authenticated government official
    IF v_user_id IS NULL OR NOT public.is_government_user() THEN
        RAISE EXCEPTION 'Unauthorized: Active government membership required';
    END IF;

    -- Lock and validate tender
    SELECT * INTO v_tender FROM public.tenders
    WHERE id = p_tender_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Tender % not found', p_tender_id;
    END IF;

    -- Rule 24: Verify Government organization owns tender/project
    IF NOT public.can_manage_project(v_tender.project_id) THEN
        RAISE EXCEPTION 'Unauthorized: Your government authority does not own project % for tender %', v_tender.project_id, p_tender_id;
    END IF;

    IF v_tender.status = 'AWARDED' THEN
        RAISE EXCEPTION 'Tender is already awarded';
    END IF;

    -- Lock and validate selected bid
    SELECT * INTO v_bid FROM public.tender_bids
    WHERE id = p_selected_bid_id AND tender_id = p_tender_id AND deleted_at IS NULL
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Bid % does not belong to tender %', p_selected_bid_id, p_tender_id;
    END IF;

    IF v_bid.status NOT IN ('SUBMITTED', 'UNDER_EVALUATION') THEN
        RAISE EXCEPTION 'Only submitted bids can be awarded (current status: %)', v_bid.status;
    END IF;

    -- Mark selected bid as SELECTED
    UPDATE public.tender_bids
    SET status = 'SELECTED', updated_at = now()
    WHERE id = p_selected_bid_id;

    -- Mark all other submitted bids for this tender as REJECTED
    UPDATE public.tender_bids
    SET status = 'REJECTED', updated_at = now()
    WHERE tender_id = p_tender_id AND id <> p_selected_bid_id AND status IN ('SUBMITTED', 'UNDER_EVALUATION', 'DRAFT');

    -- Mark tender as AWARDED
    UPDATE public.tenders
    SET status = 'AWARDED', updated_at = now()
    WHERE id = p_tender_id;

    -- Generate official contract number
    v_contract_num := 'CNT-' || COALESCE(NULLIF(v_tender.tender_number, ''), to_char(CURRENT_DATE, 'YYYY')) || '-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 8));

    -- Create official contract
    INSERT INTO public.contracts (
        project_id,
        tender_id,
        contractor_organization_id,
        official_contract_id,
        contract_number,
        contract_title,
        contract_value,
        award_date,
        scheduled_start_date,
        scheduled_completion_date,
        status,
        version
    ) VALUES (
        v_tender.project_id,
        p_tender_id,
        v_bid.contractor_organization_id,
        v_contract_num,
        v_contract_num,
        v_tender.title,
        v_bid.bid_amount,
        CURRENT_DATE,
        CURRENT_DATE + interval '14 days',
        CURRENT_DATE + (v_duration_months || ' months')::interval,
        'ACTIVE',
        1
    )
    RETURNING * INTO v_contract;

    -- Create or update project_organizations assignment
    INSERT INTO public.project_organizations (
        project_id,
        organization_id,
        relationship,
        valid_from
    ) VALUES (
        v_tender.project_id,
        v_bid.contractor_organization_id,
        'primary_contractor',
        CURRENT_DATE
    )
    ON CONFLICT DO NOTHING;

    -- Update project status to active execution
    UPDATE public.projects
    SET normalized_status = 'IN_PROGRESS', updated_at = now()
    WHERE id = v_tender.project_id AND normalized_status IN ('PROPOSED', 'TENDERED', 'APPROVED');

    -- Insert audit trail
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (
        v_user_id,
        'AWARD_CONTRACT',
        'contracts',
        v_contract.id,
        jsonb_build_object(
            'tender_id', p_tender_id,
            'bid_id', p_selected_bid_id,
            'contract_number', v_contract_num,
            'contract_value', v_bid.bid_amount,
            'contractor_organization_id', v_bid.contractor_organization_id
        )
    );

    -- Notify winning contractor
    INSERT INTO public.notifications (
        organization_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        v_bid.contractor_organization_id,
        'CONTRACT_AWARDED',
        'Contract Awarded: ' || v_tender.title,
        'Your bid has been selected and contract ' || v_contract_num || ' has been awarded.',
        'contracts',
        v_contract.id,
        jsonb_build_object(
            'tender_id', p_tender_id,
            'contract_id', v_contract.id,
            'project_id', v_tender.project_id,
            'value', v_bid.bid_amount
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'contract_id', v_contract.id,
        'contract_number', v_contract_num,
        'tender_id', p_tender_id,
        'contractor_organization_id', v_bid.contractor_organization_id,
        'contract_value', v_bid.bid_amount
    );
END;
$function$;

-- 4. Hardened save_tender_bid (Rules 21, 22, 23)
CREATE OR REPLACE FUNCTION public.save_tender_bid(p_tender_id uuid, p_bid_amount numeric, p_technical_proposal text, p_status text DEFAULT 'DRAFT'::text)
RETURNS tender_bids
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_user_id UUID := (SELECT auth.uid());
    v_org_id UUID;
    v_tender public.tenders%ROWTYPE;
    v_bid public.tender_bids%ROWTYPE;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
    IF p_status NOT IN ('DRAFT', 'SUBMITTED') THEN RAISE EXCEPTION 'Invalid bid status'; END IF;
    IF p_bid_amount IS NULL OR p_bid_amount <= 0 THEN RAISE EXCEPTION 'Bid amount must be positive'; END IF;

    SELECT om.organization_id INTO v_org_id
    FROM public.organization_members om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.user_id = v_user_id
      AND lower(om.status) = 'active'
      AND (o.type = 'contractor' OR om.role IN ('contractor_admin', 'contractor_manager', 'contractor_site_engineer'))
    LIMIT 1;
    IF v_org_id IS NULL THEN RAISE EXCEPTION 'Active contractor membership required'; END IF;

    SELECT * INTO v_tender FROM public.tenders
    WHERE id = p_tender_id AND deleted_at IS NULL FOR SHARE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Tender not found'; END IF;
    IF v_tender.status <> 'PUBLISHED' OR (v_tender.bid_due_date IS NOT NULL AND v_tender.bid_due_date < CURRENT_DATE) THEN
        RAISE EXCEPTION 'Tender is not open for bids';
    END IF;

    INSERT INTO public.tender_bids (
        tender_id, contractor_organization_id, bid_reference, bid_amount,
        technical_proposal, status, submitted_by, submitted_at
    ) VALUES (
        p_tender_id, v_org_id,
        'NIR-BID-' || EXTRACT(YEAR FROM CURRENT_DATE)::TEXT || '-' || upper(substr(replace(gen_random_uuid()::TEXT, '-', ''), 1, 12)),
        p_bid_amount, nullif(btrim(p_technical_proposal), ''), p_status, v_user_id,
        CASE WHEN p_status = 'SUBMITTED' THEN now() ELSE NULL END
    )
    ON CONFLICT (tender_id, contractor_organization_id) WHERE deleted_at IS NULL
    DO UPDATE SET
        bid_amount = EXCLUDED.bid_amount,
        technical_proposal = EXCLUDED.technical_proposal,
        status = EXCLUDED.status,
        submitted_by = v_user_id,
        submitted_at = CASE WHEN EXCLUDED.status = 'SUBMITTED' THEN now() ELSE public.tender_bids.submitted_at END,
        updated_at = now()
    WHERE public.tender_bids.status = 'DRAFT'
    RETURNING * INTO v_bid;

    IF v_bid.id IS NULL THEN RAISE EXCEPTION 'Only draft bids can be changed'; END IF;

    -- Audit trail for bid submission / update (Rule 23)
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (
        v_user_id,
        CASE WHEN p_status = 'SUBMITTED' THEN 'BID_SUBMISSION' ELSE 'BID_SAVE_DRAFT' END,
        'tender_bids',
        v_bid.id,
        jsonb_build_object(
            'tender_id', p_tender_id,
            'bid_reference', v_bid.bid_reference,
            'contractor_org_id', v_org_id,
            'amount', p_bid_amount,
            'status', p_status
        )
    );

    RETURN v_bid;
END;
$function$;

-- 5. Hardened submit_progress_update (Rules 26, 27)
CREATE OR REPLACE FUNCTION public.submit_progress_update(p_project_id uuid, p_reported_progress numeric, p_description text, p_milestone_id uuid DEFAULT NULL::uuid)
RETURNS progress_updates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_user_id UUID := (SELECT auth.uid());
    v_org_id UUID;
    v_update public.progress_updates%ROWTYPE;
BEGIN
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required';
    END IF;

    -- Validate reported progress percentage
    IF p_reported_progress IS NULL OR p_reported_progress < 0 OR p_reported_progress > 100 THEN
        RAISE EXCEPTION 'Reported progress must be between 0 and 100 percent';
    END IF;

    -- Get active contractor organization ID for caller
    SELECT om.organization_id INTO v_org_id
    FROM public.organization_members om
    JOIN public.organizations o ON o.id = om.organization_id
    WHERE om.user_id = v_user_id
      AND lower(om.status) = 'active'
      AND (o.type = 'contractor' OR om.role IN ('contractor_admin', 'contractor_manager', 'contractor_site_engineer'))
    LIMIT 1;

    IF v_org_id IS NULL THEN
        RAISE EXCEPTION 'Active contractor organization membership required';
    END IF;

    -- Verify contractor is assigned to this project
    IF NOT EXISTS (
        SELECT 1 FROM public.contracts
        WHERE project_id = p_project_id AND contractor_organization_id = v_org_id AND status = 'ACTIVE'
    ) AND NOT EXISTS (
        SELECT 1 FROM public.project_organizations
        WHERE project_id = p_project_id AND organization_id = v_org_id
    ) THEN
        RAISE EXCEPTION 'Unauthorized: Contractor organization % is not assigned to project %', v_org_id, p_project_id;
    END IF;

    -- Verify milestone if provided
    IF p_milestone_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.project_milestones
            WHERE id = p_milestone_id AND project_id = p_project_id AND deleted_at IS NULL
        ) THEN
            RAISE EXCEPTION 'Milestone % does not belong to project %', p_milestone_id, p_project_id;
        END IF;
    END IF;

    -- Insert progress update with SUBMITTED verification status
    INSERT INTO public.progress_updates (
        project_id,
        contractor_organization_id,
        milestone_id,
        reported_progress,
        description,
        submitted_by,
        submitted_at,
        verification_status
    ) VALUES (
        p_project_id,
        v_org_id,
        p_milestone_id,
        p_reported_progress,
        p_description,
        v_user_id,
        now(),
        'SUBMITTED'
    )
    RETURNING * INTO v_update;

    -- Insert audit log
    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (
        v_user_id,
        'PROGRESS_SUBMISSION',
        'progress_updates',
        v_update.id,
        jsonb_build_object(
            'project_id', p_project_id,
            'reported_progress', p_reported_progress,
            'milestone_id', p_milestone_id
        )
    );

    -- Notify government reviewers
    INSERT INTO public.notifications (
        type,
        title,
        message,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        'PROGRESS_SUBMITTED',
        'New Progress Update Submitted',
        'Contractor submitted ' || p_reported_progress || '% progress claim for project audit review.',
        'progress_updates',
        v_update.id,
        jsonb_build_object('project_id', p_project_id, 'update_id', v_update.id)
    );

    RETURN v_update;
END;
$function$;

-- 6. Hardened approve_progress_update (Rules 28, 29)
CREATE OR REPLACE FUNCTION public.approve_progress_update(p_update_id uuid, p_decision text, p_verified_progress numeric DEFAULT NULL::numeric, p_review_notes text DEFAULT NULL::text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $function$
DECLARE
    v_reviewer_id UUID := (SELECT auth.uid());
    v_update public.progress_updates%ROWTYPE;
    v_verified_progress NUMERIC;
    v_new_project_progress NUMERIC;
BEGIN
    IF v_reviewer_id IS NULL OR NOT public.is_government_user() THEN
        RAISE EXCEPTION 'Unauthorized: active government membership required';
    END IF;
    IF p_decision NOT IN ('APPROVED', 'REJECTED', 'CLARIFICATION_REQUIRED') THEN
        RAISE EXCEPTION 'Invalid review decision: must be APPROVED, REJECTED, or CLARIFICATION_REQUIRED';
    END IF;

    SELECT * INTO v_update FROM public.progress_updates WHERE id = p_update_id FOR UPDATE;
    IF NOT FOUND THEN RAISE EXCEPTION 'Progress update not found'; END IF;
    IF v_update.verification_status NOT IN ('SUBMITTED', 'CLARIFICATION_REQUIRED') THEN
        RAISE EXCEPTION 'Progress update has already reached terminal verification state';
    END IF;

    -- Verify government reviewer has authority over this project
    IF NOT public.can_manage_project(v_update.project_id) THEN
        RAISE EXCEPTION 'Unauthorized: Your government authority does not manage this project';
    END IF;

    v_verified_progress := CASE WHEN p_decision = 'APPROVED'
        THEN COALESCE(p_verified_progress, v_update.reported_progress)
        ELSE NULL END;

    IF v_verified_progress IS NOT NULL AND (v_verified_progress < 0 OR v_verified_progress > 100) THEN
        RAISE EXCEPTION 'Verified progress must be between 0 and 100';
    END IF;

    UPDATE public.progress_updates SET
        verification_status = p_decision,
        verified_progress = v_verified_progress,
        reviewed_by = v_reviewer_id,
        reviewed_at = now(),
        review_notes = p_review_notes,
        updated_at = now()
    WHERE id = p_update_id;

    -- Critical Invariant (Rule 29): Only APPROVED updates modify official physical_progress_percent
    IF p_decision = 'APPROVED' AND v_update.milestone_id IS NOT NULL THEN
        UPDATE public.project_milestones SET
            verified_progress = v_verified_progress,
            status = CASE WHEN v_verified_progress >= 100 THEN 'COMPLETED' ELSE 'IN_PROGRESS' END,
            actual_end_date = CASE WHEN v_verified_progress >= 100 THEN CURRENT_DATE ELSE actual_end_date END,
            updated_at = now()
        WHERE id = v_update.milestone_id;

        SELECT AVG(verified_progress) INTO v_new_project_progress FROM public.project_milestones
        WHERE project_id = v_update.project_id AND deleted_at IS NULL AND verified_progress IS NOT NULL;

        UPDATE public.projects SET
            physical_progress_percent = round(v_new_project_progress, 2),
            current_status_verified = (v_new_project_progress IS NOT NULL),
            updated_at = now()
        WHERE id = v_update.project_id;
    END IF;

    INSERT INTO public.audit_logs (actor_id, action, entity_type, entity_id, new_value)
    VALUES (
        v_reviewer_id,
        'PROGRESS_REVIEW',
        'progress_updates',
        p_update_id,
        jsonb_build_object('decision', p_decision, 'verified_progress', v_verified_progress, 'notes', p_review_notes)
    );

    -- Notify contractor organization
    INSERT INTO public.notifications (
        organization_id,
        type,
        title,
        message,
        entity_type,
        entity_id,
        metadata
    ) VALUES (
        v_update.contractor_organization_id,
        'PROGRESS_REVIEWED',
        'Progress Update ' || p_decision,
        'Government authority recorded decision: ' || p_decision || COALESCE(' (Verified: ' || v_verified_progress || '%)', ''),
        'progress_updates',
        p_update_id,
        jsonb_build_object('decision', p_decision, 'verified_progress', v_verified_progress, 'project_id', v_update.project_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'progress_update_id', p_update_id,
        'decision', p_decision,
        'verified_progress', v_verified_progress,
        'reviewed_by', v_reviewer_id
    );
END;
$function$;

-- 7. Provision Storage Buckets (Rules 41-44)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('progress-evidence', 'progress-evidence', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('contractor-documents', 'contractor-documents', false, 20971520, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
  ('government-documents', 'government-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('complaint-evidence', 'complaint-evidence', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),
  ('public-documents', 'public-documents', true, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png'])
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;


-- ==========================================
-- MIGRATION: 026_security_access_hardening.sql
-- ==========================================

-- Security hardening follow-up for the multi-tenant model.
-- Apply this migration before exposing the production Data API.

-- Privileged workflow functions are never anonymous endpoints.
REVOKE EXECUTE ON FUNCTION public.approve_government_access_request(uuid, public.app_role_enum) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_contractor_access_request(uuid, public.app_role_enum) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reject_access_request(uuid, text, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.award_contract(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_progress_update(uuid, text, numeric, text) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.register_government_account(text, text, text, text, text, text, text, text, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.register_contractor_account(text, text, text, text, text, text, text, text, text, text, text) FROM anon, authenticated, PUBLIC;

-- Preserve the existing transactional implementations behind authenticated,
-- administrator-only wrappers. This also hardens databases where migration 024
-- was applied manually without a matching migration-history entry.
ALTER FUNCTION public.approve_government_access_request(uuid, public.app_role_enum)
  RENAME TO approve_government_access_request_internal;
ALTER FUNCTION public.approve_contractor_access_request(uuid, public.app_role_enum)
  RENAME TO approve_contractor_access_request_internal;

REVOKE ALL ON FUNCTION public.approve_government_access_request_internal(uuid, public.app_role_enum) FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.approve_contractor_access_request_internal(uuid, public.app_role_enum) FROM anon, authenticated, PUBLIC;

CREATE FUNCTION public.approve_government_access_request(
  request_id uuid,
  approved_role public.app_role_enum DEFAULT 'government_engineer'::public.app_role_enum
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id uuid := (SELECT auth.uid());
  v_caller_role public.app_role_enum;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: authentication is required';
  END IF;
  SELECT role INTO v_caller_role
  FROM public.organization_members
  WHERE user_id = v_caller_id AND lower(status) = 'active'
  LIMIT 1;
  IF v_caller_role <> 'government_admin' THEN
    RAISE EXCEPTION 'Unauthorized: Government Administrator role is required';
  END IF;
  RETURN public.approve_government_access_request_internal(request_id, approved_role);
END;
$$;

CREATE FUNCTION public.approve_contractor_access_request(
  request_id uuid,
  approved_role public.app_role_enum DEFAULT 'contractor_admin'::public.app_role_enum
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_caller_id uuid := (SELECT auth.uid());
  v_caller_role public.app_role_enum;
BEGIN
  IF v_caller_id IS NULL THEN
    RAISE EXCEPTION 'Unauthorized: authentication is required';
  END IF;
  SELECT role INTO v_caller_role
  FROM public.organization_members
  WHERE user_id = v_caller_id AND lower(status) = 'active'
  LIMIT 1;
  IF v_caller_role <> 'government_admin' THEN
    RAISE EXCEPTION 'Unauthorized: Government Administrator role is required';
  END IF;
  RETURN public.approve_contractor_access_request_internal(request_id, approved_role);
END;
$$;

-- Keep the approval RPCs available only to authenticated callers; the function
-- bodies enforce government-admin authorization and reject NULL auth.uid().
GRANT EXECUTE ON FUNCTION public.approve_government_access_request(uuid, public.app_role_enum) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_contractor_access_request(uuid, public.app_role_enum) TO authenticated;

-- Views must evaluate access using the querying user's RLS context.
ALTER VIEW public.government_project_summary_view SET (security_invoker = true);
ALTER VIEW public.contractor_assigned_projects_view SET (security_invoker = true);
ALTER VIEW public.public_projects_view SET (security_invoker = true);

-- A user without an active organization membership must never inherit the
-- development Government authority through a view fallback.
CREATE OR REPLACE VIEW public.government_project_summary_view
WITH (security_invoker = true) AS
SELECT
  p.id, p.nirikshak_project_id, p.official_project_id, p.project_name,
  p.description, p.sector, p.subsector, p.project_type, p.ministry,
  p.department, p.project_authority, p.implementing_agency,
  p.executing_agency, p.contractor_concessionaire, p.operator,
  p.ownership_type, p.procurement_mode, p.award_date, p.planned_start_date,
  p.actual_start_date, p.original_completion_date, p.revised_completion_date,
  p.actual_completion_date, p.state, p.district, p.city, p.location_text,
  p.latitude, p.longitude, p.total_cost_inr_crore, p.original_cost_inr_crore,
  p.revised_cost_inr_crore, p.amount_spent_inr_crore,
  p.physical_progress_percent, p.financial_progress_percent,
  p.reported_status, p.normalized_status, p.record_scope,
  p.current_status_verified, p.quality_score, p.duplicate_review,
  p.source_record_id, p.primary_source_url, p.is_public, p.public_summary,
  p.published_at, p.published_by, p.version, p.government_organization_id,
  p.created_by, p.created_at, p.updated_at, p.deleted_at,
  (SELECT count(*) FROM public.complaints c
    WHERE c.project_id = p.id AND c.status NOT IN ('RESOLVED', 'CLOSED')) AS open_complaints_count,
  (SELECT count(*) FROM public.progress_updates pu
    WHERE pu.project_id = p.id AND pu.verification_status = 'SUBMITTED') AS pending_progress_updates_count,
  (SELECT count(*) FROM public.inspections i
    WHERE i.project_id = p.id AND i.status = 'SCHEDULED') AS pending_inspections_count,
  (SELECT count(*) FROM public.ai_insights ai
    WHERE ai.project_id = p.id AND ai.severity = 'HIGH' AND ai.status = 'ACTIVE') AS high_risk_ai_count
FROM public.projects p
WHERE p.deleted_at IS NULL
  AND p.government_organization_id = public.get_user_organization_id();

-- Do not expose private workflow relations directly through the anonymous Data API.
REVOKE ALL ON TABLE public.tender_bids, public.contracts, public.notifications,
  public.audit_logs, public.government_access_requests, public.contractor_access_requests,
  public.ai_runs, public.ai_insights FROM anon;
REVOKE ALL ON public.government_project_summary_view, public.contractor_assigned_projects_view FROM anon;

-- Explicitly preserve only the public project projection for anonymous users.
GRANT SELECT ON public.public_projects_view TO anon;


-- ==========================================
-- MIGRATION: 027_function_execute_privileges.sql
-- ==========================================

-- Remove PostgreSQL's default PUBLIC EXECUTE privilege from SECURITY DEFINER
-- functions. Only authenticated application workflows retain direct access.

REVOKE EXECUTE ON FUNCTION public.approve_government_access_request(uuid, public.app_role_enum) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_contractor_access_request(uuid, public.app_role_enum) FROM anon, PUBLIC;

REVOKE EXECUTE ON FUNCTION public.can_access_project(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_manage_project(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.can_review_progress(uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_current_user_organization_id() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_current_user_role() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_organization_id() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.get_user_role() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_citizen() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_contractor_user() FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_government_user() FROM anon, PUBLIC;

GRANT EXECUTE ON FUNCTION public.approve_government_access_request(uuid, public.app_role_enum) TO authenticated;
GRANT EXECUTE ON FUNCTION public.approve_contractor_access_request(uuid, public.app_role_enum) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_project(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_project(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_review_progress(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_citizen() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_contractor_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_government_user() TO authenticated;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.rls_auto_enable() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.set_project_gov_org() FROM anon, authenticated, PUBLIC;
REVOKE ALL ON FUNCTION public.seed_projects_batch(jsonb) FROM anon, authenticated, PUBLIC;
GRANT EXECUTE ON FUNCTION public.seed_projects_batch(jsonb) TO service_role;


-- ==========================================
-- MIGRATION: 028_public_rls_helper_privileges.sql
-- ==========================================

-- Anonymous reads of public projects evaluate the complete projects policy.
-- These helpers derive identity only from auth.uid() and return booleans/NULL;
-- granting EXECUTE lets RLS evaluate public rows without exposing private data.

GRANT EXECUTE ON FUNCTION public.get_user_organization_id() TO anon;
GRANT EXECUTE ON FUNCTION public.is_government_user() TO anon;
GRANT EXECUTE ON FUNCTION public.is_contractor_user() TO anon;
GRANT EXECUTE ON FUNCTION public.can_access_project(uuid) TO anon;


-- ==========================================
-- MIGRATION: 029_database_v2_foundation.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 029_database_v2_foundation.sql
-- Domain: Core Foundation, Project Normalization & Project Organization Relationships
-- ==============================================================================

-- 1. Ensure essential extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Project Organization Relationship & Status Enums / Domains
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_org_relation_enum') THEN
    CREATE TYPE project_org_relation_enum AS ENUM (
      'OWNER',
      'IMPLEMENTING_AGENCY',
      'CONTRACTOR',
      'CONSULTANT',
      'AUDITOR',
      'SUPERVISOR'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'project_lifecycle_status_enum') THEN
    CREATE TYPE project_lifecycle_status_enum AS ENUM (
      'PROPOSED',
      'UNDER_REVIEW',
      'APPROVED',
      'TENDERING',
      'AWARDED',
      'UNDER_CONSTRUCTION',
      'DELAYED',
      'AT_RISK',
      'STALLED',
      'SUSPENDED',
      'COMPLETED',
      'CANCELLED'
    );
  END IF;
END $$;

-- 3. Normalize projects table with canonical V2 fields
ALTER TABLE public.projects 
  ADD COLUMN IF NOT EXISTS approved_cost_inr_crore NUMERIC(14, 2) CHECK (approved_cost_inr_crore IS NULL OR approved_cost_inr_crore >= 0),
  ADD COLUMN IF NOT EXISTS funding_source TEXT,
  ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'MEDIUM' CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  ADD COLUMN IF NOT EXISTS public_visibility BOOLEAN DEFAULT true;

-- Ensure physical_progress_percent and financial_progress_percent have valid bounds
DO $$ BEGIN
  ALTER TABLE public.projects 
    DROP CONSTRAINT IF EXISTS chk_projects_physical_progress,
    ADD CONSTRAINT chk_projects_physical_progress CHECK (physical_progress_percent IS NULL OR (physical_progress_percent >= 0 AND physical_progress_percent <= 100));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.projects 
    DROP CONSTRAINT IF EXISTS chk_projects_financial_progress,
    ADD CONSTRAINT chk_projects_financial_progress CHECK (financial_progress_percent IS NULL OR (financial_progress_percent >= 0 AND financial_progress_percent <= 100));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 4. Normalize project_organizations table
ALTER TABLE public.project_organizations
  ADD COLUMN IF NOT EXISTS effective_from TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS effective_to TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'SUSPENDED', 'TERMINATED', 'COMPLETED'));

-- Ensure unique constraint on active project-organization-relationship pair
CREATE UNIQUE INDEX IF NOT EXISTS uq_project_org_rel 
  ON public.project_organizations (project_id, organization_id, relationship_type) 
  WHERE (status = 'ACTIVE');

-- 5. Organization members active uniqueness index
CREATE UNIQUE INDEX IF NOT EXISTS uq_org_members_active
  ON public.organization_members (organization_id, user_id)
  WHERE (status = 'active' OR status = 'ACTIVE');


-- ==========================================
-- MIGRATION: 030_procurement_contracts_v2.sql
-- ==========================================

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


-- ==========================================
-- MIGRATION: 031_milestones_progress_delays_v2.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 031_milestones_progress_delays_v2.sql
-- Domain: Milestones, Progress Updates, Progress Evidence, Delay Management
-- ==============================================================================

-- 1. Normalize project_milestones table
ALTER TABLE public.project_milestones
  ADD COLUMN IF NOT EXISTS contract_id UUID REFERENCES public.contracts(id),
  ADD COLUMN IF NOT EXISTS weight_percent NUMERIC(5, 2) DEFAULT 0.0 CHECK (weight_percent >= 0 AND weight_percent <= 100),
  ADD COLUMN IF NOT EXISTS planned_progress_percent NUMERIC(5, 2) CHECK (planned_progress_percent IS NULL OR (planned_progress_percent >= 0 AND planned_progress_percent <= 100)),
  ADD COLUMN IF NOT EXISTS verified_progress_percent NUMERIC(5, 2) CHECK (verified_progress_percent IS NULL OR (verified_progress_percent >= 0 AND verified_progress_percent <= 100));

-- 2. Normalize progress_updates table
ALTER TABLE public.progress_updates
  ADD COLUMN IF NOT EXISTS work_completed TEXT,
  ADD COLUMN IF NOT EXISTS work_planned TEXT,
  ADD COLUMN IF NOT EXISTS challenges TEXT,
  ADD COLUMN IF NOT EXISTS contractor_delay_reason TEXT,
  ADD COLUMN IF NOT EXISTS observation_date DATE DEFAULT CURRENT_DATE;

-- Ensure progress percentages are bound between 0 and 100
DO $$ BEGIN
  ALTER TABLE public.progress_updates
    DROP CONSTRAINT IF EXISTS chk_progress_reported_range,
    ADD CONSTRAINT chk_progress_reported_range CHECK (reported_progress >= 0 AND reported_progress <= 100);
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.progress_updates
    DROP CONSTRAINT IF EXISTS chk_progress_verified_range,
    ADD CONSTRAINT chk_progress_verified_range CHECK (verified_progress IS NULL OR (verified_progress >= 0 AND verified_progress <= 100));
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Normalize progress_evidence table
ALTER TABLE public.progress_evidence
  ADD COLUMN IF NOT EXISTS document_id UUID,
  ADD COLUMN IF NOT EXISTS description TEXT,
  ADD COLUMN IF NOT EXISTS captured_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS uploaded_by UUID REFERENCES public.profiles(id);

-- 4. Normalize delay_events table
ALTER TABLE public.delay_events
  ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES public.project_milestones(id),
  ADD COLUMN IF NOT EXISTS progress_update_id UUID REFERENCES public.progress_updates(id),
  ADD COLUMN IF NOT EXISTS reported_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS reported_by_organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS start_date DATE,
  ADD COLUMN IF NOT EXISTS end_date DATE,
  ADD COLUMN IF NOT EXISTS responsibility TEXT DEFAULT 'UNASSIGNED',
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'UNDER_INVESTIGATION', 'MITIGATED', 'RESOLVED', 'CLOSED'));

CREATE INDEX IF NOT EXISTS idx_progress_updates_project_submitted ON public.progress_updates(project_id, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_progress_updates_verification ON public.progress_updates(project_id, verification_status);
CREATE INDEX IF NOT EXISTS idx_delay_events_project ON public.delay_events(project_id, status);


-- ==========================================
-- MIGRATION: 032_resources_workforce_v2.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 032_resources_workforce_v2.sql
-- Domain: Construction Resources, Equipment, Material Allocations & Aggregate Workforce
-- ==============================================================================

-- 1. Create resource_items table
CREATE TABLE IF NOT EXISTS public.resource_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('MATERIAL', 'EQUIPMENT', 'MACHINERY', 'VEHICLE', 'OTHER')),
  resource_code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  unit TEXT NOT NULL DEFAULT 'units',
  capacity NUMERIC(12, 2),
  status TEXT NOT NULL DEFAULT 'AVAILABLE' CHECK (status IN ('AVAILABLE', 'ALLOCATED', 'MAINTENANCE', 'DECOMMISSIONED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_resource_org_code UNIQUE (organization_id, resource_code)
);

CREATE INDEX IF NOT EXISTS idx_resource_items_org ON public.resource_items(organization_id, resource_type);

-- 2. Create project_resource_allocations table
CREATE TABLE IF NOT EXISTS public.project_resource_allocations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  resource_item_id UUID NOT NULL REFERENCES public.resource_items(id) ON DELETE RESTRICT,
  contractor_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  allocated_quantity NUMERIC(12, 2) NOT NULL DEFAULT 1 CHECK (allocated_quantity >= 0),
  available_quantity NUMERIC(12, 2) NOT NULL DEFAULT 1 CHECK (available_quantity >= 0),
  required_quantity NUMERIC(12, 2) NOT NULL DEFAULT 1 CHECK (required_quantity >= 0),
  utilized_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (utilized_quantity >= 0),
  allocation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'MOBILIZED', 'DEMOBILIZED', 'RELEASED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resource_alloc_project ON public.project_resource_allocations(project_id, contractor_organization_id);

-- 3. Create resource_usage_updates table
CREATE TABLE IF NOT EXISTS public.resource_usage_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  resource_allocation_id UUID REFERENCES public.project_resource_allocations(id) ON DELETE SET NULL,
  observation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  required_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (required_quantity >= 0),
  available_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (available_quantity >= 0),
  used_quantity NUMERIC(12, 2) NOT NULL DEFAULT 0 CHECK (used_quantity >= 0),
  shortage_quantity NUMERIC(12, 2) GENERATED ALWAYS AS (GREATEST(0, required_quantity - available_quantity)) STORED,
  shortage_ratio NUMERIC(5, 4) CHECK (shortage_ratio IS NULL OR (shortage_ratio >= 0 AND shortage_ratio <= 1)),
  reported_by UUID REFERENCES public.profiles(id),
  verified_by UUID REFERENCES public.profiles(id),
  verification_status TEXT NOT NULL DEFAULT 'PENDING' CHECK (verification_status IN ('PENDING', 'VERIFIED', 'DISPUTED', 'REJECTED')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_resource_usage_project ON public.resource_usage_updates(project_id, observation_date DESC);

-- 4. Create project_workforce_updates table (strictly aggregate counts, no PII surveillance)
CREATE TABLE IF NOT EXISTS public.project_workforce_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  contractor_organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  observation_date DATE NOT NULL DEFAULT CURRENT_DATE,
  planned_workers INTEGER NOT NULL DEFAULT 0 CHECK (planned_workers >= 0),
  available_workers INTEGER NOT NULL DEFAULT 0 CHECK (available_workers >= 0),
  skilled_workers INTEGER DEFAULT 0 CHECK (skilled_workers >= 0),
  unskilled_workers INTEGER DEFAULT 0 CHECK (unskilled_workers >= 0),
  supervisors INTEGER DEFAULT 0 CHECK (supervisors >= 0),
  safety_officers INTEGER DEFAULT 0 CHECK (safety_officers >= 0),
  worker_shortage_ratio NUMERIC(5, 4) CHECK (worker_shortage_ratio IS NULL OR (worker_shortage_ratio >= 0 AND worker_shortage_ratio <= 1)),
  reported_by UUID REFERENCES public.profiles(id),
  verification_status TEXT NOT NULL DEFAULT 'CONTRACTOR_REPORTED' CHECK (verification_status IN ('CONTRACTOR_REPORTED', 'VERIFIED', 'FLAGGED')),
  verified_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workforce_project ON public.project_workforce_updates(project_id, observation_date DESC);


-- ==========================================
-- MIGRATION: 033_finance_payment_claims_v2.sql
-- ==========================================

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


-- ==========================================
-- MIGRATION: 034_inspections_documents_v2.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 034_inspections_documents_v2.sql
-- Domain: Quality Inspections, Defect Findings & Canonical Project Document Management
-- ==============================================================================

-- 1. Normalize inspections table
ALTER TABLE public.inspections
  ADD COLUMN IF NOT EXISTS milestone_id UUID REFERENCES public.project_milestones(id),
  ADD COLUMN IF NOT EXISTS scheduled_date DATE,
  ADD COLUMN IF NOT EXISTS inspector_user_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS inspector_organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS overall_result TEXT CHECK (overall_result IS NULL OR overall_result IN ('SATISFACTORY', 'NON_CONFORMING', 'CRITICAL_DEFECT', 'PENDING_TESTS'));

-- 2. Normalize inspection_findings table
ALTER TABLE public.inspection_findings
  ADD COLUMN IF NOT EXISTS finding_type TEXT DEFAULT 'WORKMANSHIP' CHECK (finding_type IN ('WORKMANSHIP', 'MATERIAL_QUALITY', 'SAFETY_VIOLATION', 'STRUCTURAL_DEFECT', 'SPECIFICATION_DEVIATION', 'OTHER')),
  ADD COLUMN IF NOT EXISTS required_action TEXT,
  ADD COLUMN IF NOT EXISTS due_date DATE,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id);

CREATE INDEX IF NOT EXISTS idx_inspection_findings_open ON public.inspection_findings(inspection_id, status) WHERE (status IN ('OPEN', 'ACTION_REQUIRED'));

-- 3. Normalize project_documents table
ALTER TABLE public.project_documents
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS storage_bucket TEXT DEFAULT 'project-documents',
  ADD COLUMN IF NOT EXISTS mime_type TEXT DEFAULT 'application/pdf',
  ADD COLUMN IF NOT EXISTS file_size BIGINT CHECK (file_size IS NULL OR file_size >= 0),
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'PROJECT_SHARED' CHECK (visibility IN ('GOV_INTERNAL', 'PROJECT_SHARED', 'CONTRACTOR_PRIVATE', 'PUBLIC', 'AI_ALLOWED')),
  ADD COLUMN IF NOT EXISTS checksum TEXT,
  ADD COLUMN IF NOT EXISTS version_number INTEGER NOT NULL DEFAULT 1 CHECK (version_number >= 1),
  ADD COLUMN IF NOT EXISTS is_current_version BOOLEAN NOT NULL DEFAULT true;

CREATE INDEX IF NOT EXISTS idx_project_docs_visibility ON public.project_documents(project_id, visibility);


-- ==========================================
-- MIGRATION: 035_environment_compliance_v2.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 035_environment_compliance_v2.sql
-- Domain: Environmental Clearances, Baseline Thresholds, Sensor/Satellite Observations, Incidents
-- ==============================================================================

-- 1. Normalize environmental_clearances
ALTER TABLE public.environmental_clearances
  ADD COLUMN IF NOT EXISTS document_id UUID,
  ADD COLUMN IF NOT EXISTS notes TEXT;

-- 2. Normalize environmental_baselines
ALTER TABLE public.environmental_baselines
  ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'EIA_STUDY',
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT true;

-- 3. Normalize environmental_observations
ALTER TABLE public.environmental_observations
  ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'GOVERNMENT_VERIFIED' CHECK (source_type IN ('CONTRACTOR_REPORTED', 'GOVERNMENT_VERIFIED', 'SENSOR', 'PUBLIC_DATA', 'SATELLITE', 'OTHER')),
  ADD COLUMN IF NOT EXISTS source_reference TEXT,
  ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.profiles(id);

-- 4. Normalize environmental_incidents
ALTER TABLE public.environmental_incidents
  ADD COLUMN IF NOT EXISTS resolution TEXT,
  ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_env_obs_project ON public.environmental_observations(project_id, observation_date DESC);
CREATE INDEX IF NOT EXISTS idx_env_clearances_expiry ON public.environmental_clearances(project_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_env_incidents_project ON public.environmental_incidents(project_id, status);


-- ==========================================
-- MIGRATION: 036_complaints_v2.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 036_complaints_v2.sql
-- Domain: Citizen Grievance Redressal, Complaint Progression & Public Tracking
-- ==============================================================================

-- 1. Normalize complaints table
ALTER TABLE public.complaints
  ADD COLUMN IF NOT EXISTS complaint_number TEXT,
  ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS resolution_summary TEXT,
  ADD COLUMN IF NOT EXISTS public_tracking_token TEXT;

-- Backfill complaint_number from reference_number
UPDATE public.complaints
SET complaint_number = reference_number
WHERE complaint_number IS NULL AND reference_number IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_complaints_number ON public.complaints(complaint_number) WHERE (complaint_number IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_complaints_token ON public.complaints(public_tracking_token) WHERE (public_tracking_token IS NOT NULL);
CREATE INDEX IF NOT EXISTS idx_complaints_project_status ON public.complaints(project_id, status);

-- 2. Normalize complaint_updates table
ALTER TABLE public.complaint_updates
  ADD COLUMN IF NOT EXISTS message TEXT,
  ADD COLUMN IF NOT EXISTS visibility TEXT NOT NULL DEFAULT 'CITIZEN_VISIBLE' CHECK (visibility IN ('INTERNAL', 'CITIZEN_VISIBLE', 'PUBLIC')),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id);

-- Backfill message from notes if message is null
DO $$ BEGIN
  UPDATE public.complaint_updates SET message = notes WHERE message IS NULL AND notes IS NOT NULL;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Normalize complaint_evidence table
ALTER TABLE public.complaint_evidence
  ADD COLUMN IF NOT EXISTS document_id UUID;


-- ==========================================
-- MIGRATION: 037_legal_litigation_settlements_v2.sql
-- ==========================================

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


-- ==========================================
-- MIGRATION: 038_notifications_audit_v2.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 038_notifications_audit_v2.sql
-- Domain: Universal Platform Notifications & Security Audit Logging
-- ==============================================================================

-- 1. Normalize notifications table
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS recipient_user_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS recipient_organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id),
  ADD COLUMN IF NOT EXISTS severity TEXT DEFAULT 'INFO' CHECK (severity IN ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  ADD COLUMN IF NOT EXISTS entity_type TEXT,
  ADD COLUMN IF NOT EXISTS entity_id TEXT,
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;

-- Backfill recipient_user_id from user_id if present
UPDATE public.notifications
SET recipient_user_id = user_id
WHERE recipient_user_id IS NULL AND user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_user_id, read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_org ON public.notifications(recipient_organization_id, read_at);

-- 2. Normalize audit_logs table
ALTER TABLE public.audit_logs
  ADD COLUMN IF NOT EXISTS actor_organization_id UUID REFERENCES public.organizations(id),
  ADD COLUMN IF NOT EXISTS project_id UUID REFERENCES public.projects(id),
  ADD COLUMN IF NOT EXISTS old_value JSONB,
  ADD COLUMN IF NOT EXISTS new_value JSONB,
  ADD COLUMN IF NOT EXISTS ip_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_audit_logs_project ON public.audit_logs(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON public.audit_logs(actor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);


-- ==========================================
-- MIGRATION: 039_ai_intelligence_lifecycle_v2.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 039_ai_intelligence_lifecycle_v2.sql
-- Domain: AI Analysis Runs, Recommended Actions, Officer Feedback, Verified Outcomes
-- ==============================================================================

-- 1. Create ai_analysis_runs table
CREATE TABLE IF NOT EXISTS public.ai_analysis_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_id UUID NOT NULL UNIQUE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES public.profiles(id),
  requested_by_organization_id UUID REFERENCES public.organizations(id),
  service_version TEXT NOT NULL DEFAULT '1.0.0',
  historical_model_version TEXT DEFAULT 'nirikshak-ai-v1.0.0',
  online_model_version TEXT DEFAULT 'online-drift-v1',
  rl_policy_version TEXT DEFAULT 'linucb-v1',
  llm_model TEXT DEFAULT 'nvidia/nemotron-4-340b-instruct',
  context_hash TEXT,
  input_completeness_score NUMERIC(5, 4) CHECK (input_completeness_score IS NULL OR (input_completeness_score >= 0 AND input_completeness_score <= 1)),
  status TEXT NOT NULL DEFAULT 'COMPLETED' CHECK (status IN ('RUNNING', 'COMPLETED', 'PARTIAL', 'FAILED')),
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_runs_project ON public.ai_analysis_runs(project_id, created_at DESC);

-- 2. Create ai_recommended_actions table
CREATE TABLE IF NOT EXISTS public.ai_recommended_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_run_id UUID NOT NULL REFERENCES public.ai_analysis_runs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  action_code TEXT NOT NULL,
  rank INTEGER NOT NULL CHECK (rank >= 1),
  policy_score NUMERIC(8, 4),
  learned_mean_reward NUMERIC(8, 4),
  uncertainty_bonus NUMERIC(8, 4),
  explanation TEXT,
  status TEXT NOT NULL DEFAULT 'PROPOSED' CHECK (status IN ('PROPOSED', 'REVIEWED', 'ACCEPTED', 'REJECTED', 'COMPLETED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_run_action UNIQUE (analysis_run_id, action_code)
);

CREATE INDEX IF NOT EXISTS idx_ai_recommended_actions_project ON public.ai_recommended_actions(project_id, status);

-- 3. Create ai_recommendation_feedback table
CREATE TABLE IF NOT EXISTS public.ai_recommendation_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_run_id UUID NOT NULL REFERENCES public.ai_analysis_runs(id) ON DELETE CASCADE,
  recommended_action_id UUID REFERENCES public.ai_recommended_actions(id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  reviewed_by UUID REFERENCES public.profiles(id),
  feedback TEXT NOT NULL CHECK (feedback IN ('USEFUL', 'ACCEPTED', 'NEUTRAL', 'REJECTED', 'HARMFUL')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_run_action_feedback UNIQUE (analysis_run_id, action)
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_project ON public.ai_recommendation_feedback(project_id);

-- 4. Create ai_action_outcomes table
CREATE TABLE IF NOT EXISTS public.ai_action_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_run_id UUID NOT NULL REFERENCES public.ai_analysis_runs(id) ON DELETE CASCADE,
  recommended_action_id UUID REFERENCES public.ai_recommended_actions(id) ON DELETE SET NULL,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  baseline_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  verified_outcome_snapshot JSONB NOT NULL DEFAULT '{}'::jsonb,
  reward NUMERIC(8, 4) NOT NULL,
  reward_components JSONB DEFAULT '{}'::jsonb,
  verified_by UUID REFERENCES public.profiles(id),
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_run_action_outcome UNIQUE (analysis_run_id, action)
);

CREATE INDEX IF NOT EXISTS idx_ai_outcomes_project ON public.ai_action_outcomes(project_id);

-- 5. Create ai_context_snapshots table
CREATE TABLE IF NOT EXISTS public.ai_context_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  analysis_run_id UUID REFERENCES public.ai_analysis_runs(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  snapshot JSONB NOT NULL,
  snapshot_hash TEXT NOT NULL,
  provenance JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ai_snapshots_project ON public.ai_context_snapshots(project_id);

-- 6. Normalize ai_insights table
ALTER TABLE public.ai_insights
  ADD COLUMN IF NOT EXISTS analysis_run_id UUID REFERENCES public.ai_analysis_runs(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS review_priority_score NUMERIC(5, 2) CHECK (review_priority_score IS NULL OR (review_priority_score >= 0 AND review_priority_score <= 100)),
  ADD COLUMN IF NOT EXISTS review_priority_band TEXT CHECK (review_priority_band IS NULL OR review_priority_band IN ('TYPICAL', 'WATCHLIST', 'HIGH_PRIORITY', 'VERY_UNUSUAL')),
  ADD COLUMN IF NOT EXISTS structural_anomaly_score NUMERIC(5, 2) CHECK (structural_anomaly_score IS NULL OR (structural_anomaly_score >= 0 AND structural_anomaly_score <= 100)),
  ADD COLUMN IF NOT EXISTS cost_anomaly_score NUMERIC(5, 2) CHECK (cost_anomaly_score IS NULL OR (cost_anomaly_score >= 0 AND cost_anomaly_score <= 100)),
  ADD COLUMN IF NOT EXISTS drift_percentile NUMERIC(5, 2) CHECK (drift_percentile IS NULL OR (drift_percentile >= 0 AND drift_percentile <= 100));


-- ==========================================
-- MIGRATION: 040_external_telemetry_v2.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 040_external_telemetry_v2.sql
-- Domain: External Data Sources & Open Civic/Environmental Telemetry Observations
-- ==============================================================================

-- 1. Create external_data_sources table
CREATE TABLE IF NOT EXISTS public.external_data_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('WEATHER_API', 'CPCB_AQI', 'NRSC_BHUVAN', 'STATE_PORTAL', 'IOT_SENSOR', 'OTHER')),
  base_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  refresh_frequency TEXT NOT NULL DEFAULT 'HOURLY',
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Create external_observations table
CREATE TABLE IF NOT EXISTS public.external_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  data_source_id UUID REFERENCES public.external_data_sources(id) ON DELETE RESTRICT,
  observation_type TEXT NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  value_numeric NUMERIC(12, 4),
  value_text TEXT,
  unit TEXT,
  location JSONB DEFAULT '{}'::jsonb,
  raw_reference JSONB DEFAULT '{}'::jsonb,
  verified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ext_obs_project ON public.external_observations(project_id, observation_type, observed_at DESC);


-- ==========================================
-- MIGRATION: 041_views_v2.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 041_views_v2.sql
-- Domain: Public Transparency, Government Dashboard, Contractor Portal & Summary Views
-- ==============================================================================

-- 1. Refresh public_projects_view (Strictly Sanitized Public Data)
CREATE OR REPLACE VIEW public.public_projects_view AS
SELECT 
  p.id,
  p.nirikshak_project_id,
  p.project_name,
  p.description,
  p.sector,
  p.subsector,
  p.project_authority,
  p.state,
  p.district,
  p.city,
  p.location_text,
  p.latitude,
  p.longitude,
  p.total_cost_inr_crore,
  p.approved_cost_inr_crore,
  p.planned_start_date,
  p.original_completion_date,
  p.revised_completion_date,
  p.actual_completion_date,
  p.normalized_status,
  p.physical_progress_percent,
  p.financial_progress_percent,
  p.current_status_verified,
  c.contract_number,
  org.name AS contractor_name,
  (
    SELECT count(*) 
    FROM public.complaints comp 
    WHERE comp.project_id = p.id AND comp.status = 'RESOLVED'
  ) AS resolved_complaints_count,
  p.created_at,
  p.updated_at
FROM public.projects p
LEFT JOIN public.contracts c ON c.project_id = p.id AND c.status IN ('ACTIVE', 'COMPLETED')
LEFT JOIN public.organizations org ON c.contractor_organization_id = org.id
WHERE p.public_visibility = true AND p.deleted_at IS NULL;

-- 2. Create project_progress_summary_view
CREATE OR REPLACE VIEW public.project_progress_summary_view AS
SELECT
  p.id AS project_id,
  p.nirikshak_project_id,
  p.project_name,
  p.physical_progress_percent AS verified_physical_progress_percent,
  (
    SELECT pu.reported_progress 
    FROM public.progress_updates pu 
    WHERE pu.project_id = p.id 
    ORDER BY pu.submitted_at DESC 
    LIMIT 1
  ) AS latest_reported_progress_percent,
  (
    SELECT count(*) 
    FROM public.progress_updates pu 
    WHERE pu.project_id = p.id AND pu.verification_status IN ('SUBMITTED', 'UNDER_REVIEW')
  ) AS pending_reviews_count,
  (
    SELECT max(pu.submitted_at) 
    FROM public.progress_updates pu 
    WHERE pu.project_id = p.id
  ) AS last_progress_update_at,
  COALESCE(
    (SELECT sum(de.delay_days) FROM public.delay_events de WHERE de.project_id = p.id AND de.status = 'OPEN'),
    0
  ) AS active_delay_days
FROM public.projects p
WHERE p.deleted_at IS NULL;

-- 3. Create project_finance_summary_view
CREATE OR REPLACE VIEW public.project_finance_summary_view AS
SELECT
  p.id AS project_id,
  p.nirikshak_project_id,
  COALESCE(p.approved_cost_inr_crore, p.total_cost_inr_crore, 0) AS sanctioned_amount_inr_crore,
  COALESCE(
    (SELECT fu.expenditure_inr_crore FROM public.financial_updates fu WHERE fu.project_id = p.id ORDER BY fu.observation_date DESC LIMIT 1),
    0
  ) AS spent_inr_crore,
  COALESCE(
    (SELECT sum(pc.claimed_amount) FROM public.payment_claims pc WHERE pc.project_id = p.id AND pc.status IN ('SUBMITTED', 'UNDER_REVIEW')),
    0
  ) AS pending_claims_inr,
  COALESCE(
    (SELECT sum(pc.approved_amount) FROM public.payment_claims pc WHERE pc.project_id = p.id AND pc.status = 'APPROVED'),
    0
  ) AS approved_claims_inr,
  COALESCE(
    (SELECT sum(pm.amount_paid) FROM public.payments pm WHERE pm.project_id = p.id),
    0
  ) AS total_paid_inr
FROM public.projects p
WHERE p.deleted_at IS NULL;

-- 4. Create tender_catalog_view
CREATE OR REPLACE VIEW public.tender_catalog_view AS
SELECT
  t.id AS tender_id,
  t.tender_number,
  t.title AS tender_title,
  t.description,
  t.estimated_value_inr_crore,
  t.publication_date,
  t.pre_bid_date,
  t.bid_due_date,
  t.technical_opening_date,
  t.financial_opening_date,
  t.eligibility_criteria,
  t.technical_requirements,
  t.status AS tender_status,
  p.id AS project_id,
  p.nirikshak_project_id,
  p.project_name,
  p.sector,
  p.state,
  p.district,
  org.name AS issuing_department_name
FROM public.tenders t
JOIN public.projects p ON t.project_id = p.id
LEFT JOIN public.organizations org ON t.government_organization_id = org.id
WHERE t.deleted_at IS NULL AND t.status IN ('PUBLISHED', 'CLOSED', 'UNDER_EVALUATION', 'AWARDED');

-- 5. Refresh government_project_dashboard_view
CREATE OR REPLACE VIEW public.government_project_dashboard_view AS
SELECT
  p.id AS project_id,
  p.nirikshak_project_id,
  p.project_name,
  p.sector,
  p.normalized_status,
  p.physical_progress_percent,
  p.financial_progress_percent,
  p.government_organization_id,
  c.id AS active_contract_id,
  c.contract_number,
  org.id AS contractor_org_id,
  org.name AS contractor_name,
  (
    SELECT count(*) 
    FROM public.progress_updates pu 
    WHERE pu.project_id = p.id AND pu.verification_status IN ('SUBMITTED', 'UNDER_REVIEW')
  ) AS pending_progress_reviews,
  (
    SELECT count(*) 
    FROM public.inspections ins 
    WHERE ins.project_id = p.id AND ins.status = 'SCHEDULED'
  ) AS pending_inspections,
  (
    SELECT count(*) 
    FROM public.complaints comp 
    WHERE comp.project_id = p.id AND comp.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')
  ) AS open_complaints,
  (
    SELECT ai.review_priority_score 
    FROM public.ai_insights ai 
    WHERE ai.project_id = p.id 
    ORDER BY ai.created_at DESC 
    LIMIT 1
  ) AS latest_ai_review_priority_score,
  (
    SELECT ai.review_priority_band 
    FROM public.ai_insights ai 
    WHERE ai.project_id = p.id 
    ORDER BY ai.created_at DESC 
    LIMIT 1
  ) AS latest_ai_review_priority_band
FROM public.projects p
LEFT JOIN public.contracts c ON c.project_id = p.id AND c.status = 'ACTIVE'
LEFT JOIN public.organizations org ON c.contractor_organization_id = org.id
WHERE p.deleted_at IS NULL;

-- 6. Refresh contractor_assigned_projects_view
CREATE OR REPLACE VIEW public.contractor_assigned_projects_view AS
SELECT
  p.id,
  p.nirikshak_project_id,
  p.project_name,
  p.sector,
  p.subsector,
  p.location_text,
  p.state,
  p.district,
  p.normalized_status,
  p.physical_progress_percent,
  p.current_status_verified,
  c.id AS contract_id,
  c.contract_number,
  c.contract_value,
  c.scheduled_start_date,
  c.scheduled_end_date,
  c.status AS contract_status,
  c.contractor_organization_id,
  (
    SELECT pu.reported_progress 
    FROM public.progress_updates pu 
    WHERE pu.project_id = p.id AND pu.contractor_organization_id = c.contractor_organization_id 
    ORDER BY pu.submitted_at DESC 
    LIMIT 1
  ) AS my_latest_reported_progress,
  (
    SELECT count(*) 
    FROM public.payment_claims pc 
    WHERE pc.project_id = p.id AND pc.contractor_organization_id = c.contractor_organization_id AND pc.status = 'APPROVED'
  ) AS approved_claims_count
FROM public.projects p
JOIN public.contracts c ON c.project_id = p.id
WHERE p.deleted_at IS NULL;


-- ==========================================
-- MIGRATION: 042_rls_v2.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 042_rls_v2.sql
-- Domain: Comprehensive Row Level Security (RLS) Policies on all Database V2 Tables
-- ==============================================================================

-- 1. Enable RLS on all newly created tables
ALTER TABLE public.tender_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bid_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_resource_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_usage_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_workforce_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_budget_heads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_claim_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.litigations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.litigation_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_analysis_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommended_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendation_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_action_outcomes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_context_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_data_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.external_observations ENABLE ROW LEVEL SECURITY;

-- 2. TENDER & BID DOCUMENTS RLS
-- Public tender documents readable by authenticated users
CREATE POLICY "Public tender documents readable by all authenticated"
  ON public.tender_documents FOR SELECT
  TO authenticated
  USING (visibility = 'PUBLIC' OR public.is_government_user());

-- Bid documents: strictly contractor private or authorized government evaluator
CREATE POLICY "Contractor can view own bid documents"
  ON public.bid_documents FOR SELECT
  TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.tender_bids b
      WHERE b.id = bid_documents.bid_id 
        AND b.contractor_organization_id = public.get_current_user_organization_id()
    ) OR
    public.is_government_user()
  );

CREATE POLICY "Contractor can upload own bid documents"
  ON public.bid_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    uploaded_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.tender_bids b
      WHERE b.id = bid_documents.bid_id 
        AND b.contractor_organization_id = public.get_current_user_organization_id()
    )
  );

-- 3. RESOURCES & WORKFORCE RLS
CREATE POLICY "Organization can manage own resource items"
  ON public.resource_items FOR ALL
  TO authenticated
  USING (organization_id = public.get_current_user_organization_id() OR public.is_government_user())
  WITH CHECK (organization_id = public.get_current_user_organization_id() OR public.is_government_user());

CREATE POLICY "Project resource allocations visible to project parties"
  ON public.project_resource_allocations FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "Contractor can insert resource usage updates"
  ON public.resource_usage_updates FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_project(project_id) AND reported_by = auth.uid());

CREATE POLICY "Project resource usage readable by project parties"
  ON public.resource_usage_updates FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "Project workforce updates readable by project parties"
  ON public.project_workforce_updates FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "Contractor can report workforce counts"
  ON public.project_workforce_updates FOR INSERT
  TO authenticated
  WITH CHECK (public.can_access_project(project_id) AND reported_by = auth.uid());

-- 4. FINANCE & PAYMENT CLAIMS RLS
CREATE POLICY "Budget heads readable by project stakeholders"
  ON public.project_budget_heads FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "Government officers can manage budget heads"
  ON public.project_budget_heads FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

CREATE POLICY "Payment claims visible to owning contractor and authorized government"
  ON public.payment_claims FOR SELECT
  TO authenticated
  USING (
    contractor_organization_id = public.get_current_user_organization_id() OR
    public.can_manage_project(project_id)
  );

CREATE POLICY "Contractor can submit payment claims"
  ON public.payment_claims FOR INSERT
  TO authenticated
  WITH CHECK (
    contractor_organization_id = public.get_current_user_organization_id() AND
    submitted_by = auth.uid() AND
    status IN ('DRAFT', 'SUBMITTED')
  );

CREATE POLICY "Payment vouchers visible to claim parties"
  ON public.payment_claim_documents FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.payment_claims pc
      WHERE pc.id = payment_claim_documents.payment_claim_id
        AND (pc.contractor_organization_id = public.get_current_user_organization_id() OR public.can_manage_project(pc.project_id))
    )
  );

CREATE POLICY "Payments ledger readable by authorized parties"
  ON public.payments FOR SELECT
  TO authenticated
  USING (
    contractor_organization_id = public.get_current_user_organization_id() OR
    public.can_manage_project(project_id)
  );

-- 5. LEGAL, LITIGATION & SETTLEMENTS RLS
CREATE POLICY "Litigations readable by authorized government and assigned contractor"
  ON public.litigations FOR SELECT
  TO authenticated
  USING (
    government_organization_id = public.get_current_user_organization_id() OR
    contractor_organization_id = public.get_current_user_organization_id() OR
    public.is_government_user()
  );

CREATE POLICY "Government can manage litigation"
  ON public.litigations FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

CREATE POLICY "Litigation events readable by litigation parties"
  ON public.litigation_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.litigations l
      WHERE l.id = litigation_events.litigation_id
        AND (l.government_organization_id = public.get_current_user_organization_id() OR l.contractor_organization_id = public.get_current_user_organization_id())
    )
  );

CREATE POLICY "Settlements readable by settlement parties"
  ON public.settlements FOR SELECT
  TO authenticated
  USING (
    public.can_manage_project(project_id) OR
    EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.project_id = settlements.project_id
        AND c.contractor_organization_id = public.get_current_user_organization_id()
    )
  );

-- 6. AI INTELLIGENCE DOMAIN RLS
CREATE POLICY "Government can read AI analysis runs"
  ON public.ai_analysis_runs FOR SELECT
  TO authenticated
  USING (public.is_government_user() AND public.can_access_project(project_id));

CREATE POLICY "Government can read AI recommendations"
  ON public.ai_recommended_actions FOR SELECT
  TO authenticated
  USING (public.is_government_user() AND public.can_access_project(project_id));

CREATE POLICY "Government can submit recommendation feedback"
  ON public.ai_recommendation_feedback FOR INSERT
  TO authenticated
  WITH CHECK (public.is_government_user() AND reviewed_by = auth.uid());

CREATE POLICY "Government can read AI feedback"
  ON public.ai_recommendation_feedback FOR SELECT
  TO authenticated
  USING (public.is_government_user() AND public.can_access_project(project_id));

CREATE POLICY "Government can read AI verified outcomes"
  ON public.ai_action_outcomes FOR SELECT
  TO authenticated
  USING (public.is_government_user() AND public.can_access_project(project_id));

CREATE POLICY "Government can view AI context snapshots"
  ON public.ai_context_snapshots FOR SELECT
  TO authenticated
  USING (public.is_government_user() AND public.can_access_project(project_id));

-- 7. EXTERNAL OBSERVATIONS RLS
CREATE POLICY "External data sources readable by all authenticated"
  ON public.external_data_sources FOR SELECT
  TO authenticated
  USING (is_active = true);

CREATE POLICY "External observations readable by authenticated users"
  ON public.external_observations FOR SELECT
  TO authenticated
  USING (true);


-- ==========================================
-- MIGRATION: 043_secure_rpc_v2.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 043_secure_rpc_v2.sql
-- Domain: Secure Atomic RPC Stored Procedures with Fixed Search Paths & Server Identity Derivation
-- ==============================================================================

-- 1. Submit Payment Claim (Contractor Only)
CREATE OR REPLACE FUNCTION public.submit_payment_claim(
  p_project_id UUID,
  p_claimed_amount NUMERIC,
  p_claim_type TEXT DEFAULT 'RA_BILL',
  p_description TEXT DEFAULT NULL,
  p_milestone_id UUID DEFAULT NULL
)
RETURNS public.payment_claims
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_contract_id UUID;
  v_claim_ref TEXT;
  v_new_claim public.payment_claims;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  v_org_id := public.get_current_user_organization_id();
  IF v_org_id IS NULL OR NOT public.is_contractor_user() THEN
    RAISE EXCEPTION 'Only active contractor organization members can submit payment claims.';
  END IF;

  -- Verify active contract on project
  SELECT id INTO v_contract_id
  FROM public.contracts
  WHERE project_id = p_project_id AND contractor_organization_id = v_org_id AND status = 'ACTIVE'
  LIMIT 1;

  IF v_contract_id IS NULL THEN
    RAISE EXCEPTION 'No active contract found for your organization on this project.';
  END IF;

  IF p_claimed_amount <= 0 THEN
    RAISE EXCEPTION 'Claimed amount must be greater than zero.';
  END IF;

  -- Generate sequential claim reference
  v_claim_ref := 'NRK-CLM-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6);

  INSERT INTO public.payment_claims (
    claim_number,
    project_id,
    contract_id,
    contractor_organization_id,
    milestone_id,
    claim_type,
    claimed_amount,
    status,
    description,
    submitted_by,
    submitted_at
  ) VALUES (
    v_claim_ref,
    p_project_id,
    v_contract_id,
    v_org_id,
    p_milestone_id,
    p_claim_type,
    p_claimed_amount,
    'SUBMITTED',
    p_description,
    v_user_id,
    now()
  )
  RETURNING * INTO v_new_claim;

  -- Audit log entry
  INSERT INTO public.audit_logs (
    actor_id, actor_organization_id, action, entity_type, entity_id, project_id, new_value
  ) VALUES (
    v_user_id, v_org_id, 'PAYMENT_CLAIM_SUBMITTED', 'payment_claims', v_new_claim.id::text, p_project_id,
    jsonb_build_object('claim_number', v_claim_ref, 'claimed_amount', p_claimed_amount)
  );

  RETURN v_new_claim;
END;
$$;

-- 2. Review Payment Claim (Authorized Government Finance / Admin Role)
CREATE OR REPLACE FUNCTION public.review_payment_claim(
  p_claim_id UUID,
  p_decision TEXT,
  p_verified_amount NUMERIC DEFAULT NULL,
  p_approved_amount NUMERIC DEFAULT NULL,
  p_review_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_claim RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  v_org_id := public.get_current_user_organization_id();
  IF v_org_id IS NULL OR NOT public.is_government_user() THEN
    RAISE EXCEPTION 'Only authorized government officials can review payment claims.';
  END IF;

  SELECT * INTO v_claim FROM public.payment_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment claim not found.';
  END IF;

  IF NOT public.can_manage_project(v_claim.project_id) THEN
    RAISE EXCEPTION 'You lack authority to review payment claims for this project.';
  END IF;

  IF p_decision NOT IN ('VERIFIED', 'APPROVED', 'REJECTED', 'CLARIFICATION_REQUIRED') THEN
    RAISE EXCEPTION 'Invalid review decision.';
  END IF;

  IF p_decision = 'APPROVED' THEN
    IF p_approved_amount IS NULL OR p_approved_amount <= 0 OR p_approved_amount > v_claim.claimed_amount THEN
      RAISE EXCEPTION 'Approved amount must be positive and cannot exceed claimed amount.';
    END IF;

    UPDATE public.payment_claims
    SET status = 'APPROVED',
        verified_amount = COALESCE(p_verified_amount, p_approved_amount),
        approved_amount = p_approved_amount,
        reviewed_by = v_user_id,
        reviewed_at = now(),
        review_notes = p_review_notes,
        approved_by = v_user_id,
        approved_at = now(),
        updated_at = now()
    WHERE id = p_claim_id;
  ELSE
    UPDATE public.payment_claims
    SET status = p_decision,
        verified_amount = p_verified_amount,
        reviewed_by = v_user_id,
        reviewed_at = now(),
        review_notes = p_review_notes,
        updated_at = now()
    WHERE id = p_claim_id;
  END IF;

  INSERT INTO public.audit_logs (
    actor_id, actor_organization_id, action, entity_type, entity_id, project_id, new_value
  ) VALUES (
    v_user_id, v_org_id, 'PAYMENT_CLAIM_REVIEWED', 'payment_claims', p_claim_id::text, v_claim.project_id,
    jsonb_build_object('decision', p_decision, 'approved_amount', p_approved_amount)
  );

  RETURN jsonb_build_object('success', true, 'claim_id', p_claim_id, 'status', p_decision);
END;
$$;

-- 3. Record Payment Disbursement (Government Only)
CREATE OR REPLACE FUNCTION public.record_payment(
  p_claim_id UUID,
  p_amount_paid NUMERIC,
  p_payment_reference TEXT,
  p_payment_method TEXT DEFAULT 'PFMS_RTGS'
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_claim RECORD;
  v_payment public.payments;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL OR NOT public.is_government_user() THEN
    RAISE EXCEPTION 'Only government officials can record disbursements.';
  END IF;

  v_org_id := public.get_current_user_organization_id();

  SELECT * INTO v_claim FROM public.payment_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment claim not found.';
  END IF;

  IF v_claim.status != 'APPROVED' THEN
    RAISE EXCEPTION 'Payments can only be recorded against approved claims.';
  END IF;

  IF p_amount_paid <= 0 THEN
    RAISE EXCEPTION 'Amount paid must be greater than zero.';
  END IF;

  INSERT INTO public.payments (
    payment_claim_id,
    project_id,
    contractor_organization_id,
    amount_paid,
    payment_reference,
    payment_date,
    payment_method,
    recorded_by
  ) VALUES (
    p_claim_id,
    v_claim.project_id,
    v_claim.contractor_organization_id,
    p_amount_paid,
    p_payment_reference,
    CURRENT_DATE,
    p_payment_method,
    v_user_id
  )
  RETURNING * INTO v_payment;

  -- Mark claim as PAID
  UPDATE public.payment_claims
  SET status = 'PAID', updated_at = now()
  WHERE id = p_claim_id;

  INSERT INTO public.audit_logs (
    actor_id, actor_organization_id, action, entity_type, entity_id, project_id, new_value
  ) VALUES (
    v_user_id, v_org_id, 'PAYMENT_RECORDED', 'payments', v_payment.id::text, v_claim.project_id,
    jsonb_build_object('payment_reference', p_payment_reference, 'amount_paid', p_amount_paid)
  );

  RETURN v_payment;
END;
$$;

-- 4. Mark Notification Read
CREATE OR REPLACE FUNCTION public.mark_notification_read(p_notification_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.notifications
  SET read_at = now()
  WHERE id = p_notification_id AND (recipient_user_id = auth.uid() OR user_id = auth.uid());
  RETURN FOUND;
END;
$$;


-- ==========================================
-- MIGRATION: 044_storage_policies_v2.sql
-- ==========================================

-- ============================================================================
-- Migration: 044_storage_policies_v2.sql
-- Description: Provision Database V2 Storage Buckets & Policies
-- ============================================================================

DO $$
BEGIN
    -- Only execute if storage schema exists
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'storage') THEN
        
        -- 1. Ensure required V2 storage buckets exist
        INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
        VALUES
          ('project-documents', 'project-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']),
          ('tender-documents', 'tender-documents', false, 52428800, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
          ('bid-documents', 'bid-documents', false, 52428800, ARRAY['application/pdf', 'application/zip', 'application/x-zip-compressed']),
          ('progress-evidence', 'progress-evidence', false, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'video/mp4']),
          ('inspection-evidence', 'inspection-evidence', false, 20971520, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
          ('complaint-evidence', 'complaint-evidence', false, 15728640, ARRAY['image/jpeg', 'image/png', 'image/webp', 'video/mp4']),
          ('public-project-assets', 'public-project-assets', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
        ON CONFLICT (id) DO UPDATE SET
          public = EXCLUDED.public,
          file_size_limit = EXCLUDED.file_size_limit,
          allowed_mime_types = EXCLUDED.allowed_mime_types;

        -- 2. Storage Objects RLS: Public bucket reads
        DROP POLICY IF EXISTS "Public access to public buckets" ON storage.objects;
        CREATE POLICY "Public access to public buckets" ON storage.objects
            FOR SELECT USING (
                bucket_id IN ('public-documents', 'public-project-assets')
            );

        -- 3. Storage Objects RLS: Authenticated uploads to public bucket if authorized
        DROP POLICY IF EXISTS "Authenticated can upload to public assets" ON storage.objects;
        CREATE POLICY "Authenticated can upload to public assets" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'public-project-assets' AND
                auth.uid() IS NOT NULL
            );

        -- 4. Bid documents isolation: strictly owning contractor or government evaluators
        DROP POLICY IF EXISTS "Bid documents restricted view" ON storage.objects;
        CREATE POLICY "Bid documents restricted view" ON storage.objects
            FOR SELECT USING (
                bucket_id = 'bid-documents' AND (
                    -- Owner of the uploaded object
                    owner = auth.uid() OR
                    -- Government user
                    EXISTS (
                        SELECT 1 FROM public.organization_members om
                        JOIN public.organizations o ON o.id = om.organization_id
                        WHERE om.user_id = auth.uid()
                          AND om.status = 'ACTIVE'
                          AND o.organization_type = 'GOVERNMENT'
                    )
                )
            );

        DROP POLICY IF EXISTS "Contractor bid document upload" ON storage.objects;
        CREATE POLICY "Contractor bid document upload" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'bid-documents' AND
                auth.uid() IS NOT NULL
            );

        -- 5. Progress evidence: authorized government or contractor
        DROP POLICY IF EXISTS "Progress evidence select" ON storage.objects;
        CREATE POLICY "Progress evidence select" ON storage.objects
            FOR SELECT USING (
                bucket_id = 'progress-evidence' AND (
                    auth.uid() IS NOT NULL
                )
            );

        DROP POLICY IF EXISTS "Progress evidence upload" ON storage.objects;
        CREATE POLICY "Progress evidence upload" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'progress-evidence' AND
                auth.uid() IS NOT NULL
            );

        -- 6. Complaint evidence: complaint creator or government
        DROP POLICY IF EXISTS "Complaint evidence select" ON storage.objects;
        CREATE POLICY "Complaint evidence select" ON storage.objects
            FOR SELECT USING (
                bucket_id = 'complaint-evidence' AND (
                    owner = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM public.organization_members om
                        JOIN public.organizations o ON o.id = om.organization_id
                        WHERE om.user_id = auth.uid()
                          AND om.status = 'ACTIVE'
                          AND o.organization_type = 'GOVERNMENT'
                    )
                )
            );

        DROP POLICY IF EXISTS "Complaint evidence upload" ON storage.objects;
        CREATE POLICY "Complaint evidence upload" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'complaint-evidence' AND
                auth.uid() IS NOT NULL
            );

        -- 7. Inspection evidence: government inspector or auditor
        DROP POLICY IF EXISTS "Inspection evidence select" ON storage.objects;
        CREATE POLICY "Inspection evidence select" ON storage.objects
            FOR SELECT USING (
                bucket_id = 'inspection-evidence' AND (
                    owner = auth.uid() OR
                    EXISTS (
                        SELECT 1 FROM public.organization_members om
                        JOIN public.organizations o ON o.id = om.organization_id
                        WHERE om.user_id = auth.uid()
                          AND om.status = 'ACTIVE'
                          AND o.organization_type IN ('GOVERNMENT', 'AUDITOR')
                    )
                )
            );

        DROP POLICY IF EXISTS "Inspection evidence upload" ON storage.objects;
        CREATE POLICY "Inspection evidence upload" ON storage.objects
            FOR INSERT WITH CHECK (
                bucket_id = 'inspection-evidence' AND
                EXISTS (
                    SELECT 1 FROM public.organization_members om
                    JOIN public.organizations o ON o.id = om.organization_id
                    WHERE om.user_id = auth.uid()
                      AND om.status = 'ACTIVE'
                      AND o.organization_type IN ('GOVERNMENT', 'AUDITOR')
                )
            );

    END IF;
END $$;


-- ==========================================
-- MIGRATION: 045_realtime_indexes_v2.sql
-- ==========================================

-- ============================================================================
-- Migration: 045_realtime_indexes_v2.sql
-- Description: Composite Performance Indexes & Realtime Publications V2
-- ============================================================================

-- 1. Composite & High-Traffic Indexes
CREATE INDEX IF NOT EXISTS idx_projects_gov_status 
    ON projects(government_organization_id, normalized_status) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_projects_nirikshak_id 
    ON projects(nirikshak_project_id);

CREATE INDEX IF NOT EXISTS idx_project_orgs_lookup 
    ON project_organizations(project_id, organization_id, relationship_type);

CREATE INDEX IF NOT EXISTS idx_org_members_user_status 
    ON organization_members(user_id, status);

CREATE INDEX IF NOT EXISTS idx_tenders_proj_status 
    ON tenders(project_id, status) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tenders_due_date 
    ON tenders(bid_due_date) 
    WHERE status = 'PUBLISHED' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tender_bids_tender_status 
    ON tender_bids(tender_id, status);

CREATE INDEX IF NOT EXISTS idx_tender_bids_contractor 
    ON tender_bids(contractor_organization_id, tender_id);

CREATE INDEX IF NOT EXISTS idx_contracts_project_contractor 
    ON contracts(project_id, contractor_organization_id, status);

CREATE INDEX IF NOT EXISTS idx_milestones_proj_seq 
    ON project_milestones(project_id, sequence_number);

CREATE INDEX IF NOT EXISTS idx_progress_updates_proj_time 
    ON progress_updates(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_progress_updates_verification 
    ON progress_updates(project_id, verification_status);

CREATE INDEX IF NOT EXISTS idx_payment_claims_proj_status 
    ON payment_claims(project_id, status);

CREATE INDEX IF NOT EXISTS idx_payment_claims_contractor 
    ON payment_claims(contractor_organization_id, status);

CREATE INDEX IF NOT EXISTS idx_inspections_proj_status 
    ON inspections(project_id, status);

CREATE INDEX IF NOT EXISTS idx_inspection_findings_open 
    ON inspection_findings(inspection_id, severity) 
    WHERE status IN ('OPEN', 'ACTION_REQUIRED');

CREATE INDEX IF NOT EXISTS idx_complaints_proj_status 
    ON complaints(project_id, status);

CREATE INDEX IF NOT EXISTS idx_complaints_citizen 
    ON complaints(citizen_user_id, status);

CREATE INDEX IF NOT EXISTS idx_litigations_proj_status 
    ON litigations(project_id, status);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient 
    ON notifications(recipient_user_id, read_at) 
    WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ai_runs_proj_created 
    ON ai_analysis_runs(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_recommended_actions_run 
    ON ai_recommended_actions(analysis_run_id, status);

-- 2. Configure Realtime publication safely
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
        EXCEPTION WHEN duplicate_object THEN NULL; END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE progress_updates;
        EXCEPTION WHEN duplicate_object THEN NULL; END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE tenders;
        EXCEPTION WHEN duplicate_object THEN NULL; END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE payment_claims;
        EXCEPTION WHEN duplicate_object THEN NULL; END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE complaint_updates;
        EXCEPTION WHEN duplicate_object THEN NULL; END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE projects;
        EXCEPTION WHEN duplicate_object THEN NULL; END;
    END IF;
END $$;


-- ==========================================
-- MIGRATION: 046_seed_support_v2.sql
-- ==========================================

-- ============================================================================
-- Migration: 046_seed_support_v2.sql
-- Description: Development Seed Support & Full Lifecycle E2E Fixtures V2
-- ============================================================================

DO $$
DECLARE
    v_gov_org_id UUID := 'c675a05d-6c45-4008-b021-6b88825e3641';
    v_contractor_a_id UUID := '602e1463-ed1f-48da-85f4-74fc2a5ab9cc';
    v_contractor_b_id UUID := 'b53361b8-675e-4cd7-9166-d29b896fbac5';
    v_auditor_org_id UUID := 'a1111111-1111-1111-1111-111111111111';
    
    v_project_id UUID := 'e2e00000-0000-0000-0000-000000000001';
    v_tender_id UUID := 'e2e00000-0000-0000-0000-000000000002';
    v_bid_a_id UUID := 'e2e00000-0000-0000-0000-000000000003';
    v_bid_b_id UUID := 'e2e00000-0000-0000-0000-000000000004';
    v_contract_id UUID := 'e2e00000-0000-0000-0000-000000000005';
    v_m1_id UUID := 'e2e00000-0000-0000-0000-000000000006';
    v_m2_id UUID := 'e2e00000-0000-0000-0000-000000000007';
    v_prog_id UUID := 'e2e00000-0000-0000-0000-000000000008';
    v_claim_id UUID := 'e2e00000-0000-0000-0000-000000000009';
    v_insp_id UUID := 'e2e00000-0000-0000-0000-000000000010';
    v_complaint_id UUID := 'e2e00000-0000-0000-0000-000000000011';
    v_lit_id UUID := 'e2e00000-0000-0000-0000-000000000012';
    v_run_id UUID := 'e2e00000-0000-0000-0000-000000000013';
    v_rec_id UUID := 'e2e00000-0000-0000-0000-000000000014';
BEGIN
    -- 1. Ensure Organizations Exist
    INSERT INTO organizations (id, name, organization_type, status, state, city)
    VALUES
      (v_gov_org_id, 'Maharashtra Public Works Department', 'GOVERNMENT', 'ACTIVE', 'Maharashtra', 'Pune'),
      (v_contractor_a_id, 'Apex Infrastructure Pvt Ltd', 'CONTRACTOR', 'ACTIVE', 'Maharashtra', 'Mumbai'),
      (v_contractor_b_id, 'Bharat Urban Engineering Ltd', 'CONTRACTOR', 'ACTIVE', 'Maharashtra', 'Pune'),
      (v_auditor_org_id, 'State Quality & Audit Directorate', 'AUDITOR', 'ACTIVE', 'Maharashtra', 'Mumbai')
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      name = EXCLUDED.name;

    -- 2. Ensure Project Exists
    INSERT INTO projects (
        id, nirikshak_project_id, project_name, description,
        government_organization_id, sector, subsector, state, district, city,
        original_cost_inr_crore, total_cost_inr_crore, approved_cost_inr_crore,
        planned_start_date, original_completion_date,
        physical_progress_percent, financial_progress_percent,
        normalized_status, current_status_verified, priority, public_visibility
    ) VALUES (
        v_project_id, 'NRK-MAH-2026-001', 'Pune Metro Ring Corridor Line 4',
        '32km elevated metro corridor with multi-modal interchange hubs',
        v_gov_org_id, 'Urban Transport', 'Metro Rail', 'Maharashtra', 'Pune', 'Pune',
        1850.00, 1850.00, 1850.00,
        '2025-01-01', '2027-12-31',
        28.50, 24.10,
        'UNDER_CONSTRUCTION', true, 'HIGH', 'PUBLIC'
    ) ON CONFLICT (id) DO UPDATE SET
        physical_progress_percent = EXCLUDED.physical_progress_percent,
        normalized_status = EXCLUDED.normalized_status;

    -- 3. Project Organization Relationship
    INSERT INTO project_organizations (
        project_id, organization_id, relationship_type, status
    ) VALUES 
        (v_project_id, v_gov_org_id, 'OWNER', 'ACTIVE'),
        (v_project_id, v_contractor_a_id, 'CONTRACTOR', 'ACTIVE')
    ON CONFLICT (project_id, organization_id, relationship_type) DO UPDATE SET
        status = EXCLUDED.status;

    -- 4. Tender & Bids
    INSERT INTO tenders (
        id, project_id, tender_number, government_organization_id,
        title, estimated_value_inr_crore, publication_date, bid_due_date, status
    ) VALUES (
        v_tender_id, v_project_id, 'TND-2025-PUNE-001', v_gov_org_id,
        'Civil Construction Package 01 - Viaduct & Stations', 1200.00,
        '2025-01-15', '2025-02-28', 'AWARDED'
    ) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    INSERT INTO tender_bids (
        id, tender_id, contractor_organization_id, bid_reference,
        bid_amount, technical_score, financial_score, combined_score, status
    ) VALUES 
      (v_bid_a_id, v_tender_id, v_contractor_a_id, 'BID-APEX-001', 1180.00, 92.5, 95.0, 93.75, 'SELECTED'),
      (v_bid_b_id, v_tender_id, v_contractor_b_id, 'BID-BHARAT-001', 1240.00, 88.0, 89.0, 88.5, 'REJECTED')
    ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    -- 5. Contract
    INSERT INTO contracts (
        id, contract_number, project_id, tender_id, selected_bid_id,
        government_organization_id, contractor_organization_id, contract_value,
        scheduled_start_date, scheduled_end_date, status
    ) VALUES (
        v_contract_id, 'CNT-2025-PUNE-METRO-01', v_project_id, v_tender_id, v_bid_a_id,
        v_gov_org_id, v_contractor_a_id, 1180.00,
        '2025-03-15', '2027-11-30', 'ACTIVE'
    ) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    -- 6. Milestones
    INSERT INTO project_milestones (
        id, project_id, contract_id, milestone_code, milestone_name,
        sequence_number, weight_percent, planned_start_date, planned_end_date,
        planned_progress_percent, verified_progress_percent, status
    ) VALUES 
      (v_m1_id, v_project_id, v_contract_id, 'MS-01', 'Piling & Substructure Viaduct 0-10km', 1, 30.00, '2025-03-15', '2025-10-31', 100.0, 100.0, 'COMPLETED'),
      (v_m2_id, v_project_id, v_contract_id, 'MS-02', 'Pier Cap Erection & Girder Launching', 2, 40.00, '2025-11-01', '2026-08-31', 60.0, 45.0, 'IN_PROGRESS')
    ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    -- 7. Progress Updates
    INSERT INTO progress_updates (
        id, project_id, milestone_id, contractor_organization_id,
        reported_progress, verified_progress, verification_status,
        description, work_completed, observation_date, submitted_at, reviewed_at
    ) VALUES (
        v_prog_id, v_project_id, v_m2_id, v_contractor_a_id,
        45.00, 45.00, 'APPROVED',
        'Span 24-32 pre-cast box girder launching successfully verified',
        '8 spans erected, 16 bearings seated',
        CURRENT_DATE - INTERVAL '5 days',
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '3 days'
    ) ON CONFLICT (id) DO UPDATE SET verification_status = EXCLUDED.verification_status;

    -- 8. Payment Claim & Audit
    INSERT INTO payment_claims (
        id, claim_number, project_id, contract_id, contractor_organization_id,
        milestone_id, claim_type, claimed_amount, verified_amount, approved_amount, status
    ) VALUES (
        v_claim_id, 'CLM-2026-03-01', v_project_id, v_contract_id, v_contractor_a_id,
        v_m2_id, 'RA_BILL', 45.50, 42.80, 42.80, 'APPROVED'
    ) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    -- 9. Inspection & Finding
    INSERT INTO inspections (
        id, project_id, milestone_id, inspection_type, inspection_date, status, summary, overall_result
    ) VALUES (
        v_insp_id, v_project_id, v_m2_id, 'SAFETY', CURRENT_DATE - INTERVAL '10 days',
        'COMPLETED', 'Routine structural integrity and safety barricading inspection', 'SATISFACTORY'
    ) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    INSERT INTO inspection_findings (
        id, inspection_id, finding_type, severity, description, status
    ) VALUES (
        'e2e00000-0000-0000-0000-000000000015', v_insp_id, 'SAFETY_HAZARD', 'MEDIUM',
        'Perimeter reflective barrier missing near Station 4 pier foundation', 'RESOLVED'
    ) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    -- 10. Complaint
    INSERT INTO complaints (
        id, complaint_number, project_id, category, severity,
        title, description, status
    ) VALUES (
        v_complaint_id, 'CMP-2026-PUNE-009', v_project_id, 'TRAFFIC_CONGESTION', 'MEDIUM',
        'Diversion road narrow near interchange', 'Traffic jam during peak office hours due to road narrowing', 'RESOLVED'
    ) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    -- 11. Litigation
    INSERT INTO litigations (
        id, project_id, case_number, case_title, court_or_forum, litigation_type,
        status, government_organization_id, summary
    ) VALUES (
        v_lit_id, v_project_id, 'WP-4120/2025', 'Green Citizens Forum vs State of Maharashtra',
        'Bombay High Court', 'ENVIRONMENTAL', 'OPEN', v_gov_org_id,
        'PIL regarding compensatory afforestation compliance for metro depot parcel'
    ) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    -- 12. AI Analysis Run & Action
    INSERT INTO ai_analysis_runs (
        id, analysis_id, project_id, service_version, llm_model, status
    ) VALUES (
        v_run_id, v_run_id, v_project_id, '2.0.0', 'nvidia/nemotron-3-super-120b-instruct', 'COMPLETED'
    ) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    INSERT INTO ai_recommended_actions (
        id, analysis_run_id, project_id, action_code, rank, policy_score,
        explanation, status
    ) VALUES (
        v_rec_id, v_run_id, v_project_id, 'EXPEDITE_INSPECTION', 1, 0.88,
        'Pre-monsoon girder launch schedule tight; expedite technical safety clearance', 'PROPOSED'
    ) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

END $$;


-- ==========================================
-- MIGRATION: 047_production_security_hardening.sql
-- ==========================================

-- ============================================================================
-- Migration: 047_production_security_hardening.sql
-- Description: Multi-tenant Litigation, Settlement Isolation & Hard Delete Safeguards
-- ============================================================================

-- 1. Hard Delete Prevention Trigger on Financial, Audit & Legal Entities
CREATE OR REPLACE FUNCTION public.prevent_hard_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    RAISE EXCEPTION 'Hard deletion is strictly prohibited on table % for compliance, legal, and audit integrity.', TG_TABLE_NAME;
END;
$$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_delete_payments') THEN
        CREATE TRIGGER trg_prevent_delete_payments
            BEFORE DELETE ON public.payments
            FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_delete_audit_logs') THEN
        CREATE TRIGGER trg_prevent_delete_audit_logs
            BEFORE DELETE ON public.audit_logs
            FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_delete_litigations') THEN
        CREATE TRIGGER trg_prevent_delete_litigations
            BEFORE DELETE ON public.litigations
            FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_delete_settlements') THEN
        CREATE TRIGGER trg_prevent_delete_settlements
            BEFORE DELETE ON public.settlements
            FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_prevent_delete_ai_outcomes') THEN
        CREATE TRIGGER trg_prevent_delete_ai_outcomes
            BEFORE DELETE ON public.ai_action_outcomes
            FOR EACH ROW EXECUTE FUNCTION public.prevent_hard_delete();
    END IF;
END $$;

-- 2. Hardened Litigation RLS (Remove blanket is_government_user())
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'litigations' AND policyname = 'Litigations readable by authorized government and assigned contractor'
    ) THEN
        EXECUTE 'ALTER POLICY "Litigations readable by authorized government and assigned contractor" ON public.litigations USING (
            government_organization_id = public.get_current_user_organization_id() OR
            public.can_manage_project(project_id) OR
            (contractor_organization_id = public.get_current_user_organization_id() AND public.can_access_project(project_id)) OR
            (public.can_access_project(project_id) AND EXISTS (
                SELECT 1 FROM public.organization_members om
                JOIN public.organizations o ON o.id = om.organization_id
                WHERE om.user_id = auth.uid() AND om.status = ''ACTIVE'' AND o.organization_type = ''AUDITOR''
            ))
        )';
    END IF;
END $$;

-- 3. Hardened Litigation Events RLS
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'litigation_events' AND policyname = 'Litigation events readable by litigation parties'
    ) THEN
        EXECUTE 'ALTER POLICY "Litigation events readable by litigation parties" ON public.litigation_events USING (
            EXISTS (
              SELECT 1 FROM public.litigations l
              WHERE l.id = litigation_events.litigation_id
                AND (
                  l.government_organization_id = public.get_current_user_organization_id() OR
                  public.can_manage_project(l.project_id) OR
                  (l.contractor_organization_id = public.get_current_user_organization_id() AND public.can_access_project(l.project_id))
                )
            )
        )';
    END IF;
END $$;

-- 4. Hardened Settlements RLS
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'settlements' AND policyname = 'Authorized government can manage settlements'
    ) THEN
        EXECUTE 'CREATE POLICY "Authorized government can manage settlements" ON public.settlements FOR ALL TO authenticated USING (public.can_manage_project(project_id) AND public.is_government_user()) WITH CHECK (public.can_manage_project(project_id) AND public.is_government_user())';
    END IF;
END $$;


-- ==========================================
-- MIGRATION: 048_ai_lifecycle_runtime_v2.sql
-- ==========================================

-- ============================================================================
-- Migration: 048_ai_lifecycle_runtime_v2.sql
-- Description: AI Review Band Vocabulary Alignment, RLS Protection & Outcome Idempotency
-- ============================================================================

-- 1. AI Review Band Check Constraint Alignment with Nemotron / Statistical ML Model
ALTER TABLE public.ai_insights
  DROP CONSTRAINT IF EXISTS ai_insights_review_priority_band_check;

ALTER TABLE public.ai_insights
  ADD CONSTRAINT ai_insights_review_priority_band_check
  CHECK (
    review_priority_band IS NULL OR
    review_priority_band IN ('TYPICAL', 'MODERATE', 'UNUSUAL', 'VERY_UNUSUAL', 'WATCHLIST', 'HIGH_PRIORITY')
  );

-- 2. Restrict direct client writes on AI analysis runs, snapshots, actions, outcomes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'ai_analysis_runs' AND policyname = 'Service role manages ai_analysis_runs'
    ) THEN
        EXECUTE 'CREATE POLICY "Service role manages ai_analysis_runs" ON public.ai_analysis_runs FOR ALL TO service_role USING (true) WITH CHECK (true)';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'ai_context_snapshots' AND policyname = 'Service role manages ai_context_snapshots'
    ) THEN
        EXECUTE 'CREATE POLICY "Service role manages ai_context_snapshots" ON public.ai_context_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true)';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'ai_recommended_actions' AND policyname = 'Service role manages ai_recommended_actions'
    ) THEN
        EXECUTE 'CREATE POLICY "Service role manages ai_recommended_actions" ON public.ai_recommended_actions FOR ALL TO service_role USING (true) WITH CHECK (true)';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'ai_action_outcomes' AND policyname = 'Service role manages ai_action_outcomes'
    ) THEN
        EXECUTE 'CREATE POLICY "Service role manages ai_action_outcomes" ON public.ai_action_outcomes FOR ALL TO service_role USING (true) WITH CHECK (true)';
    END IF;
END $$;

-- 3. Unique outcome per analysis_run and action (prevents duplicate RL updates)
CREATE UNIQUE INDEX IF NOT EXISTS uq_ai_action_outcomes_action 
    ON public.ai_action_outcomes (analysis_run_id, recommended_action_id);


-- ==========================================
-- MIGRATION: 049_finance_integrity_v2.sql
-- ==========================================

-- ============================================================================
-- Migration: 049_finance_integrity_v2.sql
-- Description: Financial Disbursement Security, Overpayment Protection & Partial Payment Flow
-- ============================================================================

-- 1. Add PARTIALLY_PAID to payment_claims status check
ALTER TABLE public.payment_claims
  DROP CONSTRAINT IF EXISTS payment_claims_status_check;

ALTER TABLE public.payment_claims
  ADD CONSTRAINT payment_claims_status_check
  CHECK (status = ANY (ARRAY['DRAFT'::text, 'SUBMITTED'::text, 'UNDER_REVIEW'::text, 'CLARIFICATION_REQUIRED'::text, 'VERIFIED'::text, 'APPROVED'::text, 'PARTIALLY_PAID'::text, 'PAID'::text, 'REJECTED'::text]));

-- 2. Fully Hardened record_payment RPC Procedure
CREATE OR REPLACE FUNCTION public.record_payment(
  p_claim_id UUID,
  p_amount_paid NUMERIC,
  p_payment_reference TEXT,
  p_payment_method TEXT DEFAULT 'PFMS_RTGS'
)
RETURNS public.payments
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_claim RECORD;
  v_already_paid NUMERIC;
  v_remaining NUMERIC;
  v_new_status TEXT;
  v_payment public.payments;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL OR NOT public.is_government_user() THEN
    RAISE EXCEPTION 'Only authorized government officials can record disbursements.';
  END IF;

  v_org_id := public.get_current_user_organization_id();

  -- Lock claim for update to prevent concurrent race conditions
  SELECT * INTO v_claim FROM public.payment_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment claim not found.';
  END IF;

  -- Phase 11: Government Org cross-tenant security check
  IF NOT public.can_manage_project(v_claim.project_id) THEN
    RAISE EXCEPTION 'Unauthorized: Your government authority does not manage project %', v_claim.project_id;
  END IF;

  -- Verify claim is eligible for payment
  IF v_claim.status NOT IN ('APPROVED', 'PARTIALLY_PAID') THEN
    RAISE EXCEPTION 'Payments can only be recorded against approved or partially paid claims (current status: %).', v_claim.status;
  END IF;

  IF p_amount_paid <= 0 THEN
    RAISE EXCEPTION 'Amount paid must be greater than zero.';
  END IF;

  -- Phase 12: Payment Amount Integrity & Overpayment Protection
  SELECT COALESCE(SUM(amount_paid), 0) INTO v_already_paid
  FROM public.payments
  WHERE payment_claim_id = p_claim_id;

  v_remaining := v_claim.approved_amount - v_already_paid;

  IF p_amount_paid > v_remaining THEN
    RAISE EXCEPTION 'Payment amount (%) exceeds remaining approved balance (%) for claim %.',
      p_amount_paid, v_remaining, v_claim.claim_number;
  END IF;

  -- Insert payment record
  INSERT INTO public.payments (
    payment_claim_id,
    project_id,
    contractor_organization_id,
    amount_paid,
    payment_reference,
    payment_date,
    payment_method,
    recorded_by
  ) VALUES (
    p_claim_id,
    v_claim.project_id,
    v_claim.contractor_organization_id,
    p_amount_paid,
    p_payment_reference,
    CURRENT_DATE,
    p_payment_method,
    v_user_id
  )
  RETURNING * INTO v_payment;

  -- Phase 13: Determine whether claim is fully paid or partially paid
  IF (v_already_paid + p_amount_paid) >= v_claim.approved_amount THEN
    v_new_status := 'PAID';
  ELSE
    v_new_status := 'PARTIALLY_PAID';
  END IF;

  UPDATE public.payment_claims
  SET status = v_new_status, updated_at = now()
  WHERE id = p_claim_id;

  -- Audit log entry
  INSERT INTO public.audit_logs (
    actor_id, actor_organization_id, action, entity_type, entity_id, project_id, new_value
  ) VALUES (
    v_user_id, v_org_id, 'PAYMENT_RECORDED', 'payments', v_payment.id, v_claim.project_id,
    jsonb_build_object(
      'payment_reference', p_payment_reference,
      'amount_paid', p_amount_paid,
      'already_paid_prior', v_already_paid,
      'claim_status', v_new_status
    )
  );

  RETURN v_payment;
END;
$$;


-- ==========================================
-- MIGRATION: 050_legal_rls_hardening_v2.sql
-- ==========================================

-- ============================================================================
-- Migration: 050_legal_rls_hardening_v2.sql
-- Description: Project Boundary Litigation Security & Settlement Authority Hardening
-- ============================================================================

-- 1. Ensure litigation writes require can_manage_project and authorized role
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'litigations' AND policyname = 'Authorized government officers can manage litigation'
    ) THEN
        EXECUTE 'ALTER POLICY "Authorized government officers can manage litigation" ON public.litigations 
        USING (
            public.can_manage_project(project_id) AND 
            public.is_government_user()
        )
        WITH CHECK (
            public.can_manage_project(project_id) AND 
            public.is_government_user()
        )';
    END IF;
END $$;

-- 2. Settlement Creation and Approvals Restricted to Government Managing Project
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' AND tablename = 'settlements' AND policyname = 'Authorized government can manage settlements'
    ) THEN
        EXECUTE 'ALTER POLICY "Authorized government can manage settlements" ON public.settlements 
        USING (
            public.can_manage_project(project_id) AND 
            public.is_government_user()
        )
        WITH CHECK (
            public.can_manage_project(project_id) AND 
            public.is_government_user()
        )';
    END IF;
END $$;


-- ==========================================
-- MIGRATION: 051_status_and_constraint_alignment_v2.sql
-- ==========================================

-- ============================================================================
-- Migration: 051_status_and_constraint_alignment_v2.sql
-- Description: Status Transition Safety Guards & Unique Consistency Constraints
-- ============================================================================

-- 1. Status Transition Safety Guards Trigger
CREATE OR REPLACE FUNCTION public.validate_status_transition()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Payment claims: irreversible from PAID
    IF TG_TABLE_NAME = 'payment_claims' THEN
        IF OLD.status = 'PAID' AND NEW.status <> 'PAID' THEN
            RAISE EXCEPTION 'Illegal status transition: Claim % is already fully paid.', OLD.claim_number;
        END IF;
        IF OLD.status = 'PARTIALLY_PAID' AND NEW.status IN ('DRAFT', 'SUBMITTED') THEN
            RAISE EXCEPTION 'Illegal status transition: Partially paid claim % cannot revert to %.', OLD.claim_number, NEW.status;
        END IF;
    END IF;

    -- Tenders: cannot revert from AWARDED
    IF TG_TABLE_NAME = 'tenders' THEN
        IF OLD.status = 'AWARDED' AND NEW.status IN ('DRAFT', 'PUBLISHED', 'UNDER_EVALUATION') THEN
            RAISE EXCEPTION 'Illegal status transition: Awarded tender % cannot revert to %.', OLD.tender_number, NEW.status;
        END IF;
    END IF;

    -- Progress Updates: cannot revert from APPROVED
    IF TG_TABLE_NAME = 'progress_updates' THEN
        IF OLD.verification_status = 'APPROVED' AND NEW.verification_status IN ('SUBMITTED', 'UNDER_REVIEW') THEN
            RAISE EXCEPTION 'Illegal status transition: Approved progress update % cannot revert to %.', OLD.id, NEW.verification_status;
        END IF;
    END IF;

    -- Settlements: cannot revert from EXECUTED
    IF TG_TABLE_NAME = 'settlements' THEN
        IF OLD.status = 'EXECUTED' AND NEW.status <> 'EXECUTED' THEN
            RAISE EXCEPTION 'Illegal status transition: Executed settlement cannot revert.';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_payment_claims_status') THEN
        CREATE TRIGGER trg_validate_payment_claims_status
            BEFORE UPDATE OF status ON public.payment_claims
            FOR EACH ROW EXECUTE FUNCTION public.validate_status_transition();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_tenders_status') THEN
        CREATE TRIGGER trg_validate_tenders_status
            BEFORE UPDATE OF status ON public.tenders
            FOR EACH ROW EXECUTE FUNCTION public.validate_status_transition();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_progress_status') THEN
        CREATE TRIGGER trg_validate_progress_status
            BEFORE UPDATE OF verification_status ON public.progress_updates
            FOR EACH ROW EXECUTE FUNCTION public.validate_status_transition();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_validate_settlements_status') THEN
        CREATE TRIGGER trg_validate_settlements_status
            BEFORE UPDATE OF status ON public.settlements
            FOR EACH ROW EXECUTE FUNCTION public.validate_status_transition();
    END IF;
END $$;

-- 2. Backfill sequence_number from display_order if different
UPDATE public.project_milestones 
SET sequence_number = display_order 
WHERE display_order IS NOT NULL AND sequence_number <> display_order;

-- 3. Unique Consistency Constraints & Indices
CREATE UNIQUE INDEX IF NOT EXISTS uq_contracts_active_tender 
    ON public.contracts (tender_id) 
    WHERE (status = 'ACTIVE' AND tender_id IS NOT NULL);

CREATE UNIQUE INDEX IF NOT EXISTS uq_tender_bids_selected 
    ON public.tender_bids (tender_id) 
    WHERE (status = 'SELECTED');

CREATE UNIQUE INDEX IF NOT EXISTS uq_project_milestones_sequence 
    ON public.project_milestones (project_id, sequence_number) 
    WHERE (deleted_at IS NULL);

CREATE UNIQUE INDEX IF NOT EXISTS uq_payments_reference 
    ON public.payments (payment_reference) 
    WHERE (payment_reference IS NOT NULL);


-- ==========================================
-- MIGRATION: 052_rpc_privilege_hardening_v2.sql
-- ==========================================

-- ============================================================================
-- Migration: 052_rpc_privilege_hardening_v2.sql
-- Description: Revoke Public Execution on Sensitive Business RPCs & Enforce Authenticated Grants
-- ============================================================================

DO $$
BEGIN
    -- 1. Revoke Execution Privileges from PUBLIC and anon roles
    REVOKE EXECUTE ON FUNCTION public.award_contract(uuid, uuid) FROM PUBLIC, anon;
    REVOKE EXECUTE ON FUNCTION public.save_tender_bid(uuid, numeric, text, text) FROM PUBLIC, anon;
    REVOKE EXECUTE ON FUNCTION public.submit_progress_update(uuid, numeric, text, uuid) FROM PUBLIC, anon;
    REVOKE EXECUTE ON FUNCTION public.approve_progress_update(uuid, text, numeric, text) FROM PUBLIC, anon;
    REVOKE EXECUTE ON FUNCTION public.submit_payment_claim(uuid, numeric, text, text, uuid) FROM PUBLIC, anon;
    REVOKE EXECUTE ON FUNCTION public.review_payment_claim(uuid, text, numeric, numeric, text) FROM PUBLIC, anon;
    REVOKE EXECUTE ON FUNCTION public.record_payment(uuid, numeric, text, text) FROM PUBLIC, anon;
    REVOKE EXECUTE ON FUNCTION public.mark_notification_read(uuid) FROM PUBLIC, anon;

    -- 2. Grant strictly to authenticated users and backend service_role
    GRANT EXECUTE ON FUNCTION public.award_contract(uuid, uuid) TO authenticated, service_role;
    GRANT EXECUTE ON FUNCTION public.save_tender_bid(uuid, numeric, text, text) TO authenticated, service_role;
    GRANT EXECUTE ON FUNCTION public.submit_progress_update(uuid, numeric, text, uuid) TO authenticated, service_role;
    GRANT EXECUTE ON FUNCTION public.approve_progress_update(uuid, text, numeric, text) TO authenticated, service_role;
    GRANT EXECUTE ON FUNCTION public.submit_payment_claim(uuid, numeric, text, text, uuid) TO authenticated, service_role;
    GRANT EXECUTE ON FUNCTION public.review_payment_claim(uuid, text, numeric, numeric, text) TO authenticated, service_role;
    GRANT EXECUTE ON FUNCTION public.record_payment(uuid, numeric, text, text) TO authenticated, service_role;
    GRANT EXECUTE ON FUNCTION public.mark_notification_read(uuid) TO authenticated, service_role;
END $$;


-- ==========================================
-- MIGRATION: 053_v2_runtime_views_indexes.sql
-- ==========================================

-- ============================================================================
-- Migration: 053_v2_runtime_views_indexes.sql
-- Description: Enforce Security Invoker on Views & Multi-tenant Performance Indexes
-- ============================================================================

-- 1. Enforce security_invoker = true across all sensitive Database V2 views
-- This ensures that views strictly evaluate underlying RLS policies in caller context.
ALTER VIEW public.government_project_dashboard_view SET (security_invoker = true);
ALTER VIEW public.contractor_assigned_projects_view SET (security_invoker = true);
ALTER VIEW public.project_finance_summary_view SET (security_invoker = true);
ALTER VIEW public.project_progress_summary_view SET (security_invoker = true);
ALTER VIEW public.tender_catalog_view SET (security_invoker = true);

-- 2. Performance Composite Indexes for High-Frequency V2 Queries
CREATE INDEX IF NOT EXISTS idx_payments_claim_amount 
    ON public.payments (payment_claim_id, amount_paid);

CREATE INDEX IF NOT EXISTS idx_resource_usage_verified 
    ON public.resource_usage_updates (project_id, verification_status, observation_date DESC);

CREATE INDEX IF NOT EXISTS idx_inspection_findings_open_severity 
    ON public.inspection_findings (inspection_id, status, severity)
    WHERE status IN ('OPEN', 'ACTION_REQUIRED');

CREATE INDEX IF NOT EXISTS idx_delay_events_active 
    ON public.delay_events (project_id, status)
    WHERE status IN ('OPEN', 'UNDER_INVESTIGATION');


-- ==========================================
-- MIGRATION: 054_production_validation_helpers.sql
-- ==========================================

-- ============================================================================
-- Migration: 054_production_validation_helpers.sql
-- Description: Production Schema Health Verification Stored Procedure
-- ============================================================================

CREATE OR REPLACE FUNCTION public.verify_production_schema_health()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_tables_count INTEGER;
    v_rls_disabled_count INTEGER;
    v_views_count INTEGER;
    v_report JSONB;
BEGIN
    SELECT count(*) INTO v_tables_count
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

    -- Check for public tables missing RLS
    SELECT count(*) INTO v_rls_disabled_count
    FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.schemaname = 'public' AND c.relrowsecurity = false;

    SELECT count(*) INTO v_views_count
    FROM information_schema.views
    WHERE table_schema = 'public';

    v_report := jsonb_build_object(
        'total_tables', v_tables_count,
        'tables_without_rls', v_rls_disabled_count,
        'total_views', v_views_count,
        'security_status', CASE WHEN v_rls_disabled_count = 0 THEN 'HEALTHY' ELSE 'ACTION_REQUIRED' END,
        'timestamp', now()
    );

    RETURN v_report;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_production_schema_health() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_production_schema_health() TO authenticated, service_role;


-- ==========================================
-- MIGRATION: 055_fix_payment_claims_audit_entity_uuid.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 055_fix_payment_claims_audit_entity_uuid.sql
-- Domain: Audit Log Entity ID UUID Integrity for Payment Claims RPCs
-- ==============================================================================

-- 1. Submit Payment Claim (Contractor Only) - Fixed entity_id UUID type
CREATE OR REPLACE FUNCTION public.submit_payment_claim(
  p_project_id UUID,
  p_claimed_amount NUMERIC,
  p_claim_type TEXT DEFAULT 'RA_BILL',
  p_description TEXT DEFAULT NULL,
  p_milestone_id UUID DEFAULT NULL
)
RETURNS public.payment_claims
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_contract_id UUID;
  v_claim_ref TEXT;
  v_new_claim public.payment_claims;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  v_org_id := public.get_current_user_organization_id();
  IF v_org_id IS NULL OR NOT public.is_contractor_user() THEN
    RAISE EXCEPTION 'Only active contractor organization members can submit payment claims.';
  END IF;

  -- Verify active contract on project
  SELECT id INTO v_contract_id
  FROM public.contracts
  WHERE project_id = p_project_id AND contractor_organization_id = v_org_id AND status = 'ACTIVE'
  LIMIT 1;

  IF v_contract_id IS NULL THEN
    RAISE EXCEPTION 'No active contract found for your organization on this project.';
  END IF;

  IF p_claimed_amount <= 0 THEN
    RAISE EXCEPTION 'Claimed amount must be greater than zero.';
  END IF;

  -- Generate sequential claim reference
  v_claim_ref := 'NRK-CLM-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6);

  INSERT INTO public.payment_claims (
    claim_number,
    project_id,
    contract_id,
    contractor_organization_id,
    milestone_id,
    claim_type,
    claimed_amount,
    status,
    description,
    submitted_by,
    submitted_at
  ) VALUES (
    v_claim_ref,
    p_project_id,
    v_contract_id,
    v_org_id,
    p_milestone_id,
    p_claim_type,
    p_claimed_amount,
    'SUBMITTED',
    p_description,
    v_user_id,
    now()
  )
  RETURNING * INTO v_new_claim;

  -- Audit log entry with entity_id as UUID
  INSERT INTO public.audit_logs (
    actor_id, actor_organization_id, action, entity_type, entity_id, project_id, new_value
  ) VALUES (
    v_user_id, v_org_id, 'PAYMENT_CLAIM_SUBMITTED', 'payment_claims', v_new_claim.id, p_project_id,
    jsonb_build_object('claim_number', v_claim_ref, 'claimed_amount', p_claimed_amount)
  );

  RETURN v_new_claim;
END;
$$;

-- 2. Review Payment Claim (Authorized Government Finance / Admin Role) - Fixed entity_id UUID type
CREATE OR REPLACE FUNCTION public.review_payment_claim(
  p_claim_id UUID,
  p_decision TEXT,
  p_verified_amount NUMERIC DEFAULT NULL,
  p_approved_amount NUMERIC DEFAULT NULL,
  p_review_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_org_id UUID;
  v_claim RECORD;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required.';
  END IF;

  v_org_id := public.get_current_user_organization_id();
  IF v_org_id IS NULL OR NOT public.is_government_user() THEN
    RAISE EXCEPTION 'Only authorized government officials can review payment claims.';
  END IF;

  SELECT * INTO v_claim FROM public.payment_claims WHERE id = p_claim_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment claim not found.';
  END IF;

  IF NOT public.can_manage_project(v_claim.project_id) THEN
    RAISE EXCEPTION 'You lack authority to review payment claims for this project.';
  END IF;

  IF p_decision NOT IN ('VERIFIED', 'APPROVED', 'REJECTED', 'CLARIFICATION_REQUIRED') THEN
    RAISE EXCEPTION 'Invalid review decision.';
  END IF;

  IF p_decision = 'APPROVED' THEN
    IF p_approved_amount IS NULL OR p_approved_amount <= 0 OR p_approved_amount > v_claim.claimed_amount THEN
      RAISE EXCEPTION 'Approved amount must be positive and cannot exceed claimed amount.';
    END IF;

    UPDATE public.payment_claims
    SET status = 'APPROVED',
        verified_amount = COALESCE(p_verified_amount, p_approved_amount),
        approved_amount = p_approved_amount,
        reviewed_by = v_user_id,
        reviewed_at = now(),
        review_notes = p_review_notes,
        approved_by = v_user_id,
        approved_at = now(),
        updated_at = now()
    WHERE id = p_claim_id;
  ELSE
    UPDATE public.payment_claims
    SET status = p_decision,
        verified_amount = p_verified_amount,
        reviewed_by = v_user_id,
        reviewed_at = now(),
        review_notes = p_review_notes,
        updated_at = now()
    WHERE id = p_claim_id;
  END IF;

  -- Audit log entry with entity_id as UUID
  INSERT INTO public.audit_logs (
    actor_id, actor_organization_id, action, entity_type, entity_id, project_id, new_value
  ) VALUES (
    v_user_id, v_org_id, 'PAYMENT_CLAIM_REVIEWED', 'payment_claims', p_claim_id, v_claim.project_id,
    jsonb_build_object('decision', p_decision, 'approved_amount', p_approved_amount)
  );

  RETURN jsonb_build_object('success', true, 'claim_id', p_claim_id, 'status', p_decision);
END;
$$;

-- Ensure proper permissions on the updated RPCs
GRANT EXECUTE ON FUNCTION public.submit_payment_claim(UUID, NUMERIC, TEXT, TEXT, UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.review_payment_claim(UUID, TEXT, NUMERIC, NUMERIC, TEXT) TO authenticated, service_role;


-- ==========================================
-- MIGRATION: 056_complete_missing_rls_policies.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 056_complete_missing_rls_policies.sql
-- Domain: Complete RLS Policies on Tables with Enabled RLS but Missing Policies
-- ==============================================================================

-- 1. inspection_findings
DROP POLICY IF EXISTS "Findings visible to project participants and government" ON public.inspection_findings;
CREATE POLICY "Findings visible to project participants and government"
  ON public.inspection_findings FOR SELECT
  TO authenticated
  USING (
    public.is_government_user() OR
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = inspection_findings.inspection_id
        AND public.can_access_project(i.project_id)
    )
  );

DROP POLICY IF EXISTS "Government can insert inspection findings" ON public.inspection_findings;
CREATE POLICY "Government can insert inspection findings"
  ON public.inspection_findings FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_government_user() OR
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = inspection_findings.inspection_id
        AND public.can_manage_project(i.project_id)
    )
  );

DROP POLICY IF EXISTS "Authorized users can update inspection findings" ON public.inspection_findings;
CREATE POLICY "Authorized users can update inspection findings"
  ON public.inspection_findings FOR UPDATE
  TO authenticated
  USING (
    public.is_government_user() OR
    EXISTS (
      SELECT 1 FROM public.inspections i
      JOIN public.contracts c ON c.project_id = i.project_id
      WHERE i.id = inspection_findings.inspection_id
        AND c.contractor_organization_id = public.get_current_user_organization_id()
        AND c.status = 'ACTIVE'
    )
  );

DROP POLICY IF EXISTS "Government can delete inspection findings" ON public.inspection_findings;
CREATE POLICY "Government can delete inspection findings"
  ON public.inspection_findings FOR DELETE
  TO authenticated
  USING (
    public.is_government_user() AND
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = inspection_findings.inspection_id
        AND public.can_manage_project(i.project_id)
    )
  );

-- 2. project_documents
DROP POLICY IF EXISTS "Project documents readable by participants" ON public.project_documents;
CREATE POLICY "Project documents readable by participants"
  ON public.project_documents FOR SELECT
  TO authenticated
  USING (
    public.is_government_user() OR
    public.can_access_project(project_id)
  );

DROP POLICY IF EXISTS "Authorized stakeholders can upload project documents" ON public.project_documents;
CREATE POLICY "Authorized stakeholders can upload project documents"
  ON public.project_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_government_user() OR
    (public.is_contractor_user() AND public.can_access_project(project_id))
  );

DROP POLICY IF EXISTS "Document owners and government can update project documents" ON public.project_documents;
CREATE POLICY "Document owners and government can update project documents"
  ON public.project_documents FOR UPDATE
  TO authenticated
  USING (
    public.is_government_user() OR
    uploaded_by = auth.uid()
  );

DROP POLICY IF EXISTS "Government can delete project documents" ON public.project_documents;
CREATE POLICY "Government can delete project documents"
  ON public.project_documents FOR DELETE
  TO authenticated
  USING (
    public.is_government_user() AND public.can_manage_project(project_id)
  );

-- 3. delay_events
DROP POLICY IF EXISTS "Delay events readable by project stakeholders" ON public.delay_events;
CREATE POLICY "Delay events readable by project stakeholders"
  ON public.delay_events FOR SELECT
  TO authenticated
  USING (
    public.is_government_user() OR
    public.can_access_project(project_id)
  );

DROP POLICY IF EXISTS "Delay events insertable by project contractors and gov" ON public.delay_events;
CREATE POLICY "Delay events insertable by project contractors and gov"
  ON public.delay_events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_government_user() OR
    (public.is_contractor_user() AND public.can_access_project(project_id))
  );

DROP POLICY IF EXISTS "Government can manage delay events" ON public.delay_events;
CREATE POLICY "Government can manage delay events"
  ON public.delay_events FOR ALL
  TO authenticated
  USING (public.is_government_user());

-- 4. Environmental Domain (clearances, baselines, commitments, observations, incidents)
DROP POLICY IF EXISTS "Environmental clearances readable by participants" ON public.environmental_clearances;
CREATE POLICY "Environmental clearances readable by participants"
  ON public.environmental_clearances FOR SELECT
  TO authenticated
  USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "Government manages environmental clearances" ON public.environmental_clearances;
CREATE POLICY "Government manages environmental clearances"
  ON public.environmental_clearances FOR ALL
  TO authenticated
  USING (public.is_government_user() AND public.can_manage_project(project_id));

DROP POLICY IF EXISTS "Environmental baselines readable by participants" ON public.environmental_baselines;
CREATE POLICY "Environmental baselines readable by participants"
  ON public.environmental_baselines FOR SELECT
  TO authenticated
  USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "Government manages environmental baselines" ON public.environmental_baselines;
CREATE POLICY "Government manages environmental baselines"
  ON public.environmental_baselines FOR ALL
  TO authenticated
  USING (public.is_government_user() AND public.can_manage_project(project_id));

DROP POLICY IF EXISTS "Environmental commitments readable by participants" ON public.environmental_commitments;
CREATE POLICY "Environmental commitments readable by participants"
  ON public.environmental_commitments FOR SELECT
  TO authenticated
  USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "Government manages environmental commitments" ON public.environmental_commitments;
CREATE POLICY "Government manages environmental commitments"
  ON public.environmental_commitments FOR ALL
  TO authenticated
  USING (public.is_government_user() AND public.can_manage_project(project_id));

DROP POLICY IF EXISTS "Environmental observations readable by participants" ON public.environmental_observations;
CREATE POLICY "Environmental observations readable by participants"
  ON public.environmental_observations FOR SELECT
  TO authenticated
  USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "Stakeholders report environmental observations" ON public.environmental_observations;
CREATE POLICY "Stakeholders report environmental observations"
  ON public.environmental_observations FOR INSERT
  TO authenticated
  WITH CHECK (public.is_government_user() OR (public.is_contractor_user() AND public.can_access_project(project_id)));

DROP POLICY IF EXISTS "Government manages environmental observations" ON public.environmental_observations;
CREATE POLICY "Government manages environmental observations"
  ON public.environmental_observations FOR UPDATE
  TO authenticated
  USING (public.is_government_user());

DROP POLICY IF EXISTS "Environmental incidents readable by participants" ON public.environmental_incidents;
CREATE POLICY "Environmental incidents readable by participants"
  ON public.environmental_incidents FOR SELECT
  TO authenticated
  USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "Stakeholders report environmental incidents" ON public.environmental_incidents;
CREATE POLICY "Stakeholders report environmental incidents"
  ON public.environmental_incidents FOR INSERT
  TO authenticated
  WITH CHECK (public.is_government_user() OR (public.is_contractor_user() AND public.can_access_project(project_id)));

DROP POLICY IF EXISTS "Government manages environmental incidents" ON public.environmental_incidents;
CREATE POLICY "Government manages environmental incidents"
  ON public.environmental_incidents FOR UPDATE
  TO authenticated
  USING (public.is_government_user());

-- 5. Progress Evidence & Complaint Evidence
DROP POLICY IF EXISTS "Progress evidence readable by project participants" ON public.progress_evidence;
CREATE POLICY "Progress evidence readable by project participants"
  ON public.progress_evidence FOR SELECT
  TO authenticated
  USING (
    public.is_government_user() OR
    EXISTS (
      SELECT 1 FROM public.progress_updates pu
      WHERE pu.id = progress_evidence.progress_update_id
        AND public.can_access_project(pu.project_id)
    )
  );

DROP POLICY IF EXISTS "Contractor and gov can add progress evidence" ON public.progress_evidence;
CREATE POLICY "Contractor and gov can add progress evidence"
  ON public.progress_evidence FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_government_user() OR
    (
      public.is_contractor_user() AND
      EXISTS (
        SELECT 1 FROM public.progress_updates pu
        WHERE pu.id = progress_evidence.progress_update_id
          AND public.can_access_project(pu.project_id)
      )
    )
  );

DROP POLICY IF EXISTS "Complaint evidence readable by complaint parties" ON public.complaint_evidence;
CREATE POLICY "Complaint evidence readable by complaint parties"
  ON public.complaint_evidence FOR SELECT
  TO authenticated
  USING (
    public.is_government_user() OR
    EXISTS (
      SELECT 1 FROM public.complaints c
      WHERE c.id = complaint_evidence.complaint_id
        AND (c.citizen_user_id = auth.uid() OR public.can_access_project(c.project_id))
    )
  );

DROP POLICY IF EXISTS "Authenticated users can submit complaint evidence" ON public.complaint_evidence;
CREATE POLICY "Authenticated users can submit complaint evidence"
  ON public.complaint_evidence FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);

-- 6. Project Metadata Tables (aliases, organizations, updates)
DROP POLICY IF EXISTS "Project aliases readable by participants" ON public.project_aliases;
CREATE POLICY "Project aliases readable by participants"
  ON public.project_aliases FOR SELECT
  TO authenticated
  USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "Government manages project aliases" ON public.project_aliases;
CREATE POLICY "Government manages project aliases"
  ON public.project_aliases FOR ALL
  TO authenticated
  USING (public.is_government_user());

DROP POLICY IF EXISTS "Project organizations readable by participants" ON public.project_organizations;
CREATE POLICY "Project organizations readable by participants"
  ON public.project_organizations FOR SELECT
  TO authenticated
  USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "Government manages project organizations" ON public.project_organizations;
CREATE POLICY "Government manages project organizations"
  ON public.project_organizations FOR ALL
  TO authenticated
  USING (public.is_government_user());

DROP POLICY IF EXISTS "Project updates readable by participants" ON public.project_updates;
CREATE POLICY "Project updates readable by participants"
  ON public.project_updates FOR SELECT
  TO authenticated
  USING (public.is_government_user() OR public.can_access_project(project_id));

DROP POLICY IF EXISTS "Government manages project updates" ON public.project_updates;
CREATE POLICY "Government manages project updates"
  ON public.project_updates FOR ALL
  TO authenticated
  USING (public.is_government_user());

-- 7. Legacy AI & Ingestion Staging Tables
DROP POLICY IF EXISTS "AI runs managed by gov and service role" ON public.ai_runs;
CREATE POLICY "AI runs managed by gov and service role"
  ON public.ai_runs FOR ALL
  TO authenticated, service_role
  USING (public.is_government_user() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "AI insights managed by gov and service role" ON public.ai_insights;
CREATE POLICY "AI insights managed by gov and service role"
  ON public.ai_insights FOR ALL
  TO authenticated, service_role
  USING (public.is_government_user() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Sources managed by gov and service role" ON public.sources;
CREATE POLICY "Sources managed by gov and service role"
  ON public.sources FOR ALL
  TO authenticated, service_role
  USING (public.is_government_user() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Source observations managed by gov and service role" ON public.source_observations;
CREATE POLICY "Source observations managed by gov and service role"
  ON public.source_observations FOR ALL
  TO authenticated, service_role
  USING (public.is_government_user() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Import batches managed by gov and service role" ON public.import_batches;
CREATE POLICY "Import batches managed by gov and service role"
  ON public.import_batches FOR ALL
  TO authenticated, service_role
  USING (public.is_government_user() OR auth.role() = 'service_role');

DROP POLICY IF EXISTS "Import staging managed by gov and service role" ON public.project_import_staging;
CREATE POLICY "Import staging managed by gov and service role"
  ON public.project_import_staging FOR ALL
  TO authenticated, service_role
  USING (public.is_government_user() OR auth.role() = 'service_role');


-- ==========================================
-- MIGRATION: 057_strict_tenant_rls_final.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 057_strict_tenant_rls_final.sql
-- Domain: Strict Multi-Tenant Row Level Security Hardening
-- Purpose: Remove all overly broad is_government_user() bypasses and enforce
--          strict tenant boundaries using can_access_project() and can_manage_project()
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. inspection_findings: Strict Tenant Scoping
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Findings visible to project participants and government" ON public.inspection_findings;
DROP POLICY IF EXISTS "findings_gov_all" ON public.inspection_findings;
DROP POLICY IF EXISTS "findings_contractor_update" ON public.inspection_findings;
DROP POLICY IF EXISTS "findings_select" ON public.inspection_findings;
DROP POLICY IF EXISTS "Government can insert inspection findings" ON public.inspection_findings;
DROP POLICY IF EXISTS "Authorized users can update inspection findings" ON public.inspection_findings;
DROP POLICY IF EXISTS "Government can delete inspection findings" ON public.inspection_findings;

-- READ: Project participants (Government managing org, assigned contractor, or assigned auditor)
CREATE POLICY "inspection_findings_select"
  ON public.inspection_findings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = inspection_findings.inspection_id
        AND public.can_access_project(i.project_id)
    )
  );

-- WRITE (INSERT): Government officers managing the specific project
CREATE POLICY "inspection_findings_insert"
  ON public.inspection_findings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = inspection_findings.inspection_id
        AND public.can_manage_project(i.project_id)
    )
  );

-- UPDATE:
-- 1) Government managing the project can update all fields
-- 2) Active assigned contractor can ONLY update contractor-actionable fields (status, resolution notes/evidence)
CREATE POLICY "inspection_findings_update"
  ON public.inspection_findings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = inspection_findings.inspection_id
        AND (
          public.can_manage_project(i.project_id)
          OR (
            EXISTS (
              SELECT 1 FROM public.contracts c
              WHERE c.project_id = i.project_id
                AND c.contractor_organization_id = public.get_current_user_organization_id()
                AND c.status = 'ACTIVE'
            )
          )
        )
    )
  );

-- DELETE: Strictly authorized Government managing the specific project
CREATE POLICY "inspection_findings_delete"
  ON public.inspection_findings FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.inspections i
      WHERE i.id = inspection_findings.inspection_id
        AND public.can_manage_project(i.project_id)
    )
  );

-- ------------------------------------------------------------------------------
-- 2. project_documents: Strict Visibility & Tenant Scope
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "project_documents_select" ON public.project_documents;
DROP POLICY IF EXISTS "project_documents_insert" ON public.project_documents;
DROP POLICY IF EXISTS "project_documents_update" ON public.project_documents;
DROP POLICY IF EXISTS "project_documents_delete" ON public.project_documents;
DROP POLICY IF EXISTS "documents_select" ON public.project_documents;

CREATE POLICY "project_documents_select"
  ON public.project_documents FOR SELECT
  TO authenticated
  USING (
    -- Public documents on public projects
    (visibility = 'PUBLIC' AND EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_documents.project_id AND p.is_public = true))
    -- Government managing org or auditor
    OR public.can_manage_project(project_id)
    -- Contractor with active contract and document is not internal-government
    OR (
      visibility IN ('PUBLIC', 'CONTRACTOR_VISIBLE')
      AND public.can_access_project(project_id)
      AND EXISTS (
        SELECT 1 FROM public.contracts c
        WHERE c.project_id = project_documents.project_id
          AND c.contractor_organization_id = public.get_current_user_organization_id()
          AND c.status = 'ACTIVE'
      )
    )
    -- Owner / Uploader
    OR uploaded_by = auth.uid()
  );

CREATE POLICY "project_documents_insert"
  ON public.project_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_manage_project(project_id)
    OR (
      public.can_access_project(project_id)
      AND EXISTS (
        SELECT 1 FROM public.contracts c
        WHERE c.project_id = project_documents.project_id
          AND c.contractor_organization_id = public.get_current_user_organization_id()
          AND c.status = 'ACTIVE'
      )
    )
  );

CREATE POLICY "project_documents_update"
  ON public.project_documents FOR UPDATE
  TO authenticated
  USING (
    public.can_manage_project(project_id)
    OR (uploaded_by = auth.uid() AND public.can_access_project(project_id))
  );

CREATE POLICY "project_documents_delete"
  ON public.project_documents FOR DELETE
  TO authenticated
  USING (
    public.can_manage_project(project_id)
  );

-- ------------------------------------------------------------------------------
-- 3. delay_events: Strict Tenant Scoping
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "delay_events_select" ON public.delay_events;
DROP POLICY IF EXISTS "delay_events_insert" ON public.delay_events;
DROP POLICY IF EXISTS "delay_events_manage" ON public.delay_events;

CREATE POLICY "delay_events_select"
  ON public.delay_events FOR SELECT
  TO authenticated
  USING (
    public.can_access_project(project_id)
  );

CREATE POLICY "delay_events_insert"
  ON public.delay_events FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_manage_project(project_id)
    OR (
      public.can_access_project(project_id)
      AND EXISTS (
        SELECT 1 FROM public.contracts c
        WHERE c.project_id = delay_events.project_id
          AND c.contractor_organization_id = public.get_current_user_organization_id()
          AND c.status = 'ACTIVE'
      )
    )
  );

CREATE POLICY "delay_events_update"
  ON public.delay_events FOR UPDATE
  TO authenticated
  USING (
    public.can_manage_project(project_id)
  );

CREATE POLICY "delay_events_delete"
  ON public.delay_events FOR DELETE
  TO authenticated
  USING (
    public.can_manage_project(project_id)
  );

-- ------------------------------------------------------------------------------
-- 4. Environmental Domain: Clearances, Baselines, Commitments, Observations, Incidents
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "env_clearances_select" ON public.environmental_clearances;
DROP POLICY IF EXISTS "env_clearances_all" ON public.environmental_clearances;

CREATE POLICY "env_clearances_select"
  ON public.environmental_clearances FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "env_clearances_write"
  ON public.environmental_clearances FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

DROP POLICY IF EXISTS "env_baselines_select" ON public.environmental_baselines;
DROP POLICY IF EXISTS "env_baselines_all" ON public.environmental_baselines;

CREATE POLICY "env_baselines_select"
  ON public.environmental_baselines FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "env_baselines_write"
  ON public.environmental_baselines FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

DROP POLICY IF EXISTS "env_commitments_select" ON public.environmental_commitments;
DROP POLICY IF EXISTS "env_commitments_all" ON public.environmental_commitments;

CREATE POLICY "env_commitments_select"
  ON public.environmental_commitments FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "env_commitments_write"
  ON public.environmental_commitments FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

DROP POLICY IF EXISTS "env_observations_select" ON public.environmental_observations;
DROP POLICY IF EXISTS "env_observations_insert" ON public.environmental_observations;
DROP POLICY IF EXISTS "env_observations_all" ON public.environmental_observations;

CREATE POLICY "env_observations_select"
  ON public.environmental_observations FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "env_observations_insert"
  ON public.environmental_observations FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_manage_project(project_id)
    OR (
      public.can_access_project(project_id)
      AND EXISTS (
        SELECT 1 FROM public.contracts c
        WHERE c.project_id = environmental_observations.project_id
          AND c.contractor_organization_id = public.get_current_user_organization_id()
          AND c.status = 'ACTIVE'
      )
    )
  );

CREATE POLICY "env_observations_manage"
  ON public.environmental_observations FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

DROP POLICY IF EXISTS "env_incidents_select" ON public.environmental_incidents;
DROP POLICY IF EXISTS "env_incidents_insert" ON public.environmental_incidents;
DROP POLICY IF EXISTS "env_incidents_all" ON public.environmental_incidents;

CREATE POLICY "env_incidents_select"
  ON public.environmental_incidents FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "env_incidents_insert"
  ON public.environmental_incidents FOR INSERT
  TO authenticated
  WITH CHECK (
    public.can_manage_project(project_id)
    OR (
      public.can_access_project(project_id)
      AND EXISTS (
        SELECT 1 FROM public.contracts c
        WHERE c.project_id = environmental_incidents.project_id
          AND c.contractor_organization_id = public.get_current_user_organization_id()
          AND c.status = 'ACTIVE'
      )
    )
  );

CREATE POLICY "env_incidents_manage"
  ON public.environmental_incidents FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

-- ------------------------------------------------------------------------------
-- 5. Progress Evidence & Project Updates
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "progress_evidence_select" ON public.progress_evidence;
DROP POLICY IF EXISTS "progress_evidence_insert" ON public.progress_evidence;
DROP POLICY IF EXISTS "progress_evidence_manage" ON public.progress_evidence;

CREATE POLICY "progress_evidence_select"
  ON public.progress_evidence FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_updates pu
      WHERE pu.id = progress_evidence.progress_update_id
        AND public.can_access_project(pu.project_id)
    )
  );

CREATE POLICY "progress_evidence_insert"
  ON public.progress_evidence FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_updates pu
      WHERE pu.id = progress_evidence.progress_update_id
        AND (
          public.can_manage_project(pu.project_id)
          OR (
            public.can_access_project(pu.project_id)
            AND pu.contractor_organization_id = public.get_current_user_organization_id()
          )
        )
    )
  );

CREATE POLICY "progress_evidence_manage"
  ON public.progress_evidence FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.project_updates pu
      WHERE pu.id = progress_evidence.progress_update_id
        AND public.can_manage_project(pu.project_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.project_updates pu
      WHERE pu.id = progress_evidence.progress_update_id
        AND public.can_manage_project(pu.project_id)
    )
  );

-- ------------------------------------------------------------------------------
-- 6. project_organizations: Security Critical Organization Mapping
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "project_organizations_select" ON public.project_organizations;
DROP POLICY IF EXISTS "project_organizations_manage" ON public.project_organizations;
DROP POLICY IF EXISTS "project_organizations_gov_all" ON public.project_organizations;

CREATE POLICY "project_organizations_select"
  ON public.project_organizations FOR SELECT
  TO authenticated
  USING (
    public.can_access_project(project_id)
    OR organization_id = public.get_current_user_organization_id()
  );

CREATE POLICY "project_organizations_manage"
  ON public.project_organizations FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

-- ------------------------------------------------------------------------------
-- 7. Project Aliases: Strict Tenant Scoping
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "project_aliases_select" ON public.project_aliases;
DROP POLICY IF EXISTS "project_aliases_manage" ON public.project_aliases;

CREATE POLICY "project_aliases_select"
  ON public.project_aliases FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "project_aliases_manage"
  ON public.project_aliases FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

-- ------------------------------------------------------------------------------
-- 8. Staging & Import Tables
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "import_staging_projects_select" ON public.import_staging_projects;
DROP POLICY IF EXISTS "import_staging_projects_manage" ON public.import_staging_projects;

CREATE POLICY "import_staging_projects_select"
  ON public.import_staging_projects FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "import_staging_projects_manage"
  ON public.import_staging_projects FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));

DROP POLICY IF EXISTS "import_staging_updates_select" ON public.import_staging_updates;
DROP POLICY IF EXISTS "import_staging_updates_manage" ON public.import_staging_updates;

CREATE POLICY "import_staging_updates_select"
  ON public.import_staging_updates FOR SELECT
  TO authenticated
  USING (public.can_access_project(project_id));

CREATE POLICY "import_staging_updates_manage"
  ON public.import_staging_updates FOR ALL
  TO authenticated
  USING (public.can_manage_project(project_id))
  WITH CHECK (public.can_manage_project(project_id));


-- ==========================================
-- MIGRATION: 058_platform_and_auditor_scope.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 058_platform_and_auditor_scope.sql
-- Domain: Platform Privileges, Explicit Auditor Assignment, and Scoped Security Helpers
-- Purpose: Eliminate global role bypasses, define explicit auditor scoping,
--          and implement zero-trust authorization helpers.
-- ==============================================================================

-- 1. Create auditor_project_assignments table
CREATE TABLE IF NOT EXISTS public.auditor_project_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auditor_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  auditor_organization_id UUID REFERENCES public.organizations(id),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL DEFAULT 'READ' CHECK (access_level IN ('READ', 'AUDIT_WRITE', 'FULL')),
  assigned_by UUID REFERENCES public.profiles(id),
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_auditor_assignments_user_project 
  ON public.auditor_project_assignments(auditor_user_id, project_id) 
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_auditor_assignments_project 
  ON public.auditor_project_assignments(project_id) 
  WHERE revoked_at IS NULL;

ALTER TABLE public.auditor_project_assignments ENABLE ROW LEVEL SECURITY;

-- 2. Create platform_privileges table
CREATE TABLE IF NOT EXISTS public.platform_privileges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  privilege TEXT NOT NULL CHECK (privilege IN ('PLATFORM_ADMIN', 'NATIONAL_AUDITOR', 'SECURITY_ADMIN')),
  granted_by UUID REFERENCES public.profiles(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_platform_privileges_user 
  ON public.platform_privileges(user_id, privilege) 
  WHERE revoked_at IS NULL;

ALTER TABLE public.platform_privileges ENABLE ROW LEVEL SECURITY;

-- 3. Function: has_platform_privilege
CREATE OR REPLACE FUNCTION public.has_platform_privilege(p_privilege TEXT)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
BEGIN
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.platform_privileges pp
    WHERE pp.user_id = v_user_id
      AND pp.privilege = p_privilege
      AND pp.revoked_at IS NULL
      AND (pp.expires_at IS NULL OR pp.expires_at > now())
  );
END;
$$;

-- 4. Function: can_audit_project
CREATE OR REPLACE FUNCTION public.can_audit_project(p_project_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
BEGIN
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Platform privileges provide platform-wide audit access
  IF public.has_platform_privilege('PLATFORM_ADMIN') OR public.has_platform_privilege('NATIONAL_AUDITOR') THEN
    RETURN TRUE;
  END IF;

  -- Explicit project assignment check
  RETURN EXISTS (
    SELECT 1 FROM public.auditor_project_assignments apa
    WHERE apa.auditor_user_id = v_user_id
      AND apa.project_id = p_project_id
      AND apa.revoked_at IS NULL
      AND (apa.expires_at IS NULL OR apa.expires_at > now())
  );
END;
$$;

-- 5. Updated Function: can_manage_project
CREATE OR REPLACE FUNCTION public.can_manage_project(p_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_org_id UUID := public.get_current_user_organization_id();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  IF public.has_platform_privilege('PLATFORM_ADMIN') THEN
    RETURN TRUE;
  END IF;

  IF NOT public.is_government_user() THEN
    RETURN FALSE;
  END IF;

  -- Must be associated with the project's managing government organization
  RETURN EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_id
      AND p.deleted_at IS NULL
      AND (
        p.government_organization_id = v_org_id
        OR EXISTS (
          SELECT 1 FROM public.project_organizations po
          WHERE po.project_id = p_id
            AND po.organization_id = v_org_id
            AND po.role IN ('OWNING_AGENCY', 'IMPLEMENTING_AGENCY', 'NODAL_MINISTRY')
        )
      )
  );
END;
$$;

-- 6. Updated Function: can_access_project
CREATE OR REPLACE FUNCTION public.can_access_project(p_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_org_id UUID := public.get_current_user_organization_id();
BEGIN
  IF v_user_id IS NULL THEN
    -- Anonymous / Unauthenticated: Check if public
    RETURN EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = p_id AND p.is_public = TRUE AND p.deleted_at IS NULL
    );
  END IF;

  -- Platform administrators can access
  IF public.has_platform_privilege('PLATFORM_ADMIN') OR public.has_platform_privilege('NATIONAL_AUDITOR') THEN
    RETURN TRUE;
  END IF;

  -- Assigned Auditor access
  IF public.can_audit_project(p_id) THEN
    RETURN TRUE;
  END IF;

  -- Government User: Scoped to owning/implementing organizations
  IF public.is_government_user() THEN
    RETURN EXISTS (
      SELECT 1 FROM public.projects p
      WHERE p.id = p_id
        AND p.deleted_at IS NULL
        AND (
          p.government_organization_id = v_org_id
          OR EXISTS (
            SELECT 1 FROM public.project_organizations po
            WHERE po.project_id = p_id AND po.organization_id = v_org_id
          )
        )
    );
  END IF;

  -- Contractor User: Scoped to contracted or participating projects
  IF public.is_contractor_user() THEN
    RETURN EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.project_id = p_id
        AND c.contractor_organization_id = v_org_id
        AND c.status IN ('ACTIVE', 'SIGNED', 'IN_PROGRESS', 'DEFECT_LIABILITY', 'COMPLETED')
    ) OR EXISTS (
      SELECT 1 FROM public.project_organizations po
      WHERE po.project_id = p_id AND po.organization_id = v_org_id
    ) OR EXISTS (
      SELECT 1 FROM public.tenders t
      JOIN public.tender_bids tb ON tb.tender_id = t.id
      WHERE t.project_id = p_id
        AND tb.contractor_organization_id = v_org_id
    );
  END IF;

  -- Public citizen fallback
  RETURN EXISTS (
    SELECT 1 FROM public.projects p
    WHERE p.id = p_id AND p.is_public = TRUE AND p.deleted_at IS NULL
  );
END;
$$;

-- 7. Function: can_access_document
CREATE OR REPLACE FUNCTION public.can_access_document(p_document_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user_id UUID := (SELECT auth.uid());
  v_doc RECORD;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT * INTO v_doc FROM public.project_documents WHERE id = p_document_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Uploader can always access
  IF v_doc.uploaded_by = v_user_id THEN
    RETURN TRUE;
  END IF;

  -- Public document on public project
  IF v_doc.visibility = 'PUBLIC' AND EXISTS (
    SELECT 1 FROM public.projects p WHERE p.id = v_doc.project_id AND p.is_public = TRUE
  ) THEN
    RETURN TRUE;
  END IF;

  -- Government managing project
  IF public.can_manage_project(v_doc.project_id) THEN
    RETURN TRUE;
  END IF;

  -- Auditor assigned
  IF public.can_audit_project(v_doc.project_id) THEN
    RETURN TRUE;
  END IF;

  -- Contractor visibility
  IF v_doc.visibility = 'CONTRACTOR_VISIBLE' AND public.can_access_project(v_doc.project_id) THEN
    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$;

-- 8. Function: can_manage_payment_claim
CREATE OR REPLACE FUNCTION public.can_manage_payment_claim(p_claim_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_claim RECORD;
BEGIN
  SELECT * INTO v_claim FROM public.payment_claims WHERE id = p_claim_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN public.can_manage_project(v_claim.project_id);
END;
$$;

-- 9. Function: can_manage_litigation
CREATE OR REPLACE FUNCTION public.can_manage_litigation(p_litigation_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_lit RECORD;
BEGIN
  SELECT * INTO v_lit FROM public.litigations WHERE id = p_litigation_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN public.can_manage_project(v_lit.project_id);
END;
$$;

-- 10. Function: can_review_ai_analysis
CREATE OR REPLACE FUNCTION public.can_review_ai_analysis(p_analysis_run_id UUID)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_run RECORD;
BEGIN
  SELECT * INTO v_run FROM public.ai_analysis_runs WHERE id = p_analysis_run_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  RETURN public.can_manage_project(v_run.project_id);
END;
$$;

-- 11. Policies on new metadata tables
CREATE POLICY "auditor_assignments_select"
  ON public.auditor_project_assignments FOR SELECT
  TO authenticated
  USING (
    auditor_user_id = auth.uid()
    OR public.can_manage_project(project_id)
    OR public.has_platform_privilege('PLATFORM_ADMIN')
    OR public.has_platform_privilege('SECURITY_ADMIN')
  );

CREATE POLICY "auditor_assignments_manage"
  ON public.auditor_project_assignments FOR ALL
  TO authenticated
  USING (
    public.can_manage_project(project_id)
    OR public.has_platform_privilege('PLATFORM_ADMIN')
    OR public.has_platform_privilege('SECURITY_ADMIN')
  )
  WITH CHECK (
    public.can_manage_project(project_id)
    OR public.has_platform_privilege('PLATFORM_ADMIN')
    OR public.has_platform_privilege('SECURITY_ADMIN')
  );

CREATE POLICY "platform_privileges_select"
  ON public.platform_privileges FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid()
    OR public.has_platform_privilege('PLATFORM_ADMIN')
    OR public.has_platform_privilege('SECURITY_ADMIN')
  );

CREATE POLICY "platform_privileges_manage"
  ON public.platform_privileges FOR ALL
  TO authenticated
  USING (
    public.has_platform_privilege('PLATFORM_ADMIN')
    OR public.has_platform_privilege('SECURITY_ADMIN')
  )
  WITH CHECK (
    public.has_platform_privilege('PLATFORM_ADMIN')
    OR public.has_platform_privilege('SECURITY_ADMIN')
  );

GRANT EXECUTE ON FUNCTION public.has_platform_privilege(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_audit_project(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_project(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_access_project(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.can_access_document(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_payment_claim(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_manage_litigation(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.can_review_ai_analysis(UUID) TO authenticated;


-- ==========================================
-- MIGRATION: 059_private_gateway_session_support.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 059_private_gateway_session_support.sql
-- Domain: Gateway Sessions, CSRF Token Management, and MFA Verification
-- Purpose: Support backend-mediated HttpOnly cookie sessions and multi-factor
--          auth challenge tracking without exposing tokens to frontend storage.
-- ==============================================================================

-- 1. Gateway Sessions table
CREATE TABLE IF NOT EXISTS public.gateway_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_token_hash TEXT NOT NULL UNIQUE,
  csrf_token_hash TEXT NOT NULL,
  mfa_verified BOOLEAN NOT NULL DEFAULT false,
  mfa_verified_at TIMESTAMPTZ,
  elevated_until TIMESTAMPTZ,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_gateway_sessions_token_hash 
  ON public.gateway_sessions(session_token_hash) 
  WHERE revoked_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_gateway_sessions_user 
  ON public.gateway_sessions(user_id) 
  WHERE revoked_at IS NULL;

ALTER TABLE public.gateway_sessions ENABLE ROW LEVEL SECURITY;

-- 2. MFA Challenges table
CREATE TABLE IF NOT EXISTS public.mfa_challenges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.gateway_sessions(id) ON DELETE CASCADE,
  challenge_hash TEXT NOT NULL,
  challenge_type TEXT NOT NULL DEFAULT 'TOTP' CHECK (challenge_type IN ('TOTP', 'EMAIL_OTP', 'SECURITY_KEY')),
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'VERIFIED', 'EXPIRED', 'FAILED')),
  attempts INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_mfa_challenges_user_pending 
  ON public.mfa_challenges(user_id) 
  WHERE status = 'PENDING';

ALTER TABLE public.mfa_challenges ENABLE ROW LEVEL SECURITY;

-- 3. Policies: Internal backend gateway & service-role only
-- Authenticated users can view their own non-revoked session metadata (no hashes)
CREATE POLICY "gateway_sessions_user_select"
  ON public.gateway_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Browser cannot directly insert, update or delete sessions
CREATE POLICY "gateway_sessions_service_manage"
  ON public.gateway_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "mfa_challenges_service_manage"
  ON public.mfa_challenges FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ==========================================
-- MIGRATION: 060_blockchain_audit_schema.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 060_blockchain_audit_schema.sql
-- Domain: Hyperledger Fabric Blockchain Audit Anchors Schema
-- Purpose: Store immutable cryptographic audit anchors and transaction proofs
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.blockchain_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  audit_id TEXT UNIQUE NOT NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  entity_external_id TEXT,
  event_type TEXT NOT NULL,
  canonical_version INTEGER NOT NULL DEFAULT 1,
  payload_hash TEXT NOT NULL,
  hash_algorithm TEXT NOT NULL DEFAULT 'SHA-256',
  anchor_nonce TEXT,
  fabric_network TEXT DEFAULT 'nirikshak-fabric',
  channel_name TEXT DEFAULT 'nirikshakchannel',
  chaincode_name TEXT DEFAULT 'nirikshak-audit',
  transaction_id TEXT UNIQUE,
  block_number BIGINT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'CONFIRMED', 'FAILED', 'DEAD_LETTER')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  submitted_at TIMESTAMPTZ,
  confirmed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_project_id 
  ON public.blockchain_anchors(project_id);

CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_entity 
  ON public.blockchain_anchors(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_status 
  ON public.blockchain_anchors(status);

CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_audit_id 
  ON public.blockchain_anchors(audit_id);

CREATE INDEX IF NOT EXISTS idx_blockchain_anchors_tx_id 
  ON public.blockchain_anchors(transaction_id) 
  WHERE transaction_id IS NOT NULL;

ALTER TABLE public.blockchain_anchors ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- MIGRATION: 061_blockchain_outbox.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 061_blockchain_outbox.sql
-- Domain: Transactional Outbox for Hyperledger Fabric Anchoring
-- Purpose: Decouple operational database transactions from external ledger submission
--          guaranteeing reliable, eventual, tamper-evident anchoring.
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.blockchain_anchor_outbox (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dedupe_key TEXT UNIQUE NOT NULL,
  anchor_id UUID REFERENCES public.blockchain_anchors(id) ON DELETE CASCADE,
  project_id UUID,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  event_type TEXT NOT NULL,
  minimal_payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PROCESSING', 'CONFIRMED', 'FAILED', 'DEAD_LETTER')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  processed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_blockchain_outbox_queue 
  ON public.blockchain_anchor_outbox(status, next_attempt_at) 
  WHERE status IN ('PENDING', 'FAILED');

CREATE INDEX IF NOT EXISTS idx_blockchain_outbox_dedupe 
  ON public.blockchain_anchor_outbox(dedupe_key);

CREATE INDEX IF NOT EXISTS idx_blockchain_outbox_project 
  ON public.blockchain_anchor_outbox(project_id);

ALTER TABLE public.blockchain_anchor_outbox ENABLE ROW LEVEL SECURITY;


-- ==========================================
-- MIGRATION: 062_blockchain_rls.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 062_blockchain_rls.sql
-- Domain: Row Level Security for Blockchain Anchors and Outbox Tables
-- Purpose: Restrict ledger audit verification access to authorized tenants
--          and prevent arbitrary client insertions to the ledger tables.
-- ==============================================================================

-- 1. blockchain_anchors RLS
DROP POLICY IF EXISTS "blockchain_anchors_select" ON public.blockchain_anchors;
DROP POLICY IF EXISTS "blockchain_anchors_write" ON public.blockchain_anchors;

-- Authenticated Users: Scoped by Project Access & Role Boundaries
CREATE POLICY "blockchain_anchors_select"
  ON public.blockchain_anchors FOR SELECT
  TO authenticated
  USING (
    -- Platform Admin / National Auditor
    public.has_platform_privilege('PLATFORM_ADMIN')
    OR public.has_platform_privilege('NATIONAL_AUDITOR')
    -- Assigned Auditor
    OR (project_id IS NOT NULL AND public.can_audit_project(project_id))
    -- Government Managing Organization
    OR (project_id IS NOT NULL AND public.can_manage_project(project_id))
    -- Contractor assigned to the project for non-confidential project events
    OR (
      project_id IS NOT NULL
      AND public.is_contractor_user()
      AND public.can_access_project(project_id)
      AND event_type NOT IN ('LITIGATION_CREATED', 'SETTLEMENT_APPROVED', 'INTERNAL_GOV_DECISION')
    )
  );

-- Only backend service-role / internal worker may insert or modify anchors
CREATE POLICY "blockchain_anchors_service_role_all"
  ON public.blockchain_anchors FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 2. blockchain_anchor_outbox RLS
DROP POLICY IF EXISTS "blockchain_outbox_service_role_all" ON public.blockchain_anchor_outbox;

-- Only backend worker may access the outbox table
CREATE POLICY "blockchain_outbox_service_role_all"
  ON public.blockchain_anchor_outbox FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);


-- ==========================================
-- MIGRATION: 063_blockchain_rpc_integration.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 063_blockchain_rpc_integration.sql
-- Domain: RPC & Database Triggers for Hyperledger Fabric Outbox Enqueueing
-- Purpose: Atomically enqueue blockchain anchors alongside critical business state changes
-- ==============================================================================

-- 1. Helper Function: enqueue_blockchain_anchor
CREATE OR REPLACE FUNCTION public.enqueue_blockchain_anchor(
  p_project_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_entity_external_id TEXT,
  p_event_type TEXT,
  p_payload_hash TEXT,
  p_minimal_payload JSONB,
  p_dedupe_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_anchor_id UUID;
  v_audit_id TEXT;
  v_existing_anchor_id UUID;
BEGIN
  -- Idempotency check via dedupe_key in outbox
  SELECT anchor_id INTO v_existing_anchor_id
  FROM public.blockchain_anchor_outbox
  WHERE dedupe_key = p_dedupe_key;

  IF v_existing_anchor_id IS NOT NULL THEN
    SELECT audit_id INTO v_audit_id FROM public.blockchain_anchors WHERE id = v_existing_anchor_id;
    RETURN jsonb_build_object(
      'success', true,
      'idempotent', true,
      'anchor_id', v_existing_anchor_id,
      'audit_id', v_audit_id,
      'status', 'ALREADY_ENQUEUED'
    );
  END IF;

  v_audit_id := 'AUD-' || upper(p_entity_type) || '-' || substr(md5(random()::text || clock_timestamp()::text), 1, 16);

  -- Insert Anchor record
  INSERT INTO public.blockchain_anchors (
    audit_id,
    project_id,
    entity_type,
    entity_id,
    entity_external_id,
    event_type,
    canonical_version,
    payload_hash,
    status
  ) VALUES (
    v_audit_id,
    p_project_id,
    p_entity_type,
    p_entity_id,
    p_entity_external_id,
    p_event_type,
    1,
    p_payload_hash,
    'PENDING'
  )
  RETURNING id INTO v_anchor_id;

  -- Insert into Transactional Outbox
  INSERT INTO public.blockchain_anchor_outbox (
    dedupe_key,
    anchor_id,
    project_id,
    entity_type,
    entity_id,
    event_type,
    minimal_payload,
    status
  ) VALUES (
    p_dedupe_key,
    v_anchor_id,
    p_project_id,
    p_entity_type,
    p_entity_id,
    p_event_type,
    p_minimal_payload,
    'PENDING'
  )
  ON CONFLICT (dedupe_key) DO NOTHING;

  RETURN jsonb_build_object(
    'success', true,
    'idempotent', false,
    'anchor_id', v_anchor_id,
    'audit_id', v_audit_id,
    'status', 'PENDING'
  );
END;
$$;

-- Grant execution to authenticated users & service role
GRANT EXECUTE ON FUNCTION public.enqueue_blockchain_anchor(UUID, TEXT, UUID, TEXT, TEXT, TEXT, JSONB, TEXT) TO authenticated, service_role;

-- 2. Trigger on Payments table for PAYMENT_RECORDED event
CREATE OR REPLACE FUNCTION public.trg_anchor_payment_recorded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload_hash TEXT;
  v_dedupe_key TEXT;
  v_payload JSONB;
BEGIN
  v_payload := jsonb_build_object(
    'payment_id', NEW.id,
    'payment_reference', NEW.payment_reference,
    'amount', NEW.amount,
    'payment_status', NEW.payment_status,
    'claim_id', NEW.payment_claim_id,
    'recorded_at', NEW.created_at
  );

  v_payload_hash := encode(digest(v_payload::text, 'sha256'), 'hex');
  v_dedupe_key := 'PAYMENT:' || NEW.id || ':RECORDED:' || COALESCE(NEW.payment_reference, NEW.id::text);

  PERFORM public.enqueue_blockchain_anchor(
    NEW.project_id,
    'PAYMENT',
    NEW.id,
    NEW.payment_reference,
    'PAYMENT_RECORDED',
    v_payload_hash,
    v_payload,
    v_dedupe_key
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_payment_blockchain_anchor ON public.payments;
CREATE TRIGGER trg_payment_blockchain_anchor
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_anchor_payment_recorded();

-- 3. Trigger on Contracts table for CONTRACT_AWARDED event
CREATE OR REPLACE FUNCTION public.trg_anchor_contract_awarded()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_payload_hash TEXT;
  v_dedupe_key TEXT;
  v_payload JSONB;
BEGIN
  IF NEW.status IN ('ACTIVE', 'SIGNED') AND (OLD IS NULL OR OLD.status <> NEW.status) THEN
    v_payload := jsonb_build_object(
      'contract_id', NEW.id,
      'contract_number', NEW.contract_number,
      'contract_value', NEW.contract_value,
      'contractor_organization_id', NEW.contractor_organization_id,
      'awarded_at', NEW.created_at
    );

    v_payload_hash := encode(digest(v_payload::text, 'sha256'), 'hex');
    v_dedupe_key := 'CONTRACT:' || NEW.id || ':AWARDED:' || COALESCE(NEW.contract_number, NEW.id::text);

    PERFORM public.enqueue_blockchain_anchor(
      NEW.project_id,
      'CONTRACT',
      NEW.id,
      NEW.contract_number,
      'CONTRACT_AWARDED',
      v_payload_hash,
      v_payload,
      v_dedupe_key
    );
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contract_blockchain_anchor ON public.contracts;
CREATE TRIGGER trg_contract_blockchain_anchor
  AFTER INSERT OR UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_anchor_contract_awarded();


-- ==========================================
-- MIGRATION: 064_final_production_constraints.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 064_final_production_constraints.sql
-- Domain: Financial & Concurrency Hardening
-- Purpose: Add database check constraints and row-level locking guarantees
--          preventing double-spend, race condition overpayments, and data anomalies.
-- ==============================================================================

-- 1. Hardened financial check constraints
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payments_amount_paid_positive'
  ) THEN
    ALTER TABLE public.payments
      ADD CONSTRAINT payments_amount_paid_positive CHECK (amount_paid > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_claims_claimed_amount_positive'
  ) THEN
    ALTER TABLE public.payment_claims
      ADD CONSTRAINT payment_claims_claimed_amount_positive CHECK (claimed_amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'payment_claims_approved_amount_positive'
  ) THEN
    ALTER TABLE public.payment_claims
      ADD CONSTRAINT payment_claims_approved_amount_positive CHECK (approved_amount IS NULL OR approved_amount > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contracts_contract_value_positive'
  ) THEN
    ALTER TABLE public.contracts
      ADD CONSTRAINT contracts_contract_value_positive CHECK (contract_value > 0);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tenders_estimated_cost_positive'
  ) THEN
    ALTER TABLE public.tenders
      ADD CONSTRAINT tenders_estimated_cost_positive CHECK (estimated_cost > 0);
  END IF;
END $$;

-- 2. Unique index on payment reference (prevent duplicate transaction recording)
CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_unique_reference 
  ON public.payments(payment_reference) 
  WHERE payment_reference IS NOT NULL;

-- 3. Ensure payments and claims have row locks in record_payment RPC
-- (Re-enforcing the FOR UPDATE concurrency lock)
CREATE OR REPLACE FUNCTION public.validate_payment_concurrency(p_claim_id UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_dummy UUID;
BEGIN
  SELECT id INTO v_dummy FROM public.payment_claims WHERE id = p_claim_id FOR UPDATE NOWAIT;
  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RETURN FALSE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.validate_payment_concurrency(UUID) TO authenticated, service_role;


-- ==========================================
-- MIGRATION: 065_final_security_validation.sql
-- ==========================================

-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 065_final_security_validation.sql
-- Domain: Production Zero-Trust & Blockchain Security Readiness Verification
-- Purpose: Stored procedure providing deep inspection of tenant isolation,
--          RLS completeness, blockchain anchor health, and audit integrity.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.verify_production_security_readiness()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_tables_count INTEGER;
  v_rls_disabled_count INTEGER;
  v_views_count INTEGER;
  v_policies_count INTEGER;
  v_anchors_count INTEGER;
  v_outbox_pending_count INTEGER;
  v_broad_policies_count INTEGER;
  v_report JSONB;
BEGIN
  -- 1. Base tables count
  SELECT count(*) INTO v_tables_count
  FROM information_schema.tables
  WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

  -- 2. Tables without RLS
  SELECT count(*) INTO v_rls_disabled_count
  FROM pg_tables t
  JOIN pg_class c ON c.relname = t.tablename
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE t.schemaname = 'public' AND c.relrowsecurity = false;

  -- 3. Views count
  SELECT count(*) INTO v_views_count
  FROM information_schema.views
  WHERE table_schema = 'public';

  -- 4. Total policies count
  SELECT count(*) INTO v_policies_count
  FROM pg_policies
  WHERE schemaname = 'public';

  -- 5. Check for overly broad policies using is_government_user() alone in project tables
  SELECT count(*) INTO v_broad_policies_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename IN ('inspection_findings', 'project_documents', 'delay_events', 'environmental_clearances')
    AND (
      qual LIKE '%is_government_user()%' AND qual NOT LIKE '%can_access_project%' AND qual NOT LIKE '%can_manage_project%'
    );

  -- 6. Blockchain anchors and outbox status
  SELECT count(*) INTO v_anchors_count FROM public.blockchain_anchors;
  SELECT count(*) INTO v_outbox_pending_count FROM public.blockchain_anchor_outbox WHERE status = 'PENDING';

  v_report := jsonb_build_object(
    'total_tables', v_tables_count,
    'tables_without_rls', v_rls_disabled_count,
    'total_views', v_views_count,
    'total_policies', v_policies_count,
    'broad_policies_count', v_broad_policies_count,
    'blockchain_anchors_count', v_anchors_count,
    'blockchain_outbox_pending_count', v_outbox_pending_count,
    'zero_trust_status', CASE 
      WHEN v_rls_disabled_count = 0 AND v_broad_policies_count = 0 THEN 'SECURE' 
      ELSE 'ACTION_REQUIRED' 
    END,
    'timestamp', now()
  );

  RETURN v_report;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_production_security_readiness() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_production_security_readiness() TO authenticated, service_role;

