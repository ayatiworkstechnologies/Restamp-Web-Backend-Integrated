/**
 * Runs every scripts/test/*.test.mjs in its own node process (with the
 * TypeScript hooks) and exits non-zero if any fails.
 * usage: node scripts/test/run-all.mjs
 */
import { spawnSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('.', import.meta.url));
const register = new URL('./register.mjs', import.meta.url).href;
const files = readdirSync(dir).filter((f) => f.endsWith('.test.mjs')).sort();

let failed = 0;
for (const file of files) {
  console.log(`\n# ${file}`);
  const { status } = spawnSync(process.execPath, ['--import', register, `${dir}${file}`], { stdio: 'inherit' });
  if (status !== 0) failed += 1;
}
console.log(`\n${files.length - failed}/${files.length} test files passed`);
process.exit(failed ? 1 : 0);
