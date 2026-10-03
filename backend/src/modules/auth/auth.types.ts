import { RegisterInput } from './auth.validation.js';

export interface RegisterResult {
  userId: string;
  accountType: 'citizen' | 'government' | 'contractor';
  requiresApproval: boolean;
}
