import { AppRole } from './roles.js';

export interface UserContext {
  userId: string;
  email?: string;
  role: AppRole;
  organizationId: string | null;
  organizationType: 'government' | 'contractor' | null;
  organizationName?: string;
  permissions: string[];
}
