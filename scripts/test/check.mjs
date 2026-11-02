/** Tiny assertion helper: prints `ok - …` / `FAIL - …`; exits non-zero at the end on any failure. */
let failures = 0;

export function check(name, cond, extra) {
  if (cond) console.log(`ok - ${name}`);
  else {
    failures += 1;
    console.log(`FAIL - ${name}${extra === undefined ? '' : ` :: ${JSON.stringify(extra)}`}`);
  }
}

export function done() {
  if (failures) {
    console.log(`\n${failures} failure(s)`);
    process.exit(1);
  }
}
