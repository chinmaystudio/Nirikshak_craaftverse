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

export const GovernmentRoles: AppRole[] = [
  'government_admin',
  'chief_engineer',
  'project_officer',
  'government_engineer',
  'auditor',
];

export const ContractorRoles: AppRole[] = [
  'contractor_admin',
  'contractor_manager',
  'contractor_engineer',
  'contractor_site_engineer',
];

export function isGovernmentRole(role?: string): boolean {
  return GovernmentRoles.includes(role as AppRole);
}

export function isContractorRole(role?: string): boolean {
  return ContractorRoles.includes(role as AppRole);
}
