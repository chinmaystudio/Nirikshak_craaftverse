export const CANONICAL_ROLES = [
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

export type AppRole = typeof CANONICAL_ROLES[number];

export const ROLE_LABELS: Record<AppRole, string> = {
  citizen: 'Citizen / Public',
  government_admin: 'Government Administrator',
  chief_engineer: 'Chief Engineer',
  project_officer: 'Project Officer',
  government_engineer: 'Executive Engineer',
  auditor: 'Public Works Auditor',
  contractor_admin: 'Contractor Administrator',
  contractor_manager: 'Contractor Project Manager',
  contractor_engineer: 'Contractor Lead Engineer',
  contractor_site_engineer: 'Contractor Site Engineer',
};
