import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service.js';
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema } from './auth.validation.js';
import { ApiResponseHelper } from '../../core/http/response.js';
import { AuthenticatedRequest } from '../../core/auth/auth.middleware.js';
import { generateCsrfToken } from '../../core/security/csrf.js';

export class AuthController {
  async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = LoginSchema.parse(req.body);
      const result = await authService.login(input, {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });

      const isProduction = process.env.NODE_ENV === 'production';

      // 1. Set HttpOnly opaque session cookie (Raw random token; DB only stores SHA-256)
      res.cookie('nirikshak_session', result.rawSessionToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 3600 * 1000, // 7 days
      });

      // 2. Set CSRF cookie (JavaScript readable to send in x-csrf-token header)
      res.cookie('nirikshak_csrf', result.csrfToken, {
        httpOnly: false,
        secure: isProduction,
        sameSite: 'strict',
        path: '/',
        maxAge: 7 * 24 * 3600 * 1000,
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

  async logout(req: Request, res: Response): Promise<void> {
    const rawSessionToken = req.cookies?.['nirikshak_session'];
    await authService.logout(rawSessionToken);

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
      mfaVerified: req.mfaVerified || false,
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

  async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const input = ResetPasswordSchema.parse(req.body);
      const token = input.token || (req.query.token as string) || '';
      const newPassword = input.newPassword || input.password || '';
      await authService.resetPassword(token, newPassword);
      ApiResponseHelper.success(res, {
        message: 'Password successfully reset.',
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

  // MFA Endpoints
  async enrollMfa(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userContext) {
        res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
        return;
      }
      const result = await authService.enrollMfa(req.userContext.userId, req.userContext.email || 'user@nirikshak.gov.in');
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async verifyMfa(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userContext) {
        res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
        return;
      }
      const { code } = req.body;
      const rawSessionToken = req.cookies?.['nirikshak_session'];
      const result = await authService.verifyMfa(req.userContext.userId, code, rawSessionToken);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }

  async unenrollMfa(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userContext) {
        res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
        return;
      }
      await authService.unenrollMfa(req.userContext.userId);
      ApiResponseHelper.success(res, { unenrolled: true });
    } catch (err) {
      next(err);
    }
  }

  async getMfaStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.userContext) {
        res.status(401).json({ success: false, error: 'UNAUTHORIZED' });
        return;
      }
      const rawSessionToken = req.cookies?.['nirikshak_session'];
      const result = await authService.getMfaStatus(req.userContext.userId, rawSessionToken);
      ApiResponseHelper.success(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
