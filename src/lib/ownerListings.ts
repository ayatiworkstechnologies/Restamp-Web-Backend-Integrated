import { msUntilVerified } from '@/lib/auto-verify';
import { updateUsage } from '@/lib/subscription-store';
import { getProfile } from '@/lib/profile';

export type ListingPurpose = 'Sell' | 'Resale' | 'Rent' | 'Lease';
export type ListingCategory = 'Residential' | 'Commercial';

export type PhotoCategory =
  | 'Exterior'
  | 'Living Room'
  | 'Bedroom'
  | 'Kitchen'
  | 'Bathroom'
  | 'Balcony'
  | 'Floor Plan'
  | 'Other Rooms';

export type ListingPhoto = { id: string; src: string; category: PhotoCategory };

export type OwnerListing = {
  id: string;
  status: 'Draft' | 'Pending Verification' | 'Live';
  createdAt: string;
  updatedAt: string;

  // Basic
  purpose: ListingPurpose;
  category: ListingCategory;
  propertyType: string;
  bhk: string;
  phone: string;
  email: string;

  // Location
  city: string;
  district: string;
  locality: string;
  pincode: string;
  subLocality: string;
  society: string;
  houseNo: string;
  landmark: string;

  // Property details
  bedrooms: string;
  bathrooms: string;
  balconies: string;
  carpetArea: string;
  builtUpArea: string;
  superBuiltUpArea: string;
  totalFloors: string;
  floor: string;
  duplex: boolean;
  availability: string;
  propertyAge: string;
  furnishing: string;

  // Pricing
  price: string;
  securityDeposit: string;
  bookingAmount: string;
  maintenance: string;
  maintenanceFrequency: string;
  negotiable: boolean;
  availableFrom: string;
  tenantPreference: string[];
  lockInPeriod: string;
  agreementDuration: string;

  // Photos & details
  photos: ListingPhoto[];
  coveredParking: number;
  openParking: number;
  description: string;
  ownership: string;
  features: string[];
  amenities: string[];
  facing: string;
  overlooking: string[];
  openSides: string;
};

const LISTINGS_KEY = 'restamp_owner_listings';
const DRAFT_KEY = 'restamp_owner_draft';

export function emptyListing(): OwnerListing {
  const now = new Date().toISOString();
  return {
    id: `L${Date.now()}`,
    status: 'Draft',
    createdAt: now,
    updatedAt: now,
    purpose: 'Sell',
    category: 'Residential',
    propertyType: '',
    bhk: '',
    phone: '',
    email: '',
    city: 'Chennai',
    district: 'Chennai',
    locality: '',
    pincode: '',
    subLocality: '',
    society: '',
    houseNo: '',
    landmark: '',
    bedrooms: '',
    bathrooms: '',
    balconies: '',
    carpetArea: '',
    builtUpArea: '',
    superBuiltUpArea: '',
    totalFloors: '',
    floor: '',
    duplex: false,
    availability: 'Ready to Move',
    propertyAge: '',
    furnishing: 'Unfurnished',
    price: '',
    securityDeposit: '',
    bookingAmount: '',
    maintenance: '',
    maintenanceFrequency: 'Monthly',
    negotiable: false,
    availableFrom: '',
    tenantPreference: [],
    lockInPeriod: '',
    agreementDuration: '',
    photos: [],
    coveredParking: 0,
    openParking: 0,
    description: '',
    ownership: 'Freehold',
    features: [],
    amenities: [],
    facing: '',
    overlooking: [],
    openSides: '',
  };
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

// Returns false when the browser refuses to store it (usually too many photos)
function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

/** Listings submitted for verification go live automatically AUTO_VERIFY_MINUTES later. */
export const getOwnerListings = () =>
  read<OwnerListing[]>(LISTINGS_KEY, []).map((l) =>
    l.status === 'Pending Verification' && msUntilVerified(l.updatedAt) === 0 ? { ...l, status: 'Live' as const } : l,
  );

export function publishListing(listing: OwnerListing): boolean {
  const published = { ...listing, status: 'Pending Verification' as const, updatedAt: new Date().toISOString() };
  const ok = write(LISTINGS_KEY, [published, ...getOwnerListings().filter((l) => l.id !== listing.id)]);
  if (ok) {
    clearDraft();
    syncUsage();
  }
  return ok;
}

export const getDraft = () => read<{ listing: OwnerListing; step: number } | null>(DRAFT_KEY, null);
export const saveDraft = (listing: OwnerListing, step: number) =>
  write(DRAFT_KEY, { listing: { ...listing, updatedAt: new Date().toISOString() }, step });
export function clearDraft() {
  try {
    localStorage.removeItem(DRAFT_KEY);
  } catch {}
}

export function deleteListing(id: string) {
  write(LISTINGS_KEY, getOwnerListings().filter((l) => l.id !== id));
  syncUsage();
}

/** Keeps the admin-visible usage counter on the owner's subscription current. */
function syncUsage() {
  const me = getProfile();
  if (me?.mobile) updateUsage('owner', me.mobile, { listingsUsed: getOwnerListings().length });
}
