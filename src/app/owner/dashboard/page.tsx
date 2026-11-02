"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getDraft } from '@/lib/ownerListings';
import { listOwnerListings, type OwnerListingOut } from '@/lib/api/owner';
import { errorMessage } from '@/lib/api/client';
import { cleanImageUrl, DEAL_LABELS, typeLabel } from '@/lib/api/mappers';
import { card } from './ui';
import { listingStatusLabel, statusTone } from './status';
import { Building2, Clock, MessageSquare, CheckCircle2, PlusCircle, ArrowRight, Loader2, type LucideIcon } from 'lucide-react';


function Stat({ label, value, detail, icon: Icon }: { label: string; value: string; detail: string; icon: LucideIcon }) {
  return (
    <div className={`${card} p-5`}>
      <div className="flex items-start justify-between">
        <span className="text-[13px] font-semibold text-slate-400">{label}</span>
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-[#087ed9]">
          <Icon size={19} />
        </span>
      </div>
      <p className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{value}</p>
      <p className="mt-2 text-xs text-slate-400">{detail}</p>
    </div>
  );
}

export default function OwnerDashboardPage() {
  const [listings, setListings] = useState<OwnerListingOut[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasDraft, setHasDraft] = useState(false);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    setHasDraft(!!getDraft());
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
  const live = active.filter((l) => l.verification_status === 'VERIFIED' && l.listing_status === 'AVAILABLE').length;
  const enquiries = active.reduce((sum, l) => sum + (l.enquiry_count || 0), 0);
  const visits = active.reduce((sum, l) => sum + (l.visit_count || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="mt-1 text-sm text-slate-500">An overview of your listings.</p>
        </div>
        <Link href="/owner/dashboard/add-property" className="inline-flex items-center gap-2 rounded-xl bg-[#087ed9] px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition">
          <PlusCircle size={16} /> Add property
        </Link>
      </div>

      {error ? (
        <div className={`${card} p-6 text-sm text-red-700`} role="alert">
          {error}{' '}
          <button type="button" onClick={() => setAttempt((a) => a + 1)} className="font-semibold underline cursor-pointer">
            Try again
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Stat label="My listings" value={loading ? '…' : String(total)} detail="Including pending and closed listings" icon={Building2} />
          <Stat label="Pending verification" value={loading ? '…' : String(pending)} detail="Not visible to buyers until verified" icon={Clock} />
          <Stat label="Live for buyers" value={loading ? '…' : String(live)} detail="Verified and available" icon={CheckCircle2} />
          <Stat label="Buyer enquiries" value={loading ? '…' : String(enquiries)} detail={`${visits} visit request${visits === 1 ? '' : 's'}`} icon={MessageSquare} />
        </div>
      )}

      {hasDraft && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-100 bg-amber-50 px-5 py-4 text-sm">
          <span className="text-amber-900">You have an unfinished listing draft on this device.</span>
          <Link href="/owner/dashboard/add-property" className="font-semibold text-amber-700 hover:underline">Continue draft →</Link>
        </div>
      )}

      <section className={`${card} p-5`}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-bold text-slate-900">Recent properties</h2>
          <Link href="/owner/dashboard/properties" className="inline-flex items-center gap-1 text-xs font-semibold text-[#087ed9] hover:underline">
            View all <ArrowRight size={13} />
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin text-[#087ed9]" /> Loading…
          </div>
        ) : active.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center">
            <p className="text-sm text-slate-500">You haven&apos;t listed any property yet.</p>
            <Link href="/owner/dashboard/add-property" className="mt-3 inline-block text-sm font-semibold text-[#087ed9] hover:underline">
              List your first property
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {active.slice(0, 4).map((l) => {
              const cover = cleanImageUrl(l.cover_image_url);
              return (
                <li key={l.listing_id} className="flex items-center gap-4 py-3">
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
