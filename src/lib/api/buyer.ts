/**
 * Buyer endpoints (/buyer/*).
 *
 * Browsing (search, detail, similar) is public. Every other call needs a
 * signed-in user whose CURRENT backend role is BUYER, so each one runs
 * through auth.withRole: it makes BUYER the current role, and retries once
 * if the role was switched elsewhere meanwhile — the website's public pages
 * are the buyer mode, like the mobile app's buyer tabs. Background calls
 * (recording a view, loading heart state) use auth.inRole and never switch.
 */
import { apiDelete, apiGet, apiPatch, apiPost, apiRequest, errorMessage, isApiError, ApiError, Page } from './client';
import { inRole, withRole } from './auth';

export type ListingCard = {
  listing_id: number;
  title: string;
  price_paise: number;
  price_period: string;
  price_display: string;
  transaction_type: string;
  property_type: string;
  construction_status: string | null;
  description: string | null;
  area_value: number | null;
  area_unit: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  address_line: string | null;
  locality: string;
  city: string;
  pincode: string;
  location_label: string;
  cover_image_url: string | null;
};

export type ListingDetail = ListingCard & {
  gallery: string[];
  verification_status: string;
  listing_status: string;
  owner_name?: string | null;
};

export type EnquiryMessage = { id?: number | null; body: string; sender?: 'BUYER' | 'OWNER'; created_at?: string | null };

export type BuyerEnquiry = {
  id: number;
  property_listing_id: number;
  message: string | null;
  status: string;
  closing_reason: string | null;
  created_at?: string | null;
  message_count?: number;
  last_message?: string | null;
  last_message_at?: string | null;
  messages?: EnquiryMessage[] | null;
  listing: {
    title: string;
    price_paise: number;
    price_period: string;
    price_display?: string | null;
    property_type?: string | null;
    locality?: string | null;
    city?: string | null;
    cover_image_url?: string | null;
  };
};

export type Visit = {
  id: number;
  property_listing_id: number;
  buyer_display_name?: string | null;
  owner_display_name?: string | null;
  scheduled_at: string;
  status: string;
  initiator: string;
  note: string | null;
  listing: { title: string; price_paise: number; price_period: string; property_type?: string | null; locality?: string | null; city?: string | null };
  created_at?: string | null;
};

export type ViewedProperty = { id: number; property_listing_id: number; viewed_at: string; listing: ListingCard };
export type CallEvent = { id: number; property_listing_id: number; created_at: string; listing: ListingCard | null };

export type ListingSearch = {
  deal?: 'BUY' | 'RESALE' | 'RENT' | 'LEASE';
  property_type?: string;
  locality?: string;
  city?: string;
  bedrooms?: number;
  bedrooms_min?: number;
  min_price_paise?: number;
  max_price_paise?: number;
  q?: string;
  construction_status?: 'READY_TO_MOVE' | 'UNDER_CONSTRUCTION' | 'NEW_LAUNCH';
  sort?: 'relevance' | 'price_asc' | 'price_desc' | 'area_asc' | 'area_desc';
};

// --- public browsing ------------------------------------------------------------

export function searchListings(filters: ListingSearch, page = 1, pageSize = 24, signal?: AbortSignal) {
  return apiGetPublic<Page<ListingCard>>('/buyer/listings', { ...filters, page, page_size: pageSize }, signal);
}

export async function countListings(filters: ListingSearch, signal?: AbortSignal): Promise<number> {
  const res = await apiGetPublic<Page<ListingCard>>('/buyer/listings', { ...filters, count_only: true }, signal);
  return res.total;
}

export const getListing = (id: number) => apiGet<ListingDetail>(`/buyer/listings/${id}`, undefined, false);
export const getSimilarListings = (id: number, limit = 3) =>
  apiGet<ListingCard[]>(`/buyer/listings/${id}/similar`, { limit }, false);

// Public GETs never send the token (the endpoints don't need it).
function apiGetPublic<T>(path: string, query: Record<string, string | number | boolean | undefined>, signal?: AbortSignal) {
  return apiRequest<T>(path, { query, auth: false, signal });
}

// --- signed-in buyer actions ---------------------------------------------------------

/** Reveal the owner's phone (audited by the backend). Also carries the
 * owner's public-safe display name when the backend knows one (null when
 * the owner has no saved name — never a phone number), so the contact card
 * names the real owner. */
export type RevealedContact = { phone: string; ownerName: string | null };

export async function revealContact(listingId: number): Promise<RevealedContact> {
  const res = await withRole('BUYER', () =>
    apiPost<{ phone: string; owner_name?: string | null }>(`/buyer/listings/${listingId}/contact`)
  );
  const ownerName =
    typeof res.owner_name === 'string' && res.owner_name.trim() !== '' ? res.owner_name.trim() : null;
  return { phone: res.phone, ownerName };
}

