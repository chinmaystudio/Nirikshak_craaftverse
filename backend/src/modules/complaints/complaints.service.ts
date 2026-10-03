import { supabaseAdmin } from '../../core/database/supabase.js';
import { CreateComplaintInput } from './complaints.validation.js';
import { sanitizePlainText, sanitizeStoragePath } from '../../core/security/sanitizer.js';
import { NotFoundError, ValidationError } from '../../core/http/errors.js';

export class ComplaintsService {
  async submitComplaint(input: CreateComplaintInput, callerUserId?: string | null): Promise<any> {
    if (input.evidence_paths) {
      for (const path of input.evidence_paths) {
        if (!sanitizeStoragePath(path)) {
          throw new ValidationError('Invalid evidence storage path format');
        }
      }
    }

    const refNum = `NIR-CMP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const sanitizedTitle = sanitizePlainText(input.title);
    const sanitizedDesc = sanitizePlainText(input.description);

    const { evidence_paths, ...compData } = input;
    const { data, error } = await supabaseAdmin
      .from('complaints')
      .insert({
        ...compData,
        title: sanitizedTitle,
        description: sanitizedDesc,
        user_id: callerUserId || compData.user_id || null,
        reference_number: refNum,
        status: 'SUBMITTED',
      })
      .select()
      .single();

    if (error || !data) {
      throw new ValidationError(`Complaint submission failed: ${error?.message}`);
    }

    if (evidence_paths && evidence_paths.length > 0) {
      const evs = evidence_paths.map((p) => ({
        complaint_id: data.id,
        storage_path: p,
      }));
      await supabaseAdmin.from('complaint_evidence').insert(evs);
    }

    // Audit log
    await supabaseAdmin.from('audit_logs').insert({
      actor_id: callerUserId || null,
      action: 'COMPLAINT_FILED',
      entity_type: 'complaints',
      entity_id: data.id,
      new_value: {
        reference_number: refNum,
        project_id: data.project_id,
        category: data.category,
      },
    });

    return {
      ...data,
      reference_number: refNum,
    };
  }

  async trackComplaint(ref: string, token?: string): Promise<any> {
    let callerId: string | null = null;
    let isGovernment = false;

    if (token) {
      try {
        const { data: authData } = await supabaseAdmin.auth.getUser(token);
        if (authData?.user) {
          callerId = authData.user.id;
          const { data: member } = await supabaseAdmin
            .from('organization_members')
            .select('role')
            .eq('user_id', callerId)
            .ilike('status', 'active')
            .limit(1)
            .maybeSingle();

          if (member && ['government_admin', 'chief_engineer', 'project_officer', 'government_engineer', 'auditor'].includes(member.role)) {
            isGovernment = true;
          }
        }
      } catch {
        /* proceed as anonymous tracker */
      }
    }

    const { data, error } = await supabaseAdmin
      .from('complaints')
      .select('*, complaint_updates(*), complaint_evidence(*), projects(project_name, project_authority)')
      .eq('reference_number', ref)
      .single();

    if (error || !data) {
      throw new NotFoundError('Complaint reference not found');
    }

    const isOwner = callerId !== null && data.user_id === callerId;

    if (!isOwner && !isGovernment) {
      // Privacy Protection: Redact citizen PII and internal investigator updates
      return {
        id: data.id,
        reference_number: data.reference_number,
        project_id: data.project_id,
        category: data.category,
        title: data.title,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
        projects: data.projects,
        complaint_updates: (data.complaint_updates || [])
          .filter((u: any) => u.is_public !== false)
          .map((u: any) => ({
            id: u.id,
            status_to: u.status_to,
            public_comment: u.public_comment || u.notes,
            created_at: u.created_at,
          })),
      };
    }

    return data;
  }
}

export const complaintsService = new ComplaintsService();
