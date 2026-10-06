import { Response, NextFunction } from 'express';
import { aiService } from './ai.service.js';
import { ApiResponseHelper } from '../../core/http/response.js';
import { AuthenticatedRequest } from '../../core/auth/auth.middleware.js';
import { AiFeedbackSchema, AiOutcomeSchema } from './ai.validation.js';

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

  async feedback(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = AiFeedbackSchema.parse(req.body);
      const result = await aiService.submitRecommendationFeedback(validated, req.userContext!);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async outcome(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = AiOutcomeSchema.parse(req.body);
      const result = await aiService.recordVerifiedOutcome(validated, req.userContext!, req.token!);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async health(_req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const health = await aiService.getHealth();
      ApiResponseHelper.success(res, health);
    } catch (err) {
      next(err);
    }
  }

  async assistant(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const message = String(req.body?.message || req.body?.text || '').trim();
      const context = req.body?.context;
      const result = await aiService.assistantChat(message, context);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async suggestContractor(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const tenderData = req.body || {};
      const result = await aiService.suggestContractor(tenderData);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async projectReports(req: any, res: Response, next: NextFunction): Promise<void> {
    try {
      const projectData = req.body || {};
      const result = await aiService.getProjectReports(projectData);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const aiController = new AiController();

