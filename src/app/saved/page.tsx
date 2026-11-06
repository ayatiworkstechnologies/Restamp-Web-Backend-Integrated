"use client";

import { useMemo, useState } from 'react';
import Link from 'next/link';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PropertyCard from '@/components/property/PropertyCard';
import { properties } from '@/data/properties';
import { clearWishlist, useWishlist } from '@/lib/wishlist';
import { Heart, Search } from 'lucide-react';

const filters = ['All', 'Buy', 'Resale', 'Rent', 'Lease'] as const;
type Filter = (typeof filters)[number];

export default function SavedPage() {
  const ids = useWishlist();
  const [filter, setFilter] = useState<Filter>('All');
  const [confirmClear, setConfirmClear] = useState(false);

  // Keep the order the user saved them in (most recent first)
  const saved = useMemo(
    () => ids.map((id) => properties.find((p) => p.id === id)).filter((p) => p !== undefined),
    [ids]
  );
  const visible = filter === 'All' ? saved : saved.filter((p) => p.purpose === filter);

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
                {saved.length} {saved.length === 1 ? 'property' : 'properties'} saved
              </p>
            </div>

            {saved.length > 0 &&
              (confirmClear ? (
                <div className="flex items-center gap-2 text-sm">
                  <span className="text-slate-600">Remove all saved homes?</span>
                  <button
                    type="button"
                    onClick={() => {
                      clearWishlist();
                      setConfirmClear(false);
                    }}
                    className="rounded-lg bg-red-500 px-3 py-1.5 font-semibold text-white hover:bg-red-600 transition cursor-pointer"
                  >
                    Yes, clear
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

          {saved.length === 0 ? (
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
