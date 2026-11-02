/**
 * Post-login destinations (`?next=` on /login, `?redirect=` on /admin/login).
 *
 * Only a path on this website is accepted. A plain "starts with one slash"
 * check is not enough: the browser's URL parser treats "\" like "/" and
 * silently drops tabs and newlines, so "/\evil.example" or "/<tab>/evil.example"
 * resolve to another site. Those characters are refused outright, the value
 * must still resolve to the same origin it was checked against, and the
 * result is rebuilt from the parsed URL (path + query + hash) so the page
 * navigates to exactly what was checked.
 *
 * Pure (no browser APIs), so it behaves the same during server rendering
 * and in scripts/test.
 */

// Any fixed origin works: a path-absolute value resolves against it without
// changing origin, and anything that would change it is refused.
const CHECK_ORIGIN = 'https://restamp.invalid';
const MAX_LENGTH = 2048;
// Backslash, ASCII control characters (incl. tab, CR, LF) and DEL.
const UNSAFE_CHARS = /[\\\u0000-\u001f\u007f]/;

/** A same-site path to navigate to after signing in, or null when `raw` is not one. */
export function safeInternalPath(raw: unknown): string | null {
  if (typeof raw !== 'string' || raw.length === 0 || raw.length > MAX_LENGTH) return null;
  if (UNSAFE_CHARS.test(raw)) return null;
  // Must be path-absolute: "/x" yes; "//host" (protocol-relative), "x", "https:" no.
  if (raw[0] !== '/' || raw[1] === '/') return null;
  let url: URL;
  try {
    url = new URL(raw, CHECK_ORIGIN);
  } catch {
    return null;
  }
  if (url.origin !== CHECK_ORIGIN) return null;
  return `${url.pathname}${url.search}${url.hash}`;
}
