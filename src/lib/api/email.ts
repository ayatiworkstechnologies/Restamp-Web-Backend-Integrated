/**
 * Contact email + verification + email preferences (notification system
 * Phase 3). Backend contract: Restamp-backend app/routers/email.py.
 *
 *   GET    /users/me/email                -> EmailStatusRaw
 *   PUT    /users/me/email {email}        -> EmailStatusRaw   422 invalid, 429 rate-limited
 *   POST   /users/me/email/verification   -> EmailStatusRaw   409 no address, 429
 *   POST   /users/me/email/verify {code}  -> EmailStatusRaw   422 invalid/expired code
 *   PUT    /users/me/email/preferences    -> EmailStatusRaw   409 no address
 *   DELETE /users/me/email                -> 204
 *
 * Every call acts on the signed-in account only (no user id is ever sent) and
 * goes through the shared client. `debug_code` exists only on a development
 * backend; production never returns it. No email provider setting or
 * credential exists in the website.
 */
import { apiDelete, apiGet, apiPost, apiRequest } from './client';

export type EmailPreferencesRaw = { enquiries: boolean; visits: boolean; listings: boolean };

export type EmailStatusRaw = {
  email: string | null;
  verified: boolean;
  verified_at: string | null;
  delivery_available: boolean;
  preferences: EmailPreferencesRaw;
  debug_code?: string | null;
};

export const getEmailStatus = () => apiGet<EmailStatusRaw>('/users/me/email');

export const saveEmailAddress = (email: string) =>
  apiRequest<EmailStatusRaw>('/users/me/email', { method: 'PUT', body: { email } });

export const resendEmailCode = () => apiPost<EmailStatusRaw>('/users/me/email/verification');

export const verifyEmailCode = (code: string) => apiPost<EmailStatusRaw>('/users/me/email/verify', { code });

export const saveEmailPreferences = (prefs: EmailPreferencesRaw) =>
  apiRequest<EmailStatusRaw>('/users/me/email/preferences', {
    method: 'PUT',
    body: { enquiries: !!prefs.enquiries, visits: !!prefs.visits, listings: !!prefs.listings },
  });

export const removeEmailAddress = () => apiDelete('/users/me/email');

// --- admin (read-only delivery records) --------------------------------------------

export type EmailDeliveryStatus = 'PENDING' | 'PROCESSING' | 'SENT' | 'FAILED';
export type EmailCategory = 'VERIFICATION' | 'ENQUIRY' | 'VISIT' | 'LISTING' | 'ACCOUNT';

export type AdminEmailDelivery = {
  id: number;
  user_id: number;
  recipient: string | null; // masked by the backend (a***@example.com)
  category: EmailCategory;
  template: string;
  status: EmailDeliveryStatus;
  attempts: number;
  failure: string | null;
  provider: string | null;
  created_at: string;
  sent_at: string | null;
  failed_at: string | null;
  next_attempt_at: string | null;
};

export type AdminEmailDeliveryQuery = { status?: EmailDeliveryStatus; category?: EmailCategory; user_id?: number };

export const listAdminEmailDeliveries = (query: AdminEmailDeliveryQuery = {}, page = 1, pageSize = 50) =>
  apiGet<{ items: AdminEmailDelivery[]; page: number; page_size: number; total: number }>('/admin/email-deliveries', {
    ...query,
    page,
    page_size: pageSize,
  });
