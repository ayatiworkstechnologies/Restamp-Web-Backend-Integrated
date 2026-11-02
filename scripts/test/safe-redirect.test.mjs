// Post-login redirect sanitizer (src/lib/safeRedirect.ts), used by /login (?next=) and /admin/login (?redirect=).
import { check, done } from './check.mjs';
import { safeInternalPath } from '@/lib/safeRedirect';

// A real-looking site origin, different from the sanitizer's internal one:
// an accepted path must stay on whatever origin the site is served from.
const SITE = 'https://www.restamp.example';
const staysOnSite = (p) => new URL(p, SITE).origin === new URL(SITE).origin;

const safe = [
  ['/', '/'],
  ['/profile', '/profile'],
  ['/owner/dashboard', '/owner/dashboard'],
  ['/properties/12?tab=photos#gallery', '/properties/12?tab=photos#gallery'],
  ['/admin-dashboard/enquiries?user=5', '/admin-dashboard/enquiries?user=5'],
  ['/a/../owner/dashboard', '/owner/dashboard'], // normalised to what the browser would open
  ['/%5Cevil.example', '/%5Cevil.example'], // still-encoded backslash is just a path segment here
  ['/search?q=a%20b', '/search?q=a%20b'],
];
for (const [input, expected] of safe) {
  const out = safeInternalPath(input);
  check(`accepts ${JSON.stringify(input)}`, out === expected, out);
  check(`  result stays on the site and is stable: ${JSON.stringify(input)}`, out !== null && staysOnSite(out) && safeInternalPath(out) === out);
}

const malicious = [
  '/\\evil.example', // backslash: browsers read "/\" as "//"
  '\\\\evil.example',
  '/\\/evil.example',
  '/\t/evil.example', // tab/CR/LF are stripped by the URL parser
  '/\n/evil.example',
  '/\r/evil.example',
  '//evil.example', // protocol-relative
  '///evil.example',
  'https://evil.example/owner',
  'http:evil.example',
  'javascript:alert(1)',
  'data:text/html,hi',
  'evil.example',
  'profile',
  ' /profile',
  '/\u0000profile',
  '/\u007fprofile',
  '/' + 'a'.repeat(3000),
  '',
  null,
  undefined,
  42,
  ['/profile'],
];
for (const input of malicious) {
  check(`rejects ${JSON.stringify(input)?.slice(0, 40) ?? String(input)}`, safeInternalPath(input) === null);
}

// The reviewed attack, as the login page reads it from the query string.
for (const qs of ['next=/%5Cevil.example', 'next=%2F%2Fevil.example', 'next=/%09/evil.example', 'next=/%0A/evil.example', 'next=https%3A%2F%2Fevil.example']) {
  const raw = new URLSearchParams(qs).get('next');
  check(`rejects ?${qs} (decoded ${JSON.stringify(raw)})`, safeInternalPath(raw) === null);
}
// Before the fix these passed the old check and left the site:
const oldCheck = (n) => (n && n.startsWith('/') && !n.startsWith('//') ? n : null);
check('regression: old check let "/\\evil.example" leave the site', !staysOnSite(oldCheck('/\\evil.example')));

done();
