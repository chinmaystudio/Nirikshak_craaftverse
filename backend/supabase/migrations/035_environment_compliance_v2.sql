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

CREATE INDEX IF NOT EXISTS idx_env_obs_project ON public.environmental_observations(project_id, observed_at DESC);
CREATE INDEX IF NOT EXISTS idx_env_clearances_expiry ON public.environmental_clearances(project_id, valid_until);
CREATE INDEX IF NOT EXISTS idx_env_incidents_project ON public.environmental_incidents(project_id, status);