/** Record that the buyer started a call to the owner (shown in Activity). */
export async function recordCall(listingId: number): Promise<void> {
  await withRole('BUYER', () => apiPost(`/buyer/listings/${listingId}/call-events`));
}

export async function sendEnquiry(listingId: number, message: string): Promise<BuyerEnquiry> {
  return withRole('BUYER', () => apiPost<BuyerEnquiry>('/buyer/enquiries', { property_listing_id: listingId, message: message.trim() || null }));
}

export async function listEnquiries(page = 1, pageSize = 50) {
  return withRole('BUYER', () => apiGet<Page<BuyerEnquiry>>('/buyer/enquiries', { page, page_size: pageSize }));
}

export async function getEnquiry(id: number) {
  return withRole('BUYER', () => apiGet<BuyerEnquiry>(`/buyer/enquiries/${id}`));
}

export async function requestVisit(listingId: number, scheduledAt: Date, note?: string): Promise<Visit> {
  return withRole('BUYER', () => apiPost<Visit>('/buyer/visits', {
    property_listing_id: listingId,
    scheduled_at: scheduledAt.toISOString(),
    note: note?.trim() || null,
  }));
}

export async function listVisits(page = 1, pageSize = 50) {
  return withRole('BUYER', () => apiGet<Page<Visit>>('/buyer/visits', { page, page_size: pageSize }));
}

/** Buyer moves allowed by the backend: cancel any open visit; accept or decline an owner-proposed time. */
export async function updateVisitStatus(visitId: number, status: 'CANCELLED' | 'CONFIRMED' | 'DECLINED'): Promise<Visit> {
  return withRole('BUYER', () => apiPatch<Visit>(`/buyer/visits/${visitId}`, { status }));
}

/**
 * Error text for a failed visit request or change. When the owner has
 * closed the buyer's enquiry the backend refuses with 422 "Lead is closed"
 * (closing also cancels the enquiry's open visits), so say that plainly;
 * everything else uses the shared wording.
 */
export function visitErrorMessage(e: unknown, fallback: string, kind: 'change' | 'request' = 'change'): string {
  if (isApiError(e) && e.status === 422 && e.detail === 'Lead is closed') {
    return kind === 'request'
      ? 'The owner closed your enquiry on this property. Send a new enquiry to arrange a visit.'
      : "The owner closed your enquiry on this property, so this visit was cancelled and can't be changed. Refresh to see it.";
  }
  return errorMessage(e, fallback);
}

export async function recordView(listingId: number): Promise<void> {
  await inRole('BUYER', () => apiPost(`/buyer/viewed/${listingId}`));
}

export async function listViewed(page = 1, pageSize = 50) {
  return withRole('BUYER', () => apiGet<Page<ViewedProperty>>('/buyer/viewed', { page, page_size: pageSize }));
}

export async function listCallEvents(page = 1, pageSize = 50) {
  return withRole('BUYER', () => apiGet<Page<CallEvent>>('/buyer/call-events', { page, page_size: pageSize }));
}

/** `passive`: background load for a session already in buyer mode (never switches the role). */
export async function listSaved(page = 1, pageSize = 100, { passive = false } = {}) {
  const request = () => apiGet<Page<ListingCard>>('/buyer/saved', { page, page_size: pageSize });
  return passive ? inRole('BUYER', request) : withRole('BUYER', request);
}

export async function saveListing(listingId: number): Promise<void> {
  await withRole('BUYER', () => apiPost(`/buyer/saved/${listingId}`));
}

export async function unsaveListing(listingId: number): Promise<void> {
  await withRole('BUYER', () => apiDelete(`/buyer/saved/${listingId}`));
}

// --- buyer plans (lead quota) ---------------------------------------------------

export type BuyerPlanCard = {
  code: string;
  name: string;
  price_paise: number;
  duration_days: number;
  lead_limit: number | null;
  leads_label: string;
  is_free: boolean;
};

export type BuyerPlanStatus = {
  plan_code: string;
  plan_name: string;
  is_free: boolean;
  lead_limit: number | null;
  leads_used: number;
  leads_remaining: number | null;
  valid_until: string | null;
};

/** Public catalogue of the RESTAMP buyer plans (the backend's real prices). */
export async function listBuyerPlans(): Promise<BuyerPlanCard[]> {
  const res = await apiGet<{ items: BuyerPlanCard[] }>('/buyer/plans', undefined, false);
  return res.items;
}

/** The signed-in buyer's current plan and lead usage. */
export async function getBuyerPlanStatus(): Promise<BuyerPlanStatus> {
  return withRole('BUYER', () => apiGet<BuyerPlanStatus>('/buyer/plan'));
}

/**
 * The backend refuses a contact reveal with 402 {code: BUYER_PLAN_REQUIRED}
 * once the buyer's free lead quota is used up. True only for that case, so
 * the UI can offer the plans page instead of a generic error.
 */
export function isBuyerPlanRequired(e: unknown): e is ApiError {
  return isApiError(e) && e.status === 402;
}
