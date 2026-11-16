/**
 * Pure push-preference helpers (notification system Phase 4). No React, no
 * fetch: tested by scripts/test/push-settings.test.mjs. The backend is
 * authoritative for every rule; these only give fast, friendly feedback and
 * map its PushStatus response for the UI.
 *
 * The website is preference-only: it shows and changes the account's push
 * preferences (which the mobile app's registered devices follow). It never
 * registers a device and never touches a push token.
 */

export type PushStatus = {
  // False while the backend has no push provider configured: preferences can
  // be stored but nothing is delivered yet (the card shows its dormant note).
  available: boolean;
  devices: {
    id: number;
    platform: 'ios' | 'android';
    status: 'ACTIVE' | 'INACTIVE' | 'INVALID';
    invalidReason: string | null;
    tokenPrefix: string | null;
  }[];
  preferences: { enquiries: boolean; visits: boolean; listings: boolean };
};

export type PushAction = 'load' | 'prefs';

export function toPushStatus(raw: unknown): PushStatus {
  const r = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const prefs = (r.preferences && typeof r.preferences === 'object' ? r.preferences : {}) as Record<string, unknown>;
  const devices = Array.isArray(r.devices)
    ? r.devices.map((d) => {
        const row = (d && typeof d === 'object' ? d : {}) as Record<string, unknown>;
        return {
          id: typeof row.id === 'number' ? row.id : 0,
          platform: row.platform === 'android' ? 'android' : 'ios',
          status: row.status === 'ACTIVE' ? 'ACTIVE' : row.status === 'INVALID' ? 'INVALID' : 'INACTIVE',
          invalidReason: typeof row.invalid_reason === 'string' ? row.invalid_reason : null,
          tokenPrefix: typeof row.token_prefix === 'string' ? row.token_prefix : null,
        } as PushStatus['devices'][number];
      })
    : [];
  return {
    available: r.available === true,
    devices,
    preferences: {
      enquiries: prefs.enquiries !== false,
      visits: prefs.visits !== false,
      listings: prefs.listings !== false,
    },
  };
}

export function activeDeviceCount(status: PushStatus | null): number {
  if (!status) return 0;
  return status.devices.filter((d) => d.status === 'ACTIVE').length;
}

/**
 * The two preference rows every profile shows. Each maps to exactly ONE
 * backend push preference key (independent of email preferences); listings
 * (owner-facing verification pushes) is stored but not surfaced as a switch.
 */
export const PUSH_PREFERENCE_ITEMS: { key: keyof PushStatus['preferences']; label: string; hint: string }[] = [
  { key: 'enquiries', label: 'Lead Alerts', hint: 'New enquiries and replies on your listings' },
  { key: 'visits', label: 'Visit Reminders', hint: 'Reminders for your upcoming confirmed visits' },
];

/** The dormant note shown while push delivery is not configured yet. */
export const PUSH_UNAVAILABLE_NOTE = 'Push alerts are not available yet.';

export function pushDevicesLine(status: PushStatus | null): string | null {
  const count = activeDeviceCount(status);
  if (!status || count === 0) return null;
  return count === 1 ? '1 device will receive these alerts' : `${count} devices will receive these alerts`;
}

export function pushErrorMessage(error: unknown, action: PushAction): string {
  const e = (error && typeof error === 'object' ? error : {}) as { kind?: string; status?: number };
  if (e.kind === 'offline' || e.kind === 'timeout') return "Couldn't reach the server. Check your connection and try again.";
  if (e.kind === 'login' || e.status === 401) return 'Your session has expired. Please log in again.';
  if (e.kind === 'denied' || e.status === 403) return "Your account can't change notification settings right now.";
  if (e.status === 429) return 'Too many requests. Please wait a minute and try again.';
  if (action === 'load') return "Couldn't load your notification settings.";
  return 'Something went wrong. Please try again.';
}

// --- admin delivery list -------------------------------------------------------------

export const PUSH_CATEGORY_LABELS: Record<string, string> = {
  ENQUIRY: 'Enquiry',
  VISIT: 'Visit',
  LISTING: 'Listing',
  ACCOUNT: 'Account',
};

export const PUSH_FAILURE_LABELS: Record<string, string> = {
  retry: 'Temporary error (will retry)',
  rate_limit: 'Provider rate limit (will retry)',
  config: 'Provider configuration (will retry)',
  recipient: 'Device no longer registered',
  invalid_message: 'Message rejected by the provider',
  retry_exhausted: 'Gave up after retries',
  rate_limit_exhausted: 'Gave up after retries (rate limit)',
  config_exhausted: 'Gave up after retries (configuration)',
  recipient_exhausted: 'Gave up (device refused)',
  invalid_message_exhausted: 'Gave up (message rejected)',
  superseded: 'Outdated (visit moved, lead answered or closed)',
  gone: 'No longer applicable',
  past: 'The visit time has passed',
  stale: 'Too old to be useful',
  opted_out: 'Recipient opted out',
  no_device: 'No active device',
  account_inactive: 'Account not active',
  account_closed: 'Account closed',
};

export function pushFailureLabel(failure: string | null | undefined): string {
  if (!failure) return '—';
  return PUSH_FAILURE_LABELS[failure] || failure;
}
