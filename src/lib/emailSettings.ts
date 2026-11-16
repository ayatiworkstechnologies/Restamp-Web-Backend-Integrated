/**
 * Pure contact-email helpers (notification system Phase 3). No React, no
 * fetch: tested by scripts/test/email-settings.test.mjs. The backend is
 * authoritative for every rule; these only give fast, friendly feedback and
 * mirror its normalisation (trim + lower-case, plain ASCII addresses).
 */

export type EmailStatus = {
  email: string | null;
  verified: boolean;
  verifiedAt: string | null;
  deliveryAvailable: boolean;
  preferences: { enquiries: boolean; visits: boolean; listings: boolean };
  /** Development backends only; production never sends it. */
  debugCode: string | null;
};

export type EmailAction = 'load' | 'save' | 'resend' | 'verify' | 'prefs' | 'remove';

const LOCAL_RE = /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*$/;
const LABEL_RE = /^[a-z0-9]([a-z0-9-]{0,61}[a-z0-9])?$/;

export function normalizeEmailInput(raw: unknown): string {
  return String(raw ?? '').trim().toLowerCase();
}

export function isPlausibleEmail(raw: unknown): boolean {
  const value = normalizeEmailInput(raw);
  if (!value || value.length > 254) return false;
  if (!/^[\x21-\x7e]+$/.test(value)) return false;
  const parts = value.split('@');
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (local.length < 1 || local.length > 64 || !LOCAL_RE.test(local)) return false;
  const labels = domain.split('.');
  if (domain.length > 253 || labels.length < 2 || !labels.every((l) => LABEL_RE.test(l))) return false;
  const tld = labels[labels.length - 1];
  return tld.length >= 2 && !/^\d+$/.test(tld);
}

export function isCodeShape(raw: unknown): boolean {
  return /^\d{6}$/.test(String(raw ?? '').trim());
}

export function toEmailStatus(raw: unknown): EmailStatus {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const prefs = (r.preferences && typeof r.preferences === 'object' ? r.preferences : {}) as Record<string, unknown>;
  const email = typeof r.email === 'string' && r.email ? r.email : null;
  const debug = typeof r.debug_code === 'string' && isCodeShape(r.debug_code) ? r.debug_code : null;
  return {
    email,
    verified: !!email && r.verified === true,
    verifiedAt: typeof r.verified_at === 'string' ? r.verified_at : null,
    deliveryAvailable: r.delivery_available === true,
    preferences: {
      enquiries: prefs.enquiries !== false,
      visits: prefs.visits !== false,
      listings: prefs.listings !== false,
    },
    debugCode: debug,
  };
}

export function emailStatusLabel(status: EmailStatus | null): 'Not added' | 'Verified' | 'Not verified' {
  if (!status || !status.email) return 'Not added';
  return status.verified ? 'Verified' : 'Not verified';
}

export function emailFieldText(status: EmailStatus | null, fallback: string): string {
  if (!status || !status.email) return fallback;
  return status.verified ? status.email : `${status.email} · Not verified`;
}

export const EMAIL_PREFERENCE_ITEMS: { key: keyof EmailStatus['preferences']; label: string; hint: string }[] = [
  { key: 'enquiries', label: 'Enquiries & replies', hint: 'New enquiries, replies and enquiry updates' },
  { key: 'visits', label: 'Site visits', hint: 'Requests, proposals, confirmations and changes' },
  { key: 'listings', label: 'Listing updates', hint: 'Verification results for your listings' },
];

export const MANDATORY_EMAIL_NOTE =
  'Verification codes and important account emails (such as suspension or reactivation) are always sent to your verified address.';

export const RESEND_COOLDOWN_SECONDS = 60;

export function emailErrorMessage(error: unknown, action: EmailAction): string {
  const e = (error && typeof error === 'object' ? error : {}) as { kind?: string; status?: number };
  if (e.kind === 'offline' || e.kind === 'timeout') return "Couldn't reach the server. Check your connection and try again.";
  if (e.kind === 'login' || e.status === 401) return 'Your session has expired. Please log in again.';
  if (e.kind === 'denied' || e.status === 403) return "Your account can't change email settings right now.";
  if (e.status === 429) return 'Too many requests. Please wait a minute and try again.';
  if (action === 'verify' && (e.status === 422 || e.kind === 'validation')) {
    return 'That code is invalid or has expired. Check the latest email or request a new code.';
  }
  if (action === 'save' && (e.status === 422 || e.kind === 'validation')) return 'Please enter a valid email address.';
  if (e.status === 409) return action === 'resend' || action === 'prefs' ? 'Add an email address first.' : 'Please try again.';
  if (action === 'load') return "Couldn't load your email settings.";
  return 'Something went wrong. Please try again.';
}

export function codeSentMessage(status: EmailStatus | null): string | null {
  if (!status || !status.email || status.verified) return null;
  if (status.deliveryAvailable) return `We've sent a 6-digit code to ${status.email}.`;
  if (status.debugCode) return 'Email delivery is off on this development server. Use the development code below.';
  return "Your address is saved, but email delivery isn't switched on yet, so no code could be sent.";
}

// --- admin delivery list -------------------------------------------------------------

export const EMAIL_CATEGORY_LABELS: Record<string, string> = {
  VERIFICATION: 'Verification',
  ENQUIRY: 'Enquiry',
  VISIT: 'Visit',
  LISTING: 'Listing',
  ACCOUNT: 'Account',
};

export const EMAIL_FAILURE_LABELS: Record<string, string> = {
  retry: 'Temporary error (will retry)',
  rate_limit: 'Provider rate limit (will retry)',
  config: 'Provider configuration (will retry)',
  recipient: 'Address refused',
  retry_exhausted: 'Gave up after retries',
  rate_limit_exhausted: 'Gave up after retries (rate limit)',
  config_exhausted: 'Gave up after retries (configuration)',
  superseded: 'Replaced by a newer code or address',
  already_verified: 'Address already verified',
  expired: 'Code expired before sending',
  address_changed: 'Address changed or unverified',
  opted_out: 'Recipient opted out',
  account_inactive: 'Account not active',
  account_closed: 'Account closed',
  unreadable: 'Could not be prepared',
  render_error: 'Could not be prepared',
};

export function failureLabel(failure: string | null | undefined): string {
  if (!failure) return '—';
  return EMAIL_FAILURE_LABELS[failure] || failure;
}
