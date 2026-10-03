import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';

if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY || !env.SUPABASE_ANON_KEY) {
  throw new Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_ANON_KEY are required by the backend.');
}

/**
 * Service role client strictly for server-side elevated administrative actions
 * (e.g. creating auth users, writing audit logs, checking raw organization memberships).
 * NEVER expose this or its key to the browser.
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
export const supabase = supabaseAdmin;


/**
 * Public client for querying unauthenticated public views (respecting public RLS policies).
 */
export const supabasePublic = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

/**
 * Creates a scoped client bound to the caller's JWT access token so PostgreSQL Row Level Security (RLS) applies.
 */
export async function createAuthenticatedClient(accessToken: string): Promise<SupabaseClient> {
  const { data, error } = await supabaseAdmin.auth.getUser(accessToken);
  if (error || !data.user) {
    throw new Error('Invalid or expired access token');
  }
  return createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${accessToken}` } },
  });
}
