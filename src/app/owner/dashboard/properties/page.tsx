"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { clearDraft, deleteListing, getDraft, getOwnerListings, type OwnerListing } from '@/lib/ownerListings';
import { card, rupees, shortDate } from '../ui';
import { BedDouble, Bath, MapPin, PlusCircle, Ruler, Search, Trash2 } from 'lucide-react';

const TABS = ['All', 'Active', 'Pending', 'Rejected', 'Expired', 'Closed', 'Draft'] as const;
type Tab = (typeof TABS)[number];
type Row = OwnerListing & { tab: Exclude<Tab, 'All'> };
const tabOf = (l: OwnerListing): Row['tab'] => (l.status === 'Draft' ? 'Draft' : l.status === 'Pending Verification' ? 'Pending' : 'Active');

export default function OwnerPropertiesPage() {
  const [listings, setListings] = useState<Row[]>([]);
  const [tab, setTab] = useState<Tab>('All');
  const [query, setQuery] = useState('');

  const load = () => {
    const draft = getDraft();
    const rows: Row[] = getOwnerListings().map((l) => ({ ...l, tab: tabOf(l) }));
    if (draft) rows.unshift({ ...draft.listing, id: `draft-${draft.listing.id}`, status: 'Draft', tab: 'Draft' });
    setListings(rows);
  };
  useEffect(load, []);

  const remove = (l: Row) => {
    if (l.tab === 'Draft') {
      if (!confirm('Delete this draft? Your saved progress will be permanently removed.')) return;
      clearDraft();
    } else {
      if (!confirm('Remove this listing from the marketplace? This cannot be undone.')) return;
      deleteListing(l.id);
    }
    load();
  };

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter(
      (l) =>
        (tab === 'All' || l.tab === tab) &&
        (!q || [l.bhk, l.propertyType, l.society, l.locality, l.city, l.houseNo].join(' ').toLowerCase().includes(q)),
    );
  }, [listings, tab, query]);
  const count = (t: Tab) => (t === 'All' ? listings.length : listings.filter((l) => l.tab === t).length);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">My Properties</h1>
          <p className="mt-1 text-sm text-slate-500">All the properties you have listed on Restamp.</p>
        </div>
        <Link href="/owner/dashboard/add-property" className="inline-flex items-center gap-2 rounded-xl bg-[#087ed9] px-4 h-[53px] text-sm font-semibold text-white hover:bg-sky-600 transition">
          <PlusCircle size={16} /> Add property
        </Link>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition ${
                tab === t ? 'bg-[#087ed9] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {t} <span className={tab === t ? 'text-sky-100' : 'text-slate-400'}>{count(t)}</span>
            </button>
          ))}
        </div>
        <label className="flex h-[53px] items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-4 lg:w-80">
          <Search size={17} className="text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title, locality or address..." className="w-full bg-transparent text-sm outline-none" />
        </label>
      </div>

      {shown.length === 0 ? (
        <div className={`${card} py-16 text-center`}>
          <p className="font-semibold text-slate-900">
            {tab === 'All' ? 'No Properties Yet' : tab === 'Draft' ? 'No Saved Drafts Yet' : `No ${tab} Properties`}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {tab === 'All'
              ? 'Start by adding your first property to receive verified buyer enquiries.'
              : tab === 'Draft'
                ? 'Start a listing and tap Save Draft to resume it here later.'
                : `You currently have zero properties under the ${tab} category.`}
          </p>
          <Link href="/owner/dashboard/add-property" className="mt-3 inline-block text-sm font-semibold text-[#087ed9] hover:underline">
            List your first property
          </Link>
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {shown.map((l) => (
            <article key={l.id} className={`${card} overflow-hidden`}>
              <div className="relative h-44 bg-slate-100">
                {l.photos[0] ? (
                  <img src={l.photos[0].src} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">No photo</div>
                )}
                <span className={`absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold ${l.tab === 'Active' ? 'text-emerald-700' : l.tab === 'Draft' ? 'text-slate-600' : 'text-amber-700'}`}>{l.status}</span>
                <span className="absolute right-3 top-3 rounded-full bg-[#087ed9] px-2.5 py-1 text-[11px] font-semibold text-white">{l.purpose}</span>
              </div>
              <div className="p-4">
                <p className="text-lg font-bold text-slate-900">
                  {l.price ? rupees(Number(l.price)) : '—'}
                  {(l.purpose === 'Rent' || l.purpose === 'Lease') && <span className="text-xs font-normal text-slate-500"> /month</span>}
                </p>
                <h3 className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                  {[l.bhk, l.propertyType].filter(Boolean).join(' ')} {l.society && `in ${l.society}`}
                </h3>
                <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
                  <MapPin size={12} /> {[l.locality, l.city].filter(Boolean).join(', ')}
                </p>
                <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                  {l.bedrooms && <span className="flex items-center gap-1"><BedDouble size={13} /> {l.bedrooms} Beds</span>}
                  {l.bathrooms && <span className="flex items-center gap-1"><Bath size={13} /> {l.bathrooms} Baths</span>}
                  {(l.builtUpArea || l.carpetArea) && <span className="flex items-center gap-1"><Ruler size={13} /> {l.builtUpArea || l.carpetArea} sq.ft</span>}
                </div>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  {l.tab === 'Draft' ? (
                    <Link href="/owner/dashboard/add-property" className="text-xs font-semibold text-[#087ed9] hover:underline">Continue draft →</Link>
                  ) : (
                    <span className="text-[11px] text-slate-400">Listed {shortDate(l.createdAt)}</span>
                  )}
                  <button type="button" onClick={() => remove(l)} className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 cursor-pointer">
                    <Trash2 size={13} /> {l.tab === 'Draft' ? 'Delete Draft' : 'Remove'}
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
