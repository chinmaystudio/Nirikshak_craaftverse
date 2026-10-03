import { supabaseAdmin, createAuthenticatedClient } from '../../core/database/supabase.js';
import { CreateMilestoneInput, UpdateMilestoneInput, MilestoneRecord } from './milestones.types.js';
import { UserContext } from '../../core/auth/userContext.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../../core/http/errors.js';

export class MilestonesService {
  async createMilestone(
    input: CreateMilestoneInput,
    userContext: UserContext,
    token: string
  ): Promise<MilestoneRecord> {
    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
      'government_engineer',
    ].includes(userContext.role);

    if (!isGovernment) {
      throw new AuthorizationError('Only authorized Government officers can define project milestones.');
    }

    // Verify project authority
    const { data: project } = await supabaseAdmin
      .from('projects')
      .select('id, government_organization_id')
      .eq('id', input.project_id)
      .single();

    if (!project) {
      throw new NotFoundError('Project not found.');
    }

    if (userContext.role !== 'government_admin' && project.government_organization_id !== userContext.organizationId) {
      throw new AuthorizationError('Project belongs to a different Government organization.');
    }

    // Validate milestone weights
    const { data: existingMilestones } = await supabaseAdmin
      .from('project_milestones')
      .select('weight_percentage')
      .eq('project_id', input.project_id);

    const currentTotalWeight = (existingMilestones || []).reduce(
      (sum, m) => sum + (Number(m.weight_percentage) || 0),
      0
    );

    if (currentTotalWeight + input.weight_percentage > 100.0) {
      throw new ValidationError(
        `Total milestone weight cannot exceed 100%. Current sum is ${currentTotalWeight}%, adding ${input.weight_percentage}% would total ${currentTotalWeight + input.weight_percentage}%.`
      );
    }

    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('project_milestones')
      .insert({
        project_id: input.project_id,
        milestone_code: input.milestone_code,
        title: input.title,
        description: input.description || null,
        sequence_number: input.sequence_number,
        weight_percentage: input.weight_percentage,
        planned_start_date: input.planned_start_date || null,
        planned_completion_date: input.planned_completion_date,
        payment_percentage: input.payment_percentage || null,
        status: 'PENDING',
      })
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to create milestone: ${error?.message}`);
    }

    return data as MilestoneRecord;
  }

  async updateMilestone(
    milestoneId: string,
    input: UpdateMilestoneInput,
    userContext: UserContext,
    token: string
  ): Promise<MilestoneRecord> {
    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
      'government_engineer',
    ].includes(userContext.role);

    if (!isGovernment) {
      throw new AuthorizationError('Only authorized Government officers can update milestones.');
    }

    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('project_milestones')
      .update(input)
      .eq('id', milestoneId)
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to update milestone: ${error?.message}`);
    }

    return data as MilestoneRecord;
  }

  async listProjectMilestones(
    projectId: string,
    userContext: UserContext,
    token: string
  ): Promise<MilestoneRecord[]> {
    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('project_milestones')
      .select('*')
      .eq('project_id', projectId)
      .order('sequence_number', { ascending: true });

    if (error) {
      throw new ValidationError(`Failed to fetch milestones: ${error.message}`);
    }

    return (data || []) as MilestoneRecord[];
  }
}

export const milestonesService = new MilestonesService();
