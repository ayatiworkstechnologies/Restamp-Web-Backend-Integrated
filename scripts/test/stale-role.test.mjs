// Stale cached role (src/lib/api/auth.ts withRole/inRole), against a fake backend that
// enforces roles like deps.require_role (403 "<ROLE> role required"). No network.
import { check, done } from './check.mjs';

// --- browser + backend stand-ins (set up before the modules load) ---
const store = new Map();
const win = new EventTarget();
win.sessionStorage = {
  getItem: (k) => (store.has(k) ? store.get(k) : null),
  setItem: (k, v) => store.set(k, String(v)),
  removeItem: (k) => store.delete(k),
};
globalThis.window = win;

const backend = { role: 'OWNER', calls: [], stuck: false };
const json = (status, data) =>
  new Response(data === undefined ? null : JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
globalThis.fetch = async (url, init = {}) => {
  const { pathname } = new URL(url);
  const method = init.method || 'GET';
  const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
  backend.calls.push(`${method} ${pathname}`);
  await Promise.resolve();
  if (pathname === '/users/me/role' && method === 'POST') {
    backend.role = body.role;
    return json(200, { user_id: 7, role: body.role });
  }
  if (pathname === '/auth/me') return json(200, { id: 7, display_name: 'Test Buyer', role: backend.role, providers: ['phone'], is_admin: false });
  const area = pathname.split('/')[1]; // buyer | owner
  const needed = area.toUpperCase();
  if (backend.role !== needed || backend.stuck) return json(403, { detail: `${needed} role required` });
  if (method === 'POST' && pathname === '/buyer/enquiries') {
    if (body.property_listing_id === 999) return json(403, { detail: 'Forbidden' });
    return json(201, { id: 1, property_listing_id: body.property_listing_id, message: body.message, status: 'NEW', closing_reason: null, listing: {} });
  }
  if (method === 'POST' && pathname.startsWith('/buyer/viewed/')) return json(201, { id: 1 });
  if (method === 'GET') return json(200, { items: [], page: 1, page_size: 50, total: 0 });
  return json(404, { detail: 'Not found' });
};

const { saveSession, getSession } = await import('@/lib/api/session');
const { isApiError } = await import('@/lib/api/client');
const buyer = await import('@/lib/api/buyer');
const owner = await import('@/lib/api/owner');

const signIn = (cachedRole, backendRole) => {
  saveSession({ token: 'test-token', userId: 7, role: cachedRole, displayName: 'Test Buyer', isAdmin: false, expiresAt: Date.now() + 30 * 60_000 });
  backend.role = backendRole;
  backend.calls = [];
  backend.stuck = false;
};
const roleSwitches = () => backend.calls.filter((c) => c === 'POST /users/me/role').length;
const rejects = async (p) => {
  try {
    await p;
    return null;
  } catch (e) {
    return e;
  }
};

// 1. The reviewed bug: this tab caches BUYER, the account was switched to OWNER elsewhere.
signIn('BUYER', 'OWNER');
const enquiry = await buyer.sendEnquiry(1, 'Is it available?');
check('stale BUYER cache: enquiry succeeds after one switch + retry', enquiry?.id === 1, backend.calls);
check('  exact calls: 403, switch to BUYER, retry', JSON.stringify(backend.calls) === JSON.stringify(['POST /buyer/enquiries', 'POST /users/me/role', 'POST /buyer/enquiries']), backend.calls);
check('  cache and backend both BUYER afterwards', getSession()?.role === 'BUYER' && backend.role === 'BUYER');

// 2. Cache matches the backend: one request, no role change.
signIn('BUYER', 'BUYER');
await buyer.listEnquiries();
check('fresh cache: single request, no role switch', backend.calls.length === 1 && roleSwitches() === 0, backend.calls);

// 3. Background view record never switches the role; it corrects the cache read-only.
signIn('BUYER', 'OWNER');
const viewErr = await rejects(buyer.recordView(1));
check('passive recordView with stale cache: fails without switching', isApiError(viewErr, 'denied') && roleSwitches() === 0, backend.calls);
check('  cache corrected from GET /auth/me; backend role untouched', getSession()?.role === 'OWNER' && backend.role === 'OWNER' && backend.calls.includes('GET /auth/me'));

// 4. Same for the wishlist's background saved-list load.
signIn('BUYER', 'OWNER');
const savedErr = await rejects(buyer.listSaved(1, 100, { passive: true }));
check('passive listSaved with stale cache: no role switch', isApiError(savedErr, 'denied') && roleSwitches() === 0 && backend.role === 'OWNER');

// 5. Opening Saved (explicit buyer mode) with a stale cache still works.
signIn('BUYER', 'OWNER');
await buyer.listSaved(1, 100);
check('Saved page load with stale cache: switches once and loads', roleSwitches() === 1 && backend.role === 'BUYER', backend.calls);

// 6. Any other 403 is not a role problem: no switch, error passed on.
signIn('BUYER', 'BUYER');
const forbidden = await rejects(buyer.sendEnquiry(999, 'hi'));
check('other 403 ("Forbidden"): passed on, no switch, no retry', forbidden?.detail === 'Forbidden' && roleSwitches() === 0 && backend.calls.length === 1, backend.calls);

// 7. Retries only once.
signIn('BUYER', 'OWNER');
backend.stuck = true;
const stuckErr = await rejects(buyer.sendEnquiry(1, 'hi'));
check('still refused after switching: gives up after one retry', isApiError(stuckErr, 'denied') && backend.calls.filter((c) => c === 'POST /buyer/enquiries').length === 2 && roleSwitches() === 1, backend.calls);

// 8. Owner flows: owner tab caches OWNER, account switched to BUYER elsewhere.
signIn('OWNER', 'BUYER');
await owner.listOwnerListings();
check('stale OWNER cache: owner listings load after one switch', roleSwitches() === 1 && backend.role === 'OWNER' && getSession()?.role === 'OWNER', backend.calls);

// 9. Parallel requests that all hit the stale role share one switch request.
signIn('BUYER', 'OWNER');
await Promise.all([buyer.listEnquiries(), buyer.listVisits(), buyer.listViewed()]);
check('parallel stale requests: one shared role switch (one history row)', roleSwitches() === 1, backend.calls);

done();
