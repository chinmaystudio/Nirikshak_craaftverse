import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;
if (!supabaseUrl || !serviceRoleKey || !anonKey) {
  throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY are required by the backend.');
}
const requiredSupabaseUrl = supabaseUrl;
const requiredAnonKey = anonKey;

export const supabaseAdmin = createClient(requiredSupabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Least-privileged client for endpoints that expose only RLS-approved public data. */
export const supabasePublic = createClient(requiredSupabaseUrl, requiredAnonKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/** Creates a client bound to the authenticated user's JWT so RLS applies. */
export async function createAuthenticatedClient(accessToken: string) {
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) throw new Error('Invalid or expired access token');
  return createClient(requiredSupabaseUrl, requiredAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
