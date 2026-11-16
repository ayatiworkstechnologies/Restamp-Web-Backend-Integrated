// Contact reveal owner name (src/lib/api/buyer.ts revealContact), against a fake
// backend. Regression for the 2026-11 contact-500 incident: the reveal response
// must surface the backend's public-safe owner_name so the Owner Details card
// shows the real owner ("Roshan", "Gowtham", ...) instead of the neutral label,
// and must keep the phone untouched. No network.
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

const backend = { listing: 42, payload: { phone: '+919444563007', owner_name: 'Gowtham S', own_listing: false } };
let lastAuth = null;
const json = (status, data) =>
  new Response(data === undefined ? null : JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
globalThis.fetch = async (url, init = {}) => {
  const { pathname } = new URL(url);
  const method = init.method || 'GET';
  lastAuth = init.headers?.Authorization ?? null;
  if (method === 'POST' && pathname === '/buyer/listings/42/contact') {
    return json(200, backend.payload);
  }
  if (pathname === '/auth/me') return json(200, { id: 7, display_name: 'Test Buyer', role: 'BUYER', providers: ['phone'], is_admin: false });
  return json(404, { detail: 'Not found' });
};

const { saveSession } = await import('@/lib/api/session');
const buyer = await import('@/lib/api/buyer');

saveSession({ token: 'test-token', userId: 7, role: 'BUYER', displayName: 'Test Buyer', isAdmin: false, expiresAt: Date.now() + 30 * 60_000 });

// Real reveal: phone plus the owner's public-safe name.
{
  const revealed = await buyer.revealContact(backend.listing);
  check('phone is returned unchanged', revealed.phone === '+919444563007', revealed);
  check('owner name comes from the reveal response', revealed.ownerName === 'Gowtham S', revealed);
  check('reveal sends the bearer token (audited, buyer-only)', lastAuth === 'Bearer test-token', lastAuth);
}

// Owner with no safe saved name: null (the card falls back), phone intact.
{
  backend.payload = { phone: '+919444563007', own_listing: false };
  const revealed = await buyer.revealContact(backend.listing);
  check('missing owner_name -> ownerName null', revealed.ownerName === null, revealed);
  check('phone still returned when owner_name missing', revealed.phone === '+919444563007', revealed);
}

// Blank / whitespace name is treated as absent, never displayed as " ".
{
  backend.payload = { phone: '+919444563007', owner_name: '   ', own_listing: false };
  const revealed = await buyer.revealContact(backend.listing);
  check('blank owner_name -> ownerName null', revealed.ownerName === null, revealed);
}

// Multi-part name passes through untouched (backend owns the safety rule).
{
  backend.payload = { phone: '+919444563007', owner_name: 'Roshan Kumar S', own_listing: false };
  const revealed = await buyer.revealContact(backend.listing);
  check('multi-part name passes through', revealed.ownerName === 'Roshan Kumar S', revealed);
}

done();
