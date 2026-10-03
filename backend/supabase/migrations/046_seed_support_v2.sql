-- ============================================================================
-- Migration: 046_seed_support_v2.sql
-- Description: Development Seed Support & Full Lifecycle E2E Fixtures V2
-- ============================================================================

DO $$
DECLARE
    v_gov_org_id UUID := 'c675a05d-6c45-4008-b021-6b88825e3641';
    v_contractor_a_id UUID := '602e1463-ed1f-48da-85f4-74fc2a5ab9cc';
    v_contractor_b_id UUID := 'b53361b8-675e-4cd7-9166-d29b896fbac5';
    v_auditor_org_id UUID := 'a1111111-1111-1111-1111-111111111111';
    
    v_project_id UUID := 'e2e00000-0000-0000-0000-000000000001';
    v_tender_id UUID := 'e2e00000-0000-0000-0000-000000000002';
    v_bid_a_id UUID := 'e2e00000-0000-0000-0000-000000000003';
    v_bid_b_id UUID := 'e2e00000-0000-0000-0000-000000000004';
    v_contract_id UUID := 'e2e00000-0000-0000-0000-000000000005';
    v_m1_id UUID := 'e2e00000-0000-0000-0000-000000000006';
    v_m2_id UUID := 'e2e00000-0000-0000-0000-000000000007';
    v_prog_id UUID := 'e2e00000-0000-0000-0000-000000000008';
    v_claim_id UUID := 'e2e00000-0000-0000-0000-000000000009';
    v_insp_id UUID := 'e2e00000-0000-0000-0000-000000000010';
    v_complaint_id UUID := 'e2e00000-0000-0000-0000-000000000011';
    v_lit_id UUID := 'e2e00000-0000-0000-0000-000000000012';
    v_run_id UUID := 'e2e00000-0000-0000-0000-000000000013';
    v_rec_id UUID := 'e2e00000-0000-0000-0000-000000000014';
