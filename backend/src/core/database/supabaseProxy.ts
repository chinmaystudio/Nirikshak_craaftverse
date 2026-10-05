import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../auth/auth.middleware.js';
import { env } from '../config/env.js';

const MAX_BODY_BYTES = 10 * 1024 * 1024;
const MAX_RESPONSE_BYTES = 20 * 1024 * 1024;
const ALLOWED_METHODS = new Set(['GET', 'HEAD', 'POST', 'PATCH', 'PUT', 'DELETE']);
const ALLOWED_RPC = new Set(['submit_progress_update', 'save_tender_bid', 'approve_progress_update']);

/** User-scoped Supabase Data API bridge. Browser credentials never reach Supabase. */
export async function supabaseProxy(req: Request, res: Response): Promise<void> {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.supabaseAccessToken || !ALLOWED_METHODS.has(req.method)) {
    res.status(405).json({ message: 'Method or session unavailable' });
    return;
  }

  const source = new URL(req.originalUrl, 'http://localhost');
  const prefix = '/api/supabase-proxy/';
  const path = source.pathname.startsWith(prefix) ? source.pathname.slice(prefix.length) : '';
  const isRest = /^rest\/v1\/[A-Za-z_][A-Za-z0-9_]*$/.test(path) || /^rest\/v1\/rpc\/[A-Za-z_][A-Za-z0-9_]*$/.test(path);
  const isStorage = /^storage\/v1\/object\/[A-Za-z0-9_./%\-]+$/.test(path);
  if ((!isRest && !isStorage) || path.includes('..') || /%2f|%5c|%2e/i.test(path)) {
    res.status(404).json({ message: 'Resource unavailable' });
    return;
  }
  if (path.startsWith('rest/v1/rpc/') && !ALLOWED_RPC.has(path.slice('rest/v1/rpc/'.length))) {
    res.status(403).json({ message: 'RPC unavailable' });
    return;
  }

  try {
    const headers = new Headers({
      apikey: env.SUPABASE_ANON_KEY,
      Authorization: `Bearer ${authReq.supabaseAccessToken}`,
    });
    for (const name of ['content-type', 'accept', 'prefer', 'range', 'x-upsert']) {
      const value = req.header(name);
      if (value) headers.set(name, value);
    }

    let body: Buffer | undefined;
    if (!['GET', 'HEAD'].includes(req.method)) {
      if (req.body !== undefined) {
        body = Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body));
      } else {
        const chunks: Buffer[] = [];
        let size = 0;
        for await (const chunk of req) {
          const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk);
          size += buffer.length;
          if (size > MAX_BODY_BYTES) {
            res.status(413).json({ message: 'Upload exceeds limit' });
            return;
          }
          chunks.push(buffer);
        }
        body = Buffer.concat(chunks);
      }
      if (body.length > MAX_BODY_BYTES) {
        res.status(413).json({ message: 'Request exceeds limit' });
        return;
      }
    }

    const upstream = new URL(`${path}${source.search}`, `${env.SUPABASE_URL.replace(/\/$/, '')}/`);
    const response = await fetch(upstream, { method: req.method, headers, body: body ? Uint8Array.from(body) : undefined });
    const length = Number(response.headers.get('content-length') || 0);
    if (length > MAX_RESPONSE_BYTES) {
      res.status(502).json({ message: 'Upstream response exceeds limit' });
      return;
    }
    const bytes = Buffer.from(await response.arrayBuffer());
    if (bytes.length > MAX_RESPONSE_BYTES) {
      res.status(502).json({ message: 'Upstream response exceeds limit' });
      return;
    }
    for (const name of ['content-type', 'content-range', 'etag']) {
      const value = response.headers.get(name);
      if (value) res.setHeader(name, value);
    }
    res.status(response.status).send(bytes);
  } catch {
    res.status(502).json({ message: 'Data service unavailable' });
  }
}
