import { AuthClient } from '@/lib/auth/authClient';

/**
 * Compatibility re-export facade.
 * Directs all callers to the single canonical AuthClient in src/lib/auth/authClient.ts.
 */
export const AuthService = AuthClient;
export default AuthService;
