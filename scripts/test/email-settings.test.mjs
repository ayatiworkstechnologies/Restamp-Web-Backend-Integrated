import { readFileSync } from 'node:fs';
import { check, done } from './check.mjs';
import {
  EMAIL_PREFERENCE_ITEMS,
  MANDATORY_EMAIL_NOTE,
  codeSentMessage,
  emailErrorMessage,
  emailFieldText,
  emailStatusLabel,
  failureLabel,
  isCodeShape,
  isPlausibleEmail,
  normalizeEmailInput,
  toEmailStatus,
} from '@/lib/emailSettings';

const read = (p) => readFileSync(new URL(`../../${p}`, import.meta.url), 'utf8');

// --- validation mirrors the backend (server stays authoritative)
check('normalisation = trim + lower-case', normalizeEmailInput('  User.Name+tag@Example.COM ') === 'user.name+tag@example.com');
const good = ['a@b.co', 'first_last@sub.domain.in', 'user.name+tag@example.com'];
const bad = ['', 'plain', 'a@b', 'a@@b.com', '@b.com', 'a@.com', 'a..b@c.com', '.a@c.com', 'a b@c.com', 'a@c.com\nBcc: x@y.com',
  'a@-c.com', 'a@c.123', 'ä@c.com', 'a@exämple.com', `${'x'.repeat(65)}@c.com`, 'a@c.c', '<a@c.com>', 'a@c.com,b@c.com'];
check('plausible addresses accepted', good.every(isPlausibleEmail), good.filter((g) => !isPlausibleEmail(g)));
check('malformed / injected / non-ASCII addresses rejected', bad.every((b) => !isPlausibleEmail(b)), bad.filter(isPlausibleEmail));
check('code = exactly 6 digits', isCodeShape('012345') && !isCodeShape('12345') && !isCodeShape('1234567') && !isCodeShape('12a456'));

// --- status mapping + honest text
const s = toEmailStatus({ email: 'me@example.com', verified: false, delivery_available: true, preferences: { enquiries: true, visits: false, listings: true } });
check('status mapping', s.email === 'me@example.com' && !s.verified && s.deliveryAvailable && s.preferences.visits === false && s.debugCode === null);
check('empty response -> safe "not added" state', toEmailStatus(null).email === null && !toEmailStatus(null).verified && !toEmailStatus(null).deliveryAvailable);
check('"verified" never claimed without an address', toEmailStatus({ verified: true }).verified === false);
check('debug code only in the 6-digit shape', toEmailStatus({ email: 'a@b.co', debug_code: '123456' }).debugCode === '123456' &&
  toEmailStatus({ email: 'a@b.co', debug_code: '<img>' }).debugCode === null);
check('labels', emailStatusLabel(null) === 'Not added' && emailStatusLabel(s) === 'Not verified' && emailStatusLabel({ ...s, verified: true }) === 'Verified');
check('profile field text marks an unverified address', emailFieldText(s, '') === 'me@example.com · Not verified' && emailFieldText(null, 'x') === 'x');
check('code-sent message is honest about delivery',
  codeSentMessage(s) === "We've sent a 6-digit code to me@example.com." &&
  /isn't switched on yet/.test(codeSentMessage({ ...s, deliveryAvailable: false })) &&
  /development code/.test(codeSentMessage({ ...s, deliveryAvailable: false, debugCode: '123456' })) &&
  codeSentMessage({ ...s, verified: true }) === null);
const m = (status, kind, action) => emailErrorMessage({ status, kind }, action);
check('error messages by meaning',
  m(0, 'offline', 'save').startsWith("Couldn't reach") && m(429, 'retry', 'resend').startsWith('Too many requests') &&
  m(422, 'validation', 'verify').startsWith('That code is invalid') && m(422, 'validation', 'save') === 'Please enter a valid email address.' &&
  m(409, 'retry', 'prefs') === 'Add an email address first.' && m(401, 'login', 'save').startsWith('Your session has expired') &&
  m(403, 'denied', 'save').startsWith("Your account can't") && m(500, 'retry', 'load') === "Couldn't load your email settings.");
check('optional categories match the backend; account email mandatory',
  EMAIL_PREFERENCE_ITEMS.map((i) => i.key).join(',') === 'enquiries,visits,listings' && /always sent/.test(MANDATORY_EMAIL_NOTE));
check('admin failure kinds get readable labels', failureLabel('recipient') === 'Address refused' && failureLabel('already_verified') === 'Address already verified' && failureLabel(null) === '—' && failureLabel('new_kind') === 'new_kind');

// --- wiring
const card = read('src/components/settings/EmailSettingsCard.tsx');
check('ONE shared card on the buyer, owner and agent profile pages',
  ['src/app/profile/page.tsx', 'src/app/owner/dashboard/profile/page.tsx', 'src/app/agent/dashboard/profile/page.tsx']
    .every((p) => read(p).includes("import EmailSettingsCard from '@/components/settings/EmailSettingsCard';") && read(p).includes('<EmailSettingsCard')));
check('profile Email fields show the server address, not "Not available yet"',
  ['src/app/profile/page.tsx', 'src/app/owner/dashboard/profile/page.tsx'].every((p) => read(p).includes('emailFieldText(emailStatus') && !read(p).includes('placeholder="Not available yet"')));
check('card applies only server-confirmed state', card.includes('aria-checked={on}') && card.includes('saveEmailPreferences(next)') && card.includes('const on = !!status?.preferences[item.key]'));
check('card drops another account\'s responses', card.includes('accountEpoch.current !== epoch') && card.includes('}, [userId]);'));
check('card validates with its own message (browser validation off on both forms)', (card.match(/noValidate/g) || []).length === 2 && card.includes('Please enter a valid email address.'));
check('development code shown only when the backend returned one', card.includes('{status.debugCode && (') && !/349086/.test(card));
check('honest states: loading, load error + retry, delivery-off notice', card.includes('Loading email settings') && card.includes('Try again') &&
  card.includes("Email delivery isn&apos;t switched on yet"));
const settings = read('src/app/admin-dashboard/settings/page.tsx');
const view = read('src/components/settings/email-deliveries-view.tsx');
check('admin Email Deliveries tab uses the audit-log permission', settings.includes('activeTab === "email" && <EmailDeliveriesView />') &&
  view.includes('can("settings.view_audit_logs")'));
check('admin view shows masked recipients only (no raw email/body fields)', view.includes('row.recipient') && !/to_email|payload|code_enc/.test(view));
const api = read('src/lib/api/email.ts');
check('API calls act on the signed-in account only (no user id path)', !/\/users\/\$\{/.test(api) && api.includes("'/users/me/email'"));
check('no email provider setting or credential in the website', ![card, api, view, read('src/lib/emailSettings.ts')].some((t) => /RESEND_API_KEY|SMTP_PASSWORD|SMTP_HOST|EMAIL_PROVIDER|api\.resend\.com/.test(t)));
done();
