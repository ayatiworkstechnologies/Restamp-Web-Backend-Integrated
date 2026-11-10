/**
 * RESTAMP backend API client for the website.
 *
 * - Base URL comes from NEXT_PUBLIC_API_URL. Unset: local backend in
 *   development, the live RESTAMP API (https://api.restamp.in) in production
 *   builds (same rule as the mobile app). The URL is fixed per page load; requests never switch
 *   hosts after a failure.
 * - Every failure is an ApiError with a `kind` the UI branches on:
 *   login (401) | denied (403) | missing (404) | validation (400/422) |
 *   retry (5xx/other) | timeout | offline. `detail` carries the backend's
 *   static detail string when it sent one (never credentials).
 * - Requests time out after 25 s (the Render free plan cold-starts slowly).
 * - The bearer token is read from the session module; this file never
 *   stores or logs it.
 */
import { getSessionToken, handleUnauthorized } from './session';

const DEFAULT_LOCAL_API_URL = 'http://127.0.0.1:8000';
const DEFAULT_PROD_API_URL = 'https://api.restamp.in';

function resolveApiBaseUrl(): string {
  const configured = (process.env.NEXT_PUBLIC_API_URL || '').trim().replace(/\/+$/, '');
  if (configured) return configured;
  return process.env.NODE_ENV === 'production' ? DEFAULT_PROD_API_URL : DEFAULT_LOCAL_API_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();
export const REQUEST_TIMEOUT_MS = 25000;

export type ApiErrorKind =
  | 'login'
  | 'denied'
  | 'missing'
  | 'validation'
  | 'retry'
  | 'timeout'
  | 'offline';

export class ApiError extends Error {
  kind: ApiErrorKind;
  status: number;
  detail?: string;

  constructor(kind: ApiErrorKind, status: number, message: string, detail?: string) {
    super(message);
    this.kind = kind;
    this.status = status;
    this.detail = detail;
  }
}

export function isApiError(e: unknown, kind?: ApiErrorKind): e is ApiError {
  return e instanceof ApiError && (kind === undefined || e.kind === kind);
}

function kindForStatus(status: number): ApiErrorKind {
  if (status === 401) return 'login';
  if (status === 403) return 'denied';
  if (status === 404) return 'missing';
  if (status === 400 || status === 422) return 'validation';
  return 'retry';
}

/** Plain-language message for an API failure, safe to show to users. */
export function errorMessage(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!isApiError(e)) return fallback;
  switch (e.kind) {
    case 'offline':
      return 'Could not reach the Restamp server. Check your connection and try again.';
    case 'timeout':
      return 'The server took too long to respond. Please try again.';
    case 'login':
      return 'Your session has ended. Please log in again.';
    case 'denied':
      return "You don't have permission to do that.";
    case 'missing':
      return 'This item could not be found. It may have been removed.';
    case 'validation':
      return e.detail && e.detail !== 'Invalid request' ? e.detail : 'Please check the details and try again.';
    default:
      return fallback;
  }
}

type Query = Record<string, string | number | boolean | null | undefined>;

function buildUrl(path: string, query?: Query): string {
  const qs = Object.entries(query || {})
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join('&');
  return `${API_BASE_URL}${path}${qs ? `?${qs}` : ''}`;
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  query?: Query;
  body?: unknown;
  /** Send the session token. Public endpoints pass false. */
  auth?: boolean;
  signal?: AbortSignal;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', query, body, auth = true, signal } = options;
  const headers: Record<string, string> = { Accept: 'application/json' };
  const isForm = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';
  if (auth) {
    const token = getSessionToken();
    if (token) headers.Authorization = `Bearer ${token}`;
  }

  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener('abort', onCallerAbort, { once: true });

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
      signal: controller.signal,
    });
  } catch (e) {
    if (timedOut) throw new ApiError('timeout', 0, 'The request timed out.');
    // A caller-initiated abort is rethrown untouched so it is never shown as an error.
    if (signal?.aborted) throw e;
    throw new ApiError('offline', 0, 'Could not reach the server.');
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
  }

  if (response.ok) {
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  let detail: string | undefined;
  try {
    const data = await response.json();
    if (data && typeof data.detail === 'string') detail = data.detail;
  } catch {
    // Non-JSON error body: keep the generic message.
  }
  // An authenticated request that comes back 401 means the token is no
  // longer accepted (expired or revoked): end the local session.
  if (response.status === 401 && auth && getSessionToken()) handleUnauthorized();
  throw new ApiError(kindForStatus(response.status), response.status, `Request failed (${response.status}).`, detail);
}

export const apiGet = <T>(path: string, query?: Query, auth = true) => apiRequest<T>(path, { query, auth });
export const apiPost = <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'POST', body });
export const apiPatch = <T>(path: string, body?: unknown) => apiRequest<T>(path, { method: 'PATCH', body });
export const apiDelete = <T = void>(path: string) => apiRequest<T>(path, { method: 'DELETE' });

/** Paginated list envelope used by every backend list endpoint. */
export type Page<T> = { items: T[]; page: number; page_size: number; total: number };
