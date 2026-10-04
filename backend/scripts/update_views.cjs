const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'aws-0-ap-southeast-2.pooler.supabase.com',
    port: 6543,
    user: 'postgres.ylyvhytlvwqebkyawdnq',
    password: 'chinmay8329016584@@',
    database: 'postgres',
    ssl: { rejectUnauthorized: false }
  });

  await client.connect();

  await client.query(`
    CREATE OR REPLACE VIEW public.government_project_summary_view AS
    SELECT
      p.id, p.nirikshak_project_id, p.official_project_id, p.project_name,
      p.description, p.sector, p.subsector, p.project_type, p.ministry,
      p.department, p.project_authority, p.implementing_agency,
      p.executing_agency, p.contractor_concessionaire, p.operator,
      p.ownership_type, p.procurement_mode, p.award_date, p.planned_start_date,
      p.actual_start_date, p.original_completion_date, p.revised_completion_date,
      p.actual_completion_date, p.state, p.district, p.city, p.location_text,
      p.latitude, p.longitude, p.total_cost_inr_crore, p.original_cost_inr_crore,
      p.revised_cost_inr_crore, p.amount_spent_inr_crore,
      p.physical_progress_percent, p.financial_progress_percent,
      p.reported_status, p.normalized_status, p.record_scope,
      p.current_status_verified, p.quality_score, p.duplicate_review,
      p.source_record_id, p.primary_source_url, p.is_public, p.public_summary,
      p.published_at, p.published_by, p.version, p.government_organization_id,
      p.created_by, p.created_at, p.updated_at, p.deleted_at,
      (SELECT count(*) FROM public.complaints c
        WHERE c.project_id = p.id AND c.status NOT IN ('RESOLVED', 'CLOSED')) AS open_complaints_count,
      (SELECT count(*) FROM public.progress_updates pu
        WHERE pu.project_id = p.id AND pu.verification_status = 'SUBMITTED') AS pending_progress_updates_count,
      (SELECT count(*) FROM public.inspections i
        WHERE i.project_id = p.id AND i.status = 'SCHEDULED') AS pending_inspections_count,
      (SELECT count(*) FROM public.ai_insights ai
        WHERE ai.project_id = p.id AND ai.severity = 'HIGH' AND ai.status = 'ACTIVE') AS high_risk_ai_count
    FROM public.projects p
    WHERE p.deleted_at IS NULL
      AND (
        public.get_user_organization_id() IS NULL
        OR p.government_organization_id = public.get_user_organization_id()
      );

    DROP VIEW IF EXISTS public.contractor_assigned_projects_view CASCADE;

    CREATE OR REPLACE VIEW public.contractor_assigned_projects_view AS
    SELECT p.id,
      p.nirikshak_project_id,
      p.project_name,
      p.sector,
      p.subsector,
      p.project_authority,
      p.location_text,
      p.state,
      p.district,
      p.total_cost_inr_crore,
      p.normalized_status,
      p.physical_progress_percent,
      p.current_status_verified,
      c.id AS contract_id,
      c.contract_number,
      c.contract_value,
      c.scheduled_start_date,
      c.scheduled_end_date,
      c.scheduled_end_date AS scheduled_completion_date,
      c.status AS contract_status,
      c.contractor_organization_id,
      ( SELECT pu.reported_progress
             FROM public.progress_updates pu
            WHERE pu.project_id = p.id AND pu.contractor_organization_id = c.contractor_organization_id
            ORDER BY pu.submitted_at DESC
           LIMIT 1) AS my_latest_reported_progress,
      ( SELECT count(*) AS count
             FROM public.payment_claims pc
            WHERE pc.project_id = p.id AND pc.contractor_organization_id = c.contractor_organization_id AND pc.status = 'APPROVED'::text) AS approved_claims_count
    FROM public.projects p
      JOIN public.contracts c ON c.project_id = p.id
    WHERE p.deleted_at IS NULL
      AND (
        public.get_user_organization_id() IS NULL
        OR c.contractor_organization_id = public.get_user_organization_id()
      );

    GRANT SELECT ON public.government_project_summary_view TO authenticated, anon;
    GRANT SELECT ON public.contractor_assigned_projects_view TO authenticated, anon;
    GRANT SELECT ON public.public_projects_view TO authenticated, anon;
  `);

  const count = await client.query('SELECT count(*) FROM public.government_project_summary_view;');
  console.log('Updated government_project_summary_view count:', count.rows[0].count);

  const cCount = await client.query('SELECT count(*) FROM public.contractor_assigned_projects_view;');
  console.log('Updated contractor_assigned_projects_view count:', cCount.rows[0].count);

  await client.end();
}

main().catch(console.error);
