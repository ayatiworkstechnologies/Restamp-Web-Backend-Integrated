/**
 * Saved properties, backed by the buyer's saved list on the server
 * (GET/POST/DELETE /buyer/saved). Guests have no saved list: saving asks
 * them to log in first. One shared in-memory copy per page keeps every heart
 * icon in sync; it is reloaded when the signed-in user changes.
 */
import { useEffect, useState } from 'react';
import { listSaved, saveListing, unsaveListing } from '@/lib/api/buyer';
import { getSession } from '@/lib/api/session';

const EVENT = 'wishlist-change';
const SESSION_EVENT = 'restamp-session-change';

let savedIds: number[] = [];
let loadedFor: number | null = null;
let loading: Promise<void> | null = null;

function emit() {
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(EVENT));
}

async function load(force = false): Promise<void> {
  const session = getSession();
  // Passive loads never switch roles: only a buyer-mode session has a saved
  // list to show (an explicit save switches to BUYER via toggleWishlist).
  if (!session || session.role !== 'BUYER') {
    if (loadedFor !== null || savedIds.length) {
      savedIds = [];
      loadedFor = null;
      emit();
    }
    return;
  }
  if (!force && loadedFor === session.userId) return;
  if (loading) return loading;
  loading = (async () => {
    try {
      const page = await listSaved(1, 100, { passive: true });
      savedIds = page.items.map((c) => c.listing_id);
      loadedFor = session.userId;
    } catch {
      // Keep the previous list; hearts simply show unsaved until the next load.
    } finally {
      loading = null;
      emit();
    }
  })();
  return loading;
}

export function getWishlist(): number[] {
  return savedIds;
}

export function reloadWishlist() {
  return load(true);
}

/**
 * Save or unsave one listing. Returns 'login' for guests (nothing is
 * stored locally). Updates optimistically and rolls back if the server
 * refuses, then rethrows so the caller can tell the user.
 */
export async function toggleWishlist(id: number): Promise<'saved' | 'removed' | 'login'> {
  if (!getSession()) return 'login';
  const wasSaved = savedIds.includes(id);
  savedIds = wasSaved ? savedIds.filter((x) => x !== id) : [id, ...savedIds];
  emit();
  try {
    if (wasSaved) await unsaveListing(id);
    else await saveListing(id);
    return wasSaved ? 'removed' : 'saved';
  } catch (e) {
    savedIds = wasSaved ? [id, ...savedIds.filter((x) => x !== id)] : savedIds.filter((x) => x !== id);
    emit();
    throw e;
  }
}

/** Remove every saved listing (one request per listing; there is no bulk endpoint). */
export async function clearWishlist(): Promise<void> {
  for (const id of [...savedIds]) {
    await unsaveListing(id);
    savedIds = savedIds.filter((x) => x !== id);
    emit();
  }
}

export function useWishlist(): number[] {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    const sync = () => setIds([...savedIds]);
    const onSession = () => {
      void load();
    };
    sync();
    void load();
    window.addEventListener(EVENT, sync);
    window.addEventListener(SESSION_EVENT, onSession);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener(SESSION_EVENT, onSession);
    };
  }, []);

  return ids;
}
