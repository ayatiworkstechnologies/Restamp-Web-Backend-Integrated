// Owner leads / visits and the agent dashboard use the real backend (no seeded or browser-stored
// data); Contact Us and agent checkout never claim a success that did not happen; production builds
// talk to https://api.restamp.in. Behaviour runs against a stand-in backend (no network).
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
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
store.set('restamp_session', JSON.stringify({ token: 't', userId: 9, role: 'OWNER', displayName: 'Kavya', isAdmin: false, expiresAt: Date.now() + 6e5 }));

const calls = [];
const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
globalThis.fetch = async (url, init = {}) => {
  const { pathname } = new URL(url);
  const method = init.method || 'GET';
  const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
  calls.push({ method, pathname, body });
  if (pathname === '/owner/leads' && method === 'GET') {
    return json(200, { page: 1, page_size: 100, total: 2, items: [
      { id: 1, property_listing_id: 50, buyer_user_id: 7, buyer_display_name: 'Ravi', status: 'NEW', message: 'Hi', message_count: 1, created_at: '2026-11-06T05:00:00', listing: { title: 'Flat A', locality: 'Adyar', city: 'Chennai' } },
      { id: 2, property_listing_id: 51, buyer_user_id: 8, buyer_display_name: '+919812345678', status: 'CLOSED', closing_reason: 'Sold', last_message: 'Thanks', listing: null, listing_removed: true },
    ] });
  }
  if (pathname === '/owner/visits' && method === 'GET') {
    return json(200, { page: 1, page_size: 100, total: 1, items: [
      { id: 30, property_listing_id: 50, buyer_user_id: 7, buyer_display_name: 'Ravi', scheduled_at: '2026-11-10T05:30:00', status: 'REQUESTED', initiator: 'BUYER', note: null, listing: { title: 'Flat A' } },
    ] });
  }
  if (pathname.startsWith('/owner/leads/') && method === 'PATCH') return json(200, { id: 1, property_listing_id: 50, buyer_user_id: 7, status: body.status, closing_reason: body.closing_reason ?? null });
  if (pathname === '/owner/visits' && method === 'POST') return json(201, { id: 31, ...body, status: 'PROPOSED', initiator: 'OWNER', listing: { title: 'Flat A' } });
  if (pathname.startsWith('/owner/visits/') && method === 'PATCH') return json(200, { id: Number(pathname.split('/').pop()), property_listing_id: 50, buyer_user_id: 7, scheduled_at: body.scheduled_at || '2026-11-10T05:30:00', status: body.status || 'PROPOSED', initiator: 'OWNER', listing: { title: 'Flat A' } });
  return json(404, { detail: 'Not Found' });
};

const leads = await import('@/lib/ownerLeads');
const { planActive } = await import('@/lib/api/broker');

const list = await leads.listOwnerLeads();
check('owner leads come from GET /owner/leads', calls.some((c) => c.method === 'GET' && c.pathname === '/owner/leads') && list.length === 2);
check('lead fields map from the backend (name, property, locality, message, status)',
  list[0].customerName === 'Ravi' && list[0].propertyTitle === 'Flat A' && list[0].locality === 'Adyar, Chennai' && list[0].status === 'NEW');
check('a phone-shaped or missing name falls back to "Buyer #id" — never a phone number', list[1].customerName === 'Buyer #8');
check('removed listing and closing reason are honest', list[1].listingRemoved && list[1].propertyTitle === 'Removed listing' && list[1].closingReason === 'Sold');
check('lead objects carry no phone field', !('phone' in list[0]));

const visits = await leads.listOwnerVisits();
check('zone-less visit times are read as UTC', visits[0].scheduledAt === '2026-11-10T05:30:00.000Z');
check('a lead finds its open visit (same buyer + property)', leads.activeVisitFor(list[0], visits)?.id === 30 && !leads.activeVisitFor(list[1], visits));

