import type { User, Session } from '@supabase/supabase-js';

export const CanonicalRoles = [
  'citizen',
  'government_admin',
  'chief_engineer',
  'project_officer',
  'government_engineer',
  'auditor',
  'contractor_admin',
  'contractor_manager',
  'contractor_engineer',
  'contractor_site_engineer',
] as const;

export type AppRole = typeof CanonicalRoles[number];

export interface Profile {
  id: string;
  full_name: string;
  phone?: string | null;
  avatar_url?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface Organization {
  id: string;
  name: string;
  type: 'government' | 'contractor';
  state?: string | null;
  district?: string | null;
  department?: string | null;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: string;
  status: string;
  organizations?: Organization;
}

export interface PendingApproval {
  type: 'government' | 'contractor';
  status: 'PENDING' | 'REJECTED' | 'APPROVED';
  message?: string;
}

export interface AppSession {
  user: User;
  profile: Profile;
  organization: Organization | null;
  role: AppRole;
  permissions: string[];
  pendingApproval?: PendingApproval | null;
}
