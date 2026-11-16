/**
 * Push devices + push preferences (notification system Phase 4). Backend
 * contract: Restamp-backend app/routers/push.py.
 *
 *   GET    /users/me/push                     -> PushStatusRaw
 *   PUT    /users/me/push/preferences         -> PushStatusRaw
 *          {enquiries, visits, listings}
 *   POST   /users/me/push/devices             -> PushDeviceRaw (201)
 *          {token, platform, app_version?, device_name?}
 *          422 "Invalid push token or platform"
 *   DELETE /users/me/push/devices/{device_id} -> 204 (idempotent device logout)
 *
 * The website is preference-only: it never registers a device (browsers are
 * not push devices in RESTAMP; no browser Web-Push token exists anywhere).
 * The raw Expo token is sent ONLY by the mobile app in the register body,
 * stored encrypted server-side, and never part of a response here.
 *
 * Every call acts on the signed-in account only (no user id is ever sent) and
 * goes through the shared client. Push preferences are INDEPENDENT of email
 * and in-app preferences.
 */
import { apiDelete, apiGet, apiPost, apiRequest } from './client';

export type PushPreferencesRaw = { enquiries: boolean; visits: boolean; listings: boolean };

export type PushDeviceRaw = {
  id: number;
  platform: 'ios' | 'android';
  status: 'ACTIVE' | 'INACTIVE' | 'INVALID';
  invalid_reason: string | null;
  token_prefix: string | null; // masked display form (never the token)
  app_version: string | null;
  device_name: string | null;
  registered_at: string;
  refreshed_at: string;
};

export type PushStatusRaw = {
  // False while no push provider is configured: devices may be registered but
  // nothing is delivered yet (the UI shows its dormant state).
  available: boolean;
  devices: PushDeviceRaw[];
  preferences: PushPreferencesRaw;
};

export const getPushStatus = () => apiGet<PushStatusRaw>('/users/me/push');

export const savePushPreferences = (prefs: PushPreferencesRaw) =>
  apiRequest<PushStatusRaw>('/users/me/push/preferences', {
    method: 'PUT',
    body: { enquiries: !!prefs.enquiries, visits: !!prefs.visits, listings: !!prefs.listings },
  });

export const registerPushDevice = (
  token: string,
  platform: 'ios' | 'android',
  extra: { app_version?: string; device_name?: string } = {},
) => apiPost<PushDeviceRaw>('/users/me/push/devices', { token, platform, ...extra });

export const deactivatePushDevice = (deviceId: number) =>
  apiDelete(`/users/me/push/devices/${encodeURIComponent(deviceId)}`);

// --- admin (read-only delivery records) --------------------------------------------

export type PushDeliveryStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';
export type PushCategory = 'ENQUIRY' | 'VISIT' | 'LISTING' | 'ACCOUNT';

export type AdminPushDelivery = {
  id: number;
  user_id: number;
  category: PushCategory;
  template: string;
  status: PushDeliveryStatus;
  attempts: number;
  failure: string | null;
  provider: string | null;
  created_at: string;
  sent_at: string | null;
  failed_at: string | null;
  next_attempt_at: string | null;
};

export type AdminPushDeliveryQuery = { status?: PushDeliveryStatus; category?: PushCategory; user_id?: number };

export const listAdminPushDeliveries = (query: AdminPushDeliveryQuery = {}, page = 1, pageSize = 50) =>
  apiGet<{ items: AdminPushDelivery[]; page: number; page_size: number; total: number }>('/admin/push-deliveries', {
    ...query,
    page,
    page_size: pageSize,
  });
