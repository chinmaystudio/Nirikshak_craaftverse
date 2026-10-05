import { supabase } from '../supabase/client';
import { apiClient } from '../api/apiClient';
import { env } from '../config/env';
import type { User, Session } from '@supabase/supabase-js';
import type { AppRole, AppSession, Profile, Organization, PendingApproval } from './authTypes';

export class AuthClient {
  private static friendlyError(message?: string): string {
    const value = (message || '').toLowerCase();
    if (value.includes('invalid login credentials') || value.includes('invalid email or password')) return 'Incorrect email or password.';
    if (value.includes('email not confirmed')) return 'Your account is awaiting email confirmation.';
    if (value.includes('rate limit') || value.includes('too many')) return 'Too many attempts. Please wait a few minutes and try again.';
    if (value.includes('user already registered') || value.includes('already exists')) return 'An account with this email already exists. Please sign in instead.';
    return message || 'Authentication failed. Please try again.';
  }

  /**
   * Builds an AppSession from a server-verified BFF user context.
   */
  static buildSessionFromApiUser(u: any): AppSession {
    const role: AppRole = (u.role as AppRole) || 'citizen';
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

    const userId = u.userId || u.id || 'anonymous';
    const email = u.email || 'user@nirikshak.gov.in';

    const userObj = {
      id: userId,
      email,
      app_metadata: {},
      user_metadata: { full_name: u.fullName || u.organizationName || email.split('@')[0] },
      aud: 'authenticated',
      created_at: '',
    } as unknown as User;

    const profile: Profile = {
      id: userId,
      full_name: u.fullName || u.organizationName || email.split('@')[0] || 'User',
      phone: u.phone || null,
      avatar_url: null,
      city: u.city || null,
      state: u.state || null,
    };

    const organization: Organization | null = u.organizationId ? {
      id: u.organizationId,
      name: u.organizationName || 'Organization',
      type: (u.organizationType as any) || (role.startsWith('contractor') ? 'contractor' : 'government'),
      state: u.state || null,
      district: u.district || null,
      department: u.department || null,
    } : null;

    return {
      user: userObj,
      profile,
      organization,
      role,
      permissions,
      pendingApproval: null,
    };
  }

  /**
   * Sanitizes redirect path to ensure it is strictly internal.
   * Rejects external URLs, protocol-relative URLs (//), backslash bypasses (/\ or \), and script schemes.
   */
  static sanitizeRedirectPath(path?: string): string {
    if (!path || typeof path !== 'string') return '/';
    const trimmed = path.trim().replace(/\0/g, '');
    if (
      trimmed.startsWith('http://') ||
      trimmed.startsWith('https://') ||
      trimmed.startsWith('//') ||
      trimmed.startsWith('/\\') ||
      trimmed.includes('\\') ||
      trimmed.startsWith('javascript:') ||
      trimmed.startsWith('data:')
    ) {
      return '/';
    }
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }

  /**
   * Resolves authoritative user profile, organization, and role.
   * In LIVE mode, requests authoritative session from Express BFF.
   */
  static async resolveUserSession(user: User): Promise<AppSession> {
    if (env.DATA_MODE !== 'DEMO') {
      try {
        const res = await apiClient.get<{ user: any; mfaVerified?: boolean }>('/api/auth/session');
        if (res?.user) {
          return this.buildSessionFromApiUser(res.user);
        }
      } catch (e) {
        console.warn('[AuthClient] BFF session lookup failed, building fallback session:', e);
      }
      return this.buildSessionFromApiUser({
        id: user.id,
        email: user.email,
        fullName: user.user_metadata?.full_name,
        role: 'citizen',
      });
    }

    // DEMO mode fallback: query local Supabase client directly
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
    if (env.DATA_MODE !== 'DEMO') {
      try {
        const user = await this.getCurrentUser();
        if (!user) return null;
        return {
          access_token: 'opaque-cookie-managed',
          refresh_token: '',
          expires_in: 604800,
          token_type: 'bearer',
          user,
        } as unknown as Session;
      } catch {
        return null;
      }
    }
    const { data } = await supabase.auth.getSession();
    return data.session;
  }

  static async getCurrentUser(): Promise<User | null> {
    if (env.DATA_MODE !== 'DEMO') {
      try {
        const res = await apiClient.get<{ user: any; mfaVerified?: boolean }>('/api/auth/session');
        if (res?.user) {
          return {
            id: res.user.userId || res.user.id,
            email: res.user.email,
            app_metadata: {},
            user_metadata: {
              full_name: res.user.fullName || res.user.organizationName,
            },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
          } as unknown as User;
        }
        return null;
      } catch {
        return null;
      }
    }
    const { data } = await supabase.auth.getUser();
    return data.user;
  }

  static async signIn(email: string, password: string): Promise<AppSession> {
    if (env.DATA_MODE !== 'DEMO') {
      try {
        const res = await apiClient.post<{ user: any; csrfToken?: string }>('/api/auth/login', {
          email,
          password,
        });
        return this.buildSessionFromApiUser(res.user);
      } catch (err: any) {
        throw new Error(this.friendlyError(err?.message));
      }
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data.user) {
      throw new Error(this.friendlyError(error?.message));
    }
    return await this.resolveUserSession(data.user);
  }

  static async signInWithGoogle(redirectTo?: string): Promise<void> {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const safePath = this.sanitizeRedirectPath(
      redirectTo || (typeof window !== 'undefined' ? window.location.pathname : '/')
    );
    const redirectUrl = `${origin}${safePath}`;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) {
      throw new Error(error.message);
    }
  }

  static async signUp(payload: {
    email: string;
    password: string;
    fullName: string;
    phone?: string;
    metadata?: Record<string, any>;
  }): Promise<{ user: User | null; session: Session | null }> {
    return this.registerCitizen({
      email: payload.email,
      password: payload.password,
      fullName: payload.fullName,
      phone: payload.phone,
      city: payload.metadata?.city,
      ward: payload.metadata?.ward,
      preferredLanguage: payload.metadata?.preferredLanguage,
    });
  }

  static async signOut(): Promise<void> {
    if (env.DATA_MODE !== 'DEMO') {
      try {
        await apiClient.post('/api/auth/logout');
      } catch (err) {
        console.warn('[AuthClient] BFF logout error:', err);
      }
    }
    await supabase.auth.signOut().catch(() => {});
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
    if (env.DATA_MODE !== 'DEMO') {
      const appSession = await this.signIn(payload.email, payload.password);
      return { user: appSession.user, session: null };
    }
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
  }): Promise<{ user: User | null; message: string }> {
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
      user: null,
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
  }): Promise<{ user: User | null; message: string }> {
    await apiClient.post('/api/auth/register', {
      accountType: 'contractor',
      ...payload,
    });
    return {
      user: null,
      message: 'Your contractor organization verification is pending administrator approval.',
    };
  }

  static onAuthStateChange(callback: (session: Session | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session);
    });
  }
}
