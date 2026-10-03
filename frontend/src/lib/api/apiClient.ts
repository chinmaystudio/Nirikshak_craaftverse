import { supabase } from '../supabase/client';
import { env } from '../config/env';
import { ApiError } from './apiError';
import type { ApiResponse } from './response';

class ApiClient {
  private get baseUrl(): string {
    return env.API_BASE_URL || '/api';
  }

  private async getAuthHeader(): Promise<Record<string, string>> {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) {
        return { Authorization: `Bearer ${token}` };
      }
    } catch {
      // In cookie-only zero-trust session mode, auth is transmitted via HttpOnly cookie
    }
    return {};
  }

  private getCsrfToken(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/nirikshak_csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const authHeaders = await this.getAuthHeader();
    const url = path.startsWith('http') ? path : `${this.baseUrl}${path.startsWith('/') ? path : `/${path}`}`;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...authHeaders,
      ...(options.headers as Record<string, string>),
    };

    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      const csrfToken = this.getCsrfToken();
      if (csrfToken && !headers['X-CSRF-Token']) {
        headers['X-CSRF-Token'] = csrfToken;
      }
    }

    let response: Response;
    try {
      response = await fetch(url, {
        ...options,
        headers,
        credentials: 'same-origin',
      });
    } catch (err: any) {
      throw new ApiError(err?.message || 'Network connection failed', 'NETWORK_ERROR', 0);
    }

    let payload: ApiResponse<T> | null = null;
    try {
      payload = await response.json();
    } catch {
      payload = null;
    }

    if (!response.ok || !payload?.success) {
      const code = payload?.error?.code || `HTTP_${response.status}`;
      const message = payload?.error?.message || response.statusText || 'API request failed';
      throw new ApiError(message, code, response.status);
    }

    return payload.data as T;
  }

  async get<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: 'GET', headers });
  }

  async post<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  async put<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(path, {
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  async patch<T>(path: string, body?: unknown, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
      headers,
    });
  }

  async delete<T>(path: string, headers?: Record<string, string>): Promise<T> {
    return this.request<T>(path, { method: 'DELETE', headers });
  }
}

export const apiClient = new ApiClient();
