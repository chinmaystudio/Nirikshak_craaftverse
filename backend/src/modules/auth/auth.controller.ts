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
        sameSite: isProduction ? 'none' : 'strict',
        path: '/',
        maxAge: 7 * 24 * 3600 * 1000, // 7 days
      });

      // 2. Set CSRF cookie (JavaScript readable to send in x-csrf-token header)
      res.cookie('nirikshak_csrf', result.csrfToken, {
        httpOnly: false,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'strict',
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
      sameSite: isProduction ? 'none' as const : 'strict' as const,
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
      sameSite: isProduction ? 'none' : 'strict',
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

      // Phase 8: If session was rotated on MFA elevation, set new opaque cookies
      if (result.newRawSessionToken && result.newCsrfToken) {
        const isProduction = process.env.NODE_ENV === 'production';
        res.cookie('nirikshak_session', result.newRawSessionToken, {
          httpOnly: true,
          secure: isProduction,
          sameSite: isProduction ? 'none' : 'strict',
          path: '/',
          maxAge: 7 * 24 * 3600 * 1000,
        });

        res.cookie('nirikshak_csrf', result.newCsrfToken, {
          httpOnly: false,
          secure: isProduction,
          sameSite: isProduction ? 'none' : 'strict',
          path: '/',
          maxAge: 7 * 24 * 3600 * 1000,
        });
      }

      ApiResponseHelper.success(res, {
        verified: result.verified,
        elevatedUntil: result.elevatedUntil,
      });
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
      const rawSessionToken = req.cookies?.['nirikshak_session'];
      await authService.unenrollMfa(req.userContext.userId, rawSessionToken);
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

  // Phase 14: Live Google OAuth through BFF
  async googleOAuthStart(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const redirectUrl = `${req.protocol}://${req.get('host')}/api/auth/oauth/google/callback`;
      const { supabase } = await import('../../core/database/supabase.js');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
        },
      });

      if (error || !data.url) {
        res.status(502).json({ success: false, error: 'OAUTH_INITIATION_FAILED', message: error?.message });
        return;
      }

      res.redirect(data.url);
    } catch (err) {
      next(err);
    }
  }

  async googleOAuthCallback(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const code = req.query.code as string;
      if (!code) {
        res.redirect('/login?error=missing_oauth_code');
        return;
      }

      const { supabase, supabaseAdmin } = await import('../../core/database/supabase.js');
      const { data: authData, error: authError } = await supabase.auth.exchangeCodeForSession(code);

      if (authError || !authData.session || !authData.user) {
        res.redirect('/login?error=oauth_exchange_failed');
        return;
      }

      // Generate opaque session token & bound CSRF token
      const crypto = await import('crypto');
      const rawSessionToken = crypto.randomBytes(32).toString('hex');
      const sessionTokenHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');
      const csrfToken = generateCsrfToken();
      const csrfTokenHash = crypto.createHash('sha256').update(csrfToken).digest('hex');

      // Encrypt tokens
      const { encryptSecret } = await import('../../core/security/encryption.js');
      const encAccess = encryptSecret(authData.session.access_token, 'SESSION_TOKEN_ENCRYPTION_KEY');
      const encRefresh = encryptSecret(authData.session.refresh_token, 'SESSION_TOKEN_ENCRYPTION_KEY');

      const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString();
      const accessExpiresAt = new Date(Date.now() + (authData.session.expires_in || 3600) * 1000).toISOString();

      await supabaseAdmin.from('gateway_sessions').insert({
        user_id: authData.user.id,
        session_token_hash: sessionTokenHash,
        csrf_token_hash: csrfTokenHash,
        supabase_access_token_ciphertext: encAccess.ciphertext,
        supabase_access_token_iv: encAccess.iv,
        supabase_access_token_tag: encAccess.tag,
        supabase_refresh_token_ciphertext: encRefresh.ciphertext,
        supabase_refresh_token_iv: encRefresh.iv,
        supabase_refresh_token_tag: encRefresh.tag,
        encryption_key_version: encAccess.keyVersion,
        access_token_expires_at: accessExpiresAt,
        mfa_verified: false,
        ip_address: req.ip || null,
        user_agent: req.headers['user-agent'] || null,
        expires_at: sessionExpiresAt,
      });

      const isProduction = process.env.NODE_ENV === 'production';
      res.cookie('nirikshak_session', rawSessionToken, {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'strict',
        path: '/',
        maxAge: 7 * 24 * 3600 * 1000,
      });

      res.cookie('nirikshak_csrf', csrfToken, {
        httpOnly: false,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'strict',
        path: '/',
        maxAge: 7 * 24 * 3600 * 1000,
      });

      // Redirect cleanly to frontend root with ZERO tokens in URL
      res.redirect('/');
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
