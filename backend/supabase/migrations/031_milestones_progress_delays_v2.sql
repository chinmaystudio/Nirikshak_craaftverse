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
