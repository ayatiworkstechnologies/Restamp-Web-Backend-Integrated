/**
 * Backend timestamps are UTC. Some (e.g. visit scheduled_at) come back with
 * no zone designator ("2026-11-06T05:00:00"), which `new Date()` would read
 * as the viewer's local time — a 10:30 IST visit then shows as 5:00. Zone-less
 * ISO values are read as UTC here; values that already carry "Z" or an
 * offset are parsed unchanged (never shifted twice). Returns null when absent
 * or invalid.
 */
const NAIVE_ISO_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?$/;

export function parseApiDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const s = String(value).trim();
  const parsed = new Date(NAIVE_ISO_DATETIME.test(s) ? `${s}Z` : s);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
