"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  archiveOwnerListing,
  deleteOwnerListing,
  listOwnerListings,
  publishOwnerListing,
  resubmitOwnerListing,
  type OwnerListingOut,
} from '@/lib/api/owner';
import { errorMessage } from '@/lib/api/client';
import { cleanImageUrl, DEAL_LABELS, typeLabel } from '@/lib/api/mappers';
import { clearDraft, getDraft, type OwnerListing } from '@/lib/ownerListings';
import { card, rupees, shortDate } from '../ui';
import { listingStatusLabel, statusTone } from '../status';
import { BedDouble, Bath, MapPin, PlusCircle, Ruler, Search, Trash2, Loader2, MessageSquare, CalendarClock, Phone } from 'lucide-react';

const TABS = ['All', 'Active', 'Pending', 'Rejected', 'Expired', 'Closed', 'Draft'] as const;
type Tab = (typeof TABS)[number];

/** The tab a real listing belongs to, from its backend verification + listing status. */
function tabOf(l: OwnerListingOut): Exclude<Tab, 'All' | 'Draft'> {
  if (l.verification_status === 'PENDING') return 'Pending';
  if (l.verification_status === 'REJECTED') return 'Rejected';
  if (l.listing_status === 'EXPIRED') return 'Expired';
  if (l.listing_status === 'AVAILABLE') return 'Active';
  return 'Closed'; // hidden (CLOSED), SOLD, RENTED, LEASED
}

