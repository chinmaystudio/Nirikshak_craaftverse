import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { env } from '../config/env';

if (!env.SUPABASE_URL || !env.SUPABASE_PUBLISHABLE_KEY) {
  console.warn('[NIRIKSHAK] VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY missing.');
}

const isDemo = env.DATA_MODE === 'DEMO';

export async function bffSupabaseFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  if (isDemo) return fetch(input, init);
  const requestUrl = new URL(input instanceof Request ? input.url : String(input));
  const configuredOrigin = new URL(env.SUPABASE_URL).origin;
  if (requestUrl.origin !== configuredOrigin || !/^\/(rest|storage)\/v1\//.test(requestUrl.pathname)) {
    throw new Error('Direct browser Supabase access is disabled in LIVE mode');
  }

  const headers = new Headers(init?.headers || (input instanceof Request ? input.headers : undefined));
  headers.delete('apikey');
  headers.delete('authorization');
  const method = (init?.method || (input instanceof Request ? input.method : 'GET')).toUpperCase();
  if (!['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const csrf = typeof document !== 'undefined'
      ? document.cookie.match(/(?:^|;\s*)nirikshak_csrf=([^;]+)/)?.[1]
      : undefined;
    if (csrf) headers.set('X-CSRF-Token', decodeURIComponent(csrf));
  }
  const path = `/api/supabase-proxy${requestUrl.pathname}${requestUrl.search}`;
  return fetch(path, {
    ...init,
    method,
    headers,
    body: init?.body || (input instanceof Request ? input.body : undefined),
    credentials: 'same-origin',
  });
}

/**
 * Browser Supabase client.
 * In LIVE mode, authentication is strictly managed by Express BFF via HttpOnly cookies;
 * browser does NOT persist sessions or auto-refresh tokens directly with Supabase.
 */
export const supabase = createClient<Database>(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: isDemo,
    autoRefreshToken: isDemo,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  global: { fetch: bffSupabaseFetch },
});
