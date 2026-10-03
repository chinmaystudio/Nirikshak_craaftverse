import { Response, NextFunction } from 'express';
import { aiService } from './ai.service.js';
import { ApiResponseHelper } from '../../core/http/response.js';
import { AuthenticatedRequest } from '../../core/auth/auth.middleware.js';

export class AiController {
  async analyze(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const { projectId } = req.params;
      const result = await aiService.analyzeProject(projectId, req.userContext!, req.token!);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const aiController = new AiController();
