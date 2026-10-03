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
