-- Historical 001 enables RLS on these two tables before 012 creates them.
-- Bootstrap the exact 012 columns; foreign keys to projects are added after 001.
CREATE TABLE IF NOT EXISTS public.environmental_observations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
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
  project_id UUID NOT NULL,
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
