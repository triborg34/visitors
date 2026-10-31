import type { ApiResponse, PageMeta } from '../types';

export class ApiRequestError extends Error {
  status: number;
  code: string;
  details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  /** پیام‌های میدانی به تفکیک فیلد برای نمایش کنار ورودی‌ها */
  get fieldErrors(): Record<string, string[]> {
    if (this.details && typeof this.details === 'object' && !Array.isArray(this.details)) {
      const out: Record<string, string[]> = {};
      for (const [key, value] of Object.entries(this.details as Record<string, unknown>)) {
        out[key] = Array.isArray(value) ? (value as string[]) : [String(value)];
      }
      return out;
    }
    return {};
  }
}

function readCookie(name: string): string | undefined {
  const match = document.cookie
    .split(';')
    .map((part) => part.trim())
    .find((part) => part.startsWith(name + '='));
  return match ? decodeURIComponent(match.slice(name.length + 1)) : undefined;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
  const method = options.method ?? 'GET';
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (options.body !== undefined) headers['Content-Type'] = 'application/json';
  if (method !== 'GET') {
    const csrf = readCookie('amn_csrf');
    if (csrf) headers['x-csrf-token'] = csrf;
  }

  let response: Response;
  try {
    response = await fetch(path, {
      method,
      headers,
      credentials: 'include',
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      signal: options.signal,
    });
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error;
    throw new ApiRequestError(0, 'NETWORK_ERROR', 'ارتباط با سرور برقرار نشد. اتصال شبکه را بررسی کنید.');
  }

  let payload: unknown = null;
  const contentType = response.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    payload = await response.json().catch(() => null);
  }

  if (!response.ok) {
    const errorBody = (payload as { error?: { code?: string; message?: string; details?: unknown } } | null)
      ?.error;
    throw new ApiRequestError(
      response.status,
      errorBody?.code ?? 'UNKNOWN',
      errorBody?.message ?? 'خطایی رخ داد. لطفاً دوباره تلاش کنید.',
      errorBody?.details,
    );
  }

  return payload as ApiResponse<T>;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal) => request<T>(path, { method: 'GET', signal }),
  post: <T>(path: string, body?: unknown, signal?: AbortSignal) =>
    request<T>(path, { method: 'POST', body, signal }),
  put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
  patch: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PATCH', body }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};

export function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? '?' + query : '';
}

export async function downloadFile(path: string, fallbackName: string): Promise<void> {
  const csrf = readCookie('amn_csrf');
  const response = await fetch(path, {
    credentials: 'include',
    headers: csrf ? { 'x-csrf-token': csrf } : {},
  });
  if (!response.ok) {
    throw new ApiRequestError(response.status, 'EXPORT_FAILED', 'دریافت فایل خروجی ناموفق بود.');
  }
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fallbackName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export type { PageMeta };
