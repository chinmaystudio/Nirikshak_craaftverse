import { Request, Response, NextFunction } from 'express';
import { complaintsService } from './complaints.service.js';
import { CreateComplaintSchema } from './complaints.validation.js';
import { ApiResponseHelper } from '../../core/http/response.js';

export class ComplaintsController {
  async submit(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateComplaintSchema.parse(req.body);
      const authHeader = req.header('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
      const callerUserId = (req as any).user?.id || null;

      const result = await complaintsService.submitComplaint(validated, callerUserId);
      ApiResponseHelper.created(res, result);
    } catch (err) {
      next(err);
    }
  }

  async track(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const authHeader = req.header('authorization');
      const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7).trim() : undefined;
      const result = await complaintsService.trackComplaint(req.params.ref, token);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const complaintsController = new ComplaintsController();
