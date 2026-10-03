import { supabaseAdmin, supabasePublic, createAuthenticatedClient } from '../../core/database/supabase.js';
import { CreateProjectInput, ListProjectsQuery } from './projects.validation.js';
import { ProjectListResult } from './projects.types.js';
import { NotFoundError, ValidationError } from '../../core/http/errors.js';
import { UserContext } from '../../core/auth/userContext.js';

export class ProjectsService {
  async listPublic(query: ListProjectsQuery): Promise<ProjectListResult> {
    let q = supabasePublic
      .from('projects')
      .select(
        'id, nirikshak_project_id, project_name, description, sector, subsector, project_authority, state, city, location_text, total_cost_inr_crore, planned_start_date, original_completion_date, normalized_status, physical_progress_percent, current_status_verified, is_public',
        { count: 'exact' }
      )
      .eq('is_public', true)
      .is('deleted_at', null)
      .range(query.offset, query.offset + query.limit - 1)
      .order('total_cost_inr_crore', { ascending: false, nullsFirst: false });

    if (query.city) q = q.eq('city', query.city);
    if (query.sector) q = q.eq('sector', query.sector);
    if (query.status) q = q.eq('normalized_status', query.status);

    const { data, count, error } = await q;
    if (error) {
      throw new ValidationError(`Failed to retrieve project list: ${error.message}`);
    }

    return {
      projects: data || [],
      total: count || 0,
      limit: query.limit,
      offset: query.offset,
    };
  }

  async getProject(id: string, token?: string): Promise<any> {
    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
    let userClient = null;
    let isPrivilegedGov = false;

    if (token) {
      try {
        const { data: authData } = await supabaseAdmin.auth.getUser(token);
        if (authData?.user) {
          userClient = await createAuthenticatedClient(token);
          const { data: member } = await supabaseAdmin
            .from('organization_members')
            .select('role')
            .eq('user_id', authData.user.id)
            .ilike('status', 'active')
            .limit(1)
            .maybeSingle();

          if (member && ['government_admin', 'chief_engineer', 'project_officer', 'government_engineer', 'auditor'].includes(member.role)) {
            isPrivilegedGov = true;
          }
        }
      } catch {
        /* proceed as public viewer */
      }
    }

    if (isPrivilegedGov && userClient) {
      let query = userClient.from('projects').select('*, project_milestones(*), contracts(*), complaints(*)');
      query = isUuid ? query.eq('id', id) : query.eq('nirikshak_project_id', id);
      const { data, error } = await query.single();
      if (error || !data) {
        throw new NotFoundError('Project not found');
      }
      return data;
    }

    // Public / Citizen projection (zero private contracts or unverified progress)
    let query = supabasePublic
      .from('projects')
      .select('id, nirikshak_project_id, project_name, description, sector, subsector, project_authority, state, city, location_text, latitude, longitude, total_cost_inr_crore, planned_start_date, original_completion_date, normalized_status, physical_progress_percent, current_status_verified, is_public, project_milestones(id, milestone_name, sequence_order, target_completion_date, verified_progress, status)')
      .eq('is_public', true)
      .is('deleted_at', null);

    query = isUuid ? query.eq('id', id) : query.eq('nirikshak_project_id', id);

    const { data, error } = await query.single();
    if (error || !data) {
      throw new NotFoundError('Project not found');
    }
    return data;
  }

  async createProject(input: CreateProjectInput, userContext: UserContext, token: string): Promise<any> {
    const scopedClient = await createAuthenticatedClient(token);
    const projectPayload = {
      ...input,
      government_organization_id: userContext.organizationId,
      created_by: userContext.userId,
    };

    const { data, error } = await scopedClient
      .from('projects')
      .insert(projectPayload)
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Project creation failed: ${error?.message}`);
    }

    // Record audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: userContext.userId,
      actor_organization_id: userContext.organizationId,
      action: 'PROJECT_CREATE',
      entity_type: 'projects',
      entity_id: data.id,
      new_value: {
        project_name: data.project_name,
        government_org_id: userContext.organizationId,
        cost: data.total_cost_inr_crore,
      },
    });

    return data;
  }
}

export const projectsService = new ProjectsService();
