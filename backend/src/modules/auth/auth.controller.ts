import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { RegisterSchema } from './auth.validation.js';
import { ApiResponseHelper } from '../../core/http/response.js';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = RegisterSchema.parse(req.body);
      const result = await authService.register(validated);
      ApiResponseHelper.created(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
