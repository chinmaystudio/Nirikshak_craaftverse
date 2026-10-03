import { Response, NextFunction } from 'express';
import { inspectionsService } from './inspections.service.js';
import {
  ScheduleInspectionSchema,
  CompleteInspectionSchema,
  CreateFindingSchema,
  ResolveFindingSchema,
} from './inspections.validation.js';
import { ApiResponseHelper } from '../../core/http/response.js';
import { AuthenticatedRequest } from '../../core/auth/auth.middleware.js';

export class InspectionsController {
  async schedule(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ScheduleInspectionSchema.parse(req.body);
      const result = await inspectionsService.scheduleInspection(validated, req.userContext!, req.token!);
      ApiResponseHelper.created(res, result);
    } catch (err) {
      next(err);
    }
  }

  async complete(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = CompleteInspectionSchema.parse(req.body);
      const result = await inspectionsService.completeInspection(id, validated, req.userContext!, req.token!);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async listByProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const list = await inspectionsService.listProjectInspections(projectId, req.userContext!, req.token!);
      ApiResponseHelper.success(res, list);
    } catch (err) {
      next(err);
    }
  }

  async createFinding(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = CreateFindingSchema.parse(req.body);
      const result = await inspectionsService.createFinding(id, validated, req.userContext!, req.token!);
      ApiResponseHelper.created(res, result);
    } catch (err) {
      next(err);
    }
  }

  async resolveFinding(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { findingId } = req.params;
      const validated = ResolveFindingSchema.parse(req.body);
      const result = await inspectionsService.resolveFinding(findingId, validated, req.userContext!, req.token!);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async listProjectFindings(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const list = await inspectionsService.listProjectFindings(projectId, req.userContext!, req.token!);
      ApiResponseHelper.success(res, list);
    } catch (err) {
      next(err);
    }
  }
}

export const inspectionsController = new InspectionsController();
