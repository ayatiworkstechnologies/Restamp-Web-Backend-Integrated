/**
 * Admin endpoints (/admin/*) for the admin console.
 *
 * Admin rights come only from the backend: GET /admin/me answers with the
 * caller's admin role and permissions, and every endpoint re-checks its own
 * permission server-side. The console uses `permissions` only to hide or
 * disable controls (UX); a 403 from any call is still handled as "not
 * allowed". Admins sign in with the normal mobile OTP login.
 */
import { apiDelete, apiGet, apiPatch, apiPost, Page } from './client';
import type { EnquiryMessage } from './buyer';
import type { OwnerListingOut } from './owner';

export type AdminPermission =
  | 'properties.view'
  | 'properties.approve'
  | 'properties.reject'
  | 'properties.edit'
  | 'properties.delete'
  | 'users.view'
  | 'users.kyc_verify'
  | 'users.suspend'
  | 'users.export'
  | 'enquiries.view'
  | 'enquiries.update_status'
  | 'enquiries.delete'
  | 'enquiries.export'
  | 'reports.view'
  | 'reports.export'
  | 'settings.manage_team'
  | 'settings.configure_platform'
  | 'settings.view_audit_logs';

export type AdminMe = { user_id: number; display_name: string; admin_role: string; role_label: string; permissions: AdminPermission[] };

export type AdminListingRow = {
  listing_id: number;
  title: string;
  property_type: string;
  transaction_type: string;
  price_paise: number;
  price_period: string;
  price_display: string;
  verification_status: string;
  listing_status: string;
  removed: boolean;
  submitted_at?: string | null;
  owner_user_id: number;
  owner_name?: string | null;
  locality: string;
  city: string;
  pincode: string;
  cover_image_url?: string | null;
};

export type VerificationEvent = {
  attempt_no: number;
  action?: string | null;
  actor?: string | null;
  result: string;
  reason?: string | null;
  category?: string | null;
  triggered_at?: string | null;
  triggered_by_user_id?: number | null;
};

export type AdminListingDetail = {
  listing: OwnerListingOut & {
    gallery?: string[];
    district?: string;
    address_line?: string | null;
    landmark?: string | null;
    furnishing?: string | null;
    facing?: string | null;
    floor_on?: string | null;
    total_floors?: number | null;
    balconies?: number | null;
    super_built_up_area?: number | null;
    property_age_band?: string | null;
    amenities?: string[];
  };
  owner: { user_id: number; display_name?: string | null; status?: string | null };
  verification_history: VerificationEvent[];
};

export type AdminUserRow = {
  user_id: number;
  display_name?: string | null;
  status: string;
  current_role?: string | null;
  admin_role?: string | null;
  phone_last4?: string | null;
  joined_at?: string | null;
};

export type AdminUserDetail = {
  user_id: number;
  display_name: string;
  status: string;
  current_role?: string | null;
  admin_role?: string | null;
  phone?: string | null;
  providers: string[];
  joined_at?: string | null;
  activity: {
    listings_owned: number;
    enquiries_sent: number;
    enquiries_received: number;
    visits_requested: number;
    broker_covered_locations: number;
  };
};

export type AdminEnquiryRow = {
  id: number;
  status: string;
  closing_reason?: string | null;
  created_at?: string | null;
  property_listing_id: number;
  listing_title?: string | null;
  buyer_user_id: number;
  buyer_name?: string | null;
  owner_user_id: number;
  owner_name?: string | null;
  message_count: number;
  last_message?: string | null;
  last_message_at?: string | null;
};

export type AdminEnquiryDetail = AdminEnquiryRow & { messages: EnquiryMessage[] };

export type AdminDashboard = {
  listings_total: number;
  listings_live: number;
  listings_pending: number;
  listings_rejected: number;
  enquiries_total: number;
  enquiries_open: number;
  users_total: number;
  users_suspended: number;
  buyers: number;
  owners: number;
  brokers: number;
  admins: number;
  unavailable: string[];
};

export type AdminAnalytics = {
  months: { month: string; verified: number; rejected: number }[];
  listings_by_type: { property_type: string; count: number }[];
  top_enquiry_localities: { locality: string; city: string; enquiries: number }[];
  unavailable: string[];
};

