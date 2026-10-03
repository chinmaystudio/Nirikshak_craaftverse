-- Pune Core Projects & Ecosystem Seed
-- 1. Ensure Organizations
INSERT INTO public.organizations (id, name, type, department, state, district, verified) VALUES
('11111111-1111-1111-1111-111111111111', 'Pune Municipal Corporation (PMC)', 'ULB', 'Urban Development', 'Maharashtra', 'Pune', TRUE),
('22222222-2222-2222-2222-222222222222', 'Maharashtra Metro Rail Corporation Limited (Maha Metro)', 'government', 'Metro Rail', 'Maharashtra', 'Pune', TRUE),
('33333333-3333-3333-3333-333333333333', 'Pune Metropolitan Region Development Authority (PMRDA)', 'authority', 'Regional Planning', 'Maharashtra', 'Pune', TRUE),
('44444444-4444-4444-4444-444444444444', 'Maharashtra State Road Development Corporation (MSRDC)', 'authority', 'Highways & Expressways', 'Maharashtra', 'Mumbai/Pune', TRUE),
('55555555-5555-5555-5555-555555555555', 'Tata Projects Limited', 'contractor', 'Infrastructure Engineering', 'Maharashtra', 'Pune', TRUE),
('66666666-6666-6666-6666-666666666666', 'Larsen & Toubro Infrastructure (L&T)', 'contractor', 'Heavy Civil Infrastructure', 'Maharashtra', 'Pune', TRUE),
('77777777-7777-7777-7777-777777777777', 'J Kumar Infraprojects Limited', 'contractor', 'Metro & Flyovers', 'Maharashtra', 'Pune', TRUE)
ON CONFLICT (name) DO UPDATE SET verified = TRUE;

-- 2. Insert Pune Core Projects
INSERT INTO public.projects (
    id, nirikshak_project_id, project_name, description, sector, subsector,
    project_authority, state, city, location_text, reported_status, normalized_status,
    total_cost_inr_crore, physical_progress_percent, financial_progress_percent,
    current_status_verified, quality_score, is_public
) VALUES
('b1000000-0000-0000-0000-000000000001', 'NIR-PUNE-1C6ACEADF93FFB1A', 'Pune Metro Line 3 — Maan-Hinjawadi to Shivajinagar', '23.3 km elevated metro line connecting IT hub Hinjawadi to Shivajinagar with 23 stations. Implemented via PPP mode.', 'Transport', 'Urban metro rail', 'Pune Metropolitan Region Development Authority (PMRDA)', 'Maharashtra', 'Pune', 'Hinjawadi-Shivajinagar Corridor', 'Under construction; physical progress 94.58% reported for early 2026', 'UNDER_CONSTRUCTION', 8313, 94.58, 88.5, TRUE, 96.5, TRUE),
('b1000000-0000-0000-0000-000000000002', 'NIR-PUNE-B015C41DB7149E9E', 'Pune Metro Phase I — PCMC-Swargate and Vanaz-Ramwadi', '31.25 km dual-corridor metro system connecting North-South and East-West Pune, including 5 km underground section from Agriculture College to Swargate.', 'Transport', 'Urban metro rail', 'Maharashtra Metro Rail Corporation Limited (Maha Metro)', 'Maharashtra', 'Pune', 'Pune & PCMC Municipal Areas', 'Core Phase-I corridors operational; underground civil works complete', 'COMPLETED', 11420, 100.0, 98.2, TRUE, 98.0, TRUE),
('b1000000-0000-0000-0000-000000000003', 'NIR-PUNE-65D552F521ADB949', 'Pune Metro Line 1A Extension — PCMC to Nigdi (Bhakti Shakti)', '4.41 km elevated extension of North-South corridor from PCMC to Nigdi Bhakti Shakti Chowk.', 'Transport', 'Urban metro rail', 'Maharashtra Metro Rail Corporation Limited (Maha Metro)', 'Maharashtra', 'Pune', 'Pimpri-Chinchwad corridor', 'Under construction', 'UNDER_CONSTRUCTION', 910.18, 48.0, 42.0, TRUE, 94.0, TRUE),
('b1000000-0000-0000-0000-000000000004', 'NIR-PUNE-D292712EECA3204A', 'Mumbai-Pune Expressway (Yashwantrao Chavan Expressway)', 'India first 6-lane access-controlled toll expressway spanning 94.5 km.', 'Transport', 'Expressways', 'Maharashtra State Road Development Corporation (MSRDC)', 'Maharashtra', 'Pune', 'Mumbai-Pune corridor', 'Fully opened to traffic', 'COMPLETED', 2136, 100.0, 100.0, TRUE, 99.0, TRUE),
('b1000000-0000-0000-0000-000000000005', 'NIR-PUNE-3C842EE8214DBC84', 'Pune Ring Road — Eastern & Western Corridors', '128 km access-controlled 8-lane expressway encircling Pune and Pimpri-Chinchwad to decongest city traffic.', 'Transport', 'Expressways', 'Maharashtra State Road Development Corporation (MSRDC)', 'Maharashtra', 'Pune', 'Pune Metropolitan Outer Ring', 'Land acquisition and advance engineering', 'UNDER_CONSTRUCTION', 26831, 24.5, 20.0, TRUE, 92.0, TRUE),
('b1000000-0000-0000-0000-000000000006', 'NIR-PUNE-5E9110ABC7482D11', 'Mula-Mutha River Rejuvenation and Pollution Abatement Project', 'JICA funded environmental rejuvenation project constructing 11 new STPs with 396 MLD capacity and 113 km sewer lines.', 'Water Sanitation', 'Sewage treatment plants', 'Pune Municipal Corporation (PMC)', 'Maharashtra', 'Pune', 'Mula-Mutha River Basin, Pune', 'Under construction; STPs under advanced civil works', 'UNDER_CONSTRUCTION', 1450, 68.4, 61.2, TRUE, 95.0, TRUE),
('b1000000-0000-0000-0000-000000000007', 'NIR-PUNE-8F4219EBA174C302', 'Pune 24x7 Equitably Distributed Water Supply Project', 'Installation of 3.18 lakh smart water meters, 1200 km distribution pipeline, and 85 ESR water reservoirs across Pune city.', 'Water Sanitation', 'Water distribution', 'Pune Municipal Corporation (PMC)', 'Maharashtra', 'Pune', 'All 5 municipal zones, Pune', 'Under construction', 'UNDER_CONSTRUCTION', 2550, 82.0, 78.5, TRUE, 94.0, TRUE),
('b1000000-0000-0000-0000-000000000008', 'NIR-PUNE-7A19842BDC0912EA', 'Pune International Airport New Integrated Terminal Building', '51,595 sq m state-of-the-art terminal building handling 16 million passengers annually with 10 aerobridges and 34 check-in counters.', 'Transport', 'Airports', 'Airports Authority of India (AAI)', 'Maharashtra', 'Pune', 'Lohegaon, Pune', 'Operational', 'COMPLETED', 475, 100.0, 100.0, TRUE, 97.0, TRUE)
ON CONFLICT (nirikshak_project_id) DO UPDATE SET
  project_name = EXCLUDED.project_name,
  description = EXCLUDED.description,
  sector = EXCLUDED.sector,
  total_cost_inr_crore = EXCLUDED.total_cost_inr_crore,
  physical_progress_percent = EXCLUDED.physical_progress_percent,
  normalized_status = EXCLUDED.normalized_status,
  current_status_verified = TRUE;

