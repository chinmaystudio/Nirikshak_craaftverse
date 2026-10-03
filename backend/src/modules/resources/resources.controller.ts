import { Response, NextFunction } from 'express';
import { resourcesService } from './resources.service.js';
import { SubmitResourceUsageSchema, VerifyResourceUsageSchema } from './resources.validation.js';
import { ApiResponseHelper } from '../../core/http/response.js';
import { AuthenticatedRequest } from '../../core/auth/auth.middleware.js';

export class ResourcesController {
  async submitUsage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = SubmitResourceUsageSchema.parse(req.body);
      const result = await resourcesService.submitUsage(validated, req.userContext!, req.token!);
      ApiResponseHelper.created(res, result);
    } catch (err) {
      next(err);
    }
  }

  async verifyUsage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = VerifyResourceUsageSchema.parse(req.body);
      const result = await resourcesService.verifyUsage(id, validated, req.userContext!, req.token!);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getLatestShortage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const shortage = await resourcesService.getLatestVerifiedShortage(projectId);
      ApiResponseHelper.success(res, shortage);
    } catch (err) {
      next(err);
    }
  }

  async listProjectUsage(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const list = await resourcesService.listProjectUsage(projectId, req.userContext!, req.token!);
      ApiResponseHelper.success(res, list);
    } catch (err) {
      next(err);
    }
  }
}

export const resourcesController = new ResourcesController();
