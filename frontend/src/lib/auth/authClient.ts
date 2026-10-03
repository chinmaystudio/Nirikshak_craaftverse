import { supabase } from '../supabase/client';
import { apiClient } from '../api/apiClient';
import type { User, Session } from '@supabase/supabase-js';
import type { AppRole, AppSession, Profile, Organization, PendingApproval } from './authTypes';

export class AuthClient {
  private static friendlyError(message?: string): string {
    const value = (message || '').toLowerCase();
    if (value.includes('invalid login credentials')) return 'Incorrect email or password.';
    if (value.includes('email not confirmed')) return 'Your account is awaiting email confirmation.';
    if (value.includes('rate limit') || value.includes('too many')) return 'Too many attempts. Please wait a few minutes and try again.';
    if (value.includes('user already registered') || value.includes('already exists')) return 'An account with this email already exists. Please sign in instead.';
    return message || 'Authentication failed. Please try again.';
  }

  /**
   * Resolves authoritative user profile, organization, and role directly from Supabase DB.
   */
  static async resolveUserSession(user: User): Promise<AppSession> {
    // 1. Fetch Profile
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (profileError) throw profileError;

    const profile: Profile = profileData || {
      id: user.id,
      full_name: (user.user_metadata?.full_name || user.email?.split('@')[0]) ?? 'User',
      phone: user.phone || user.user_metadata?.phone || null,
      avatar_url: null,
      city: user.user_metadata?.city || null,
      state: user.user_metadata?.state || null,
    };

    // 2. Fetch Active Organization Membership
    const { data: memberRows, error: memberError } = await supabase
      .from('organization_members')
      .select('*, organizations(*)')
      .eq('user_id', user.id)
      .ilike('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1);

    if (memberError) {
      console.warn('[AuthClient] Membership lookup error:', memberError.message);
    }

    const memberData = memberRows && memberRows.length > 0 ? memberRows[0] : null;

    let role: AppRole = 'citizen';
    let organization: Organization | null = null;
    let pendingApproval: PendingApproval | null = null;

    if (memberData) {
      role = memberData.role as AppRole;
      if (memberData.organizations) {
        organization = memberData.organizations as Organization;
      }
    } else {
      // Check for pending Government or Contractor access requests
      const { data: govReq } = await supabase
        .from('government_access_requests')
        .select('id, status, department, designation')
        .eq('user_id', user.id)
        .maybeSingle();

      if (govReq) {
        if (govReq.status === 'PENDING') {
          pendingApproval = {
            type: 'government',
            status: 'PENDING',
            message: 'Government access request pending administrator approval.',
          };
        } else if (govReq.status === 'REJECTED') {
          pendingApproval = {
            type: 'government',
            status: 'REJECTED',
            message: 'Your government access request was not approved.',
          };
        }
      } else {
        const { data: contReq } = await supabase
          .from('contractor_access_requests')
          .select('id, status, company_name')
          .eq('user_id', user.id)
          .maybeSingle();

        if (contReq) {
          if (contReq.status === 'PENDING') {
            pendingApproval = {
              type: 'contractor',
              status: 'PENDING',
              message: 'Contractor organization verification is pending administrator approval.',
            };
          } else if (contReq.status === 'REJECTED') {
            pendingApproval = {
              type: 'contractor',
              status: 'REJECTED',
              message: 'Your contractor organization onboarding was not approved.',
            };
          }
        }
      }
    }

    // Compute informational UX permissions
    const permissions: string[] = [];
    if (role.startsWith('government') || role === 'chief_engineer' || role === 'project_officer' || role === 'auditor') {
      permissions.push('government:access', 'projects:read', 'tenders:read');
      if (role === 'government_admin' || role === 'chief_engineer') {
        permissions.push('projects:write', 'tenders:write', 'contracts:award', 'progress:verify');
      }
    } else if (role.startsWith('contractor')) {
      permissions.push('contractor:access', 'tenders:read', 'bids:submit', 'progress:submit');
    } else {
      permissions.push('citizen:access', 'complaints:submit', 'projects:public_read');
    }

    return {
      user,
      profile,
      organization,
      role,
      permissions,
      pendingApproval,
    };
  }

  static async getSession(): Promise<Session | null> {
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  static async getCurrentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    return data.user;
  }

  static async signIn(email: string, password: string): Promise<AppSession> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      throw new Error(this.friendlyError(error?.message));
    }
    return await this.resolveUserSession(data.user);
  }

  static async signOut(): Promise<void> {
    await supabase.auth.signOut();
  }

  static async registerCitizen(payload: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    city?: string;
    ward?: string;
    preferredLanguage?: string;
  }): Promise<{ user: User | null; session: Session | null }> {
    await apiClient.post('/api/auth/register', {
      accountType: 'citizen',
      ...payload,
    });
    const { data, error } = await supabase.auth.signInWithPassword({
      email: payload.email,
      password: payload.password,
    });
    if (error || !data.user || !data.session) throw new Error(this.friendlyError(error?.message));
    return data;
  }

  static async registerGovernment(payload: {
    fullName: string;
    officialEmail: string;
    employeeId: string;
    department: string;
    designation: string;
    state: string;
    district: string;
    password: string;
  }): Promise<{ message: string }> {
    await apiClient.post('/api/auth/register', {
      accountType: 'government',
      email: payload.officialEmail,
      password: payload.password,
      fullName: payload.fullName,
      employeeId: payload.employeeId,
      department: payload.department,
      designation: payload.designation,
      state: payload.state,
      district: payload.district,
    });
    return {
      message: 'Registration request submitted. Your Government access is pending administrator approval.',
    };
  }

  static async registerContractor(payload: {
    fullName: string;
    email: string;
    phone: string;
    companyName: string;
    registrationCin: string;
    gstin: string;
    contractorClass: string;
    state: string;
    district: string;
    password: string;
  }): Promise<{ message: string }> {
    await apiClient.post('/api/auth/register', {
      accountType: 'contractor',
      ...payload,
    });
    return {
      message: 'Your contractor organization verification is pending administrator approval.',
    };
  }

  static onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  }
}
