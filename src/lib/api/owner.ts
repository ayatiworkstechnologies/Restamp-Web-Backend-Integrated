/**
 * Owner endpoints (/owner/*) for the owner dashboard and the post-property
 * wizard. Every call runs through auth.withRole, which makes OWNER the
 * backend's current role (the owner dashboard is the owner mode) and retries
 * once if the role was switched elsewhere meanwhile; the backend still
 * checks the role and listing ownership on every request.
 *
 * buildOwnerPayload mirrors the mobile app's buildPayload: labels are passed
 * through where the backend normalizes them, and nothing is invented (empty
 * optional fields are omitted). New listings start PENDING verification and
 * are not visible to buyers until verified.
 */
import { apiDelete, apiGet, apiPost, apiRequest, Page } from './client';
import { withRole } from './auth';
import type { OwnerListing } from '@/lib/ownerListings';

export type OwnerListingOut = {
  listing_id: number;
  title: string;
  transaction_type: string;
  property_type: string;
  price_paise: number;
  price_period: string;
  price_display: string;
  construction_status: string | null;
  verification_status: 'PENDING' | 'VERIFIED' | 'REJECTED' | string;
  listing_status: 'AVAILABLE' | 'CLOSED' | 'SOLD' | 'RENTED' | 'LEASED' | 'EXPIRED' | string;
  removed?: boolean;
  description: string | null;
  locality: string;
  city: string;
  pincode: string;
  society_name?: string | null;
  bedrooms: number | null;
  bathrooms: number | null;
  area_value: number | null;
  area_unit: string | null;
  submitted_at?: string | null;
  cover_image_url: string | null;
  enquiry_count?: number;
  visit_count?: number;
  call_count?: number;
};

export type PhotoUploadOut = { id: number; url: string; category?: string | null; is_cover: boolean };

/** Photo categories the backend accepts (the wizard's "Other Rooms" has no backend category). */
export const BACKEND_PHOTO_CATEGORIES = ['Exterior', 'Living Room', 'Bedroom', 'Kitchen', 'Bathroom', 'Balcony', 'Floor Plan'];

const DEAL: Record<string, string> = { Sell: 'BUY', Resale: 'RESALE', Rent: 'RENT', Lease: 'LEASE' };

const PROPERTY_TYPE: Record<string, string> = {
  Apartment: 'APARTMENT',
  'Studio Apartment': 'APARTMENT',
  'Builder Floor': 'APARTMENT',
  'PG / Co-living': 'APARTMENT',
  'Independent House / Villa': 'VILLA',
  'Plot / Land': 'PLOT',
};

const CONSTRUCTION: Record<string, string> = {
  'Ready to Move': 'READY_TO_MOVE',
  'Under Construction': 'UNDER_CONSTRUCTION',
  'New Launch': 'NEW_LAUNCH',
};

// Website age chips -> the backend's canonical bands.
const AGE_BAND: Record<string, string> = {
  '0-1 Years': '0–1 Year',
  '1-5 Years': '1–5 Years',
  '5-10 Years': '5–10 Years',
  '10+ Years': '10+ Years',
};

const firstNumber = (value: string): number | null => {
  const m = String(value || '').match(/\d+/);
  return m ? parseInt(m[0], 10) : null;
};

const text = (value: string | null | undefined, max: number): string | undefined => {
  const s = String(value ?? '').trim().replace(/\s+/g, ' ');
  return s ? s.slice(0, max) : undefined;
};

/** Plots and land have no rooms. */
export const isPlotListing = (l: Pick<OwnerListing, 'propertyType'>) => /Plot|Land/.test(l.propertyType);

/** The wizard shows Room Details (Bedrooms/Bathrooms/Balconies) for residential, non-plot listings. */
export const asksRoomDetails = (l: Pick<OwnerListing, 'category' | 'propertyType'>) =>
  l.category === 'Residential' && !isPlotListing(l);

/** The wizard asks for a BHK configuration for the same listings except PG / Co-living. */
export const asksBhk = (l: Pick<OwnerListing, 'category' | 'propertyType'>) =>
  asksRoomDetails(l) && l.propertyType !== 'PG / Co-living';

/**
 * Bedroom count sent to the backend. Same precedence as the mobile app:
 * the Bedrooms choice first, then the BHK configuration ('5+' -> 5,
 * '2 BHK' -> 2, '1 RK' -> 1). A value left over from a field the wizard no
 * longer shows (e.g. after switching to a plot) is never sent.
 */
export function bedroomCount(l: Pick<OwnerListing, 'category' | 'propertyType' | 'bedrooms' | 'bhk'>): number | null {
  if (!asksRoomDetails(l)) return null;
  return firstNumber(l.bedrooms) ?? (asksBhk(l) ? firstNumber(l.bhk) : null);
}

/** "6 months" / "1 year" / "11" -> months; '' -> null; unreadable -> NaN (caller shows an error). */
export function durationToMonths(value: string): number | null {
  const s = String(value || '').trim().toLowerCase();
  if (!s || s === 'none') return null;
  const m = s.match(/^(\d+)\s*(months?|mos?|years?|yrs?)?$/);
  if (!m) return NaN;
  const n = parseInt(m[1], 10);
  return m[2] && m[2].startsWith('y') ? n * 12 : n;
}

