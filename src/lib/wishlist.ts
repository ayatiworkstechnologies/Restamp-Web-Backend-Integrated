import { snackbar } from '@/lib/notify';
import { useEffect, useState } from 'react';
import { getBuyerSavedLimit } from '@/lib/subscription-store';
import { getProfile } from '@/lib/profile';

export const WISHLIST_LIMIT_EVENT = 'wishlist-limit';

const KEY = 'restamp_wishlist';
const EVENT = 'wishlist-change';

export function getWishlist(): number[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as number[]) : [];
  } catch {
    return [];
  }
}

function setWishlist(ids: number[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
    window.dispatchEvent(new Event(EVENT));
  } catch {}
}

/**
 * Adds or removes a property. Buyers (and visitors) are capped by the saved
 * property limit of their subscription plan, as configured in Admin.
 * Returns false when the add was blocked by the limit.
 */
export function toggleWishlist(id: number): boolean {
  const ids = getWishlist();
  if (ids.includes(id)) {
    setWishlist(ids.filter((x) => x !== id));
    snackbar('Removed from your shortlist', {
      actionLabel: 'Undo',
      onAction: () => setWishlist([id, ...getWishlist().filter((x) => x !== id)]),
    });
    return true;
  }
  const me = getProfile();
  if (!me || me.role === 'buyer') {
    const { limit, planName } = getBuyerSavedLimit(me?.mobile);
    if (limit >= 0 && ids.length >= limit) {
      window.dispatchEvent(new CustomEvent(WISHLIST_LIMIT_EVENT, { detail: { limit, planName } }));
      return false;
    }
  }
  setWishlist([id, ...ids]);
  snackbar('Saved to your shortlist', {
    actionLabel: 'View',
    onAction: () => window.location.assign('/saved'),
  });
  return true;
}

export function clearWishlist() {
  setWishlist([]);
}

export function useWishlist() {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    const sync = () => setIds(getWishlist());
    sync();
    window.addEventListener(EVENT, sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  return ids;
}
