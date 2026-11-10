"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { listBrokerListings, listBrokerLocations } from '@/lib/api/broker';
import type { ListingCard } from '@/lib/api/buyer';
import { errorMessage } from '@/lib/api/client';
import { cleanImageUrl, typeLabel } from '@/lib/api/mappers';
import { agentCard } from '../ui';
import { BedDouble, Loader2, MapPin, Ruler, Search } from 'lucide-react';

const PURPOSES = ['All', 'Buy', 'Rent', 'Lease'] as const;
const TYPES = ['All Types', 'Apartment', 'Villa', 'House', 'Commercial', 'Plot'];
const BHKS = ['All BHK', '1', '2', '3', '4+'];

const select = 'h-[53px] cursor-pointer rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none';

const purposeOf = (l: ListingCard) => (l.transaction_type === 'RENT' ? 'Rent' : l.transaction_type === 'LEASE' ? 'Lease' : 'Buy');

// Owner listings inside the agent's covered areas, from GET /broker/listings:
// the backend decides the coverage, so nothing outside it is ever loaded.
export default function AgentPropertiesPage() {
  const [all, setAll] = useState<ListingCard[]>([]);
  const [total, setTotal] = useState(0);
  const [coverage, setCoverage] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const [purpose, setPurpose] = useState<(typeof PURPOSES)[number]>('All');
  const [type, setType] = useState('All Types');
  const [bhk, setBhk] = useState('All BHK');
  const [loc, setLoc] = useState('All Locations');
  const [query, setQuery] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([listBrokerListings({}, 1, 100), listBrokerLocations()])
      .then(([listings, locations]) => {
        if (cancelled) return;
        setAll(listings.items);
        setTotal(listings.total);
        setCoverage([...new Set(locations.map((l) => l.locality).filter(Boolean))].sort());
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e, 'Could not load properties in your covered areas.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((p) => {
      if (purpose !== 'All' && purposeOf(p) !== purpose) return false;
      if (type !== 'All Types' && !typeLabel(p.property_type).toLowerCase().includes(type.toLowerCase())) return false;
      if (bhk !== 'All BHK') {
        const n = p.bedrooms ?? 0;
        if (bhk === '4+' ? n < 4 : n !== parseInt(bhk)) return false;
      }
      if (loc !== 'All Locations' && p.locality.toLowerCase() !== loc.toLowerCase()) return false;
      if (q && ![p.title, p.locality, p.city, typeLabel(p.property_type), p.bedrooms ? `${p.bedrooms} bhk` : ''].join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [all, purpose, type, bhk, loc, query]);

  const reset = () => {
    setPurpose('All');
    setType('All Types');
    setBhk('All BHK');
    setLoc('All Locations');
    setQuery('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Properties</h1>
          <p className="mt-1 text-sm text-slate-500">Owner-listed properties in your covered locations.</p>
        </div>
        <p className="text-sm text-slate-500">
          Coverage: <span className="font-semibold text-slate-900">{loading ? '…' : coverage.length} Localities</span>
        </p>
      </div>

      <div className="space-y-3">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="flex h-[53px] flex-1 items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-4">
            <Search size={17} className="text-slate-400" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search properties, BHK, or localities..." className="w-full bg-transparent text-sm outline-none" />
          </label>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:flex">
            <select aria-label="Location" value={loc} onChange={(e) => setLoc(e.target.value)} className={select}>
              <option>All Locations</option>
              {coverage.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
            <select aria-label="Property type" value={type} onChange={(e) => setType(e.target.value)} className={select}>
              {TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
            <select aria-label="BHK" value={bhk} onChange={(e) => setBhk(e.target.value)} className={select}>
              {BHKS.map((b) => (
                <option key={b} value={b}>
                  {b === 'All BHK' ? b : `${b} BHK`}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex gap-2">
            {PURPOSES.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPurpose(p)}
                className={`cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition ${
                  purpose === p ? 'bg-[#087ed9] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                }`}
              >
                {p}
              </button>
            ))}
          </div>
          <p className="text-sm text-slate-500">
            Showing {shown.length} {total > all.length ? `of the newest ${all.length} (${total} in total)` : ''} properties
          </p>
        </div>
      </div>

      {loading ? (
        <div className={`${agentCard} flex items-center justify-center gap-2 py-16 text-sm text-slate-500`}>
          <Loader2 size={16} className="animate-spin text-[#087ed9]" /> Loading properties in your areas…
        </div>
      ) : error ? (
        <div className={`${agentCard} py-12 text-center text-sm text-red-700`} role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setAttempt((a) => a + 1)} className="mt-3 font-semibold underline cursor-pointer">
            Try again
          </button>
        </div>
      ) : shown.length === 0 ? (
        <div className={`${agentCard} py-16 text-center`}>
          <p className="font-semibold text-slate-900">No properties available in your selected locations.</p>
          <p className="mt-1 text-sm text-slate-500">
            {coverage.length === 0
              ? 'You have no covered locations yet. Properties appear here once your agent plan covers an area.'
              : 'Try clearing your filters or select a different locality from your covered areas.'}
          </p>
          <button type="button" onClick={reset} className="mt-5 inline-flex h-[53px] cursor-pointer items-center rounded-[16px] bg-[#087ed9] px-6 text-sm font-semibold text-white hover:bg-sky-600">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {shown.map((p) => {
            const cover = cleanImageUrl(p.cover_image_url);
            return (
              <article key={p.listing_id} className={`${agentCard} flex flex-col overflow-hidden`}>
                <div className="relative aspect-[16/10] bg-slate-100">
                  {cover ? (
                    <img src={cover} alt={p.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">No photo</div>
                  )}
                  <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                    Available for {purposeOf(p)}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-lg font-bold text-slate-900">{p.price_display}</p>
                  <h3 className="mt-0.5 truncate text-sm font-semibold text-slate-800">{p.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                    <MapPin size={13} className="shrink-0" /> {[p.locality, p.city].filter(Boolean).join(', ')}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
                    {p.bedrooms != null && <span className="flex items-center gap-1"><BedDouble size={13} /> {p.bedrooms} BHK</span>}
                    {p.area_value != null && <span className="flex items-center gap-1"><Ruler size={13} /> {p.area_value} {p.area_unit || 'sqft'}</span>}
                    <span>{typeLabel(p.property_type)}</span>
                  </div>
                  <div className="mt-auto pt-5">
                    <Link href={`/properties/${p.listing_id}`} className="inline-flex h-[53px] w-full items-center justify-center rounded-[16px] bg-slate-100 text-sm font-semibold text-slate-900 hover:bg-slate-200">
                      View Details
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
