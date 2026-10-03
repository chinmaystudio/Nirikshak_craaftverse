import { Router, Request, Response } from 'express';
import { supabaseAdmin, createAuthenticatedClient } from '../services/supabase.js';
import { CreateComplaintSchema } from '../validation/schemas.js';
import { rateLimit } from '../middleware/security.js';

export const complaintsRouter = Router();

// Sanitizer for plain text inputs to prevent XSS (Rules 45, 87)
function sanitizeText(str: string): string {
  return str
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

// POST /api/complaints - Submit grievance
complaintsRouter.post(
  '/',
  rateLimit({ windowMs: 60 * 1000, max: 20 }),
  async (req: Request, res: Response) => {
    try {
      const validated = CreateComplaintSchema.parse(req.body);
      const { evidence_paths, ...compData } = validated;

      // Extract optional authenticated user
      let userId: string | null = null;
      const authHeader = req.header('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const token = authHeader.slice(7).trim();
        try {
          const { data: authData } = await supabaseAdmin.auth.getUser(token);
          if (authData?.user) userId = authData.user.id;
        } catch {
          /* anonymous submission permitted */
        }
      }

      // Validate storage paths to prevent path traversal (Rule 42)
      if (evidence_paths) {
        for (const path of evidence_paths) {
          if (path.includes('..') || path.startsWith('/') || path.includes('\\')) {
            return res.status(400).json({
              success: false,
              error: { code: 'INVALID_PATH', message: 'Invalid evidence storage path format' },
            });
          }
        }
      }

      const refNum = `NIR-CMP-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

      const sanitizedTitle = sanitizeText(compData.title);
      const sanitizedDesc = sanitizeText(compData.description);

      const { data, error } = await supabaseAdmin
        .from('complaints')
        .insert({
          ...compData,
          title: sanitizedTitle,
          description: sanitizedDesc,
          user_id: userId || compData.user_id || null,
          reference_number: refNum,
          status: 'SUBMITTED',
        })
        .select()
        .single();

      if (error) throw error;

      if (evidence_paths && evidence_paths.length > 0) {
        const evs = evidence_paths.map((p) => ({
          complaint_id: data.id,
          storage_path: p,
        }));
        await supabaseAdmin.from('complaint_evidence').insert(evs);
      }

      // Record audit log
      await supabaseAdmin.from('audit_logs').insert({
        actor_id: userId,
        action: 'COMPLAINT_FILED',
        entity_type: 'complaints',
        entity_id: data.id,
        new_value: {
          reference_number: refNum,
          project_id: data.project_id,
          category: data.category,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          ...data,
          reference_number: refNum,
        },
      });
    } catch (err: any) {
      res.status(400).json({ success: false, error: { code: 'COMPLAINT_ERROR', message: err.message } });
    }
  }
);

// GET /api/complaints/track/:ref - Track complaint status with PII redaction (Rules 74, 75)
complaintsRouter.get('/track/:ref', async (req: Request, res: Response) => {
  try {
    const { ref } = req.params;

    // Check caller's identity
    const authHeader = req.header('authorization');
    let callerId: string | null = null;
    let isGovernment = false;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim();
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
        /* unauthenticated track request */
      }
    }

    const { data, error } = await supabaseAdmin
      .from('complaints')
      .select('*, complaint_updates(*), complaint_evidence(*), projects(project_name, project_authority)')
      .eq('reference_number', ref)
      .single();

    if (error || !data) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Complaint reference not found' } });
    }

    // Check if caller is authorized owner or government official
    const isOwner = callerId !== null && data.user_id === callerId;

    if (!isOwner && !isGovernment) {
      // Privacy Protection (Rule 74): Redact citizen PII and internal investigator updates
      const redacted = {
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
      return res.json({ success: true, data: redacted });
    }

    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'TRACK_ERROR', message: 'Error retrieving complaint status' } });
  }
});
