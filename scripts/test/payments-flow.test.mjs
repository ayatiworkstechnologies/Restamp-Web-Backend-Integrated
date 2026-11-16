// The agent payment flow talks only to the real /payments backend: the server
// decides the amount, Razorpay relays ids, the backend verifies before
// activation, and nothing is recorded or activated in the browser. Provider
// unconfigured → every payment call 503s and the UI refuses honestly.
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
globalThis.sessionStorage = win.sessionStorage; // the draft bridge reads bare sessionStorage

const calls = [];
let checkoutBehaviour = 'ok'; // 'ok' | 'not-configured'
const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
globalThis.fetch = async (url, init = {}) => {
  const { pathname } = new URL(url);
  const method = init.method || 'GET';
  const body = typeof init.body === 'string' ? JSON.parse(init.body) : undefined;
  const headers = init.headers || {};
  calls.push({ method, pathname, body, headers });
  if (pathname === '/payments/checkout' && method === 'POST') {
    if (checkoutBehaviour === 'not-configured') return json(503, { detail: 'Online payments are not configured yet. Please try again later.' });
    return json(200, {
      payment_id: 11,
      provider: 'razorpay',
      razorpay_key_id: 'rzp_test_KEYID12345678',
      razorpay_order_id: 'order_1',
      amount_paise: 1499900,
      currency: 'INR',
      plan: { kind: 'agent', code: 'RESTAMP_AGENT_ELITE', name: 'Agent Elite Plan', price_paise: 1499900, duration_days: 30, locality_limit: 15 },
      unmatched_localities: [],
      unavailable_localities: ['Adyar'],
    });
  }
  if (pathname === '/payments/verify' && method === 'POST') {
    return json(200, { status: 'SUCCESS', activated: true, payment_id: 11, plan_code: 'RESTAMP_AGENT_ELITE', plan_name: 'Agent Elite Plan', transaction_id: 'pay_1', amount_paise: 1499900 });
  }
  if (pathname === '/payments/config' && method === 'GET') {
    return json(200, { provider: checkoutBehaviour === 'not-configured' ? 'none' : 'razorpay', razorpay_key_id: checkoutBehaviour === 'not-configured' ? null : 'rzp_test_KEYID12345678' });
  }
  if (pathname === '/payments/history' && method === 'GET') {
    return json(200, { items: [
      { payment_id: 11, provider: 'razorpay', status: 'SUCCESS', amount_paise: 1499900, currency: 'INR', plan_code: 'RESTAMP_AGENT_ELITE', plan_name: 'Agent Elite Plan', provider_payment_id: 'pay_1', provider_order_id: 'order_1', created_at: '2026-11-10T05:00:00', paid_at: '2026-11-10T05:02:00' },
      { payment_id: 10, provider: 'razorpay', status: 'FAILED', amount_paise: 299900, currency: 'INR', plan_code: 'RESTAMP_AGENT_STARTER', plan_name: 'Agent Starter Plan', provider_payment_id: null, provider_order_id: 'order_0', created_at: '2026-11-09T05:00:00', paid_at: null },
    ] });
  }
  if (pathname === '/payments/11/invoice' && method === 'GET') {
    return json(200, { invoice_number: 'RS-2026-000011', issued_at: '2026-11-10T05:02:00', seller: { name: 'RESTAMP', support: null }, buyer: { user_id: 9, name: 'Isaac', email: null }, plan: { code: 'RESTAMP_AGENT_ELITE', name: 'Agent Elite Plan', description: '15 localities' }, payment: { provider: 'razorpay', provider_payment_id: 'pay_1', provider_order_id: 'order_1', paid_at: '2026-11-10T05:02:00' }, amount_paise: 1499900, currency: 'INR', note: 'This invoice reflects a payment verified by the payment provider.' });
  }
  if (pathname === '/payments/10/invoice' && method === 'GET') {
    return json(409, { detail: 'An invoice is available once the payment has succeeded.' });
  }
  return json(404, { detail: 'Not Found' });
};

