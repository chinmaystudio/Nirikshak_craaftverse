-- 018_indexes.sql
CREATE INDEX IF NOT EXISTS idx_projects_nirikshak_id ON public.projects(nirikshak_project_id);
CREATE INDEX IF NOT EXISTS idx_projects_normalized_status ON public.projects(normalized_status);
CREATE INDEX IF NOT EXISTS idx_projects_state ON public.projects(state);
CREATE INDEX IF NOT EXISTS idx_projects_district ON public.projects(district);
CREATE INDEX IF NOT EXISTS idx_projects_city ON public.projects(city);
CREATE INDEX IF NOT EXISTS idx_projects_sector ON public.projects(sector);
CREATE INDEX IF NOT EXISTS idx_projects_authority ON public.projects(project_authority);
CREATE INDEX IF NOT EXISTS idx_projects_contractor ON public.projects(contractor_concessionaire);
CREATE INDEX IF NOT EXISTS idx_projects_award_date ON public.projects(award_date);
CREATE INDEX IF NOT EXISTS idx_projects_is_public ON public.projects(is_public);

CREATE INDEX IF NOT EXISTS idx_project_updates_project_id ON public.project_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_project_id ON public.progress_updates(project_id);
CREATE INDEX IF NOT EXISTS idx_progress_updates_milestone_id ON public.progress_updates(milestone_id);
CREATE INDEX IF NOT EXISTS idx_complaints_project_id ON public.complaints(project_id);
CREATE INDEX IF NOT EXISTS idx_complaints_ref_number ON public.complaints(reference_number);
CREATE INDEX IF NOT EXISTS idx_complaints_status ON public.complaints(status);
CREATE INDEX IF NOT EXISTS idx_contracts_project_id ON public.contracts(project_id);
CREATE INDEX IF NOT EXISTS idx_contracts_org_id ON public.contracts(contractor_organization_id);
CREATE INDEX IF NOT EXISTS idx_tenders_project_id ON public.tenders(project_id);
CREATE INDEX IF NOT EXISTS idx_source_observations_project_id ON public.source_observations(project_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_id ON public.audit_logs(entity_id);
CREATE INDEX IF NOT EXISTS idx_project_milestones_project_id ON public.project_milestones(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_project_id ON public.ai_insights(project_id);
