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
