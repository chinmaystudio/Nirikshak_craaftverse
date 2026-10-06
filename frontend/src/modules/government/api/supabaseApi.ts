/**
 * Backward-compatible facade for Government Domain Services.
 * Domain implementations have been modularized into:
 *   frontend/src/modules/government/services/
 *
 * This facade preserves existing call sites while routing all business logic
 * through specialized, testable domain services.
 */
import { supabase } from '@/core/supabase/client';
import type { Officer } from '@/modules/government/types';

import {
  projectsService,
  CreateGovernmentProjectInput,
} from '../services/projects.service';
import { approvalsService } from '../services/approvals.service';
import { complaintsService } from '../services/complaints.service';
import { contractorsService } from '../services/contractors.service';
import { procurementService } from '../services/procurement.service';
import { financeService } from '../services/finance.service';
import { auditService } from '../services/audit.service';
import { alertsService } from '../services/alerts.service';
import { documentsService } from '../services/documents.service';
import { legalService } from '../services/legal.service';
import { workService } from '../services/work.service';
import { citizenPublicService } from '../services/citizenPublic.service';
import { governmentAiService } from '../services/ai.service';

export type { CreateGovernmentProjectInput };

export const projectsApi = projectsService;
export const approvalsApi = approvalsService;
export const grievancesApi = complaintsService;
export const contractorsApi = contractorsService;
export const tendersApi = procurementService;
export const financeApi = financeService;
export const auditApi = auditService;
export const alertsApi = alertsService;
export const documentsApi = documentsService;
export const litigationApi = legalService;
export const workApi = workService;
export const citizenApi = citizenPublicService;

export const insightsApi = {
  async analyzeProject(projectId: string) {
    const res = await governmentAiService.analyzeProject(projectId);
    return res;
  },
  async all() {
    return governmentAiService.all();
  },
  async evaluateContractor(projectId: string) {
    return governmentAiService.evaluateContractor(projectId);
  },
};

export const authApi = {
  async signIn(_employeeId: string, _password: string): Promise<Officer> {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) throw new Error('Not authenticated');
    return this.currentOfficer().then(
      (o) =>
        o || {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Officer',
          designation: (data.user.user_metadata?.designation as string) || 'Not available',
          department: 'Not available',
          employeeNo: (data.user.user_metadata?.employee_id as string) || 'Not available',
          roles: ['government_engineer'],
        }
    );
  },

  async currentOfficer(): Promise<Officer | null> {
    const { data } = await supabase.auth.getUser();
    if (!data?.user) return null;

    const [{ data: profile }, { data: members }] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', data.user.id).maybeSingle(),
      supabase
        .from('organization_members')
        .select('role, organizations(name, department)')
        .eq('user_id', data.user.id)
        .ilike('status', 'active')
        .limit(1),
    ]);

    const activeMember = members && members.length > 0 ? members[0] : null;
    const org = (activeMember as any)?.organizations;

    return {
      id: data.user.id,
      name: profile?.full_name || data.user.user_metadata?.full_name || data.user.email?.split('@')[0] || 'Officer',
      designation: (data.user.user_metadata?.designation as string) || (profile as any)?.designation || 'Not available',
      department: org?.department || org?.name || 'Not available',
      employeeNo: (data.user.user_metadata?.employee_id as string) || (profile as any)?.employee_id || 'Not available',
      roles: [activeMember?.role || 'government_engineer'],
    };
  },
};
