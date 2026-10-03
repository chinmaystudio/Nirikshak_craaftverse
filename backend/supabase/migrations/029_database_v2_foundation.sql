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
