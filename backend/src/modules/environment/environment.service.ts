import { supabaseAdmin, createAuthenticatedClient } from '../../core/database/supabase.js';
import { CreateClearanceInput, RecordObservationInput, ReportIncidentInput } from './environment.types.js';
import { UserContext } from '../../core/auth/userContext.js';
import { AuthorizationError, NotFoundError, ValidationError } from '../../core/http/errors.js';

export class EnvironmentService {
  async createClearance(
    input: CreateClearanceInput,
    userContext: UserContext,
    token: string
  ): Promise<any> {
    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
      'government_engineer',
    ].includes(userContext.role);

    if (!isGovernment) {
      throw new AuthorizationError('Only authorized Government officers can record environmental clearances.');
    }

    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('environmental_clearances')
      .insert({
        project_id: input.project_id,
        clearance_type: input.clearance_type,
        issuing_authority: input.issuing_authority,
        clearance_number: input.clearance_number,
        issue_date: input.issue_date,
        valid_until: input.valid_until || null,
        status: input.status,
        conditions_count: input.conditions_count || 0,
        conditions_complied_count: input.conditions_complied_count || 0,
      })
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to record clearance: ${error?.message}`);
    }

    return data;
  }

  async listProjectClearances(
    projectId: string,
    userContext: UserContext,
    token: string
  ): Promise<any[]> {
    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('environmental_clearances')
      .select('*')
      .eq('project_id', projectId)
      .order('issue_date', { ascending: false });

    if (error) {
      throw new ValidationError(`Failed to list clearances: ${error.message}`);
    }

    return data || [];
  }

  async recordObservation(
    input: RecordObservationInput,
    userContext: UserContext,
    token: string
  ): Promise<any> {
    const isGovernment = [
      'government_admin',
      'chief_engineer',
      'project_officer',
      'government_engineer',
      'auditor',
    ].includes(userContext.role);

    // Contractor vs Government distinction
    const verificationStatus = isGovernment ? 'VERIFIED' : 'REPORTED';
    const reporterRole = isGovernment ? 'GOVERNMENT' : 'CONTRACTOR';

    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('environmental_observations')
      .insert({
        project_id: input.project_id,
        observation_date: input.observation_date,
        parameter_name: input.parameter_name,
        measured_value: input.measured_value,
        prescribed_limit: input.prescribed_limit,
        unit: input.unit,
        is_compliant: input.is_compliant,
        reporter_role: reporterRole,
        verification_status: verificationStatus,
        verified_by: isGovernment ? userContext.userId : null,
      })
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to record observation: ${error?.message}`);
    }

    return data;
  }

  async reportIncident(
    input: ReportIncidentInput,
    userContext: UserContext,
    token: string
  ): Promise<any> {
    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('environmental_incidents')
      .insert({
        project_id: input.project_id,
        incident_date: input.incident_date,
        severity: input.severity,
        title: input.title,
        description: input.description,
        mitigation_measures: input.mitigation_measures || null,
        status: 'OPEN',
        reported_by: userContext.userId,
      })
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Failed to report incident: ${error?.message}`);
    }

    return data;
  }

  async listProjectIncidents(
    projectId: string,
    userContext: UserContext,
    token: string
  ): Promise<any[]> {
    const scopedClient = await createAuthenticatedClient(token);
    const { data, error } = await scopedClient
      .from('environmental_incidents')
      .select('*')
      .eq('project_id', projectId)
      .order('incident_date', { ascending: false });

    if (error) {
      throw new ValidationError(`Failed to list incidents: ${error.message}`);
    }

    return data || [];
  }

  async getEnvironmentSummary(
    projectId: string,
    userContext: UserContext,
    token: string
  ): Promise<any> {
    const scopedClient = await createAuthenticatedClient(token);

    const [
      { data: clearances },
      { data: observations },
      { data: incidents },
    ] = await Promise.all([
      scopedClient.from('environmental_clearances').select('id, status').eq('project_id', projectId),
      scopedClient.from('environmental_observations').select('id, is_compliant, verification_status').eq('project_id', projectId),
      scopedClient.from('environmental_incidents').select('id, severity, status').eq('project_id', projectId),
    ]);

    const totalClearances = clearances?.length || 0;
    const grantedClearances = clearances?.filter((c) => c.status === 'GRANTED').length || 0;
    const totalObservations = observations?.length || 0;
    const verifiedCompliant = observations?.filter((o) => o.is_compliant && o.verification_status === 'VERIFIED').length || 0;
    const nonCompliant = observations?.filter((o) => !o.is_compliant).length || 0;
    const openIncidents = incidents?.filter((i) => i.status !== 'RESOLVED' && i.status !== 'CLOSED').length || 0;

    return {
      project_id: projectId,
      clearances: {
        total: totalClearances,
        granted: grantedClearances,
      },
      observations: {
        total: totalObservations,
        verified_compliant: verifiedCompliant,
        non_compliant: nonCompliant,
      },
      incidents: {
        total: incidents?.length || 0,
        open: openIncidents,
      },
    };
  }
}

export const environmentService = new EnvironmentService();
