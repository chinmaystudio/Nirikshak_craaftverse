import { Response, NextFunction } from 'express';
import { progressService } from './progress.service.js';
import { SubmitProgressSchema, ReviewProgressSchema } from './progress.validation.js';
import { ApiResponseHelper } from '../../core/http/response.js';
import { AuthenticatedRequest } from '../../core/auth/auth.middleware.js';

export class ProgressController {
  async listProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await progressService.listProjectProgress(req.params.projectId, req.token!);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async submit(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = SubmitProgressSchema.parse(req.body);
      const result = await progressService.submitProgress(validated, req.token!);
      ApiResponseHelper.created(res, {
        ...result,
        message: 'Progress update submitted successfully. Awaiting government verification.',
      });
    } catch (err) {
      next(err);
    }
  }

  async review(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ReviewProgressSchema.parse(req.body);
      const result = await progressService.reviewProgress(validated, req.token!);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const progressController = new ProgressController();