export function buildOwnerPayload(l: OwnerListing): Record<string, unknown> {
  const transaction_type = DEAL[l.purpose] || 'BUY';
  const isRental = transaction_type === 'RENT' || transaction_type === 'LEASE';
  const property_type = l.category === 'Commercial' ? 'COMMERCIAL' : PROPERTY_TYPE[l.propertyType] || 'APARTMENT';
  const bedrooms = bedroomCount(l);
  const carpet = firstNumber(l.carpetArea);
  const title = [asksBhk(l) ? l.bhk : '', l.propertyType, 'in', l.locality].filter(Boolean).join(' ').slice(0, 255) || 'Property';

  const payload: Record<string, unknown> = {
    title,
    transaction_type,
    property_type,
    price_rupees: Math.round(Number(l.price)),
    price_period: isRental ? 'MONTHLY' : 'TOTAL',
    description: text(l.description, 5000),
    construction_status: CONSTRUCTION[l.availability],
    locality: l.locality.trim(),
    city: l.city.trim() || 'Chennai',
    district: text(l.district, 255),
    pincode: l.pincode.trim(),
    sub_locality: text(l.subLocality, 255),
    society_name: text(l.society, 255),
    house_no: text(l.houseNo, 100),
    landmark: text(l.landmark, 255),
    area_value: carpet && carpet > 0 ? carpet : undefined,
    area_unit: carpet && carpet > 0 ? 'sqft' : undefined,
    bedrooms: bedrooms ?? undefined,
    bathrooms: firstNumber(l.bathrooms) ?? undefined,
    balconies: firstNumber(l.balconies) ?? undefined,
    built_up_area: firstNumber(l.builtUpArea) ?? undefined,
    super_built_up_area: firstNumber(l.superBuiltUpArea) ?? undefined,
    total_floors: firstNumber(l.totalFloors) ?? undefined,
    floor_on: text(l.floor, 10),
    is_duplex: l.duplex,
    property_age_band: AGE_BAND[l.propertyAge],
    furnishing: text(l.furnishing, 50),
    covered_parking: l.coveredParking,
    open_parking: l.openParking,
    open_sides: l.openSides === '4' ? '3+' : text(l.openSides, 10),
    overlooking: text(l.overlooking[0], 50),
    facing: text(l.facing, 20),
    ownership_type: text(l.ownership, 50),
    contact_phone: text(l.phone, 20),
    contact_email: text(l.email, 255),
    amenities: l.amenities,
    property_features: l.features,
  };

  if (isRental) {
    const lockIn = durationToMonths(l.lockInPeriod);
    const agreement = durationToMonths(l.agreementDuration);
    payload.rent_terms = {
      security_deposit_rupees: firstNumber(l.securityDeposit) ?? undefined,
      maintenance_rupees: firstNumber(l.maintenance) ?? undefined,
      maintenance_period: l.maintenance ? text(l.maintenanceFrequency, 20) : undefined,
      is_negotiable: l.negotiable,
      available_from: text(l.availableFrom, 50),
      tenant_preference: text(l.tenantPreference[0], 20),
      lock_in_months: Number.isNaN(lockIn) ? undefined : lockIn ?? undefined,
      agreement_months: Number.isNaN(agreement) ? undefined : agreement ?? undefined,
    };
  }

  // Drop undefined keys so the backend sees "not provided", never a guess.
  return Object.fromEntries(Object.entries(payload).filter(([, v]) => v !== undefined));
}

export async function listOwnerListings(page = 1, pageSize = 50) {
  return withRole('OWNER', () => apiGet<Page<OwnerListingOut>>('/owner/listings', { page, page_size: pageSize }));
}

export async function createOwnerListing(listing: OwnerListing): Promise<OwnerListingOut> {
  return withRole('OWNER', () => apiPost<OwnerListingOut>('/owner/listings', buildOwnerPayload(listing)));
}

/** Upload one photo (multipart). `blob` is the compressed JPEG from the wizard. */
export async function uploadListingPhoto(listingId: number, blob: Blob, category: string): Promise<PhotoUploadOut> {
  const form = new FormData();
  form.append('file', blob, 'photo.jpg');
  form.append('category', category);
  return withRole('OWNER', () => apiRequest<PhotoUploadOut>(`/owner/listings/${listingId}/photos`, { method: 'POST', body: form }));
}

/** Soft delete (the backend never hard-deletes listings). */
export async function deleteOwnerListing(listingId: number): Promise<void> {
  await withRole('OWNER', () => apiDelete(`/owner/listings/${listingId}`));
}

/** REJECTED -> PENDING: send a rejected listing back for review. */
export async function resubmitOwnerListing(listingId: number): Promise<OwnerListingOut> {
  return withRole('OWNER', () => apiPost<OwnerListingOut>(`/owner/listings/${listingId}/submit`));
}

/** AVAILABLE -> CLOSED (hide from buyers). */
export async function archiveOwnerListing(listingId: number): Promise<OwnerListingOut> {
  return withRole('OWNER', () => apiPost<OwnerListingOut>(`/owner/listings/${listingId}/archive`));
}

/** CLOSED -> AVAILABLE (verified listings only). */
export async function publishOwnerListing(listingId: number): Promise<OwnerListingOut> {
  return withRole('OWNER', () => apiPost<OwnerListingOut>(`/owner/listings/${listingId}/publish`));
}

/** Data URL from the wizard's image compression -> Blob for upload. */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [head, body] = dataUrl.split(',');
  const mime = head.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
  const bytes = atob(body);
  const arr = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}