const payments = await import('@/lib/api/payments');
const draft = await import('@/lib/agentCheckout');
const { ApiError, isApiError } = await import('@/lib/api/client');

// --- the money numbers and bodies -------------------------------------------
check('amounts format from paise the way the backend sends them', payments.formatPaise(1499900) === '₹14,999.00' && payments.formatPaise(0) === '₹0.00');

calls.length = 0;
const checkout = await payments.createCheckout('agent', 'RESTAMP_AGENT_ELITE', ['Velachery', 'Adyar']);
check('checkout POSTs kind + plan code + chosen localities (never an amount)',
  calls[0].method === 'POST' && calls[0].pathname === '/payments/checkout' &&
  JSON.stringify(calls[0].body) === JSON.stringify({ kind: 'agent', code: 'RESTAMP_AGENT_ELITE', localities: ['Velachery', 'Adyar'] }));
check('checkout returns the server-decided amount and order', checkout.amount_paise === 1499900 && checkout.razorpay_order_id === 'order_1' && checkout.razorpay_key_id === 'rzp_test_KEYID12345678');
check('the server flags localities it could not cover', checkout.unavailable_localities.length === 1 && checkout.unavailable_localities[0] === 'Adyar');

calls.length = 0;
const verified = await payments.verifyPayment('order_1', 'pay_1', 'sig_1');
check('verify relays the Razorpay trio to POST /payments/verify',
  calls[0].pathname === '/payments/verify' && JSON.stringify(calls[0].body) === JSON.stringify({ razorpay_order_id: 'order_1', razorpay_payment_id: 'pay_1', razorpay_signature: 'sig_1' }));
check('activation comes from the backend response, not this module', verified.activated === true && verified.plan_name === 'Agent Elite Plan');

const history = await payments.getPaymentHistory();
check('payment history is the caller’s real records (newest first)', history.length === 2 && history[0].status === 'SUCCESS' && history[1].status === 'FAILED');

const invoice = await payments.getInvoice(11);
check('invoice reads only verified payments and states that in its note',
  invoice.invoice_number === 'RS-2026-000011' && invoice.note.includes('verified by the payment provider'));

const failedInvoice = await payments.getInvoice(10).catch((e) => e);
check('a non-SUCCESS payment has no invoice (409 surfaced as an error)', isApiError(failedInvoice) && failedInvoice.kind === 'retry' && failedInvoice.detail.includes('once the payment has succeeded'));

// --- provider unconfigured: fail closed, never simulate ----------------------
checkoutBehaviour = 'not-configured';
const config = await payments.getPaymentConfig();
check('provider "none" is reported honestly', config.provider === 'none' && config.razorpay_key_id === null);
const refused = await payments.createCheckout('agent', 'RESTAMP_AGENT_PRO', ['Velachery']).catch((e) => e);
check('with the provider unconfigured checkout is refused (503) with the backend detail',
  isApiError(refused) && refused.kind === 'retry' && refused.detail === 'Online payments are not configured yet. Please try again later.');
checkoutBehaviour = 'ok';

// --- Razorpay modal relay -----------------------------------------------------
class FakeRazorpayOk {
  constructor(options) { this.options = options; }
  open() { this.options.handler({ razorpay_order_id: 'order_9', razorpay_payment_id: 'pay_9', razorpay_signature: 'sig_9' }); }
}
class FakeRazorpayDismissed {
  constructor(options) { this.options = options; }
  open() { this.options.modal.ondismiss(); }
}
win.Razorpay = FakeRazorpayOk;
const relayed = await payments.openRazorpayCheckout({ keyId: 'k', orderId: 'o', amountPaise: 100, currency: 'INR', name: 'RESTAMP' });
check('the modal resolves with the signature payload it was handed',
  relayed.razorpay_order_id === 'order_9' && relayed.razorpay_payment_id === 'pay_9' && relayed.razorpay_signature === 'sig_9');
