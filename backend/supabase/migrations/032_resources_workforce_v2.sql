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
