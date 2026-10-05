-- ==============================================================================
-- NIRIKSHAK DATABASE V2: 041_views_v2.sql
-- Domain: Public Transparency, Government Dashboard, Contractor Portal & Summary Views
-- ==============================================================================

-- 1. Refresh public_projects_view (Strictly Sanitized Public Data)
DROP VIEW IF EXISTS public.public_projects_view;
CREATE OR REPLACE VIEW public.public_projects_view WITH (security_invoker = true) AS
SELECT 
  p.id,
  p.nirikshak_project_id,
  p.project_name,
  p.description,
  p.sector,
  p.subsector,
  p.project_authority,
  p.state,
  p.district,
  p.city,
  p.location_text,
  p.latitude,
  p.longitude,
  p.total_cost_inr_crore,
  p.approved_cost_inr_crore,
  p.planned_start_date,
  p.original_completion_date,
  p.revised_completion_date,
  p.actual_completion_date,
  p.normalized_status,
  p.physical_progress_percent,
  p.financial_progress_percent,
  p.current_status_verified,
  c.contract_number,
  org.name AS contractor_name,
  (
    SELECT count(*) 
    FROM public.complaints comp 
    WHERE comp.project_id = p.id AND comp.status = 'RESOLVED'
  ) AS resolved_complaints_count,
  p.created_at,
  p.updated_at
FROM public.projects p
LEFT JOIN public.contracts c ON c.project_id = p.id AND c.status IN ('ACTIVE', 'COMPLETED')
LEFT JOIN public.organizations org ON c.contractor_organization_id = org.id
WHERE p.public_visibility = true AND p.deleted_at IS NULL;

-- 2. Create project_progress_summary_view
CREATE OR REPLACE VIEW public.project_progress_summary_view WITH (security_invoker = true) AS
SELECT
  p.id AS project_id,
  p.nirikshak_project_id,
  p.project_name,
  p.physical_progress_percent AS verified_physical_progress_percent,
  (
    SELECT pu.reported_progress 
    FROM public.progress_updates pu 
    WHERE pu.project_id = p.id 
    ORDER BY pu.submitted_at DESC 
    LIMIT 1
  ) AS latest_reported_progress_percent,
  (
    SELECT count(*) 
    FROM public.progress_updates pu 
    WHERE pu.project_id = p.id AND pu.verification_status IN ('SUBMITTED', 'UNDER_REVIEW')
  ) AS pending_reviews_count,
  (
    SELECT max(pu.submitted_at) 
    FROM public.progress_updates pu 
    WHERE pu.project_id = p.id
  ) AS last_progress_update_at,
  COALESCE(
    (SELECT sum(de.delay_days) FROM public.delay_events de WHERE de.project_id = p.id AND de.status = 'OPEN'),
    0
  ) AS active_delay_days
FROM public.projects p
WHERE p.deleted_at IS NULL;

-- 3. Create project_finance_summary_view
CREATE OR REPLACE VIEW public.project_finance_summary_view WITH (security_invoker = true) AS
SELECT
  p.id AS project_id,
  p.nirikshak_project_id,
  COALESCE(p.approved_cost_inr_crore, p.total_cost_inr_crore, 0) AS sanctioned_amount_inr_crore,
  COALESCE(
    (SELECT fu.expenditure_inr_crore FROM public.financial_updates fu WHERE fu.project_id = p.id ORDER BY fu.observation_date DESC LIMIT 1),
    0
  ) AS spent_inr_crore,
  COALESCE(
    (SELECT sum(pc.claimed_amount) FROM public.payment_claims pc WHERE pc.project_id = p.id AND pc.status IN ('SUBMITTED', 'UNDER_REVIEW')),
    0
  ) AS pending_claims_inr,
  COALESCE(
    (SELECT sum(pc.approved_amount) FROM public.payment_claims pc WHERE pc.project_id = p.id AND pc.status = 'APPROVED'),
    0
  ) AS approved_claims_inr,
  COALESCE(
    (SELECT sum(pm.amount_paid) FROM public.payments pm WHERE pm.project_id = p.id),
    0
  ) AS total_paid_inr
FROM public.projects p
WHERE p.deleted_at IS NULL;

