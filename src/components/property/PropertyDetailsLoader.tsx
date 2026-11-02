"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Loader2, RotateCcw } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import PropertyDetailsView from '@/components/property/PropertyDetailsView';
import type { Property } from '@/data/properties';
import { getListing, getSimilarListings } from '@/lib/api/buyer';
import { errorMessage, isApiError } from '@/lib/api/client';
import { cardToProperty, detailToProperty } from '@/lib/api/mappers';

/**
 * Loads one listing from GET /buyer/listings/{id} (public; only verified,
 * available listings resolve) plus its similar listings. Similar listings
 * are optional: if they fail the page still shows the property.
 */
export default function PropertyDetailsLoader({ id }: { id: string }) {
  const listingId = /^\d+$/.test(id) ? Number(id) : null;
  const [property, setProperty] = useState<Property | null>(null);
  const [similar, setSimilar] = useState<Property[]>([]);
  const [state, setState] = useState<'loading' | 'ready' | 'missing' | 'error'>(listingId ? 'loading' : 'missing');
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!listingId) return;
    let cancelled = false;
    setState('loading');
    getListing(listingId)
      .then((detail) => {
        if (cancelled) return;
        setProperty(detailToProperty(detail));
        setState('ready');
        getSimilarListings(listingId, 3)
          .then((cards) => {
            if (!cancelled) setSimilar(cards.map(cardToProperty));
          })
          .catch(() => undefined);
      })
      .catch((e) => {
        if (cancelled) return;
        if (isApiError(e, 'missing')) {
          setState('missing');
        } else {
          setError(errorMessage(e, 'Could not load this property.'));
          setState('error');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [listingId, attempt]);

  if (state === 'ready' && property) return <PropertyDetailsView property={property} similar={similar} />;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-6">
        {state === 'loading' ? (
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={18} className="animate-spin text-[#087ed9]" />
            Loading property…
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md shadow-xs" role="alert">
            <h1 className="text-lg font-bold text-slate-900">
              {state === 'missing' ? 'Property not available' : 'Property could not be loaded'}
            </h1>
            <p className="text-xs text-slate-500 mt-2">
              {state === 'missing'
                ? 'This listing may have been removed, rented or sold, or it is not verified yet.'
                : error}
            </p>
            <div className="mt-5 flex items-center justify-center gap-3">
              {state === 'error' && (
                <button
                  onClick={() => setAttempt((a) => a + 1)}
                  className="inline-flex items-center gap-1.5 bg-[#087ed9] hover:bg-sky-600 text-white text-xs font-semibold px-4 py-2.5 rounded-lg transition cursor-pointer"
                >
                  <RotateCcw size={14} />
                  Try again
                </button>
              )}
              <Link
                href="/buy"
                className="px-4 py-2.5 text-xs font-semibold text-[#087ed9] border border-[#087ed9] hover:bg-sky-50 rounded-lg transition"
              >
                Browse properties
              </Link>
            </div>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