BEGIN
    -- 1. Ensure Organizations Exist
    INSERT INTO organizations (id, name, organization_type, status, state, city)
    VALUES
      (v_gov_org_id, 'Maharashtra Public Works Department', 'GOVERNMENT', 'ACTIVE', 'Maharashtra', 'Pune'),
      (v_contractor_a_id, 'Apex Infrastructure Pvt Ltd', 'CONTRACTOR', 'ACTIVE', 'Maharashtra', 'Mumbai'),
      (v_contractor_b_id, 'Bharat Urban Engineering Ltd', 'CONTRACTOR', 'ACTIVE', 'Maharashtra', 'Pune'),
      (v_auditor_org_id, 'State Quality & Audit Directorate', 'AUDITOR', 'ACTIVE', 'Maharashtra', 'Mumbai')
    ON CONFLICT (id) DO UPDATE SET
      status = EXCLUDED.status,
      name = EXCLUDED.name;

    -- 2. Ensure Project Exists
    INSERT INTO projects (
        id, nirikshak_project_id, project_name, description,
        government_organization_id, sector, subsector, state, district, city,
        original_cost_inr_crore, total_cost_inr_crore, approved_cost_inr_crore,
        planned_start_date, original_completion_date,
        physical_progress_percent, financial_progress_percent,
        normalized_status, current_status_verified, priority, public_visibility
    ) VALUES (
        v_project_id, 'NRK-MAH-2026-001', 'Pune Metro Ring Corridor Line 4',
        '32km elevated metro corridor with multi-modal interchange hubs',
        v_gov_org_id, 'Urban Transport', 'Metro Rail', 'Maharashtra', 'Pune', 'Pune',
        1850.00, 1850.00, 1850.00,
        '2025-01-01', '2027-12-31',
        28.50, 24.10,
        'UNDER_CONSTRUCTION', true, 'HIGH', 'PUBLIC'
    ) ON CONFLICT (id) DO UPDATE SET
        physical_progress_percent = EXCLUDED.physical_progress_percent,
        normalized_status = EXCLUDED.normalized_status;

    -- 3. Project Organization Relationship
    INSERT INTO project_organizations (
        project_id, organization_id, relationship_type, status
    ) VALUES 
        (v_project_id, v_gov_org_id, 'OWNER', 'ACTIVE'),
        (v_project_id, v_contractor_a_id, 'CONTRACTOR', 'ACTIVE')
    ON CONFLICT (project_id, organization_id, relationship_type) DO UPDATE SET
        status = EXCLUDED.status;

    -- 4. Tender & Bids
    INSERT INTO tenders (
        id, project_id, tender_number, government_organization_id,
        title, estimated_value_inr_crore, publication_date, bid_due_date, status
    ) VALUES (
        v_tender_id, v_project_id, 'TND-2025-PUNE-001', v_gov_org_id,
        'Civil Construction Package 01 - Viaduct & Stations', 1200.00,
        '2025-01-15', '2025-02-28', 'AWARDED'
    ) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    INSERT INTO tender_bids (
        id, tender_id, contractor_organization_id, bid_reference,
        bid_amount, technical_score, financial_score, combined_score, status
    ) VALUES 
      (v_bid_a_id, v_tender_id, v_contractor_a_id, 'BID-APEX-001', 1180.00, 92.5, 95.0, 93.75, 'SELECTED'),
      (v_bid_b_id, v_tender_id, v_contractor_b_id, 'BID-BHARAT-001', 1240.00, 88.0, 89.0, 88.5, 'REJECTED')
    ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    -- 5. Contract
    INSERT INTO contracts (
        id, contract_number, project_id, tender_id, selected_bid_id,
        government_organization_id, contractor_organization_id, contract_value,
        scheduled_start_date, scheduled_end_date, status
    ) VALUES (
        v_contract_id, 'CNT-2025-PUNE-METRO-01', v_project_id, v_tender_id, v_bid_a_id,
        v_gov_org_id, v_contractor_a_id, 1180.00,
        '2025-03-15', '2027-11-30', 'ACTIVE'
    ) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    -- 6. Milestones
    INSERT INTO project_milestones (
        id, project_id, contract_id, milestone_code, milestone_name,
        sequence_number, weight_percent, planned_start_date, planned_end_date,
        planned_progress_percent, verified_progress_percent, status
    ) VALUES 
      (v_m1_id, v_project_id, v_contract_id, 'MS-01', 'Piling & Substructure Viaduct 0-10km', 1, 30.00, '2025-03-15', '2025-10-31', 100.0, 100.0, 'COMPLETED'),
      (v_m2_id, v_project_id, v_contract_id, 'MS-02', 'Pier Cap Erection & Girder Launching', 2, 40.00, '2025-11-01', '2026-08-31', 60.0, 45.0, 'IN_PROGRESS')
    ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    -- 7. Progress Updates
    INSERT INTO progress_updates (
        id, project_id, milestone_id, contractor_organization_id,
        reported_progress, verified_progress, verification_status,
        description, work_completed, observation_date, submitted_at, reviewed_at
    ) VALUES (
        v_prog_id, v_project_id, v_m2_id, v_contractor_a_id,
        45.00, 45.00, 'APPROVED',
        'Span 24-32 pre-cast box girder launching successfully verified',
        '8 spans erected, 16 bearings seated',
        CURRENT_DATE - INTERVAL '5 days',
        NOW() - INTERVAL '5 days',
        NOW() - INTERVAL '3 days'
    ) ON CONFLICT (id) DO UPDATE SET verification_status = EXCLUDED.verification_status;

    -- 8. Payment Claim & Audit
    INSERT INTO payment_claims (
        id, claim_number, project_id, contract_id, contractor_organization_id,
        milestone_id, claim_type, claimed_amount, verified_amount, approved_amount, status
    ) VALUES (
        v_claim_id, 'CLM-2026-03-01', v_project_id, v_contract_id, v_contractor_a_id,
        v_m2_id, 'RA_BILL', 45.50, 42.80, 42.80, 'APPROVED'
    ) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    -- 9. Inspection & Finding
    INSERT INTO inspections (
        id, project_id, milestone_id, inspection_type, inspection_date, status, summary, overall_result
    ) VALUES (
        v_insp_id, v_project_id, v_m2_id, 'SAFETY', CURRENT_DATE - INTERVAL '10 days',
        'COMPLETED', 'Routine structural integrity and safety barricading inspection', 'SATISFACTORY'
    ) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    INSERT INTO inspection_findings (
        id, inspection_id, finding_type, severity, description, status
    ) VALUES (
        'e2e00000-0000-0000-0000-000000000015', v_insp_id, 'SAFETY_HAZARD', 'MEDIUM',
        'Perimeter reflective barrier missing near Station 4 pier foundation', 'RESOLVED'
    ) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    -- 10. Complaint
    INSERT INTO complaints (
        id, complaint_number, project_id, category, severity,
        title, description, status
    ) VALUES (
        v_complaint_id, 'CMP-2026-PUNE-009', v_project_id, 'TRAFFIC_CONGESTION', 'MEDIUM',
        'Diversion road narrow near interchange', 'Traffic jam during peak office hours due to road narrowing', 'RESOLVED'
    ) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    -- 11. Litigation
    INSERT INTO litigations (
        id, project_id, case_number, case_title, court_or_forum, litigation_type,
        status, government_organization_id, summary
    ) VALUES (
        v_lit_id, v_project_id, 'WP-4120/2025', 'Green Citizens Forum vs State of Maharashtra',
        'Bombay High Court', 'ENVIRONMENTAL', 'OPEN', v_gov_org_id,
        'PIL regarding compensatory afforestation compliance for metro depot parcel'
    ) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    -- 12. AI Analysis Run & Action
    INSERT INTO ai_analysis_runs (
        id, analysis_id, project_id, service_version, llm_model, status
    ) VALUES (
        v_run_id, v_run_id, v_project_id, '2.0.0', 'nvidia/nemotron-3-super-120b-instruct', 'COMPLETED'
    ) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

    INSERT INTO ai_recommended_actions (
        id, analysis_run_id, project_id, action_code, rank, policy_score,
        explanation, status
    ) VALUES (
        v_rec_id, v_run_id, v_project_id, 'EXPEDITE_INSPECTION', 1, 0.88,
        'Pre-monsoon girder launch schedule tight; expedite technical safety clearance', 'PROPOSED'
    ) ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status;

END $$;
