"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDraft } from '@/lib/ownerListings';
import { listOwnerListings, type OwnerListingOut } from '@/lib/api/owner';
import { errorMessage } from '@/lib/api/client';
import { cleanImageUrl, DEAL_LABELS, typeLabel } from '@/lib/api/mappers';
import { getSession, isPlaceholderName } from '@/lib/api/session';
import { card } from './ui';
import { listingStatusLabel, statusTone } from './status';
import { ArrowRight, Building2, CalendarCheck, Crown, Loader2, MapPin, MessageSquareText, PlusCircle, type LucideIcon } from 'lucide-react';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

function Metric({ label, value, icon: Icon, href }: { label: string; value: string; icon: LucideIcon; href: string }) {
  return (
    <Link href={href} className={`${card} group flex items-center gap-4 p-5 transition hover:border-sky-100 hover:shadow-lg`}>
      <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-sky-50 text-[#087ed9]">
        <Icon size={22} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-2xl font-extrabold tracking-tight text-slate-900">{value}</p>
        <p className="text-xs font-semibold text-slate-500">{label}</p>
      </div>
      <ArrowRight size={16} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#087ed9]" />
    </Link>
  );
}

// Every figure here comes from the owner's real listings (GET /owner/listings):
// listing counts by backend status and each listing's enquiry / visit counts.
// Nothing is estimated (no view counts exist), and plans are not connected yet.
export default function OwnerDashboardPage() {
  const [listings, setListings] = useState<OwnerListingOut[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasDraft, setHasDraft] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setHasDraft(!!getDraft());
    const name = getSession()?.displayName;
    setFirstName(isPlaceholderName(name) ? '' : (name || '').split(' ')[0]);
    let cancelled = false;
    setLoading(true);
    setError('');
    listOwnerListings(1, 100)
      .then((res) => {
        if (cancelled) return;
        setListings(res.items);
        setTotal(res.total);
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e, 'Could not load your listings.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Counts over the listings loaded here (up to 100, newest first).
  const active = listings.filter((l) => !l.removed);
  const pending = active.filter((l) => l.verification_status === 'PENDING').length;
  const enquiries = active.reduce((sum, l) => sum + (l.enquiry_count || 0), 0);
  const visits = active.reduce((sum, l) => sum + (l.visit_count || 0), 0);
  const primary = active[0];
  const primaryCover = primary ? cleanImageUrl(primary.cover_image_url) : '';
  const count = (n: number) => (loading ? '…' : String(n));

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-[#087ed9]">RESTAMP Owner Partner</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {greeting()}
            {firstName && `, ${firstName}`} 👋
          </h1>
        </div>
        <Link href="/owner/dashboard/add-property" className="inline-flex h-[53px] items-center gap-2 rounded-[16px] bg-[#087ed9] px-5 text-sm font-semibold text-white transition hover:bg-sky-600">
          <PlusCircle size={18} /> Add Property
        </Link>
      </div>

      {hasDraft && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-amber-100 bg-amber-50 px-5 py-4 text-sm">
          <span className="text-amber-900">You have an unfinished listing draft on this device.</span>
          <Link href="/owner/dashboard/add-property" className="font-semibold text-amber-700 hover:underline">Continue draft →</Link>
        </div>
      )}

      {error && (
        <div className={`${card} p-6 text-sm text-red-700`} role="alert">
          {error}{' '}
          <button type="button" onClick={() => setAttempt((a) => a + 1)} className="font-semibold underline cursor-pointer">
            Try again
          </button>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Primary (newest) listing */}
        <section className={`${card} overflow-hidden xl:col-span-2`}>
          {loading ? (
            <div className="flex items-center gap-2 p-8 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin text-[#087ed9]" /> Loading your listings…
            </div>
          ) : primary ? (
            <Link href="/owner/dashboard/properties" className="grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <div className="relative h-52 bg-slate-100 sm:h-full">
                {primaryCover ? (
                  <img src={primaryCover} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">No photo</div>
                )}
                <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700">Primary Listing</span>
              </div>
              <div className="flex flex-col p-6">
                <span className={`self-start rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone(primary)}`}>
                  {listingStatusLabel(primary)}
                </span>
                <h2 className="mt-3 text-xl font-bold text-slate-900">{primary.title}</h2>
                <p className="mt-1 text-sm text-slate-500">
                  {[typeLabel(primary.property_type), DEAL_LABELS[primary.transaction_type]].filter(Boolean).join(' · ')}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin size={14} /> {[primary.locality, primary.city].filter(Boolean).join(', ') || '—'}
                </p>
                <p className="mt-4 text-2xl font-extrabold text-slate-900">{primary.price_display || 'Price on request'}</p>
                <div className="mt-auto flex gap-6 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5"><MessageSquareText size={15} /> {primary.enquiry_count || 0} Enquiries</span>
                  <span className="flex items-center gap-1.5"><CalendarCheck size={15} /> {primary.visit_count || 0} Visits</span>
                </div>
              </div>
            </Link>
          ) : (
            <div className="flex flex-col items-start gap-4 p-8 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#087ed9]">Quick Action</p>
                <h2 className="mt-2 text-xl font-bold text-slate-900">Add Your First Property</h2>
                <p className="mt-1 text-sm text-slate-500">Start by adding your first property to receive verified buyer enquiries.</p>
              </div>
              <Link href="/owner/dashboard/add-property" className="inline-flex h-[53px] items-center gap-2 rounded-[16px] bg-[#087ed9] px-6 text-sm font-semibold text-white hover:bg-sky-600">
                Start <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </section>

        {/* Owner plan: purchases are not connected to the backend yet. */}
        <section className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 text-slate-900 flex flex-col rounded-[16px] p-6">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600">
            <Crown size={14} /> Owner Plan
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">My listings</span><span className="font-semibold">{count(total)}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Pending verification</span><span className="font-semibold">{count(pending)}</span></div>
            <p className="text-xs text-slate-500">Plan purchases and payments are not available online yet.</p>
          </div>
          <Link href="/owner/plans" className="mt-6 inline-flex h-[53px] items-center justify-center rounded-[16px] bg-white text-sm font-semibold text-slate-900 transition hover:bg-sky-50">
            View Plans
          </Link>
        </section>
      </div>

      {/* Metrics (real counts) */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="My listings" value={count(total)} icon={Building2} href="/owner/dashboard/properties" />
        <Metric label="Total enquiries" value={count(enquiries)} icon={MessageSquareText} href="/owner/dashboard/properties" />
        <Metric label="Site visit requests" value={count(visits)} icon={CalendarCheck} href="/owner/dashboard/properties" />
      </div>

      {/* List a new property */}
      <Link href="/owner/dashboard/add-property" className={`${card} group flex items-center gap-4 p-5 transition hover:border-sky-100 hover:shadow-lg`}>
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[14px] bg-[#087ed9] text-white">
          <PlusCircle size={22} />
        </span>
        <div className="flex-1">
          <p className="font-bold text-slate-900">List a New Property</p>
          <p className="text-sm text-slate-500">Add new property, rental, lease, or resale in minutes</p>
        </div>
        <ArrowRight size={18} className="text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[#087ed9]" />
      </Link>

      {/* Recent properties with their real enquiry / visit counts */}
      <section className={`${card} p-5 sm:p-6`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Recent Properties</h2>
            <p className="text-xs text-slate-500">Enquiries and visit requests per listing</p>
          </div>
          <Link href="/owner/dashboard/properties" className="inline-flex items-center gap-1 text-sm font-semibold text-[#087ed9] hover:underline">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin text-[#087ed9]" /> Loading…
          </div>
        ) : active.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
            You haven&apos;t listed any property yet. Buyer enquiries for your properties will appear here.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {active.slice(0, 4).map((l) => {
              const cover = cleanImageUrl(l.cover_image_url);
              return (
                <li key={l.listing_id} className="flex flex-wrap items-center gap-4 py-4">
                  <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                    {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-900">{l.title}</p>
                    <p className="truncate text-xs text-slate-500">
                      {[typeLabel(l.property_type), DEAL_LABELS[l.transaction_type], [l.locality, l.city].filter(Boolean).join(', ')]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <span className="flex items-center gap-1 text-xs text-slate-500"><MessageSquareText size={13} /> {l.enquiry_count || 0}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-500"><CalendarCheck size={13} /> {l.visit_count || 0}</span>
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusTone(l)}`}>{listingStatusLabel(l)}</span>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