export default function OwnerPropertiesPage() {
  const [listings, setListings] = useState<OwnerListingOut[]>([]);
  // The unfinished listing saved on this device (not on the server yet).
  const [draft, setDraft] = useState<OwnerListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<{ id: number; text: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [tab, setTab] = useState<Tab>('All');
  const [query, setQuery] = useState('');

  useEffect(() => {
    setDraft(getDraft()?.listing ?? null);
    let cancelled = false;
    setLoading(true);
    setError('');
    listOwnerListings(1, 100)
      .then((res) => {
        if (!cancelled) setListings(res.items.filter((l) => !l.removed));
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e, 'Could not load your properties.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const run = async (l: OwnerListingOut, action: () => Promise<OwnerListingOut | void>) => {
    setBusyId(l.listing_id);
    setActionError(null);
    try {
      const updated = await action();
      setListings((prev) =>
        updated ? prev.map((x) => (x.listing_id === l.listing_id ? updated : x)) : prev.filter((x) => x.listing_id !== l.listing_id)
      );
    } catch (e) {
      setActionError({ id: l.listing_id, text: errorMessage(e, 'That change could not be saved. Please try again.') });
    } finally {
      setBusyId(null);
    }
  };

  const remove = (l: OwnerListingOut) => {
    if (!confirm('Remove this listing? Buyers will no longer see it.')) return;
    void run(l, () => deleteOwnerListing(l.listing_id));
  };

  const removeDraft = () => {
    if (!confirm('Delete this draft? Your saved progress will be permanently removed.')) return;
    clearDraft();
    setDraft(null);
  };

  const q = query.trim().toLowerCase();
  const shown = useMemo(
    () =>
      listings.filter(
        (l) =>
          (tab === 'All' || tabOf(l) === tab) &&
          (!q ||
            [l.title, l.society_name, typeLabel(l.property_type), l.locality, l.city, l.pincode]
              .join(' ')
              .toLowerCase()
              .includes(q)),
      ),
    [listings, tab, q],
  );
  const draftShown =
    !!draft &&
    (tab === 'All' || tab === 'Draft') &&
    (!q || [draft.bhk, draft.propertyType, draft.society, draft.locality, draft.city].join(' ').toLowerCase().includes(q));
  const count = (t: Tab) =>
    t === 'Draft'
      ? draft ? 1 : 0
      : t === 'All'
        ? listings.length + (draft ? 1 : 0)
        : listings.filter((l) => tabOf(l) === t).length;

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
              {t} <span className={tab === t ? 'text-sky-100' : 'text-slate-400'}>{loading ? '…' : count(t)}</span>
            </button>
          ))}
        </div>
        <label className="flex h-[53px] items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-4 lg:w-80">
          <Search size={17} className="text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title, locality or address..." className="w-full bg-transparent text-sm outline-none" />
        </label>
      </div>

      {loading ? (
        <div className={`${card} flex items-center justify-center gap-2 py-16 text-sm text-slate-500`}>
          <Loader2 size={16} className="animate-spin text-[#087ed9]" /> Loading your properties…
        </div>
      ) : error ? (
        <div className={`${card} py-12 text-center text-sm text-red-700`} role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setAttempt((a) => a + 1)} className="mt-3 font-semibold underline cursor-pointer">
            Try again
          </button>
        </div>
      ) : shown.length === 0 && !draftShown ? (
        <div className={`${card} py-16 text-center`}>
          <p className="font-semibold text-slate-900">
            {q ? 'No matching properties' : tab === 'All' ? 'No Properties Yet' : tab === 'Draft' ? 'No Saved Drafts Yet' : `No ${tab} Properties`}
          </p>
          <p className="mt-1 text-sm text-slate-500">
            {q
              ? 'Try a different title, locality or address.'
              : tab === 'All'
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
          {draftShown && draft && (
            <article className={`${card} overflow-hidden`}>
              <div className="relative h-44 bg-slate-100">
                {draft.photos?.[0] ? (
                  <img src={draft.photos[0].src} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">No photo</div>
                )}
                <span className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[11px] font-semibold text-slate-600">Draft</span>
                {draft.purpose && (
                  <span className="absolute right-3 top-3 rounded-full bg-[#087ed9] px-2.5 py-1 text-[11px] font-semibold text-white">{draft.purpose}</span>
                )}
              </div>
              <div className="p-4">
                <p className="text-lg font-bold text-slate-900">{draft.price ? rupees(Number(draft.price)) : '—'}</p>
                <h3 className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                  {[draft.bhk, draft.propertyType].filter(Boolean).join(' ') || 'Untitled listing'} {draft.society && `in ${draft.society}`}
                </h3>
                <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
                  <MapPin size={12} /> {[draft.locality, draft.city].filter(Boolean).join(', ') || 'Location not added yet'}
                </p>
                <p className="mt-3 text-xs text-slate-500">Saved on this device; not submitted yet.</p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
                  <Link href="/owner/dashboard/add-property" className="text-xs font-semibold text-[#087ed9] hover:underline">Continue draft →</Link>
                  <button type="button" onClick={removeDraft} className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 cursor-pointer">
                    <Trash2 size={13} /> Delete Draft
                  </button>
                </div>
              </div>
            </article>
          )}
          {shown.map((l) => {
            const cover = cleanImageUrl(l.cover_image_url);
            const busy = busyId === l.listing_id;
            const verified = l.verification_status === 'VERIFIED';
            return (
              <article key={l.listing_id} className={`${card} overflow-hidden`}>
                <div className="relative h-44 bg-slate-100">
                  {cover ? (
                    <img src={cover} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">No photo</div>
                  )}
                  <span className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone(l)}`}>
                    {listingStatusLabel(l)}
                  </span>
                  <span className="absolute right-3 top-3 rounded-full bg-[#087ed9] px-2.5 py-1 text-[11px] font-semibold text-white">
                    {DEAL_LABELS[l.transaction_type] || l.transaction_type}
                  </span>
                </div>
                <div className="p-4">
                  <p className="text-lg font-bold text-slate-900">{l.price_display}</p>
                  <h3 className="mt-0.5 truncate text-sm font-semibold text-slate-800">
                    {l.title}
                    {l.society_name ? ` in ${l.society_name}` : ''}
                  </h3>
                  <p className="mt-1 flex items-center gap-1 truncate text-xs text-slate-500">
                    <MapPin size={12} /> {[typeLabel(l.property_type), l.locality, l.city].filter(Boolean).join(', ')}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-600">
                    {l.bedrooms != null && <span className="flex items-center gap-1"><BedDouble size={13} /> {l.bedrooms} Beds</span>}
                    {l.bathrooms != null && <span className="flex items-center gap-1"><Bath size={13} /> {l.bathrooms} Baths</span>}
                    {l.area_value != null && (
                      <span className="flex items-center gap-1"><Ruler size={13} /> {l.area_value} {l.area_unit || 'sqft'}</span>
                    )}
                  </div>
                  <div className="mt-3 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span className="flex items-center gap-1"><MessageSquare size={13} /> {l.enquiry_count ?? 0} enquiries</span>
                    <span className="flex items-center gap-1"><CalendarClock size={13} /> {l.visit_count ?? 0} visits</span>
                    <span className="flex items-center gap-1"><Phone size={13} /> {l.call_count ?? 0} calls</span>
                  </div>

                  {actionError?.id === l.listing_id && (
                    <p className="mt-3 text-xs text-red-600" role="alert">{actionError.text}</p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                    <span className="text-[11px] text-slate-400">
                      {l.submitted_at ? `Submitted ${shortDate(l.submitted_at)}` : ''}
                    </span>
                    <div className="flex items-center gap-3">
                      {busy && <Loader2 size={13} className="animate-spin text-slate-400" />}
                      {l.verification_status === 'REJECTED' && (
                        <button type="button" disabled={busy} onClick={() => void run(l, () => resubmitOwnerListing(l.listing_id))} className="text-xs font-semibold text-[#087ed9] hover:underline disabled:opacity-50 cursor-pointer">
                          Resubmit
                        </button>
                      )}
                      {verified && l.listing_status === 'AVAILABLE' && (
                        <button type="button" disabled={busy} onClick={() => void run(l, () => archiveOwnerListing(l.listing_id))} className="text-xs font-semibold text-slate-600 hover:underline disabled:opacity-50 cursor-pointer">
                          Hide
                        </button>
                      )}
                      {verified && l.listing_status === 'CLOSED' && (
                        <button type="button" disabled={busy} onClick={() => void run(l, () => publishOwnerListing(l.listing_id))} className="text-xs font-semibold text-[#087ed9] hover:underline disabled:opacity-50 cursor-pointer">
                          Show to buyers
                        </button>
                      )}
                      {verified && l.listing_status === 'AVAILABLE' && (
                        <Link href={`/properties/${l.listing_id}`} className="text-xs font-semibold text-[#087ed9] hover:underline">
                          View
                        </Link>
                      )}
                      <button type="button" disabled={busy} onClick={() => remove(l)} className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 disabled:opacity-50 cursor-pointer">
                        <Trash2 size={13} /> Delete
                      </button>
                    </div>
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
