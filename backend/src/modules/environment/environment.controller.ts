import { Response, NextFunction } from 'express';
import { environmentService } from './environment.service.js';
import {
  CreateClearanceSchema,
  RecordObservationSchema,
  ReportIncidentSchema,
} from './environment.validation.js';
import { ApiResponseHelper } from '../../core/http/response.js';
import { AuthenticatedRequest } from '../../core/auth/auth.middleware.js';

export class EnvironmentController {
  async createClearance(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateClearanceSchema.parse(req.body);
      const result = await environmentService.createClearance(validated, req.userContext!, req.token!);
      ApiResponseHelper.created(res, result);
    } catch (err) {
      next(err);
    }
  }

  async listClearances(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const list = await environmentService.listProjectClearances(projectId, req.userContext!, req.token!);
      ApiResponseHelper.success(res, list);
    } catch (err) {
      next(err);
    }
  }

  async recordObservation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = RecordObservationSchema.parse(req.body);
      const result = await environmentService.recordObservation(validated, req.userContext!, req.token!);
      ApiResponseHelper.created(res, result);
    } catch (err) {
      next(err);
    }
  }

  async reportIncident(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ReportIncidentSchema.parse(req.body);
      const result = await environmentService.reportIncident(validated, req.userContext!, req.token!);
      ApiResponseHelper.created(res, result);
    } catch (err) {
      next(err);
    }
  }

  async listIncidents(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const list = await environmentService.listProjectIncidents(projectId, req.userContext!, req.token!);
      ApiResponseHelper.success(res, list);
    } catch (err) {
      next(err);
    }
  }

  async getSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const summary = await environmentService.getEnvironmentSummary(projectId, req.userContext!, req.token!);
      ApiResponseHelper.success(res, summary);
    } catch (err) {
      next(err);
    }
  }
}

export const environmentController = new EnvironmentController();
