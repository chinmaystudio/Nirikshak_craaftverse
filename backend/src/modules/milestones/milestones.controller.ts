import { Response, NextFunction } from 'express';
import { milestonesService } from './milestones.service.js';
import { CreateMilestoneSchema, UpdateMilestoneSchema } from './milestones.validation.js';
import { ApiResponseHelper } from '../../core/http/response.js';
import { AuthenticatedRequest } from '../../core/auth/auth.middleware.js';

export class MilestonesController {
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateMilestoneSchema.parse(req.body);
      const milestone = await milestonesService.createMilestone(validated, req.userContext!, req.token!);
      ApiResponseHelper.created(res, milestone);
    } catch (err) {
      next(err);
    }
  }

  async update(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = UpdateMilestoneSchema.parse(req.body);
      const updated = await milestonesService.updateMilestone(id, validated, req.userContext!, req.token!);
      ApiResponseHelper.success(res, updated);
    } catch (err) {
      next(err);
    }
  }

  async listByProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const list = await milestonesService.listProjectMilestones(projectId, req.userContext!, req.token!);
      ApiResponseHelper.success(res, list);
    } catch (err) {
      next(err);
    }
  }
}

export const milestonesController = new MilestonesController();
