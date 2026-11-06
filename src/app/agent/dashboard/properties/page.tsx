"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { getAgentSubscription } from '@/lib/agentPlan';
import { getAgentCatalogProperties, type AgentPropertyItem } from '@/lib/agent-data';
import { useAgentLeads } from '@/lib/agentLeads';
import MatchModal from '@/components/agent/MatchModal';
import { agentCard } from '../ui';
import { BadgeCheck, BedDouble, MapPin, Ruler, Search, Users } from 'lucide-react';

const PURPOSES = ['All', 'Buy', 'Rent', 'Lease'] as const;
const TYPES = ['All Types', 'Apartment', 'Villa', 'House', 'Commercial', 'Plot'];
const BHKS = ['All BHK', '1', '2', '3', '4+'];

const select = 'h-[53px] cursor-pointer rounded-[16px] border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 outline-none';

export default function AgentPropertiesPage() {
  const [all, setAll] = useState<AgentPropertyItem[]>([]);
  const [coverage, setCoverage] = useState<string[]>([]);
  const [purpose, setPurpose] = useState<(typeof PURPOSES)[number]>('All');
  const [type, setType] = useState('All Types');
  const [bhk, setBhk] = useState('All BHK');
  const [loc, setLoc] = useState('All Locations');
  const [query, setQuery] = useState('');
  const [matching, setMatching] = useState<AgentPropertyItem | null>(null);
  const [toast, setToast] = useState('');
  const { leads } = useAgentLeads();

  useEffect(() => {
    setAll(getAgentCatalogProperties());
    setCoverage(getAgentSubscription()?.selectedLocations || []);
  }, []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((p) => {
      const purposeOf = p.purpose === 'Rent' ? 'Rent' : 'Buy';
      if (purpose !== 'All' && !(purpose === 'Lease' ? p.purpose === 'Commercial' : purposeOf === purpose)) return false;
      if (type !== 'All Types' && !p.type.toLowerCase().includes(type.toLowerCase())) return false;
      if (bhk !== 'All BHK') {
        const n = parseInt(p.bhk) || 0;
        if (bhk === '4+' ? n < 4 : n !== parseInt(bhk)) return false;
      }
      if (loc !== 'All Locations' && !p.locality.toLowerCase().includes(loc.toLowerCase().split(' ')[0])) return false;
      if (q && ![p.title, p.bhk, p.locality, p.type].join(' ').toLowerCase().includes(q)) return false;
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
          Coverage: <span className="font-semibold text-slate-900">{coverage.length} Localities</span>
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
          <p className="text-sm text-slate-500">Showing {shown.length} properties</p>
        </div>
      </div>

      {shown.length === 0 ? (
        <div className={`${agentCard} py-16 text-center`}>
          <p className="font-semibold text-slate-900">No properties available in your selected locations.</p>
          <p className="mt-1 text-sm text-slate-500">Try clearing your filters or select a different locality from your covered areas.</p>
          <button type="button" onClick={reset} className="mt-5 inline-flex h-[53px] cursor-pointer items-center rounded-[16px] bg-[#087ed9] px-6 text-sm font-semibold text-white hover:bg-sky-600">
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {shown.map((p) => (
            <article key={p.id} className={`${agentCard} flex flex-col overflow-hidden`}>
              <div className="relative aspect-[16/10] bg-slate-100">
                <img src={p.image} alt={p.title} className="h-full w-full object-cover" />
                <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-700">
                  {p.purpose === 'Rent' ? 'Available for Rent' : p.purpose === 'Commercial' ? 'Available for Lease' : 'Available for Buy'}
                </span>
                {p.verified && (
                  <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-[#087ed9]">
                    <BadgeCheck size={13} /> Owner Verified
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col p-5">
                <p className="text-lg font-bold text-slate-900">{p.price}</p>
                <h3 className="mt-0.5 truncate text-sm font-semibold text-slate-800">{p.title}</h3>
                <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">
                  <MapPin size={13} className="shrink-0" /> {p.locality}, {p.city}
                </p>
                <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
                  <span className="flex items-center gap-1"><BedDouble size={13} /> {p.bhk}</span>
                  <span className="flex items-center gap-1"><Ruler size={13} /> {p.sqft}</span>
                  <span className="flex items-center gap-1"><Users size={13} /> {p.leadCount} leads</span>
                </div>
                <div className="mt-auto grid grid-cols-2 gap-3 pt-5">
                  <Link href={`/properties/${p.id}`} className="inline-flex h-[53px] items-center justify-center rounded-[16px] bg-slate-100 text-sm font-semibold text-slate-900 hover:bg-slate-200">
                    View Details
                  </Link>
                  <button type="button" onClick={() => setMatching(p)} className="inline-flex h-[53px] cursor-pointer items-center justify-center rounded-[16px] bg-[#087ed9] text-sm font-semibold text-white hover:bg-sky-600">
                    Match Lead
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {matching && (
        <MatchModal
          mode="property-to-lead"
          property={matching}
          leads={leads}
          onClose={() => setMatching(null)}
          onDone={(msg) => {
            setMatching(null);
            setToast(msg);
            setTimeout(() => setToast(''), 3500);
          }}
        />
      )}
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 w-[calc(100%-32px)] max-w-md -translate-x-1/2 rounded-[16px] bg-slate-900 px-5 py-4 text-sm text-white shadow-xl">
          <p className="font-semibold">Lead Matched! 🎉</p>
          <p className="mt-0.5 text-slate-300">{toast}</p>
        </div>
      )}
    </div>
  );
}
