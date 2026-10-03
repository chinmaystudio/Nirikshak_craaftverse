import { AuthClient } from './authClient';
import type { AppSession } from './authTypes';

export async function getCurrentSession(): Promise<AppSession | null> {
  const user = await AuthClient.getCurrentUser();
  if (!user) return null;
  return AuthClient.resolveUserSession(user);
}
