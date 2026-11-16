// Homepage recent searches (src/lib/recentSearches.ts): only the visitor's own
// submitted searches, never preset sample entries.
import { readFileSync } from 'node:fs';
import { check, done } from './check.mjs';
import {
  addRecentSearch,
  MAX_RECENT_SEARCHES,
  parseRecentSearches,
  removeRecentSearch,
} from '@/lib/recentSearches';

const panel = readFileSync(new URL('../../src/components/home/SearchPanel.tsx', import.meta.url), 'utf8');
const recentState = panel.slice(panel.indexOf('const [recentSearches'), panel.indexOf('const [recentSearches') + 200);
check('SearchPanel starts with an empty recent list (no preset entries)', /useState<RecentSearch\[\]>\(\[\]\)/.test(recentState));
check('SearchPanel has no hard-coded sample places in its recent list', !/OMR Cyber Hub|ECR Beach Enclave|Prime Residential/.test(panel));

check('empty storage -> no recent searches', parseRecentSearches(null).length === 0 && parseRecentSearches('').length === 0);
check('corrupt JSON -> empty list, no throw', parseRecentSearches('{oops').length === 0);
check('non-array JSON -> empty list', parseRecentSearches('{"query":"x"}').length === 0);
check(
  'malformed entries are dropped',
  parseRecentSearches(JSON.stringify([{ query: '', purpose: 'Buy', category: 'Home', at: 1 }, { query: 'Adyar' }, null, 'x'])).length === 0,
);

const a = addRecentSearch([], { query: '  Adyar  ', purpose: 'Buy', category: 'Home' }, 1);
check('a submitted search is recorded, trimmed', a.length === 1 && a[0].query === 'Adyar' && a[0].purpose === 'Buy' && a[0].category === 'Home');
check('a blank search records nothing', addRecentSearch(a, { query: '   ', purpose: 'Buy', category: 'Home' }, 2) === a);

const b = addRecentSearch(a, { query: 'Velachery', purpose: 'Rent', category: 'Apartments' }, 2);
check('newest search first', b[0].query === 'Velachery' && b[1].query === 'Adyar');
const c = addRecentSearch(b, { query: 'adyar', purpose: 'Rent', category: 'Home' }, 3);
check('same query+type (any case) is listed once, moved to the top', c.length === 2 && c[0].query === 'adyar' && c[0].purpose === 'Rent');
const d = addRecentSearch(c, { query: 'Adyar', purpose: 'Buy', category: 'Villas' }, 4);
check('same query with another property type is a separate entry', d.length === 3);

let many = [];
for (let i = 0; i < 9; i++) many = addRecentSearch(many, { query: `q${i}`, purpose: 'Buy', category: 'Home' }, i);
check(`at most ${MAX_RECENT_SEARCHES} entries kept`, many.length === MAX_RECENT_SEARCHES && many[0].query === 'q8');

const long = addRecentSearch([], { query: 'x'.repeat(500), purpose: 'Buy', category: 'Home' }, 1);
check('very long queries are capped', long[0].query.length === 80);

check('remove one entry', removeRecentSearch(b, b[0]).length === 1 && removeRecentSearch(b, b[0])[0].query === 'Adyar');
check('round trip through storage JSON', JSON.stringify(parseRecentSearches(JSON.stringify(b))) === JSON.stringify(b));

done();
