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
