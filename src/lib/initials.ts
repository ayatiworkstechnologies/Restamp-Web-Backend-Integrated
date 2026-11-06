/**
 * Avatar initials — one rule for every user avatar on the site (same rule
 * as the mobile app's src/shared/utils/initials.js).
 *
 * - First and last name word -> two letters ("Roshan S" -> "RS").
 * - One name word -> one letter ("Roshan" -> "R").
 * - Only words starting with a letter count, so a phone-number default name
 *   never turns into digits.
 * - Missing, empty, whitespace-only or placeholder names ("User", "Owner",
 *   "Guest", "Restamp user", ...) -> "" so the caller shows an icon instead.
 * Display only: the stored name is never changed.
 */
const STARTS_WITH_LETTER = /^\p{L}/u;
const PLACEHOLDER_NAME = /^(user|owner|buyer|guest|my account|restamp user|user profile)(\s*#\d+)?$/i;

export function getInitials(name: string | null | undefined): string {
  if (typeof name !== 'string') return '';
  const trimmed = name.trim();
  if (PLACEHOLDER_NAME.test(trimmed)) return '';
  const words = trimmed.split(/\s+/).filter((w) => STARTS_WITH_LETTER.test(w));
  if (words.length === 0) return '';
  const first = Array.from(words[0])[0];
  if (words.length === 1) return first.toLocaleUpperCase();
  const last = Array.from(words[words.length - 1])[0];
  return `${first}${last}`.toLocaleUpperCase();
}
