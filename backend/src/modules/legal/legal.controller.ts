import { Response, NextFunction } from 'express';
import { legalService } from './legal.service.js';
import {
  CreateLitigationSchema,
  AddLitigationEventSchema,
  ProposeSettlementSchema,
  ReviewSettlementSchema,
} from './legal.validation.js';
import { ApiResponseHelper } from '../../core/http/response.js';
import { AuthenticatedRequest } from '../../core/auth/auth.middleware.js';

export class LegalController {
  async createLitigation(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateLitigationSchema.parse(req.body);
      const result = await legalService.createLitigation(validated, req.userContext!, req.token!);
      ApiResponseHelper.created(res, result);
    } catch (err) {
      next(err);
    }
  }

  async listProjectLitigations(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const list = await legalService.listProjectLitigations(projectId, req.userContext!, req.token!);
      ApiResponseHelper.success(res, list);
    } catch (err) {
      next(err);
    }
  }

  async addEvent(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = AddLitigationEventSchema.parse(req.body);
      const result = await legalService.addLitigationEvent(id, validated, req.userContext!, req.token!);
      ApiResponseHelper.created(res, result);
    } catch (err) {
      next(err);
    }
  }

  async proposeSettlement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ProposeSettlementSchema.parse(req.body);
      const result = await legalService.proposeSettlement(validated, req.userContext!, req.token!);
      ApiResponseHelper.created(res, result);
    } catch (err) {
      next(err);
    }
  }

  async reviewSettlement(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = ReviewSettlementSchema.parse(req.body);
      const result = await legalService.reviewSettlement(id, validated, req.userContext!, req.token!);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const legalController = new LegalController();
