/**
 * Authentication and account endpoints.
 *
 * - POST /auth/otp/request {phone} -> {message[, debug_code]}. debug_code is
 *   present ONLY when the backend runs in its local OTP display mode (there is
 *   no SMS provider yet); production never returns it. The login screen shows
 *   it only when the backend actually sent it.
 * - POST /auth/otp/verify {phone, code} -> TokenOut. A first login creates
 *   the account with the BUYER role and the phone as display name.
 * - GET /auth/me, PATCH /users/me {display_name}, POST /users/me/role {role}.
 * - Role-scoped requests go through withRole (user actions: may switch the
 *   role) or inRole (background loads: never switch). The cached role is a
 *   hint; the backend's "<ROLE> role required" answer is what counts.
 */
import { apiGet, apiPatch, apiPost, apiRequest, isApiError } from './client';
import { BackendRole, clearSession, getSession, saveSession, Session, updateSession } from './session';

type TokenOut = { access_token: string; expires_in: number; user_id: number; role: string | null };
type MeOut = { id: number; display_name: string; role: string | null; providers: string[]; is_admin: boolean };

/** +91 and a 10-digit Indian mobile starting 6-9 (the backend's rule). */
export function toE164India(mobile: string): string | null {
  const digits = mobile.replace(/\D/g, '').replace(/^91(?=\d{10}$)/, '');
  return /^[6-9]\d{9}$/.test(digits) ? `+91${digits}` : null;
}

export async function requestOtp(phone: string): Promise<{ debugCode: string | null }> {
  const res = await apiRequest<{ message: string; debug_code?: string }>('/auth/otp/request', {
    method: 'POST',
    body: { phone },
    auth: false,
  });
  return { debugCode: res?.debug_code ? String(res.debug_code) : null };
}

function asRole(role: string | null | undefined): BackendRole | null {
  return role === 'BUYER' || role === 'OWNER' || role === 'BROKER' ? role : null;
}

/** Verify the code, then load the profile so the session knows the name and admin flag. */
export async function verifyOtp(phone: string, code: string): Promise<Session> {
  const token = await apiRequest<TokenOut>('/auth/otp/verify', {
    method: 'POST',
    body: { phone, code },
    auth: false,
  });
  saveSession({
    token: token.access_token,
    userId: token.user_id,
    role: asRole(token.role),
    displayName: '',
    isAdmin: false,
    expiresAt: Date.now() + token.expires_in * 1000,
  });
  try {
    return await refreshMe();
  } catch (e) {
    clearSession();
    throw e;
  }
}

export async function refreshMe(): Promise<Session> {
  const me = await apiGet<MeOut>('/auth/me');
  updateSession({ userId: me.id, displayName: me.display_name, role: asRole(me.role), isAdmin: !!me.is_admin });
  const session = getSession();
  if (!session) throw new Error('Session ended');
  return session;
}

export async function updateDisplayName(displayName: string): Promise<void> {
  const me = await apiPatch<MeOut>('/users/me', { display_name: displayName });
  updateSession({ displayName: me.display_name });
}

let switching: { role: BackendRole; promise: Promise<void> } | null = null;

/**
 * POST the role switch. The backend appends a role-history row on every
 * call (even to the same role), so concurrent switches to one role share a
 * single request.
 */
function switchRole(role: BackendRole): Promise<void> {
  if (switching?.role === role) return switching.promise;
  const promise = apiPost<{ user_id: number; role: string }>('/users/me/role', { role })
    .then((out) => updateSession({ role: asRole(out.role) }))
    .finally(() => {
      if (switching?.promise === promise) switching = null;
    });
  switching = { role, promise };
  return promise;
}

/**
 * Make `role` the backend's current role (no-op when the tab's cached role
 * already is). Buyer pages need BUYER and the owner dashboard needs OWNER,
 * like the mobile app's buyer/owner modes.
 */
export async function ensureRole(role: BackendRole): Promise<void> {
  if (getSession()?.role === role) return;
  await switchRole(role);
}

/** The backend refused because its current role is not `role` (deps.require_role's static detail). */
function isWrongRole(e: unknown, role: BackendRole): boolean {
  return isApiError(e, 'denied') && e.detail === `${role} role required`;
}

/**
 * Run a request the user asked for that needs `role` as the backend's
 * current role. The tab's cached role can be stale (the same account may
 * have switched role in the mobile app or another tab since), so when the
 * backend answers "<ROLE> role required" the role is switched and the
 * request retried once. Any other failure is passed on unchanged.
 */
export async function withRole<T>(role: BackendRole, request: () => Promise<T>): Promise<T> {
  await ensureRole(role);
  try {
    return await request();
  } catch (e) {
    if (!isWrongRole(e, role)) throw e;
    await switchRole(role);
    return request();
  }
}

/**
 * Run a background request that only makes sense while `role` is already
 * current (callers check the cached role first), e.g. loading saved-heart
 * state or recording a view. It never switches the role: when the backend
 * says its role differs, the cached role is corrected from GET /auth/me
 * (read-only) and the error is passed on.
 */
export async function inRole<T>(role: BackendRole, request: () => Promise<T>): Promise<T> {
  try {
    return await request();
  } catch (e) {
    if (isWrongRole(e, role)) await refreshMe().catch(() => undefined);
    throw e;
  }
}

export function signOut() {
  clearSession();
}
