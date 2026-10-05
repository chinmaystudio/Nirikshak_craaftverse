import { env } from '../config/env';
import { ApiError } from './apiError';
import type { ApiResponse } from './response';

class ApiClient {
  private get baseUrl(): string {
    return env.API_BASE_URL || '';
  }

  private getCsrfToken(): string | null {
    if (typeof document === 'undefined') return null;
    const match = document.cookie.match(/nirikshak_csrf=([^;]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    let resolvedPath = path.startsWith('/') ? path : `/${path}`;
    let url: string;
    if (path.startsWith('http')) {
      url = path;
    } else if (this.baseUrl) {
      const cleanBase = this.baseUrl.replace(/\/$/, '');
      if (cleanBase.endsWith('/api') && resolvedPath.startsWith('/api/')) {
        resolvedPath = resolvedPath.slice(4);
      }
      url = `${cleanBase}${resolvedPath}`;
    } else {
      url = resolvedPath;
    }

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
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
        credentials: 'same-origin', // Zero-trust: HttpOnly session cookie handles authentication
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
