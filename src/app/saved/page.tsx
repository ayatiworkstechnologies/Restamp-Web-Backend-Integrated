"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/property/PropertyCard';
import type { Property } from '@/data/properties';
import { clearWishlist, reloadWishlist, useWishlist } from '@/lib/wishlist';
import { listSaved } from '@/lib/api/buyer';
import { errorMessage } from '@/lib/api/client';
import { cardToProperty } from '@/lib/api/mappers';
import { loginHref, useSession } from '@/lib/api/session';
import { Heart, Loader2, Search } from 'lucide-react';

const filters = ['All', 'Buy', 'Resale', 'Rent', 'Lease'] as const;
type Filter = (typeof filters)[number];

export default function SavedPage() {
  const ids = useWishlist();
  const { session, ready } = useSession();
  const [filter, setFilter] = useState<Filter>('All');
  const [confirmClear, setConfirmClear] = useState(false);
  const [loaded, setLoaded] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [clearing, setClearing] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const userId = session?.userId;

  // The server's saved list (newest first); opening this page is buyer mode.
  useEffect(() => {
    if (!ready) return;
    if (!userId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError('');
    listSaved(1, 100)
      .then((res) => {
        if (cancelled) return;
        setLoaded(res.items.map(cardToProperty));
        void reloadWishlist();
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e, 'Could not load your saved homes.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ready, userId, attempt]);

  // Unsaving a card removes it here immediately (ids is the shared saved list).
  const saved = useMemo(() => loaded.filter((p) => ids.includes(p.id)), [loaded, ids]);
  const visible = filter === 'All' ? saved : saved.filter((p) => p.purpose === filter);

  const onClearAll = async () => {
    setClearing(true);
    setError('');
    try {
      await clearWishlist();
      setConfirmClear(false);
    } catch (e) {
      setError(errorMessage(e, 'Some saved homes could not be removed. Please try again.'));
    } finally {
      setClearing(false);
    }
  };

  if (ready && !session) {
    return (
      <>
        <Header />
        <main className="bg-slate-50 min-h-[70vh]">
          <div className="container-site py-12">
            <p className="eyebrow">My wishlist</p>
            <h1 className="section-title mt-3">Saved homes</h1>
            <div className="mt-10 rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-[0_12px_45px_-10px_rgba(0,0,0,0.1)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                <Heart size={28} />
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-900">Log in to see your saved homes</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                Saved homes are kept in your Restamp account, so they are there on every device.
              </p>
              <Link
                href={loginHref('/saved')}
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#087ed9] px-6 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition"
              >
                Log in
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-[70vh]">
        <div className="container-site py-12">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">My wishlist</p>
              <h1 className="section-title mt-3">Saved homes</h1>
              <p className="mt-2 text-sm text-slate-500">
                {loading ? 'Loading…' : `${saved.length} ${saved.length === 1 ? 'property' : 'properties'} saved`}
              </p>
            </div>

            {saved.length > 0 &&
              (confirmClear ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600">Remove all saved homes?</span>
                  <button
                    type="button"
                    onClick={() => void onClearAll()}
                    disabled={clearing}
                    className="rounded-lg bg-red-500 px-3 py-1.5 font-semibold text-white hover:bg-red-600 disabled:opacity-60 transition cursor-pointer"
                  >
                    {clearing ? 'Removing…' : 'Yes, clear'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirmClear(false)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 font-medium text-slate-700 hover:border-slate-300 transition cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmClear(true)}
                  className="text-sm font-medium text-slate-500 hover:text-red-500 transition cursor-pointer"
                >
                  Clear all
                </button>
              ))}
          </div>

          {saved.length > 0 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {filters.map((f) => {
                const count = f === 'All' ? saved.length : saved.filter((p) => p.purpose === f).length;
                return (
                  <button
                    key={f}
                    type="button"
                    onClick={() => setFilter(f)}
                    className={`rounded-full border px-4 py-1.5 text-sm font-medium transition cursor-pointer ${
                      filter === f
                        ? 'border-[#087ed9] bg-[#087ed9] text-white'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {f} <span className={filter === f ? 'text-white/80' : 'text-slate-400'}>({count})</span>
                  </button>
                );
              })}
            </div>
          )}

          {error && (
            <div className="mt-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700 flex items-center justify-between gap-3" role="alert">
              <span>{error}</span>
              <button type="button" onClick={() => setAttempt((a) => a + 1)} className="font-semibold underline cursor-pointer">
                Retry
              </button>
            </div>
          )}

          {loading ? (
            <div className="mt-10 flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
              <Loader2 size={18} className="animate-spin text-[#087ed9]" />
              Loading saved homes…
            </div>
          ) : saved.length === 0 && error ? null : saved.length === 0 ? (
            <div className="mt-10 rounded-2xl border border-slate-100 bg-white px-6 py-16 text-center shadow-[0_12px_45px_-10px_rgba(0,0,0,0.1)]">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-50 text-red-500">
                <Heart size={28} />
              </div>
              <h2 className="mt-5 text-lg font-bold text-slate-900">No saved homes yet</h2>
              <p className="mx-auto mt-2 max-w-sm text-sm text-slate-500">
                Tap the heart on any property to save it here and compare later.
              </p>
              <Link
                href="/buy"
                className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[#087ed9] px-6 h-[53px] text-sm font-semibold text-white hover:bg-sky-600 transition"
              >
                <Search size={16} /> Explore properties
              </Link>
            </div>
          ) : visible.length === 0 ? (
            <p className="mt-10 text-center text-sm text-slate-500">No saved homes for {filter}.</p>
          ) : (
            <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((property) => (
                <PropertyCard key={property.id} property={property} showExplore />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
