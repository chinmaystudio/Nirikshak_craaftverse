import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { RegisterSchema, LoginSchema, ForgotPasswordSchema } from './auth.validation.js';
import { ApiResponseHelper } from '../../core/http/response.js';
import { AuthenticatedRequest } from '../../core/auth/auth.middleware.js';
import { generateCsrfToken } from '../../core/security/csrf.js';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = LoginSchema.parse(req.body);
      const result = await authService.login(input);

      const isProduction = process.env.NODE_ENV === 'production';

      // 1. Set HttpOnly session cookie (access token)
      res.cookie('nirikshak_session', result.accessToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        path: '/',
        maxAge: 3600 * 1000, // 1 hour
      });

      // 2. Set HttpOnly refresh token cookie if present
      if (result.refreshToken) {
        res.cookie('nirikshak_refresh', result.refreshToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: 'strict',
          path: '/',
          maxAge: 7 * 24 * 3600 * 1000, // 7 days
        });
      }

      // 3. Set CSRF cookie (JavaScript readable to send in x-csrf-token header)
      res.cookie('nirikshak_csrf', result.csrfToken, {
        httpOnly: false,
        secure: isProduction,
        sameSite: 'strict',
        path: '/',
        maxAge: 3600 * 1000,
      });

      // Return sanitized user profile with ZERO token exposure in body
      ApiResponseHelper.success(res, {
        user: {
          id: result.userId,
          email: result.email,
          role: result.role,
          organizationId: result.organizationId,
          organizationName: result.organizationName,
          organizationType: result.organizationType,
        },
        csrfToken: result.csrfToken,
      }, 200);
    } catch (err) {
      next(err);
    }
  }

  async logout(_req: Request, res: Response): Promise<void> {
    const isProduction = process.env.NODE_ENV === 'production';
    const clearOpts = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'strict' as const,
      path: '/',
    };

    res.clearCookie('nirikshak_session', clearOpts);
    res.clearCookie('nirikshak_refresh', clearOpts);
    res.clearCookie('nirikshak_csrf', { ...clearOpts, httpOnly: false });

    ApiResponseHelper.success(res, { loggedOut: true }, 200);
  }

  async getCsrf(_req: Request, res: Response): Promise<void> {
    const csrfToken = generateCsrfToken();
    const isProduction = process.env.NODE_ENV === 'production';

    res.cookie('nirikshak_csrf', csrfToken, {
      httpOnly: false,
      secure: isProduction,
      sameSite: 'strict',
      path: '/',
      maxAge: 3600 * 1000,
    });

    ApiResponseHelper.success(res, { csrfToken });
  }

  async getSession(req: AuthenticatedRequest, res: Response): Promise<void> {
    ApiResponseHelper.success(res, {
      user: req.userContext,
    });
  }

  async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = ForgotPasswordSchema.parse(req.body);
      await authService.forgotPassword(input.email);
      ApiResponseHelper.success(res, {
        message: 'If an account exists with this email, password reset instructions have been sent.',
      });
    } catch (err) {
      next(err);
    }
  }

  async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = RegisterSchema.parse(req.body);
      const result = await authService.register(input);
      ApiResponseHelper.created(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
