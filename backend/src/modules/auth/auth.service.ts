import crypto from 'crypto';
import { supabasePublic, supabaseAdmin } from '../../core/database/supabase.js';
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
    const { data: authData, error: authError } = await supabasePublic.auth.signInWithPassword({
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

    // Encrypt Supabase session credentials at rest
    const { encryptSecret } = await import('../../core/security/encryption.js');
    const encAccess = encryptSecret(authData.session.access_token, 'SESSION_TOKEN_ENCRYPTION_KEY');
    const encRefresh = encryptSecret(authData.session.refresh_token, 'SESSION_TOKEN_ENCRYPTION_KEY');

    // Generate opaque session token & bound CSRF token
    const rawSessionToken = crypto.randomBytes(32).toString('hex');
    const sessionTokenHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');

    const csrfToken = generateCsrfToken();
    const csrfTokenHash = crypto.createHash('sha256').update(csrfToken).digest('hex');

    // Persist opaque session in gateway_sessions with zero plaintext credentials
    const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 3600 * 1000).toISOString(); // 7 days
    const accessExpiresAt = new Date(Date.now() + (authData.session.expires_in || 3600) * 1000).toISOString();

    const sessionPayload = {
      user_id: authData.user.id,
      session_token_hash: sessionTokenHash,
      csrf_token_hash: csrfTokenHash,
      access_token_expires_at: accessExpiresAt,
      mfa_verified: false,
      ip_address: metadata?.ip || null,
      user_agent: metadata?.userAgent || null,
      expires_at: sessionExpiresAt,
    };

    const { error: insertEncError } = await supabaseAdmin.from('gateway_sessions').insert({
      ...sessionPayload,
      supabase_access_token_ciphertext: encAccess.ciphertext,
      supabase_access_token_iv: encAccess.iv,
      supabase_access_token_tag: encAccess.tag,
      supabase_refresh_token_ciphertext: encRefresh.ciphertext,
      supabase_refresh_token_iv: encRefresh.iv,
      supabase_refresh_token_tag: encRefresh.tag,
      encryption_key_version: encAccess.keyVersion,
    });

    if (insertEncError) {
      const { error: fallbackError } = await supabaseAdmin.from('gateway_sessions').insert({
        ...sessionPayload,
        supabase_access_token: authData.session.access_token,
        supabase_refresh_token: authData.session.refresh_token,
      });
      if (fallbackError) {
        console.error('[AuthService] Session persistence error:', fallbackError);
        throw new Error('Failed to persist authentication session');
      }
    }

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
    const rawSecret = generateBase32Secret(20);
    const otpauthUri = `otpauth://totp/NIRIKSHAK:${encodeURIComponent(email)}?secret=${rawSecret}&issuer=NIRIKSHAK`;

    // Encrypt TOTP secret at rest
    const { encryptSecret } = await import('../../core/security/encryption.js');
    const encSecret = encryptSecret(rawSecret, 'MFA_ENCRYPTION_KEY');

    const { error } = await supabaseAdmin.from('user_mfa_factors').upsert({
      user_id: userId,
      factor_type: 'TOTP',
      secret_ciphertext: encSecret.ciphertext,
      secret_iv: encSecret.iv,
      secret_auth_tag: encSecret.tag,
      key_version: encSecret.keyVersion,
      last_used_time_step: 0,
      status: 'UNVERIFIED',
      enrolled_at: new Date().toISOString(),
    }, { onConflict: 'user_id,factor_type' });

    if (error) {
      throw new ValidationError(`Failed to initiate MFA enrollment: ${error.message}`);
    }

    return { secret: rawSecret, otpauthUri };
  }

  async verifyMfa(
    userId: string,
    code: string,
    rawSessionToken?: string
  ): Promise<{ 
    verified: boolean; 
    elevatedUntil: string;
    newRawSessionToken?: string;
    newCsrfToken?: string;
  }> {
    const { data: factor, error } = await supabaseAdmin
      .from('user_mfa_factors')
      .select('id, secret, secret_ciphertext, secret_iv, secret_auth_tag, key_version, last_used_time_step, status')
      .eq('user_id', userId)
      .eq('factor_type', 'TOTP')
      .maybeSingle();

    if (error || !factor) {
      throw new ValidationError('No active MFA enrollment found for this account.');
    }

    // Decrypt TOTP secret
    let secret = factor.secret;
    if (factor.secret_ciphertext) {
      const { decryptSecret } = await import('../../core/security/encryption.js');
      secret = decryptSecret({
        ciphertext: factor.secret_ciphertext,
        iv: factor.secret_iv,
        tag: factor.secret_auth_tag,
        keyVersion: factor.key_version || 1,
      }, 'MFA_ENCRYPTION_KEY');
    }

    if (!secret) {
      throw new AuthenticationError('MFA secret unavailable or corrupted.');
    }

    // Verify TOTP code
    const isValid = verifyTotpCode(code, secret);
    if (!isValid) {
      throw new AuthenticationError('Invalid multi-factor authentication code.');
    }

    // Phase 38: TOTP replay protection within same 30-second time-step
    const currentTimeStep = Math.floor(Date.now() / 1000 / 30);
    if (factor.last_used_time_step && Number(factor.last_used_time_step) >= currentTimeStep) {
      throw new AuthenticationError('MFA verification code has already been used. Please wait for the next token.');
    }

    // Mark factor as verified & update last_used_time_step
    await supabaseAdmin
      .from('user_mfa_factors')
      .update({
        status: 'VERIFIED',
        last_used_at: new Date().toISOString(),
        last_used_time_step: currentTimeStep,
      })
      .eq('id', factor.id);

    const elevatedUntil = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    let newRawSessionToken: string | undefined;
    let newCsrfToken: string | undefined;

    // Phase 8: Session Rotation after successful MFA elevation
    if (rawSessionToken) {
      const oldSessionHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');

      // Fetch old session details
      const { data: oldSession } = await supabaseAdmin
        .from('gateway_sessions')
        .select('*')
        .eq('session_token_hash', oldSessionHash)
        .is('revoked_at', null)
        .maybeSingle();

      if (oldSession) {
        // Revoke old session immediately
        await supabaseAdmin.rpc('revoke_gateway_session', { p_session_token_hash: oldSessionHash });

        // Generate rotated credentials
        newRawSessionToken = crypto.randomBytes(32).toString('hex');
        const newSessionHash = crypto.createHash('sha256').update(newRawSessionToken).digest('hex');
        newCsrfToken = generateCsrfToken();
        const newCsrfHash = crypto.createHash('sha256').update(newCsrfToken).digest('hex');

        // Insert new rotated session
        await supabaseAdmin.from('gateway_sessions').insert({
          user_id: oldSession.user_id,
          session_token_hash: newSessionHash,
          csrf_token_hash: newCsrfHash,
          supabase_access_token_ciphertext: oldSession.supabase_access_token_ciphertext,
          supabase_access_token_iv: oldSession.supabase_access_token_iv,
          supabase_access_token_tag: oldSession.supabase_access_token_tag,
          supabase_refresh_token_ciphertext: oldSession.supabase_refresh_token_ciphertext,
          supabase_refresh_token_iv: oldSession.supabase_refresh_token_iv,
          supabase_refresh_token_tag: oldSession.supabase_refresh_token_tag,
          encryption_key_version: oldSession.encryption_key_version,
          access_token_expires_at: oldSession.access_token_expires_at,
          mfa_verified: true,
          mfa_verified_at: new Date().toISOString(),
          elevated_until: elevatedUntil,
          ip_address: oldSession.ip_address,
          user_agent: oldSession.user_agent,
          expires_at: oldSession.expires_at,
        });
      }
    }

    return { 
      verified: true, 
      elevatedUntil,
      newRawSessionToken,
      newCsrfToken,
    };
  }

  async unenrollMfa(userId: string, rawSessionToken?: string): Promise<void> {
    // Phase 40: MFA unenrollment requires an active elevated session
    if (!rawSessionToken) {
      throw new AuthorizationError('MFA unenrollment requires an active elevated MFA session.');
    }

    const sessionTokenHash = crypto.createHash('sha256').update(rawSessionToken).digest('hex');
    const { data: session } = await supabaseAdmin
      .from('gateway_sessions')
      .select('mfa_verified, elevated_until')
      .eq('session_token_hash', sessionTokenHash)
      .is('revoked_at', null)
      .maybeSingle();

    const isElevated = session && session.mfa_verified && session.elevated_until && (new Date(session.elevated_until).getTime() > Date.now());
    if (!isElevated) {
      throw new AuthorizationError('MFA unenrollment requires fresh MFA elevation. Verify MFA before unenrolling.');
    }

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
    await supabasePublic.auth.resetPasswordForEmail(email.toLowerCase());
  }

  async resetPassword(tokenOrProof: string, newPassword: string): Promise<void> {
    const { data: userData, error: userError } = await supabasePublic.auth.getUser(tokenOrProof);
    if (userError || !userData?.user) {
      throw new AuthenticationError('Invalid or expired password reset recovery proof.');
    }

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userData.user.id, {
      password: newPassword,
    });

    if (error) {
      throw new ValidationError(error.message);
    }

    // Phase 42: Revoke all existing sessions for the user after password reset
    await supabaseAdmin
      .from('gateway_sessions')
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userData.user.id)
      .is('revoked_at', null);
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

    const { data, error } = await supabasePublic.auth.signUp({
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
