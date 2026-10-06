import { Router } from 'express';
import { z } from 'zod';
import { requireRole, type AuthenticatedRequest } from '../../core/auth/auth.middleware.js';
import { ApiResponseHelper } from '../../core/http/response.js';
import { ValidationError } from '../../core/http/errors.js';

export const accessRequestsRouter = Router();
accessRequestsRouter.use(requireRole(['government_admin']));

const requestParams = z.object({
  type: z.enum(['government', 'contractor']),
  id: z.string().uuid(),
});
const governmentRoles = z.enum(['government_engineer', 'project_officer', 'chief_engineer']);
const contractorRoles = z.enum(['contractor_admin']);

accessRequestsRouter.get('/', async (req: AuthenticatedRequest, res, next) => {
  try {
    const client = req.supabase!;
    const [government, contractor] = await Promise.all([
      client.from('government_access_requests').select('*').order('created_at', { ascending: false }),
      client.from('contractor_access_requests').select('*').order('created_at', { ascending: false }),
    ]);
    if (government.error) throw government.error;
    if (contractor.error) throw contractor.error;

    const userIds = [...new Set([
      ...(government.data || []).map((row) => row.user_id),
      ...(contractor.data || []).map((row) => row.user_id),
    ])];
    const profiles = userIds.length
      ? await client.from('profiles').select('id, full_name, phone').in('id', userIds)
      : { data: [], error: null };
    if (profiles.error) throw profiles.error;

    ApiResponseHelper.success(res, {
      governmentRequests: government.data || [],
      contractorRequests: contractor.data || [],
      profiles: profiles.data || [],
    });
  } catch (error) {
    next(error);
  }
});

accessRequestsRouter.post('/:type/:id/approve', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { type, id } = requestParams.parse(req.params);
    const role = type === 'government'
      ? governmentRoles.parse(req.body?.role)
      : contractorRoles.parse(req.body?.role);
    const name = type === 'government'
      ? 'approve_government_access_request'
      : 'approve_contractor_access_request';
    const { data, error } = await (req.supabase!.rpc as any)(name, {
      request_id: id,
      approved_role: role,
    });
    if (error) throw new ValidationError(error.message);
    ApiResponseHelper.success(res, data);
  } catch (error) {
    next(error);
  }
});

accessRequestsRouter.post('/:type/:id/reject', async (req: AuthenticatedRequest, res, next) => {
  try {
    const { type, id } = requestParams.parse(req.params);
    const { data, error } = await (req.supabase!.rpc as any)('reject_access_request', {
      p_request_id: id,
      p_type: type,
      p_reason: 'Application rejected by Government Authority Administrator',
    });
    if (error) throw new ValidationError(error.message);
    ApiResponseHelper.success(res, data);
  } catch (error) {
    next(error);
  }
});
