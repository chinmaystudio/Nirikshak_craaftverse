export * from '@/lib/auth/authTypes';
export { CanonicalRoles as AppRoles } from '@/lib/auth/authTypes';

export const GOVERNMENT_ROLES = [
  'government_admin',
  'chief_engineer',
  'project_officer',
  'government_engineer',
  'auditor',
] as const;

export const CONTRACTOR_ROLES = [
  'contractor_admin',
  'contractor_manager',
  'contractor_engineer',
  'contractor_site_engineer',
] as const;
