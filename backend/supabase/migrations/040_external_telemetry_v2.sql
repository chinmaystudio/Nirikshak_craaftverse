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
