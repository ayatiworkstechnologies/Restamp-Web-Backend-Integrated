// Reva talks only to the real /chat endpoint: the question is relayed, the
// signed-in token rides along when a session exists, a rejected token falls
// back to one anonymous attempt, and the widget renders exactly what the
// backend returned (reply + demo flag + real listing cards). No replies are
// invented in the browser.
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
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
globalThis.sessionStorage = win.sessionStorage;

const calls = [];
let chatBehaviour = 'ok'; // 'ok' | 'unauthorized' | 'rate-limited'
const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
globalThis.fetch = async (url, init = {}) => {
  const { pathname } = new URL(url);
  const method = init.method || 'GET';
  const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
  const headers = init.headers || {};
  calls.push({ method, pathname, body, headers });
  if (pathname === '/chat' && method === 'POST') {
    if (chatBehaviour === 'unauthorized' && headers.Authorization) return json(401, { detail: 'Invalid or expired token' });
    if (chatBehaviour === 'rate-limited') return json(429, { detail: 'Too many requests. Please try again soon.' });
    return json(200, {
      reply: 'Here are 2 verified listings matching Velachery.',
      language: body.language,
      model: 'murai-labs/agaram-2.5b-instruct',
      demo: false,
      listings: [
        { listing_id: 50, title: '2BHK Flat in Velachery', price_display: '₹85 L', locality: 'Velachery', city: 'Chennai', property_type: 'APARTMENT', bedrooms: 2 },
      ],
    });
  }
  if (pathname === '/chat/health' && method === 'GET') {
    return json(200, { ok: true, mode: 'demo', model: 'local-knowledge-base', provider: 'local-knowledge-base', languages: ['en', 'ta'], voice: true, agaram_ready: false });
  }
  return json(404, { detail: 'Not Found' });
};

store.set('restamp_session', JSON.stringify({ token: 't', userId: 9, role: 'BUYER', displayName: 'Isaac', isAdmin: false, expiresAt: Date.now() + 6e5 }));

const reva = await import('@/lib/api/reva');
const { ApiError, isApiError } = await import('@/lib/api/client');

// --- the wire contract --------------------------------------------------------
const history15 = Array.from({ length: 15 }, (_, i) => ({ role: i % 2 ? 'assistant' : 'user', content: 'x'.repeat(1200) }));
calls.length = 0;
const res = await reva.sendChatMessage({
  message: 'Show 2BHK flats in Velachery',
  language: 'en',
  history: history15,
});
check('chat POSTs to the real /chat endpoint with the session token attached',
  calls[0].method === 'POST' && calls[0].pathname === '/chat' && calls[0].headers.Authorization === 'Bearer t');
check('the request carries the message and language — the ROLE is never claimed by the browser (the backend reads it from the database)',
  JSON.stringify(calls[0].body) === JSON.stringify({
    message: 'Show 2BHK flats in Velachery',
    language: 'en',
    history: history15.slice(-12).map((t) => ({ role: t.role, content: 'x'.repeat(1000) })),
  }));
check('history is capped at 12 items × 1000 chars before it is sent', calls[0].body.history.length === 12 && calls[0].body.history[0].content.length === 1000);
check('the answer, model and demo flag come straight from the backend', res.reply.startsWith('Here are 2') && res.demo === false && res.language === 'en');
check('real listing cards come from the response, keyed to the listing id', res.listings?.[0]?.listing_id === 50 && res.listings[0].price_display === '₹85 L');
check('the message cap mirrors the backend schema', reva.CHAT_MESSAGE_MAX_CHARS === 500 && reva.CHAT_HISTORY_MAX_ITEMS === 12);

// --- rejected token: fail closed once, then answer the guest ------------------
chatBehaviour = 'unauthorized';
calls.length = 0;
const after401 = await reva.sendChatMessage({ message: 'How does 0% brokerage work?', language: 'en' });
const first = calls.find((c) => c.headers.Authorization);
const second = calls.filter((c) => !c.headers.Authorization).pop();
check('a rejected token ends the local session', !store.has('restamp_session'));
check('the same question is retried anonymously so the guest still gets an answer',
  calls.length === 2 && Boolean(first) && Boolean(second) && after401.reply.startsWith('Here are 2'));
chatBehaviour = 'ok';

// --- rate limiting: the backend's message is surfaced verbatim ----------------
store.set('restamp_session', JSON.stringify({ token: 't', userId: 9, role: 'BUYER', displayName: 'Isaac', isAdmin: false, expiresAt: Date.now() + 6e5 }));
chatBehaviour = 'rate-limited';
const limited = await reva.sendChatMessage({ message: 'Any villas?', language: 'en' }).catch((e) => e);
check('a 429 surfaces as a retryable error carrying the backend’s plain-language detail',
  isApiError(limited) && limited.kind === 'retry' && limited.detail === 'Too many requests. Please try again soon.');
chatBehaviour = 'ok';

// --- service mode banner -------------------------------------------------------
calls.length = 0;
const health = await reva.getChatHealth();
check('health is read from GET /chat/health (demo vs live AI shown honestly)',
  calls[0].pathname === '/chat/health' && health.mode === 'demo' && health.agaram_ready === false);

// --- source guards -------------------------------------------------------------
const SRC = fileURLToPath(new URL('../../src/', import.meta.url));
const read = (rel) => readFileSync(join(SRC, rel), 'utf8');

const widget = read('components/reva/RevaAssistant.tsx');
check('the widget sends the question through the real API module only', widget.includes('sendChatMessage') && widget.includes("from '@/lib/api/reva'"));
check('the widget marks knowledge-base answers (demo) so users are never misled', widget.includes('b.demo'));
check('property cards render only what the backend returned', widget.includes('b.listings') && widget.includes('/properties/${l.listing_id}'));
check('the widget offers a retry after a failed answer and trims the input to the backend cap',
  widget.includes('RotateCcw') && widget.includes('retry(b.retryWith, i)') && widget.includes('CHAT_MESSAGE_MAX_CHARS'));
check('the widget supports both languages', widget.includes("setLanguage('ta')") && widget.includes('தமிழ்'));
check('no fabricated listings or replies are stored in the widget bundle',
  !/listings\s*=\s*\[\s*\{/.test(widget) && !widget.includes('mockReplies'));

const revaApi = read('lib/api/reva.ts');
check('the API module never claims a role for the caller and never fabricates a reply',
  !revaApi.includes("'Buyer'") && !revaApi.includes("'Agent'") && !revaApi.includes("'Owner'") && !revaApi.includes('fallbackReply'));

done();