win.Razorpay = FakeRazorpayDismissed;
const dismissed = await payments.openRazorpayCheckout({ keyId: 'k', orderId: 'o', amountPaise: 100, currency: 'INR', name: 'RESTAMP' }).catch((e) => e);
check('closing the modal rejects as "dismissed" (nothing charged, nothing activated)', dismissed instanceof Error && dismissed.message === 'dismissed');

// --- checkout draft bridge (per tab, keyed to real plan codes) ---------------
draft.saveAgentCheckoutDraft({ plan_code: 'RESTAMP_AGENT_ELITE', localities: ['Velachery'], updatedAt: new Date().toISOString() });
const saved = draft.getAgentCheckoutDraft();
check('the draft keeps the plan code and locality choice for the payment page',
  saved?.plan_code === 'RESTAMP_AGENT_ELITE' && JSON.stringify(saved?.localities) === JSON.stringify(['Velachery']));
draft.clearAgentCheckoutDraft();
check('clearing the draft leaves no residue', draft.getAgentCheckoutDraft() === null);

// --- source guards: the pages stay honest ------------------------------------
const SRC = fileURLToPath(new URL('../../src/', import.meta.url));
const read = (rel) => readFileSync(join(SRC, rel), 'utf8');

const pay = read('app/agent/payment/page.tsx');
check('agent checkout never records or activates anything locally',
  !pay.includes('activateAgentPackage') && !pay.includes('saveAgentPayment') && !pay.includes('localStorage'));
check('agent checkout activates only through the backend verify call',
  pay.includes('createCheckout') && pay.includes('verifyPayment') && pay.includes("createCheckout('agent'"));
check('agent checkout shows the unconfigured provider instead of simulating a sale',
  pay.includes("provider !== 'razorpay'") && pay.includes('not configured yet'));
check('agent checkout has no promo codes or GST rows (the backend charges the plan price only)',
  !pay.includes('GST') && !/promo/i.test(pay));
check('agent checkout surfaces the server’s locality warnings before taking money',
  pay.includes('unmatched_localities') && pay.includes('unavailable_localities'));

const packages = read('app/agent/packages/page.tsx');
check('the packages page reads the real plan + locality catalogues',
  packages.includes('listAgentPlans') && packages.includes('listAgentLocalities'));
check('the packages page carries no invented demand scores, regions, GST or monthly math',
  !packages.includes('demandScore') && !packages.includes('avgTicketPrice') && !packages.includes('activeBuyers') && !packages.includes('GST') && !packages.includes('monthlyEquivalent'));
check('the packages draft is keyed to the real plan code', packages.includes('saveAgentCheckoutDraft') && packages.includes('selectedPlan.code'));

const dash = read('app/agent/dashboard/payments/page.tsx');
check('the agent dashboard payment history is the backend’s records with invoices',
  dash.includes('getPaymentHistory') && dash.includes('getInvoice') && !dash.includes('localStorage') && !dash.includes('@/lib/agentPlan'));

const agentPlan = read('lib/agentPlan.ts');
const packagesBlock = agentPlan.slice(agentPlan.indexOf('export const locationPackages'), agentPlan.indexOf('export const AGENT_GST_RATE'));
check('agentPlan marketing constants match the real catalogue (₹2,999/₹6,999/₹14,999 · 30 days · 5/10/15)',
  packagesBlock.includes('price: 2999') && packagesBlock.includes('price: 6999') && packagesBlock.includes('price: 14999') &&
  !packagesBlock.includes('validityDays: 90') && !packagesBlock.includes('mandateLimit'));
check('the unused legacy agentPlans list is quarantined with a warning', agentPlan.includes('LEGACY marketing list'));

const revaMount = read('app/layout.tsx');
check('Reva is mounted site-wide and keeps the existing site-wide hosts',
  revaMount.includes('<RevaAssistant />') && revaMount.includes('<AppToaster />') && revaMount.includes('<ConfirmDialogHost />'));

done();
