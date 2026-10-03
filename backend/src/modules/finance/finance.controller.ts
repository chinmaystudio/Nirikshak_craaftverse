import { Response, NextFunction } from 'express';
import { financeService } from './finance.service.js';
import {
  SubmitPaymentClaimSchema,
  ReviewPaymentClaimSchema,
  RecordPaymentSchema,
  FinancialUpdateSchema,
} from './finance.validation.js';
import { ApiResponseHelper } from '../../core/http/response.js';
import { AuthenticatedRequest } from '../../core/auth/auth.middleware.js';

export class FinanceController {
  async submitClaim(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = SubmitPaymentClaimSchema.parse(req.body);
      const result = await financeService.submitClaim(validated, req.userContext!, req.token!);
      ApiResponseHelper.created(res, result);
    } catch (err) {
      next(err);
    }
  }

  async reviewClaim(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ReviewPaymentClaimSchema.parse(req.body);
      const result = await financeService.reviewClaim(validated, req.userContext!, req.token!);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async recordPayment(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = RecordPaymentSchema.parse(req.body);
      const result = await financeService.recordPayment(validated, req.userContext!, req.token!);
      ApiResponseHelper.created(res, result);
    } catch (err) {
      next(err);
    }
  }

  async recordFinancialUpdate(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = FinancialUpdateSchema.parse(req.body);
      const result = await financeService.recordFinancialUpdate(validated, req.userContext!, req.token!);
      ApiResponseHelper.created(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getFinanceSummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const summary = await financeService.getFinanceSummary(projectId, req.userContext!, req.token!);
      ApiResponseHelper.success(res, summary);
    } catch (err) {
      next(err);
    }
  }

  async listClaims(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const claims = await financeService.listClaims(projectId, req.userContext!, req.token!);
      ApiResponseHelper.success(res, claims);
    } catch (err) {
      next(err);
    }
  }

  async listPayments(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const payments = await financeService.listPayments(projectId, req.userContext!, req.token!);
      ApiResponseHelper.success(res, payments);
    } catch (err) {
      next(err);
    }
  }
}

export const financeController = new FinanceController();