-- 4. Create tender_catalog_view
CREATE OR REPLACE VIEW public.tender_catalog_view WITH (security_invoker = true) AS
SELECT
  t.id AS tender_id,
  t.tender_number,
  t.title AS tender_title,
  t.description,
  t.estimated_value_inr_crore,
  t.publication_date,
  t.pre_bid_date,
  t.bid_due_date,
  t.technical_opening_date,
  t.financial_opening_date,
  t.eligibility_criteria,
  t.technical_requirements,
  t.status AS tender_status,
  p.id AS project_id,
  p.nirikshak_project_id,
  p.project_name,
  p.sector,
  p.state,
  p.district,
  org.name AS issuing_department_name
FROM public.tenders t
JOIN public.projects p ON t.project_id = p.id
LEFT JOIN public.organizations org ON t.government_organization_id = org.id
WHERE t.deleted_at IS NULL AND t.status IN ('PUBLISHED', 'CLOSED', 'UNDER_EVALUATION', 'AWARDED');

-- 5. Refresh government_project_dashboard_view
CREATE OR REPLACE VIEW public.government_project_dashboard_view WITH (security_invoker = true) AS
SELECT
  p.id AS project_id,
  p.nirikshak_project_id,
  p.project_name,
  p.sector,
  p.normalized_status,
  p.physical_progress_percent,
  p.financial_progress_percent,
  p.government_organization_id,
  c.id AS active_contract_id,
  c.contract_number,
  org.id AS contractor_org_id,
  org.name AS contractor_name,
  (
    SELECT count(*) 
    FROM public.progress_updates pu 
    WHERE pu.project_id = p.id AND pu.verification_status IN ('SUBMITTED', 'UNDER_REVIEW')
  ) AS pending_progress_reviews,
  (
    SELECT count(*) 
    FROM public.inspections ins 
    WHERE ins.project_id = p.id AND ins.status = 'SCHEDULED'
  ) AS pending_inspections,
  (
    SELECT count(*) 
    FROM public.complaints comp 
    WHERE comp.project_id = p.id AND comp.status NOT IN ('RESOLVED', 'CLOSED', 'REJECTED')
  ) AS open_complaints,
  (
    SELECT ai.review_priority_score 
    FROM public.ai_insights ai 
    WHERE ai.project_id = p.id 
    ORDER BY ai.created_at DESC 
    LIMIT 1
  ) AS latest_ai_review_priority_score,
  (
    SELECT ai.review_priority_band 
    FROM public.ai_insights ai 
    WHERE ai.project_id = p.id 
    ORDER BY ai.created_at DESC 
    LIMIT 1
  ) AS latest_ai_review_priority_band
FROM public.projects p
LEFT JOIN public.contracts c ON c.project_id = p.id AND c.status = 'ACTIVE'
LEFT JOIN public.organizations org ON c.contractor_organization_id = org.id
WHERE p.deleted_at IS NULL;

-- 6. Refresh contractor_assigned_projects_view
DROP VIEW IF EXISTS public.contractor_assigned_projects_view;
CREATE OR REPLACE VIEW public.contractor_assigned_projects_view WITH (security_invoker = true) AS
SELECT
  p.id,
  p.nirikshak_project_id,
  p.project_name,
  p.sector,
  p.subsector,
  p.location_text,
  p.state,
  p.district,
  p.normalized_status,
  p.physical_progress_percent,
  p.current_status_verified,
  c.id AS contract_id,
  c.contract_number,
  c.contract_value,
  c.scheduled_start_date,
  c.scheduled_end_date,
  c.status AS contract_status,
  c.contractor_organization_id,
  (
    SELECT pu.reported_progress 
    FROM public.progress_updates pu 
    WHERE pu.project_id = p.id AND pu.contractor_organization_id = c.contractor_organization_id 
    ORDER BY pu.submitted_at DESC 
    LIMIT 1
  ) AS my_latest_reported_progress,
  (
    SELECT count(*) 
    FROM public.payment_claims pc 
    WHERE pc.project_id = p.id AND pc.contractor_organization_id = c.contractor_organization_id AND pc.status = 'APPROVED'
  ) AS approved_claims_count
FROM public.projects p
JOIN public.contracts c ON c.project_id = p.id
WHERE p.deleted_at IS NULL;

GRANT SELECT ON public.public_projects_view TO anon, authenticated;
GRANT SELECT ON public.contractor_assigned_projects_view TO authenticated;
