import { Router } from 'express';
import { authController } from './auth.controller.js';
import { rateLimit } from '../../core/security/rateLimit.js';

export const authRouter = Router();

authRouter.post(
  '/register',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 8,
    message: 'Too many registration attempts. Please wait 15 minutes and try again.',
  }),
  (req, res, next) => authController.register(req, res, next)
);