export type AdminAuditLog = {
  id: number;
  actor_user_id: number;
  actor_name?: string | null;
  action: string;
  entity?: string | null;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  created_at?: string | null;
};

export type AdminRole = { code: string; label: string; assignable: boolean; permissions: string[] };
export type AdminStaffRow = { user_id: number; display_name?: string | null; admin_role: string; role_label: string; status: string };
export type AssignableRole = 'SUPER_ADMIN' | 'OPERATIONS_MANAGER' | 'LISTING_REVIEWER' | 'SUPPORT_SPECIALIST';

export const getAdminMe = () => apiGet<AdminMe>('/admin/me');
export const getAdminRoles = () => apiGet<{ items: AdminRole[] }>('/admin/roles');
export const getAdminDashboard = () => apiGet<AdminDashboard>('/admin/dashboard');
export const getAdminAnalytics = (months = 6) => apiGet<AdminAnalytics>('/admin/analytics', { months });

export type AdminListingQuery = {
  verification_status?: 'PENDING' | 'VERIFIED' | 'REJECTED';
  listing_status?: string;
  property_type?: string;
  owner_user_id?: number;
  q?: string;
  include_removed?: boolean;
  sort?: 'newest' | 'submitted_oldest';
};
export const listAdminListings = (query: AdminListingQuery = {}, page = 1, pageSize = 100) =>
  apiGet<Page<AdminListingRow>>('/admin/listings', { ...query, page, page_size: pageSize });
export const getAdminListing = (id: number) => apiGet<AdminListingDetail>(`/admin/listings/${id}`);
export const verifyAdminListing = (id: number, notes?: string) =>
  apiPost<AdminListingDetail>(`/admin/listings/${id}/verify`, notes?.trim() ? { notes: notes.trim() } : undefined);
export const rejectAdminListing = (id: number, reason: string, category?: string) =>
  apiPost<AdminListingDetail>(`/admin/listings/${id}/reject`, { reason: reason.trim(), category: category?.trim() || null });

export type AdminUserQuery = { role?: 'BUYER' | 'OWNER' | 'BROKER'; status?: 'active' | 'suspended' | 'closed'; is_admin?: boolean; q?: string };
export const listAdminUsers = (query: AdminUserQuery = {}, page = 1, pageSize = 100) =>
  apiGet<Page<AdminUserRow>>('/admin/users', { ...query, page, page_size: pageSize });
export const getAdminUser = (id: number) => apiGet<AdminUserDetail>(`/admin/users/${id}`);
export const suspendAdminUser = (id: number, reason: string) =>
  apiPost<AdminUserDetail>(`/admin/users/${id}/suspend`, { reason: reason.trim() });
export const reactivateAdminUser = (id: number, reason?: string) =>
  apiPost<AdminUserDetail>(`/admin/users/${id}/reactivate`, reason?.trim() ? { reason: reason.trim() } : undefined);

export type AdminEnquiryQuery = { status?: 'NEW' | 'CONTACTED' | 'CLOSED'; property_listing_id?: number; buyer_user_id?: number; owner_user_id?: number };
export const listAdminEnquiries = (query: AdminEnquiryQuery = {}, page = 1, pageSize = 100) =>
  apiGet<Page<AdminEnquiryRow>>('/admin/enquiries', { ...query, page, page_size: pageSize });
export const getAdminEnquiry = (id: number) => apiGet<AdminEnquiryDetail>(`/admin/enquiries/${id}`);

export const listAdminAuditLogs = (query: { action?: string; entity?: string; actor_user_id?: number } = {}, page = 1, pageSize = 50) =>
  apiGet<Page<AdminAuditLog>>('/admin/audit-logs', { ...query, page, page_size: pageSize });

export const listAdminStaff = () => apiGet<{ items: AdminStaffRow[]; total: number }>('/admin/staff');
export const grantAdminStaff = (userId: number, role: AssignableRole) =>
  apiPost<AdminStaffRow>('/admin/staff', { user_id: userId, admin_role: role });
export const changeAdminStaffRole = (userId: number, role: AssignableRole) =>
  apiPatch<AdminStaffRow>(`/admin/staff/${userId}`, { admin_role: role });
export const revokeAdminStaff = (userId: number) => apiDelete(`/admin/staff/${userId}`);
