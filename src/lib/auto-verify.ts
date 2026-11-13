/**
 * Listings are verified automatically: no manual approval step.
 * A listing becomes live AUTO_VERIFY_MINUTES after it was submitted.
 */
export const AUTO_VERIFY_MINUTES = 5;
export const AUTO_VERIFY_MS = AUTO_VERIFY_MINUTES * 60 * 1000;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Parses ISO dates and the "28 Oct 2026, 09:15 AM" format used by property records. */
export function parseSubmitted(v: string | undefined): number | null {
  if (!v) return null;
  const m = /^(\d{1,2}) ([A-Za-z]{3}) (\d{4})(?:, (\d{1,2}):(\d{2})\s*(AM|PM))?/i.exec(v.trim());
  if (m) {
    const mi = MONTHS.findIndex((x) => x.toLowerCase() === m[2].toLowerCase());
    if (mi < 0) return null;
    let h = m[4] ? Number(m[4]) % 12 : 0;
    if (m[6]?.toUpperCase() === "PM") h += 12;
    return new Date(Number(m[3]), mi, Number(m[1]), h, m[5] ? Number(m[5]) : 0).getTime();
  }
  const t = Date.parse(v);
  return Number.isNaN(t) ? null : t;
}

/** Milliseconds until the listing goes live (0 = due now). Unparseable dates are treated as due. */
export function msUntilVerified(submittedAt: string | undefined, now = Date.now()) {
  const t = parseSubmitted(submittedAt);
  return t === null ? 0 : Math.max(0, t + AUTO_VERIFY_MS - now);
}

export function verifyCountdown(submittedAt: string | undefined, now = Date.now()) {
  const ms = msUntilVerified(submittedAt, now);
  if (ms <= 0) return "Going live…";
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return `Auto-verifies in ${min}:${String(sec).padStart(2, "0")}`;
}
