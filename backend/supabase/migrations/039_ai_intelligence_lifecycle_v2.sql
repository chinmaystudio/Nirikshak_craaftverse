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
