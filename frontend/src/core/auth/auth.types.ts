import type { User } from '@supabase/supabase-js';

export type AppRole =
  | 'citizen'
  | 'government_admin'
  | 'chief_engineer'
  | 'project_officer'
  | 'government_engineer'
  | 'auditor'
  | 'contractor_admin'
  | 'contractor_manager'
  | 'contractor_site_engineer';

export const GOVERNMENT_ROLES: AppRole[] = [
  'government_admin',
  'chief_engineer',
  'project_officer',
  'government_engineer',
  'auditor',
];

export const CONTRACTOR_ROLES: AppRole[] = [
  'contractor_admin',
  'contractor_manager',
  'contractor_site_engineer',
];

export interface Profile {
  id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  city: string | null;
  state: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Organization {
  id: string;
  name: string;
  type: string;
  department?: string | null;
  state?: string | null;
  district?: string | null;
  verified?: boolean;
}

export interface OrganizationMember {
  id: string;
  organization_id: string;
  user_id: string;
  role: AppRole;
  status: string;
}

export interface AppSession {
  user: User;
  profile: Profile | null;
  organization: Organization | null;
  role: AppRole;
  permissions: string[];
  pendingApproval?: {
    type: 'government' | 'contractor';
    status: 'PENDING' | 'REJECTED' | 'APPROVED';
    message?: string;
  } | null;
}
