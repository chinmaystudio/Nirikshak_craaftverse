import { supabase, supabaseAdmin } from '../../core/database/supabase.js';
import { RegisterInput, LoginInput } from './auth.validation.js';
import { RegisterResult } from './auth.types.js';
import { ConflictError, ValidationError, AuthenticationError } from '../../core/http/errors.js';
import { generateCsrfToken } from '../../core/security/csrf.js';

export interface LoginResult {
  userId: string;
  email: string;
  role: string;
  organizationId: string | null;
  organizationName?: string;
  organizationType?: string;
  accessToken: string;
  refreshToken?: string;
  csrfToken: string;
}

export class AuthService {
  async login(input: LoginInput): Promise<LoginResult> {
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

    const csrfToken = generateCsrfToken();

    return {
      userId: authData.user.id,
      email: authData.user.email!,
      role,
      organizationId: orgId,
      organizationName: org?.name,
      organizationType: org?.type,
      accessToken: authData.session.access_token,
      refreshToken: authData.session.refresh_token,
      csrfToken,
    };
  }

  async forgotPassword(email: string): Promise<void> {
    await supabase.auth.resetPasswordForEmail(email.toLowerCase());
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const { error } = await supabaseAdmin.auth.admin.updateUserById(token, {
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
        registration_cin: input.registrationCin,
        gstin: input.gstin,
        contractor_class: input.contractorClass,
        state: input.state,
        district: input.district,
      });
    }

    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email: input.email.toLowerCase(),
      password: input.password,
      email_confirm: true,
      user_metadata: metadata,
    });

    if (error || !data.user) {
      console.error('[AuthService.register] Account creation failure', {
        code: error?.code,
        status: error?.status,
        message: error?.message,
      });
      const duplicate = error?.message?.toLowerCase().includes('already') || error?.status === 422;
      if (duplicate) {
        throw new ConflictError('An account with this email already exists. Please sign in instead.');
      }
      throw new ValidationError(error?.message || 'Could not create account with supplied details.');
    }

    return {
      userId: data.user.id,
      accountType: input.accountType,
      requiresApproval: input.accountType !== 'citizen',
    };
  }
}

export const authService = new AuthService();
