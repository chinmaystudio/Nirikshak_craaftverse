import { Response, NextFunction } from 'express';
import { contractsService } from './contracts.service.js';
import { AwardContractSchema } from './contracts.validation.js';
import { ApiResponseHelper } from '../../core/http/response.js';
import { AuthenticatedRequest } from '../../core/auth/auth.middleware.js';

export class ContractsController {
  async award(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = AwardContractSchema.parse(req.body);
      const result = await contractsService.awardContract(validated, req.userContext!, req.token!);
      ApiResponseHelper.created(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getById(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const contract = await contractsService.getContractById(id, req.userContext!, req.token!);
      ApiResponseHelper.success(res, contract);
    } catch (err) {
      next(err);
    }
  }

  async listByProject(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const contracts = await contractsService.listProjectContracts(projectId, req.userContext!, req.token!);
      ApiResponseHelper.success(res, contracts);
    } catch (err) {
      next(err);
    }
  }
}

export const contractsController = new ContractsController();
