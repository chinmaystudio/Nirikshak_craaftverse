import { Response, NextFunction } from 'express';
import { procurementService } from './procurement.service.js';
import { CreateTenderSchema, SaveTenderBidSchema } from './procurement.validation.js';
import { ApiResponseHelper } from '../../core/http/response.js';
import { AuthenticatedRequest } from '../../core/auth/auth.middleware.js';

export class ProcurementController {
  async publishTender(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateTenderSchema.parse(req.body);
      const result = await procurementService.publishTender(validated, req.userContext!, req.token!);
      ApiResponseHelper.created(res, result);
    } catch (err) {
      next(err);
    }
  }

  async saveTenderBid(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = SaveTenderBidSchema.parse({ ...req.body, tender_id: req.params.tenderId });
      const result = await procurementService.saveTenderBid(validated, req.token!);
      ApiResponseHelper.created(res, result);
    } catch (err) { next(err); }
  }
}

export const procurementController = new ProcurementController();
