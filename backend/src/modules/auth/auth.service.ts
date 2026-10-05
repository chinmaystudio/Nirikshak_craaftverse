import crypto from 'crypto';
import { supabase, supabaseAdmin } from '../../core/database/supabase.js';
import { RegisterInput, LoginInput } from './auth.validation.js';
import { RegisterResult } from './auth.types.js';
import { ConflictError, ValidationError, AuthenticationError, AuthorizationError } from '../../core/http/errors.js';
import { generateCsrfToken } from '../../core/security/csrf.js';
import { generateBase32Secret, verifyTotpCode } from '../../core/security/totp.js';

export interface LoginResult {
  userId: string;
  email: string;
  role: string;
  organizationId: string | null;
  organizationName?: string;
  organizationType?: string;
  rawSessionToken: string;
  csrfToken: string;
}

export class AuthService {
  async login(
    input: LoginInput,
    metadata?: { ip?: string; userAgent?: string }
  ): Promise<LoginResult> {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: input.email.toLowerCase(),
      password: input.password,
    });

    if (authError || !authData.session || !authData.user) {
      throw new AuthenticationError('Invalid email or password.');
    }

    // Resolve authoritative role & active membership
    const { data: memberRows } = await supabaseAdmin
      .from('organization_members')
      .select('role, organization_id, status, organizations(id, name, type)')
      .eq('user_id', authData.user.id)
      .ilike('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    const membership = memberRows && memberRows.length > 0 ? memberRows[0] : null;
    const org = membership?.organizations as any;

    const role = membership?.role || 'citizen';
    const orgId = membership?.organization_id || null;

    // Generate opaque session token & bound CSRF token
    const rawSessionToken = crypto.randomBytes(32).toString('hex');
    const sessionTokenHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');

    const csrfToken = generateCsrfToken();
    const csrfTokenHash = crypto.createHash('sha256').update(csrfToken).digest('hex');

    // Persist opaque session in gateway_sessions
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(); // 7 days
    const accessExpiresAt = new Date(Date.now() + (authData.session.expires_in || 3600) * 1000).toISOString();

    await supabaseAdmin.from('gateway_sessions').insert({
      user_id: authData.user.id,
      session_token_hash: sessionTokenHash,
      csrf_token_hash: csrfTokenHash,
      supabase_access_token: authData.session.access_token,
      supabase_refresh_token: authData.session.refresh_token,
      access_token_expires_at: accessExpiresAt,
      mfa_verified: false,
      ip_address: metadata?.ip || null,
      user_agent: metadata?.userAgent || null,
      expires_at: sessionExpiresAt,
    });

    return {
      userId: authData.user.id,
      email: authData.user.email!,
      role,
      organizationId: orgId,
      organizationName: org?.name,
      organizationType: org?.type,
      rawSessionToken,
      csrfToken,
    };
  }

  async logout(rawSessionToken?: string): Promise<void> {
    if (!rawSessionToken) return;

    try {
      const sessionTokenHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');
      await supabaseAdmin.rpc('revoke_gateway_session', {
        p_session_token_hash: sessionTokenHash,
      });
    } catch (err: any) {
      console.warn('[AuthService] Logout revocation notice:', err.message);
    }
  }

  async enrollMfa(userId: string, email: string): Promise<{ secret: string; otpauthUri: string }> {
    const secret = generateBase32Secret(20);
    const otpauthUri = `otpauth://totp/NIRIKSHAK:${encodeURIComponent(email)}?secret=${secret}&issuer=NIRIKSHAK`;

    const { error } = await supabaseAdmin.from('user_mfa_factors').upsert({
      user_id: userId,
      factor_type: 'TOTP',
      secret,
      status: 'UNVERIFIED',
      enrolled_at: new Date().toISOString(),
    }, { onConflict: 'user_id,factor_type' });

    if (error) {
      throw new ValidationError(`Failed to initiate MFA enrollment: ${error.message}`);
    }

    return { secret, otpauthUri };
  }

  async verifyMfa(
    userId: string,
    code: string,
    rawSessionToken?: string
  ): Promise<{ verified: boolean; elevatedUntil: string }> {
    const { data: factor, error } = await supabaseAdmin
      .from('user_mfa_factors')
      .select('id, secret, status')
      .eq('user_id', userId)
      .eq('factor_type', 'TOTP')
      .maybeSingle();

    if (error || !factor) {
      throw new ValidationError('No active MFA enrollment found for this account.');
    }

    const isValid = verifyTotpCode(code, factor.secret);
    if (!isValid) {
      throw new AuthenticationError('Invalid multi-factor authentication code.');
    }

    // Mark factor as verified
    await supabaseAdmin
      .from('user_mfa_factors')
      .update({
        status: 'VERIFIED',
        last_used_at: new Date().toISOString(),
      })
      .eq('id', factor.id);

    // Elevate current gateway session for 15 minutes
    let elevatedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    if (rawSessionToken) {
      const sessionTokenHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');
      await supabaseAdmin.rpc('elevate_gateway_session', {
        p_session_token_hash: sessionTokenHash,
        p_duration_minutes: 15,
      });
    }

    return { verified: true, elevatedUntil };
  }

  async unenrollMfa(userId: string): Promise<void> {
    const { error } = await supabaseAdmin
      .from('user_mfa_factors')
      .delete()
      .eq('user_id', userId)
      .eq('factor_type', 'TOTP');

    if (error) {
      throw new ValidationError(`Failed to unenroll MFA: ${error.message}`);
    }
  }

  async getMfaStatus(userId: string, rawSessionToken?: string): Promise<{
    enrolled: boolean;
    elevated: boolean;
    elevatedUntil: string | null;
  }> {
    const { data: factor } = await supabaseAdmin
      .from('user_mfa_factors')
      .select('status')
      .eq('user_id', userId)
      .eq('factor_type', 'TOTP')
      .eq('status', 'VERIFIED')
      .maybeSingle();

    let elevated = false;
    let elevatedUntil: string | null = null;

    if (rawSessionToken) {
      const sessionTokenHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');
      const { data: session } = await supabaseAdmin
        .from('gateway_sessions')
        .select('mfa_verified, elevated_until')
        .eq('session_token_hash', sessionTokenHash)
        .is('revoked_at', null)
        .maybeSingle();

      if (session && session.mfa_verified && session.elevated_until) {
        if (new Date(session.elevated_until).getTime() > Date.now()) {
          elevated = true;
          elevatedUntil = session.elevated_until;
        }
      }
    }

    return {
      enrolled: !!factor,
      elevated,
      elevatedUntil,
    };
  }

  async forgotPassword(email: string): Promise<void> {
    await supabase.auth.resetPasswordForEmail(email.toLowerCase());
  }

  async resetPassword(tokenOrProof: string, newPassword: string): Promise<void> {
    // Phase 34: Must verify recovery session proof, never blindly update by arbitrary ID
    // If tokenOrProof is a Supabase recovery access token
    const { data: userData, error: userError } = await supabase.auth.getUser(tokenOrProof);
    if (userError || !userData?.user) {
      // In production, reject invalid recovery proof
      throw new AuthenticationError('Invalid or expired password reset recovery proof.');
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userData.user.id, {
      password: newPassword,
    });

    if (error) {
      throw new ValidationError(error.message);
    }
  }

  async register(input: RegisterInput): Promise<RegisterResult> {
    const metadata: Record<string, string> = {
      full_name: input.fullName,
      account_type: input.accountType,
    };

    if (input.accountType === 'citizen') {
      Object.assign(metadata, {
        role: 'citizen',
        phone: input.phone || '',
        city: input.city || '',
        ward: input.ward || '',
        preferredLanguage: input.preferredLanguage || 'en',
      });
    } else if (input.accountType === 'government') {
      Object.assign(metadata, {
        requested_role: 'government_engineer',
        employee_id: input.employeeId,
        department: input.department,
        designation: input.designation,
        state: input.state,
        district: input.district,
      });
    } else {
      Object.assign(metadata, {
        requested_role: 'contractor_admin',
        phone: input.phone,
        company_name: input.companyName,
        cin: input.registrationCin,
        gstin: input.gstin,
        class: input.contractorClass,
        state: input.state,
        district: input.district,
      });
    }

    const { data, error } = await supabase.auth.signUp({
      email: input.email.toLowerCase(),
      password: input.password,
      options: { data: metadata },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new ConflictError('An account with this email address already exists.');
      }
      throw new ValidationError(error.message);
    }

    return {
      userId: data.user!.id,
      email: data.user!.email!,
      message: 'Registration successful.',
    };
  }
}

export const authService = new AuthService();
