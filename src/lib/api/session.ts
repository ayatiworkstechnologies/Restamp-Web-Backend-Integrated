/**
 * Signed-in session for the website (buyers, owners and admins share it:
 * an admin is a normal user whose admin rights the backend checks per request).
 *
 * - Stored in sessionStorage: it survives reloads in the same tab and is
 *   cleared when the tab closes. The backend token lasts 30 minutes with no
 *   refresh, so the session is dropped locally at the token's expiry too.
 * - The role here is only a cache of the backend's current role for UI
 *   decisions (where to send the user, which mode to show). Every protected
 *   request is authorized by the backend, never by this value.
 * - Nothing here logs the token or the phone number.
 */
import { useEffect, useState } from 'react';

export type BackendRole = 'BUYER' | 'OWNER' | 'BROKER';

export type Session = {
  token: string;
  userId: number;
  role: BackendRole | null;
  displayName: string;
  isAdmin: boolean;
  /** Epoch milliseconds when the token stops being accepted. */
  expiresAt: number;
};

const KEY = 'restamp_session';
const EVENT = 'restamp-session-change';
// Treat the token as expired slightly early so a request never races the expiry.
const EXPIRY_MARGIN_MS = 30_000;

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function notify() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT));
}

export function getSession(): Session | null {
  const s = storage();
  if (!s) return null;
  try {
    const raw = s.getItem(KEY);
    if (!raw) return null;
    const session = JSON.parse(raw) as Session;
    if (!session.token || Date.now() >= session.expiresAt - EXPIRY_MARGIN_MS) {
      s.removeItem(KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export function getSessionToken(): string | null {
  return getSession()?.token ?? null;
}

export function saveSession(session: Session) {
  try {
    storage()?.setItem(KEY, JSON.stringify(session));
  } catch {
    // Storage refused (private mode quota): the user stays signed out.
  }
  notify();
}

export function updateSession(patch: Partial<Omit<Session, 'token' | 'expiresAt'>>) {
  const current = getSession();
  if (current) saveSession({ ...current, ...patch });
}

export function clearSession() {
  try {
    storage()?.removeItem(KEY);
  } catch {}
  notify();
}

/** Called by the API client when the backend rejects the token (401). */
export function handleUnauthorized() {
  clearSession();
}

/**
 * Current session, kept in sync with sign-in/out in this tab and with the
 * token's expiry. `ready` is false until the first client-side read, so
 * pages can avoid flashing signed-out UI during hydration.
 */
export function useSession(): { session: Session | null; ready: boolean } {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const sync = () => {
      setSession(getSession());
      setReady(true);
    };
    sync();
    window.addEventListener(EVENT, sync);
    // Re-check periodically so an expired token signs the user out.
    const timer = window.setInterval(sync, 30_000);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.clearInterval(timer);
    };
  }, []);

  return { session, ready };
}

/** Login URL that returns to `next` after signing in. */
export function loginHref(next?: string, role?: 'buyer' | 'owner' | 'agent'): string {
  const params = new URLSearchParams();
  if (role) params.set('role', role);
  if (next) params.set('next', next);
  const qs = params.toString();
  return `/login${qs ? `?${qs}` : ''}`;
}

/** A backend display name that is still the phone number the account was created with. */
export function isPlaceholderName(name: string | null | undefined): boolean {
  return !name || /^\+?\d{10,15}$/.test(name.trim());
}