calls.length = 0;
await leads.updateLeadStatus(1, 'CONTACTED');
await leads.updateLeadStatus(1, 'CLOSED', 'Rented');
check('status changes PATCH the backend; closing_reason only when closing',
  JSON.stringify(calls.map((c) => c.body)) === JSON.stringify([{ status: 'CONTACTED' }, { status: 'CLOSED', closing_reason: 'Rented' }]));
calls.length = 0;
await leads.proposeVisit(list[0], '2026-11-12T06:00:00.000Z', 'Evening');
await leads.proposeVisit(list[0], '2026-11-13T06:00:00.000Z', undefined, visits[0]);
check('a new proposal POSTs /owner/visits with the lead\'s buyer + property; an open visit is rescheduled with PATCH',
  calls[0].method === 'POST' && calls[0].pathname === '/owner/visits' && calls[0].body.buyer_user_id === 7 && calls[0].body.property_listing_id === 50 &&
  calls[1].method === 'PATCH' && calls[1].pathname === '/owner/visits/30');

check('agent plan validity', planActive({ has_plan: true, valid_until: null }) && !planActive({ has_plan: false }) &&
  !planActive({ has_plan: true, valid_until: '2020-01-01T00:00:00' }) && planActive({ has_plan: true, valid_until: '2999-01-01T00:00:00' }));

// --- source guards ---
const SRC = fileURLToPath(new URL('../../src/', import.meta.url));
const read = (rel) => readFileSync(join(SRC, rel), 'utf8');
const walk = (dir) => readdirSync(dir).flatMap((f) => { const p = join(dir, f); return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) ? [p] : []; });
const files = walk(SRC).map((f) => [f.slice(SRC.length), readFileSync(f, 'utf8')]);

for (const mod of ['agentLeads', 'profile', 'activity', 'dashboard-data', 'settings-data']) {
  check(`mock module @/lib/${mod} is gone and unused`, !existsSync(join(SRC, `lib/${mod}.ts`)) && !files.some(([, s]) => s.includes(`@/lib/${mod}'`)));
}
check('only types are imported from the static sample catalog',
  files.every(([f, s]) => f.startsWith('lib/agent-data') || !/import\s+\{[^}]*\b(properties|allProperties)\b[^}]*\}\s+from '@\/data\/properties'/.test(s)));
check('agent dashboard pages read only the backend (no agentPlan / agent-data / localStorage)',
  ['app/agent/dashboard/page.tsx', 'app/agent/dashboard/properties/page.tsx', 'app/agent/dashboard/leads/page.tsx', 'app/agent/dashboard/payments/page.tsx', 'app/agent/dashboard/profile/page.tsx', 'app/agent/dashboard/layout.tsx']
    .every((f) => { const s = read(f); return !s.includes('@/lib/agentPlan') && !s.includes('@/lib/agent-data') && !s.includes('localStorage'); }));
check('no invented RERA / firm values remain in the agent area', !files.some(([f, s]) => f.startsWith('app/agent') && /TN\/AGENT\/\d|Royal Realty Associates/.test(s)));
const contact = read('components/dashboard-shared/ContactUs.tsx');
check('Contact Us never shows "sent" or stores messages; send is disabled; no placeholder support number',
  !contact.includes('setSent') && !contact.includes('localStorage') && contact.includes('disabled\n') && !/98400|9840000000/.test(contact));
const pay = read('app/agent/payment/page.tsx');
check('agent checkout cannot record a payment or activate a plan',
  !pay.includes('activateAgentPackage') && !pay.includes('saveAgentPayment') && /onClick=\{handleProcessPayment\}\s*disabled/.test(pay));
check('home sections show real listings, never a sample phone number',
  read('components/home/RecentlyAddedSection.tsx').includes('searchListings(') && !read('components/home/RecentlyAddedSection.tsx').includes('98402'));
check("production builds default to the live API", read('lib/api/client.ts').includes("const DEFAULT_PROD_API_URL = 'https://api.restamp.in';"));

done();
