/**
 * RESTAMP agent (backend role BROKER) API, as served by the live backend:
 *
 * - GET /broker/plan       the caller's agent plan + covered localities, or has_plan=false
 * - GET /broker/dashboard  real counts; metrics without a source are null and listed in `unavailable`
 * - GET /broker/profile    the signed-in agent
 * - GET /broker/locations  the caller's unexpired coverage (postcode grants)
 * - GET /broker/listings   buyer-visible listings inside the caller's coverage only
 *
 * Coverage is decided by the backend (never by the browser). There is no
 * agent-leads, commission or payment-history endpoint, and plan purchase on
 * the backend is a simulation, so the website does not offer it.
 */
import { withRole } from './auth';
import { apiGet, type Page } from './client';
import type { ListingCard } from './buyer';

export type BrokerPlan = {
  has_plan: boolean;
  plan_code?: string;
  plan_id?: string;
  plan_name?: string;
  price_paise?: number;
  locality_limit?: number;
  start_date?: string | null;
  valid_until?: string | null;
  is_trial?: boolean;
  localities?: string[];
};

export type BrokerDashboard = {
  available_property_count: number;
  covered_location_count: number;
  coverage_limit: number | null;
  subscription: Record<string, unknown> | null;
  new_lead_count: number | null;
  earnings: number | null;
  unavailable: string[];
};

export type BrokerProfile = {
  user_id: number;
  display_name: string;
  role: 'BROKER';
  covered_location_count: number;
  unavailable: string[];
};

export type BrokerLocation = { postcode_id: number; pincode: string; locality: string; city: string; expires_at: string | null };

export type BrokerListingFilters = {
  deal?: 'BUY' | 'RESALE' | 'RENT' | 'LEASE';
  property_type?: 'APARTMENT' | 'VILLA' | 'HOUSE' | 'COMMERCIAL' | 'PLOT' | 'AGRICULTURAL_LAND';
  locality?: string;
  bedrooms?: number;
  bedrooms_min?: number;
  q?: string;
};

export const getBrokerPlan = () => withRole('BROKER', () => apiGet<BrokerPlan>('/broker/plan'));
export const getBrokerDashboard = () => withRole('BROKER', () => apiGet<BrokerDashboard>('/broker/dashboard'));
export const getBrokerProfile = () => withRole('BROKER', () => apiGet<BrokerProfile>('/broker/profile'));

export async function listBrokerLocations(): Promise<BrokerLocation[]> {
  const res = await withRole('BROKER', () => apiGet<{ items: BrokerLocation[]; total: number }>('/broker/locations'));
  return res.items;
}

export function listBrokerListings(filters: BrokerListingFilters = {}, page = 1, pageSize = 100) {
  return withRole('BROKER', () => apiGet<Page<ListingCard>>('/broker/listings', { ...filters, page, page_size: pageSize }));
}

/** Plan validity: true while there is a plan with no end date or an end date in the future. */
export function planActive(plan: BrokerPlan | null): boolean {
  if (!plan?.has_plan) return false;
  if (!plan.valid_until) return true;
  const end = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(plan.valid_until) ? plan.valid_until : `${plan.valid_until}Z`);
  return Number.isNaN(end.getTime()) || end.getTime() > Date.now();
}
