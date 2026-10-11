import { useAuth } from '@/store/authStore';

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5050/api';
export const WEBSITE_URL = import.meta.env.VITE_WEBSITE_URL ?? 'http://localhost:5173';

/** Product photos live in the storefront's public folder, so relative paths point at the website. */
export const assetUrl = (src?: string) => (src && src.startsWith('/') ? WEBSITE_URL + src : src);

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

/** Fetch wrapper for /api/admin/* — adds the admin token and logs out on 401. */
export async function api<T = unknown>(path: string, options: { method?: string; body?: unknown; query?: Record<string, unknown> } = {}): Promise<T> {
  const url = new URL(API_URL + '/admin' + path);
  Object.entries(options.query ?? {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  });
  const token = useAuth.getState().token;
  let res: Response;
  try {
    res = await fetch(url, {
      method: options.method ?? 'GET',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Is the backend running on port 5050?');
  }
  const json = await res.json().catch(() => ({}));
  if (res.status === 401 && token) useAuth.getState().logout();
  if (!res.ok) throw new ApiError(res.status, json.message ?? `Request failed (${res.status})`);
  return json as T;
}

export interface Paged<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}
