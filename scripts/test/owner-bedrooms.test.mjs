// Post-property wizard -> POST /owner/listings payload: bedroom count (src/lib/api/owner.ts).
import { check, done } from './check.mjs';
import { bedroomCount, buildOwnerPayload } from '@/lib/api/owner';
import { emptyListing } from '@/lib/ownerListings';

const listing = (patch) => ({
  ...emptyListing(),
  purpose: 'Sell',
  category: 'Residential',
  propertyType: 'Apartment',
  locality: 'Adyar',
  city: 'Chennai',
  district: 'Chennai',
  pincode: '600020',
  price: '8500000',
  carpetArea: '1200',
  ...patch,
});

// The mobile app's rule (Restamp-latest/src/features/owner/api/owner.js buildPayload).
const mobileBedrooms = (l) => {
  const n = parseInt(String(l.bedrooms || l.bhk || '').replace(/[^0-9]/g, ''), 10);
  return Number.isNaN(n) ? null : n;
};

const cases = [
  ['BHK only', { bhk: '2 BHK', bedrooms: '' }, 2],
  ['Bedrooms only', { bhk: '', bedrooms: '3' }, 3],
  ['Bedrooms wins over a different BHK', { bhk: '2 BHK', bedrooms: '3' }, 3],
  ['same value in both', { bhk: '3 BHK', bedrooms: '3' }, 3],
  ["'5+' chip", { bhk: '', bedrooms: '5+' }, 5],
  ["'5+ BHK'", { bhk: '5+ BHK', bedrooms: '' }, 5],
  ["'1 RK'", { bhk: '1 RK', bedrooms: '' }, 1],
  ['nothing chosen', { bhk: '', bedrooms: '' }, null],
  ['PG / Co-living (no BHK asked) keeps Bedrooms', { propertyType: 'PG / Co-living', bhk: '', bedrooms: '2' }, 2],
  ['Villa', { propertyType: 'Independent House / Villa', bhk: '4 BHK', bedrooms: '' }, 4],
];
for (const [name, patch, expected] of cases) {
  const l = listing(patch);
  const payload = buildOwnerPayload(l);
  const sent = payload.bedrooms ?? null;
  check(`${name}: sends bedrooms=${expected}`, sent === expected && bedroomCount(l) === expected, sent);
  check(`  ${name}: same as the mobile app`, sent === mobileBedrooms(l));
  if (expected === null) check(`  ${name}: key omitted, never guessed`, !('bedrooms' in payload));
}

// Values left over from a field the wizard no longer shows are not sent.
const pgStale = buildOwnerPayload(listing({ propertyType: 'PG / Co-living', bhk: '3 BHK', bedrooms: '' }));
check('PG with a leftover BHK (switched from Apartment): no bedrooms sent', !('bedrooms' in pgStale), pgStale.bedrooms);
check('PG with a leftover BHK: title has no BHK', pgStale.title === 'PG / Co-living in Adyar', pgStale.title);
const plot = buildOwnerPayload(listing({ propertyType: 'Plot / Land', bhk: '2 BHK', bedrooms: '3' }));
check('Plot with leftover room values: no bedrooms sent', !('bedrooms' in plot), plot.bedrooms);
const office = buildOwnerPayload(listing({ category: 'Commercial', propertyType: 'Office', bhk: '', bedrooms: '2' }));
check('Commercial: no bedrooms sent', !('bedrooms' in office), office.bedrooms);

// Title keeps the BHK configuration (as the mobile app does) while the count follows Bedrooms.
const differ = buildOwnerPayload(listing({ bhk: '2 BHK', bedrooms: '3' }));
check('BHK/Bedrooms differ: title keeps "2 BHK"', differ.title === '2 BHK Apartment in Adyar', differ.title);
check('BHK/Bedrooms differ: other fields unaffected', differ.transaction_type === 'BUY' && differ.property_type === 'APARTMENT' && differ.price_rupees === 8500000);

done();
