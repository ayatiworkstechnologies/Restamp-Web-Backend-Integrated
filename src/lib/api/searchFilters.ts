/**
 * Website search filters -> GET /buyer/listings query (pure; no React).
 *
 * Supported by the backend: purpose (deal), property type, locality, text
 * query, bedrooms (one exact value or a minimum), price range in paise,
 * construction status and sort. Furnishing, facing and amenities are NOT
 * filterable on the backend (listing cards don't carry them), so the filter
 * modal shows them as unavailable instead of silently ignoring them.
 */
import type { FilterValues } from '@/components/property/FullFiltersModal';
import type { ListingSearch } from './buyer';

const DEAL: Record<string, ListingSearch['deal']> = { Buy: 'BUY', Resale: 'RESALE', Rent: 'RENT', Lease: 'LEASE' };

const TYPE: Record<string, string> = {
  Home: 'HOUSE',
  Apartments: 'APARTMENT',
  Villas: 'VILLA',
  Plots: 'PLOT',
  Commercial: 'COMMERCIAL',
};

const STATUS: Record<string, ListingSearch['construction_status']> = {
  'New launch': 'NEW_LAUNCH',
  'Under construction': 'UNDER_CONSTRUCTION',
  'Ready to Move': 'READY_TO_MOVE',
};

// Budget presets in rupees: [min, max] (null = open-ended).
const BUDGETS: Record<string, [number | null, number | null]> = {
  'under-75l': [null, 7_500_000],
  '75l-1.25cr': [7_500_000, 12_500_000],
  '1.25cr-2cr': [12_500_000, 20_000_000],
  '2cr-5cr': [20_000_000, 50_000_000],
  'above-2cr': [20_000_000, null],
  'above-5cr': [50_000_000, null],
  'under-30k': [null, 30_000],
  '30k-60k': [30_000, 60_000],
  '60k-1.5l': [60_000, 150_000],
  'above-1.5l': [150_000, null],
};

const SORT: Record<string, ListingSearch['sort']> = {
  recommended: 'relevance',
  newest: 'relevance', // the backend's relevance order is newest first
  'price-asc': 'price_asc',
  'price-desc': 'price_desc',
};

/** Filters the backend cannot apply; the UI must not pretend they work. */
export const UNSUPPORTED_FILTER_GROUPS = ['furnishing', 'facing', 'amenities'] as const;

export function toListingSearch(f: FilterValues, searchQuery: string, sort: string): ListingSearch {
  const params: ListingSearch = { deal: DEAL[f.purpose], sort: SORT[sort] || 'relevance' };

  const type = TYPE[f.propertyType];
  if (type) params.property_type = type;

  const q = searchQuery.trim().replace(/\s+/g, ' ');
  if (q) params.q = q;
  if (f.locality && f.locality !== 'All Chennai' && f.locality !== 'All localities') params.locality = f.locality;

  const bhk = bedroomFilter(f.bhk);
  if (bhk.bedrooms != null) params.bedrooms = bhk.bedrooms;
  if (bhk.bedrooms_min != null) params.bedrooms_min = bhk.bedrooms_min;

  let [lo, hi] = BUDGETS[f.budget] || [null, null];
  if (f.customMinPrice) lo = Math.max(lo ?? 0, f.customMinPrice);
  if (f.customMaxPrice) hi = Math.min(hi ?? Infinity, f.customMaxPrice);
  if (lo) params.min_price_paise = Math.round(lo * 100);
  if (hi != null && Number.isFinite(hi)) params.max_price_paise = Math.round(hi * 100);

  const statuses = f.badges.map((b) => STATUS[b]).filter(Boolean);
  if (statuses.length === 1) params.construction_status = statuses[0];

  return params;
}

/**
 * The backend takes one exact bedroom count or a minimum. One selection maps
 * exactly ('5' = 5 or more); several map to "at least the smallest" and the
 * remaining exact match is applied to the returned cards (clientBedrooms).
 */
export function bedroomFilter(selected: string[]): {
  bedrooms?: number;
  bedrooms_min?: number;
  clientBedrooms?: number[];
} {
  const nums = selected.map((s) => parseInt(s, 10)).filter((n) => !Number.isNaN(n)).sort((a, b) => a - b);
  if (nums.length === 0) return {};
  if (nums.length === 1) return nums[0] >= 5 ? { bedrooms_min: 5 } : { bedrooms: nums[0] };
  return { bedrooms_min: nums[0], clientBedrooms: nums };
}

/** Exact client-side bedroom match for multi-select ('5' means 5 or more). */
export function matchesBedrooms(bedrooms: number | null | undefined, wanted: number[] | undefined): boolean {
  if (!wanted || wanted.length === 0) return true;
  if (bedrooms == null) return false;
  return wanted.some((n) => (n >= 5 ? bedrooms >= 5 : bedrooms === n));
}

/**
 * Count queries whose totals add up to exactly the selected filters. The
 * backend takes one bedroom value (or a minimum) and one construction
 * status, so a multi-selection is split into one count per bedroom value ×
 * status. The parts never overlap ('5' = 5 or more, the rest exact; one
 * status each), so their sum is the exact total, matching what the results
 * page keeps from the cards. Nothing multi-selected: the single search query.
 */
export function exactCountQueries(f: FilterValues, searchQuery: string, sort: string): ListingSearch[] {
  const base = toListingSearch(f, searchQuery, sort);
  const { clientBedrooms } = bedroomFilter(f.bhk);
  const statuses = statusesFor(f.badges);
  if (!clientBedrooms && statuses.length <= 1) return [base];

  const { bedrooms: _exact, bedrooms_min: _min, ...rest } = base;
  const bedroomParts: Pick<ListingSearch, 'bedrooms' | 'bedrooms_min'>[] = clientBedrooms
    ? [...new Set(clientBedrooms.map((n) => Math.min(n, 5)))].map((n) => (n >= 5 ? { bedrooms_min: 5 } : { bedrooms: n }))
    : [{ bedrooms: _exact, bedrooms_min: _min }];
  const statusParts: Pick<ListingSearch, 'construction_status'>[] =
    statuses.length > 1
      ? [...new Set(statuses)].map((s) => ({ construction_status: s as ListingSearch['construction_status'] }))
      : [{ construction_status: rest.construction_status }];

  return bedroomParts.flatMap((b) =>
    statusParts.map((s) => {
      const q: ListingSearch = { ...rest, ...b, ...s };
      (Object.keys(q) as (keyof ListingSearch)[]).forEach((k) => q[k] === undefined && delete q[k]);
      return q;
    })
  );
}

/** Several construction statuses selected: the backend takes one, so match the rest client-side. */
export function statusesFor(badges: string[]): string[] {
  return badges.map((b) => STATUS[b]).filter((s): s is NonNullable<typeof s> => !!s);
}
