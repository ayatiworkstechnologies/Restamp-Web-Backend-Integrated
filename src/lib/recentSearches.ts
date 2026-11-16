/**
 * The visitor's own recent searches for the homepage search panel.
 *
 * - Only searches this visitor actually submitted are listed: nothing is
 *   seeded, suggested or invented (an empty list shows "No recent searches").
 * - Stored in this browser's localStorage only. It is a per-visitor
 *   convenience, never sent to the backend, and survives the navigation to
 *   /buy that every search triggers. Any storage failure (private mode,
 *   blocked storage, corrupt JSON) degrades to an empty list.
 * - The pure helpers (parse / add / remove) are framework-free so they can
 *   be tested from scripts/test/recent-searches.test.mjs.
 */

export type RecentSearch = {
  /** The text the visitor typed (trimmed). */
  query: string;
  /** Buy / Resale / Rent / Lease tab at the time of the search. */
  purpose: string;
  /** Property type chosen at the time of the search (Home, Villas, ...). */
  category: string;
  /** Epoch milliseconds of the search. */
  at: number;
};

export const RECENT_SEARCHES_KEY = 'restamp_recent_searches';
export const MAX_RECENT_SEARCHES = 5;
const MAX_QUERY_LENGTH = 80;

const sameSearch = (a: Pick<RecentSearch, 'query' | 'category'>, b: Pick<RecentSearch, 'query' | 'category'>) =>
  a.query.toLowerCase() === b.query.toLowerCase() && a.category === b.category;

/** Stored JSON -> valid entries only (anything malformed is dropped). */
export function parseRecentSearches(raw: string | null | undefined): RecentSearch[] {
  if (!raw) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!Array.isArray(data)) return [];
    return data
      .filter(
        (r): r is RecentSearch =>
          !!r &&
          typeof r === 'object' &&
          typeof (r as RecentSearch).query === 'string' &&
          (r as RecentSearch).query.trim() !== '' &&
          typeof (r as RecentSearch).purpose === 'string' &&
          typeof (r as RecentSearch).category === 'string' &&
          typeof (r as RecentSearch).at === 'number',
      )
      .map((r) => ({ query: r.query.trim().slice(0, MAX_QUERY_LENGTH), purpose: r.purpose, category: r.category, at: r.at }))
      .slice(0, MAX_RECENT_SEARCHES);
  } catch {
    return [];
  }
}

/**
 * A submitted search -> the new list (newest first, the same query+type only
 * once, at most MAX_RECENT_SEARCHES). A blank query records nothing.
 */
export function addRecentSearch(list: RecentSearch[], entry: { query: string; purpose: string; category: string }, at = Date.now()): RecentSearch[] {
  const query = entry.query.trim().slice(0, MAX_QUERY_LENGTH);
  if (!query) return list;
  const next: RecentSearch = { query, purpose: entry.purpose, category: entry.category, at };
  return [next, ...list.filter((r) => !sameSearch(r, next))].slice(0, MAX_RECENT_SEARCHES);
}

export function removeRecentSearch(list: RecentSearch[], item: RecentSearch): RecentSearch[] {
  return list.filter((r) => !(sameSearch(r, item) && r.at === item.at));
}

function storage(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function loadRecentSearches(): RecentSearch[] {
  try {
    return parseRecentSearches(storage()?.getItem(RECENT_SEARCHES_KEY));
  } catch {
    return [];
  }
}

export function saveRecentSearches(list: RecentSearch[]): void {
  try {
    const s = storage();
    if (!s) return;
    if (list.length) s.setItem(RECENT_SEARCHES_KEY, JSON.stringify(list));
    else s.removeItem(RECENT_SEARCHES_KEY);
  } catch {
    // Storage blocked or full: the list just isn't remembered.
  }
}
