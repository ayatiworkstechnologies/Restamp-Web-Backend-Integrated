/**
 * Backend listing shapes -> the website's Property view model.
 *
 * Only real backend fields are mapped. Anything the backend does not return
 * (builder, amenities, nearby places, completion dates, furnishing on public
 * cards, ...) is left undefined so the UI hides it rather than inventing it.
 * Images: only absolute http(s) URLs from the backend are used; otherwise the
 * image is '' and components render a neutral "no photo" placeholder (never a
 * stock photo presented as the property).
 */
import type { Property } from '@/data/properties';
import type { ListingCard, ListingDetail } from './buyer';

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  APARTMENT: 'Apartment',
  VILLA: 'Villa',
  HOUSE: 'House',
  COMMERCIAL: 'Commercial',
  PLOT: 'Plot',
  AGRICULTURAL_LAND: 'Agricultural Land',
};

const CATEGORY_BY_TYPE: Record<string, Property['propertyCategory']> = {
  APARTMENT: 'Apartments',
  VILLA: 'Villas',
  HOUSE: 'Home',
  COMMERCIAL: 'Commercial',
  PLOT: 'Plots',
  AGRICULTURAL_LAND: 'Plots',
};

export const DEAL_LABELS: Record<string, string> = {
  BUY: 'For Sale',
  RESALE: 'Resale',
  RENT: 'For Rent',
  LEASE: 'For Lease',
};

const PURPOSE_BY_DEAL: Record<string, Property['purpose']> = {
  BUY: 'Buy',
  RESALE: 'Resale',
  RENT: 'Rent',
  LEASE: 'Lease',
};

export const CONSTRUCTION_LABELS: Record<string, string> = {
  READY_TO_MOVE: 'Ready to Move',
  UNDER_CONSTRUCTION: 'Under Construction',
  NEW_LAUNCH: 'New Launch',
};

const AREA_UNIT_LABELS: Record<string, string> = { SQFT: 'sq. ft.', SQYD: 'sq. yd.', SQM: 'sq. m.', ACRE: 'acres', CENT: 'cents', GROUND: 'grounds' };

export function typeLabel(type: string | null | undefined): string {
  if (!type) return '';
  return PROPERTY_TYPE_LABELS[type] || type.charAt(0) + type.slice(1).toLowerCase().replace(/_/g, ' ');
}

export function cleanImageUrl(url: string | null | undefined): string {
  return url && /^https?:\/\//i.test(url) ? url : '';
}

function areaLabel(value: number | null, unit: string | null): string | undefined {
  if (value == null) return undefined;
  const u = unit ? AREA_UNIT_LABELS[unit.toUpperCase()] || unit.toLowerCase() : 'sq. ft.';
  return `${value.toLocaleString('en-IN')} ${u}`;
}

function rupees(paise: number): number {
  return Math.round(paise / 100);
}

/** Price per sq. ft. only for sale listings measured in sq. ft. (a real derived figure). */
function pricePerSqft(c: ListingCard): string | undefined {
  if (!(c.transaction_type === 'BUY' || c.transaction_type === 'RESALE')) return undefined;
  if (!c.area_value || (c.area_unit && c.area_unit.toUpperCase() !== 'SQFT')) return undefined;
  const per = Math.round(rupees(c.price_paise) / c.area_value);
  return per > 0 ? `₹${per.toLocaleString('en-IN')} /sqft` : undefined;
}

export function cardToProperty(c: ListingCard): Property {
  const label = typeLabel(c.property_type);
  return {
    id: c.listing_id,
    badge: label || 'Property',
    type: c.property_type,
    name: c.title,
    area: c.locality,
    city: c.city,
    locality: c.locality,
    beds: c.bedrooms != null ? `${c.bedrooms} ${c.bedrooms === 1 ? 'Bed' : 'Beds'}` : undefined,
    baths: c.bathrooms != null ? `${c.bathrooms} ${c.bathrooms === 1 ? 'Bath' : 'Baths'}` : undefined,
    address: c.address_line || c.location_label,
    sqft: areaLabel(c.area_value, c.area_unit),
    price: c.price_display,
    priceMin: rupees(c.price_paise),
    priceMax: rupees(c.price_paise),
    image: cleanImageUrl(c.cover_image_url),
    purpose: PURPOSE_BY_DEAL[c.transaction_type],
    propertyCategory: CATEGORY_BY_TYPE[c.property_type],
    statusTag: DEAL_LABELS[c.transaction_type],
    launchType: c.construction_status ? CONSTRUCTION_LABELS[c.construction_status] : undefined,
    bhk: c.bedrooms != null && c.bedrooms > 0 ? `${c.bedrooms} BHK` : undefined,
    bhkCount: c.bedrooms ?? undefined,
    propertyType: label,
    pricePerSqft: pricePerSqft(c),
    description: c.description || undefined,
    postedBy: 'Owner',
  };
}

export function detailToProperty(d: ListingDetail): Property {
  const base = cardToProperty(d);
  const gallery = (d.gallery || []).map(cleanImageUrl).filter(Boolean);
  const cover = base.image;
  return {
    ...base,
    gallery: cover && !gallery.includes(cover) ? [cover, ...gallery] : gallery.length ? gallery : cover ? [cover] : [],
    builderName: d.owner_name || undefined,
  };
}
