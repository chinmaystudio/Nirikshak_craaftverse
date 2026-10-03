import { supabaseAdmin, createAuthenticatedClient } from '../../core/database/supabase.js';
import {
  ScheduleInspectionInput,
  CompleteInspectionInput,
  CreateFindingInput,
  ResolveFindingInput,
  InspectionRecord,
  InspectionFindingRecord,
} from './inspections.types.js';
import { UserContext } from '../../core/auth/userContext.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../../core/http/errors.js';

export class InspectionsService {
  async scheduleInspection(
    input: ScheduleInspectionInput,
    userContext: UserContext,
    token: string
  ): Promise<InspectionRecord> {
    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
      'government_engineer',
    ].includes(userContext.role);

    if (!isGovernment) {
      throw new AuthorizationError('Only authorized Government officers can schedule inspections.');
    }

    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('inspections')
      .insert({
        project_id: input.project_id,
        inspector_id: userContext.userId,
        inspection_type: input.inspection_type,
        scheduled_date: input.scheduled_date,
        summary: input.summary || null,
        status: 'SCHEDULED',
      })
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to schedule inspection: ${error?.message}`);
    }

    return data as InspectionRecord;
  }

  async completeInspection(
    inspectionId: string,
    input: CompleteInspectionInput,
    userContext: UserContext,
    token: string
  ): Promise<InspectionRecord> {
    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
      'government_engineer',
    ].includes(userContext.role);

    if (!isGovernment) {
      throw new AuthorizationError('Only authorized Government officers can complete inspections.');
    }

    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('inspections')
      .update({
        status: 'COMPLETED',
        inspection_date: input.inspection_date,
        overall_rating: input.overall_rating || null,
        summary: input.summary,
      })
      .eq('id', inspectionId)
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to complete inspection: ${error?.message}`);
    }

    return data as InspectionRecord;
  }

  async listProjectInspections(
    projectId: string,
    userContext: UserContext,
    token: string
  ): Promise<InspectionRecord[]> {
    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('inspections')
      .select('*')
      .eq('project_id', projectId)
      .order('scheduled_date', { ascending: false });

    if (error) {
      throw new ValidationError(`Failed to list inspections: ${error.message}`);
    }

    return (data || []) as InspectionRecord[];
  }

  async createFinding(
    inspectionId: string,
    input: CreateFindingInput,
    userContext: UserContext,
    token: string
  ): Promise<InspectionFindingRecord> {
    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
      'government_engineer',
    ].includes(userContext.role);

    if (!isGovernment) {
      throw new AuthorizationError('Only authorized Government officers can record inspection findings.');
    }

    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('inspection_findings')
      .insert({
        inspection_id: inspectionId,
        project_id: input.project_id,
        severity: input.severity,
        title: input.title,
        description: input.description,
        status: 'OPEN',
      })
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to create finding: ${error?.message}`);
    }

    return data as InspectionFindingRecord;
  }

  async resolveFinding(
    findingId: string,
    input: ResolveFindingInput,
    userContext: UserContext,
    token: string
  ): Promise<InspectionFindingRecord> {
    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('inspection_findings')
      .update({
        status: 'RESOLVED',
        resolution_notes: input.resolution_notes,
        resolved_at: new Date().toISOString(),
      })
      .eq('id', findingId)
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to resolve finding: ${error?.message}`);
    }

    return data as InspectionFindingRecord;
  }

  async listProjectFindings(
    projectId: string,
    userContext: UserContext,
    token: string
  ): Promise<InspectionFindingRecord[]> {
    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('inspection_findings')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new ValidationError(`Failed to list findings: ${error.message}`);
    }

    return (data || []) as InspectionFindingRecord[];
  }
}

export const inspectionsService = new InspectionsService();
