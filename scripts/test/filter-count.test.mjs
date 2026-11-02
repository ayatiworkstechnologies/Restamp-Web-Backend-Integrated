// Filter dialog Apply count (src/lib/api/searchFilters.ts exactCountQueries), against a fake
// backend count that applies one bedrooms / bedrooms_min / construction_status like GET /buyer/listings.
import { check, done } from './check.mjs';
import { bedroomFilter, exactCountQueries, matchesBedrooms, statusesFor, toListingSearch } from '@/lib/api/searchFilters';

const filters = (patch) => ({
  purpose: 'Buy',
  city: 'Chennai',
  locality: 'All Chennai',
  propertyType: '',
  bhk: [],
  budget: 'any',
  furnishing: [],
  facing: [],
  badges: [],
  amenities: [],
  verifiedOnly: false,
  ...patch,
});

// Deterministic listings covering null/0..7 bedrooms and null/each status.
const STATUSES = [null, 'READY_TO_MOVE', 'UNDER_CONSTRUCTION', 'NEW_LAUNCH'];
const listings = [];
for (let i = 0; i < 96; i++) listings.push({ bedrooms: i % 9 === 8 ? null : i % 9, construction_status: STATUSES[i % 4] });

const backendMatches = (q) =>
  listings.filter(
    (c) =>
      (q.bedrooms === undefined || c.bedrooms === q.bedrooms) &&
      (q.bedrooms_min === undefined || (c.bedrooms != null && c.bedrooms >= q.bedrooms_min)) &&
      (q.construction_status === undefined || c.construction_status === q.construction_status)
  );
const backendCount = (q) => backendMatches(q).length;

// What the results page keeps (BuyerSearchPage: broad query, then exact match on the cards).
const resultsPageCount = (f) => {
  const { clientBedrooms } = bedroomFilter(f.bhk);
  const st = statusesFor(f.badges);
  const clientStatuses = st.length > 1 ? st : undefined;
  return backendMatches(toListingSearch(f, '', 'recommended'))
    .filter((c) => matchesBedrooms(c.bedrooms, clientBedrooms))
    .filter((c) => !clientStatuses || (!!c.construction_status && clientStatuses.includes(c.construction_status))).length;
};
const dialogCount = (f) => exactCountQueries(f, '', 'recommended').reduce((sum, q) => sum + backendCount(q), 0);

const combos = [
  ['no filters', {}],
  ['one BHK', { bhk: ['2'] }],
  ["one BHK '5+'", { bhk: ['5+'] }],
  ['two BHKs', { bhk: ['2', '4'] }],
  ["BHK incl. '5+'", { bhk: ['3', '5+'] }],
  ['all BHKs', { bhk: ['1', '2', '3', '4', '5+'] }],
  ['one status', { badges: ['New launch'] }],
  ['two statuses', { badges: ['New launch', 'Ready to Move'] }],
  ['three statuses + Verified badge', { badges: ['New launch', 'Under construction', 'Ready to Move', 'Verified'] }],
  ['two BHKs × two statuses', { bhk: ['1', '2'], badges: ['Under construction', 'Ready to Move'] }],
  ['one BHK × two statuses', { bhk: ['3'], badges: ['New launch', 'Ready to Move'] }],
  ['two BHKs × one status', { bhk: ['2', '5+'], badges: ['Under construction'] }],
];
for (const [name, patch] of combos) {
  const f = filters(patch);
  check(`${name}: dialog count = results page count`, dialogCount(f) === resultsPageCount(f), { dialog: dialogCount(f), page: resultsPageCount(f) });
}

// The reviewed bug: the old single broad query over-counted multi-selections.
const multi = filters({ bhk: ['2', '4'] });
check('regression: old count (one broad query) was too high for 2+4 BHK', backendCount(toListingSearch(multi, '', 'recommended')) > resultsPageCount(multi));

// Request shape: one request when nothing is multi-selected, exact parts otherwise.
check('single selections: one request, same as the search query', JSON.stringify(exactCountQueries(filters({ bhk: ['2'], badges: ['New launch'] }), 'adyar', 'price-asc')) === JSON.stringify([toListingSearch(filters({ bhk: ['2'], badges: ['New launch'] }), 'adyar', 'price-asc')]));
const parts = exactCountQueries(filters({ bhk: ['3', '5+'], badges: ['New launch', 'Ready to Move'] }), 'sea view', 'recommended');
check('2 BHK values × 2 statuses: 4 requests', parts.length === 4, parts);
check('  each part has exactly one bedroom filter and one status', parts.every((q) => (q.bedrooms === undefined) !== (q.bedrooms_min === undefined) && !!q.construction_status), parts);
check('  no part carries an undefined key', parts.every((q) => Object.values(q).every((v) => v !== undefined)));
check("  '5+' becomes bedrooms_min=5", parts.some((q) => q.bedrooms_min === 5) && parts.some((q) => q.bedrooms === 3));
const shared = filters({ purpose: 'Rent', locality: 'Adyar', propertyType: 'Apartments', budget: '30k-60k', bhk: ['1', '2'] });
const sharedParts = exactCountQueries(shared, 'gated', 'recommended');
check('other filters (deal, type, locality, q, price) kept in every part', sharedParts.every((q) => q.deal === 'RENT' && q.property_type === 'APARTMENT' && q.locality === 'Adyar' && q.q === 'gated' && q.min_price_paise === 3_000_000 && q.max_price_paise === 6_000_000), sharedParts);

done();
