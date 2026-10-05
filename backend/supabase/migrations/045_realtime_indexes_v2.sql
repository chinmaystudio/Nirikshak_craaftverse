-- ============================================================================
-- Migration: 045_realtime_indexes_v2.sql
-- Description: Composite Performance Indexes & Realtime Publications V2
-- ============================================================================

-- 1. Composite & High-Traffic Indexes
CREATE INDEX IF NOT EXISTS idx_projects_gov_status 
    ON projects(government_organization_id, normalized_status) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_projects_nirikshak_id 
    ON projects(nirikshak_project_id);

CREATE INDEX IF NOT EXISTS idx_project_orgs_lookup 
    ON project_organizations(project_id, organization_id, relationship_type);

CREATE INDEX IF NOT EXISTS idx_org_members_user_status 
    ON organization_members(user_id, status);

CREATE INDEX IF NOT EXISTS idx_tenders_proj_status 
    ON tenders(project_id, status) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tenders_due_date 
    ON tenders(bid_due_date) 
    WHERE status = 'PUBLISHED' AND deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_tender_bids_tender_status 
    ON tender_bids(tender_id, status);

CREATE INDEX IF NOT EXISTS idx_tender_bids_contractor 
    ON tender_bids(contractor_organization_id, tender_id);

CREATE INDEX IF NOT EXISTS idx_contracts_project_contractor 
    ON contracts(project_id, contractor_organization_id, status);

CREATE INDEX IF NOT EXISTS idx_milestones_proj_seq 
    ON project_milestones(project_id, display_order);

CREATE INDEX IF NOT EXISTS idx_progress_updates_proj_time 
    ON progress_updates(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_progress_updates_verification 
    ON progress_updates(project_id, verification_status);

CREATE INDEX IF NOT EXISTS idx_payment_claims_proj_status 
    ON payment_claims(project_id, status);

CREATE INDEX IF NOT EXISTS idx_payment_claims_contractor 
    ON payment_claims(contractor_organization_id, status);

CREATE INDEX IF NOT EXISTS idx_inspections_proj_status 
    ON inspections(project_id, status);

CREATE INDEX IF NOT EXISTS idx_inspection_findings_open 
    ON inspection_findings(inspection_id, severity) 
    WHERE status IN ('OPEN', 'ACTION_REQUIRED');

CREATE INDEX IF NOT EXISTS idx_complaints_proj_status 
    ON complaints(project_id, status);

CREATE INDEX IF NOT EXISTS idx_complaints_citizen 
    ON complaints(user_id, status);

CREATE INDEX IF NOT EXISTS idx_litigations_proj_status 
    ON litigations(project_id, status);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient 
    ON notifications(recipient_user_id, read_at) 
    WHERE read_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ai_runs_proj_created 
    ON ai_analysis_runs(project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_recommended_actions_run 
    ON ai_recommended_actions(analysis_run_id, status);

-- 2. Configure Realtime publication safely
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
        EXCEPTION WHEN duplicate_object THEN NULL; END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE progress_updates;
        EXCEPTION WHEN duplicate_object THEN NULL; END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE tenders;
        EXCEPTION WHEN duplicate_object THEN NULL; END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE payment_claims;
        EXCEPTION WHEN duplicate_object THEN NULL; END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE complaint_updates;
        EXCEPTION WHEN duplicate_object THEN NULL; END;

        BEGIN
            ALTER PUBLICATION supabase_realtime ADD TABLE projects;
        EXCEPTION WHEN duplicate_object THEN NULL; END;
    END IF;
END $$;
