import { supabaseAdmin } from '../../core/database/supabase.js';
import { RegisterInput } from './auth.validation.js';
import { RegisterResult } from './auth.types.js';
import { ConflictError, ValidationError } from '../../core/http/errors.js';

export class AuthService {
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