-- 3. Project Organizations Linkage
INSERT INTO public.project_organizations (project_id, organization_id, relationship) VALUES
('b1000000-0000-0000-0000-000000000001', '33333333-3333-3333-3333-333333333333', 'owner'),
('b1000000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', 'contractor'),
('b1000000-0000-0000-0000-000000000002', '22222222-2222-2222-2222-222222222222', 'owner'),
('b1000000-0000-0000-0000-000000000002', '66666666-6666-6666-6666-666666666666', 'contractor'),
('b1000000-0000-0000-0000-000000000005', '44444444-4444-4444-4444-444444444444', 'owner'),
('b1000000-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 'contractor'),
('b1000000-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'owner'),
('b1000000-0000-0000-0000-000000000006', '77777777-7777-7777-7777-777777777777', 'contractor')
ON CONFLICT DO NOTHING;

-- 4. Contracts linking Contractor Portal
INSERT INTO public.contracts (
    id, project_id, contractor_organization_id, official_contract_id, contract_number,
    contract_title, contract_value, scheduled_start_date, scheduled_completion_date, status
) VALUES
('c1000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', '55555555-5555-5555-5555-555555555555', 'PMRDA/METRO3/PKG-01', 'CNT-PMRDA-2019-08', 'Design, Civil Viaduct and Station Construction - Hinjawadi to Balewadi', 2450.00, '2020-01-15', '2026-06-30', 'ACTIVE'),
('c1000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000005', '55555555-5555-5555-5555-555555555555', 'MSRDC/RING/PKG-WEST-3', 'CNT-MSRDC-2023-14', 'Western Ring Road Package 3 - Tunneling and Viaduct Works', 3210.00, '2023-11-01', '2027-12-31', 'ACTIVE'),
('c1000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000006', '77777777-7777-7777-7777-777777777777', 'PMC/JICA/STP-04', 'CNT-PMC-2022-09', 'Construction of 127 MLD STP at Mundhwa and Outfall Sewer', 420.50, '2022-08-10', '2026-09-30', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 5. Milestones
INSERT INTO public.project_milestones (
    id, project_id, milestone_name, description, milestone_type, planned_start_date,
    planned_end_date, planned_progress, verified_progress, planned_cost, actual_cost, status, display_order
) VALUES
('fa000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'Civil Viaduct & Pier Caps', 'Completion of 850 piers, pier caps, and segment launching from Hinjawadi Ph 3 to Balewadi Stadium', 'Civil', '2020-01-15', '2024-06-30', 100.0, 100.0, 950.0, 965.0, 'COMPLETED', 1),
('fa000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'Track Laying & Third Rail Power System', 'Continuous welded rail installation and 750V DC third rail power integration', 'Electrification', '2023-01-01', '2025-08-31', 100.0, 96.0, 520.0, 510.0, 'IN_PROGRESS', 2),
('fa000000-0000-0000-0000-000000000003', 'b1000000-0000-0000-0000-000000000001', 'Station Finishing & Signalling (CBTC)', 'Station architectural façade, MEP works, escalators, and Alstom Urbalis CBTC signalling integration', 'Systems', '2024-03-01', '2026-05-15', 90.0, 87.5, 680.0, 640.0, 'IN_PROGRESS', 3),
('fa000000-0000-0000-0000-000000000004', 'b1000000-0000-0000-0000-000000000001', 'CMRS Safety Inspection & Trial Runs', 'Commissioner of Metro Railway Safety statutory inspection and trial runs under full payload', 'Statutory', '2026-04-01', '2026-06-30', 50.0, 30.0, 50.0, 15.0, 'PENDING', 4),
('fa000000-0000-0000-0000-000000000005', 'b1000000-0000-0000-0000-000000000006', 'Civil Excavation & Aeration Basin Construction', '127 MLD STP civil tanks, sequential batch reactor basins, and sludge drying beds', 'Civil', '2022-09-01', '2024-12-31', 100.0, 100.0, 180.0, 185.0, 'COMPLETED', 1),
('fa000000-0000-0000-0000-000000000006', 'b1000000-0000-0000-0000-000000000006', 'Electromechanical Equipment Installation & Pipeline Interception', 'Pumping machinery, diffuse aeration blowers, and trunk sewer interception at Bund Garden', 'ElectroMechanical', '2024-06-01', '2026-04-30', 80.0, 65.0, 150.0, 120.0, 'IN_PROGRESS', 2)
ON CONFLICT (id) DO NOTHING;

-- 6. Progress Updates (Contractor Submitted -> Awaiting Gov Review)
INSERT INTO public.progress_updates (
    id, project_id, milestone_id, contractor_organization_id, reported_progress,
    description, verification_status, verified_progress, review_notes
) VALUES
('fb000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000003', '55555555-5555-5555-5555-555555555555', 92.0, 'Completed interior false ceilings and platform screen gates testing at Hinjawadi Phase 2 and Infosys Phase 1 stations. Signaling rack cabling complete.', 'SUBMITTED', NULL, NULL),
('fb000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000001', 'fa000000-0000-0000-0000-000000000002', '55555555-5555-5555-5555-555555555555', 96.0, 'Third rail energized for 18.5 km stretch from Maan Depot to Balewadi. Train set #4 successfully moved during low-speed shunting.', 'APPROVED', 96.0, 'Verified by PMRDA Superintending Engineer. Traction power sub-station tests passed.')
ON CONFLICT (id) DO NOTHING;

-- 7. Citizen Complaints
INSERT INTO public.complaints (
    id, reference_number, project_id, category, title, description,
    severity, status, assigned_organization_id
) VALUES
('fc000000-0000-0000-0000-000000000001', 'NIR-PUNE-CMP-2026-001', 'b1000000-0000-0000-0000-000000000001', 'Traffic & Road Restoration', 'Severe pothole crater near Hinjawadi Shivaji Chowk metro barricades', 'Barricades near Hinjawadi Phase 1 entry have blocked natural drainage causing deep craters. Commuters facing 45 min traffic bottlenecks during evening rush.', 'HIGH', 'IN_PROGRESS', '33333333-3333-3333-3333-333333333333'),
('fc000000-0000-0000-0000-000000000002', 'NIR-PUNE-CMP-2026-002', 'b1000000-0000-0000-0000-000000000006', 'Environmental Concern', 'Untreated sewage overflow into river near Bund Garden construction zone', 'Temporary bypass pipe leaking black foul-smelling effluent directly into Mula-Mutha river bed during evening flow peaks.', 'CRITICAL', 'SUBMITTED', '11111111-1111-1111-1111-111111111111'),
('fc000000-0000-0000-0000-000000000003', 'NIR-PUNE-CMP-2026-003', 'b1000000-0000-0000-0000-000000000007', 'Utility Damage', 'Water main pipeline puncture during trenching in Kothrud Dahanukar Colony', '24x7 water supply pipeline contractor ruptured the municipal distribution line. Clean water flooding 200m road section for 4 hours.', 'MEDIUM', 'RESOLVED', '11111111-1111-1111-1111-111111111111')
ON CONFLICT (reference_number) DO NOTHING;

-- 8. Tenders & Bids
INSERT INTO public.tenders (
    id, project_id, official_tender_id, tender_number, title, issuing_organization_id,
    estimated_value_inr_crore, publication_date, bid_due_date, status, is_public
) VALUES
('fd000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'PMRDA/TND/2026/04', 'TND-PMRDA-M3-004', 'Multi-Modal Integration and Last-Mile Feeder Hubs at 10 Metro Stations', '33333333-3333-3333-3333-333333333333', 145.00, '2026-02-01', '2026-04-15', 'PUBLISHED', TRUE),
('fd000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000005', 'MSRDC/TND/2026/09', 'TND-MSRDC-RR-009', 'Construction of Major Bridge over Indrayani River on Western Ring Road', '44444444-4444-4444-4444-444444444444', 380.00, '2026-01-10', '2026-03-31', 'UNDER_EVALUATION', TRUE)
ON CONFLICT (id) DO NOTHING;

-- 9. Environmental Baselines & Commitments
INSERT INTO public.environmental_baselines (project_id, metric, value, unit, source) VALUES
('b1000000-0000-0000-0000-000000000001', 'PM2.5', 68.5, 'µg/m³', 'PMRDA Environmental Monitoring Station Hinjawadi'),
('b1000000-0000-0000-0000-000000000001', 'Noise Level', 74.2, 'dBA', 'Baseline EIA Study Shivajinagar Junction'),
('b1000000-0000-0000-0000-000000000006', 'River BOD', 48.0, 'mg/L', 'CPCB River Quality Monitoring Bund Garden');

INSERT INTO public.environmental_commitments (project_id, category, commitment, expected_value, actual_value, unit, status) VALUES
('b1000000-0000-0000-0000-000000000001', 'Compensatory Afforestation', 'Transplantation and compensatory plantation of native trees along Hinjawadi-Balewadi corridor', 4500, 4820, 'trees', 'COMPLETED'),
('b1000000-0000-0000-0000-000000000001', 'Noise Barriers', 'Acoustic noise barriers installation along residential educational stretches (Balewadi High St)', 12.5, 9.8, 'km', 'IN_PROGRESS'),
('b1000000-0000-0000-0000-000000000006', 'River Water Quality', 'Treated sewage effluent BOD reduction to discharge quality standards', 10.0, 14.5, 'mg/L', 'IN_PROGRESS');

-- 10. AI Insights
INSERT INTO public.ai_insights (
    id, project_id, insight_type, title, summary, severity, confidence,
    evidence, recommended_actions, status
) VALUES
('fe000000-0000-0000-0000-000000000001', 'b1000000-0000-0000-0000-000000000001', 'schedule_risk', 'Signalling Integration Bottleneck at Shivajinagar Junction', 'AI detected a 42-day milestone variance between civil readiness at Shivajinagar interchange and CBTC telecommunication rack handover. High probability of commercial launch slip by 30 days if not expedited.', 'HIGH', 0.91, '["CBTC supplier schedule update dated 15-Feb-2026 indicates delayed delivery of fallback train protection relays", "Civil handover of Shivajinagar concourse level delayed by 21 days due to multi-utility diversion"]'::jsonb, '["Conduct tri-partite technical review between PMRDA, Alstom, and Tata Projects", "Authorize 24x7 electrical rack fitment shift at Shivajinagar Station", "Isolate testing to Hinjawadi-Balewadi section for provisional commercial operation certificate"]'::jsonb, 'ACTIVE'),
('fe000000-0000-0000-0000-000000000002', 'b1000000-0000-0000-0000-000000000006', 'complaint_cluster', 'Environmental Grievance Spike at Mundhwa & Bund Garden', 'Three citizen complaints and two local NGO alerts registered within 72 hours regarding untreated bypass discharge during high rainfall events.', 'HIGH', 0.88, '["Complaint NIR-PUNE-CMP-2026-002 flagged CRITICAL severity", "Turbidity sensor downstream showed 240% increase on 18-Feb"]'::jsonb, '["Dispatch municipal environmental inspection team within 24 hours", "Direct contractor J Kumar to deploy mobile slurry pump diversion", "Issue formal show-cause compliance letter to site safety engineer"]'::jsonb, 'ACTIVE');
