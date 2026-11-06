// Agent sign-in ?next= uses the same sanitizer as /login and /admin/login, and no page passes a raw
// next/redirect query value to the router. Agents sign in on the main /login (role=agent); the old
// /agent/login URL (src/app/agent/login/page.tsx) only forwards a SAFE ?next= there.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { check, done } from './check.mjs';
import { safeInternalPath } from '@/lib/safeRedirect';

const SRC = fileURLToPath(new URL('../../src/', import.meta.url));
const read = (rel) => readFileSync(join(SRC, rel), 'utf8');
const walk = (dir) =>
  readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    return statSync(p).isDirectory() ? walk(p) : /\.(ts|tsx)$/.test(f) ? [p] : [];
  });

// Where an agent lands after signing in: /login's afterLogin falls back to the agent dashboard,
// and both /agent/login and /login accept ?next= only through safeInternalPath.
const agentTarget = (raw) => safeInternalPath(raw) || '/agent/dashboard';

// 1. Every agent destination the app actually sends to sign-in is preserved.
const linked = new Set();
for (const file of walk(join(SRC, 'app/agent'))) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/loginHref\(\s*'(\/agent[^']*)'\s*,\s*'agent'\s*\)/g)) linked.add(m[1]);
  for (const m of src.matchAll(/login\?role=agent&next=([^'"`\s$]+)/g)) linked.add(m[1]);
}
check('found the agent pages that send agents to sign in with ?next=', linked.size >= 1, [...linked]);
for (const dest of linked) {
  const raw = new URLSearchParams(`next=${dest}`).get('next');
  check(`agent destination kept: ${dest}`, agentTarget(raw) === dest, agentTarget(raw));
}
check('agent destination with query kept', agentTarget('/agent/packages?pkg=loc-10') === '/agent/packages?pkg=loc-10');
const login = read('app/login/page.tsx');
check("/login: role=agent makes the backend role BROKER and defaults to the agent dashboard",
  /role === 'agent'\)\s*\{\s*await ensureRole\('BROKER'\);\s*return next \|\| '\/agent\/dashboard';/.test(login));
const agentLogin = read('app/agent/login/page.tsx');
check('/agent/login forwards ?next only after safeInternalPath',
  agentLogin.includes('const target = safeInternalPath(next);') && agentLogin.includes('encodeURIComponent(target)') &&
  !/next=\$\{encodeURIComponent\(next\)\}/.test(agentLogin));

// 2. Attacks fall back to the dashboard on this site.
for (const qs of [
  'next=/%5Cevil.example',
  'next=/%09/evil.example',
  'next=/%0D%0A/evil.example',
  'next=%2F%2Fevil.example',
  'next=https%3A%2F%2Fevil.example%2Fagent%2Fdashboard',
  'next=javascript%3Aalert(1)',
  'next=agent/dashboard',
  'next=',
  '',
]) {
  const raw = new URLSearchParams(qs).get('next');
  check(`agent login ?${qs || '(none)'} -> /agent/dashboard`, agentTarget(raw) === '/agent/dashboard', agentTarget(raw));
}

// 3. Source guard: each login page reads its destination only through safeInternalPath ...
const loginPages = {
  'app/login/page.tsx': 'next',
  'app/admin/login/page.tsx': 'redirect',
};
for (const [rel, param] of Object.entries(loginPages)) {
  const src = read(rel);
  check(`${rel}: ?${param} goes through safeInternalPath`, src.includes(`safeInternalPath(searchParams.get('${param}'))`));
}
// ... and no file anywhere reads next/redirect raw.
const raw = walk(SRC).flatMap((file) => {
  const src = readFileSync(file, 'utf8');
  return [...src.matchAll(/searchParams\.get\(\s*['"](next|redirect)['"]\s*\)/g)]
    .filter((m) => !src.slice(Math.max(0, m.index - 'safeInternalPath('.length), m.index).endsWith('safeInternalPath('))
    .map(() => file.slice(SRC.length));
});
check('no page reads ?next / ?redirect without safeInternalPath', raw.length === 0, raw);

done();
