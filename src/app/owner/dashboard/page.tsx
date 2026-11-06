"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getOwnerListings, getDraft, type OwnerListing } from '@/lib/ownerListings';
import { getSubscription, type OwnerSubscription } from '@/lib/ownerPlan';
import { getProfile } from '@/lib/profile';
import { timeAgo, useOwnerLeads, visitBucket } from '@/lib/ownerLeads';
import { card, rupees, shortDate } from './ui';
import { ArrowRight, CalendarCheck, Crown, Eye, MapPin, MessageSquareText, Phone, PlusCircle, type LucideIcon } from 'lucide-react';

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

export default function OwnerDashboardPage() {
  const [listings, setListings] = useState<OwnerListing[]>([]);
  const [sub, setSub] = useState<OwnerSubscription | null>(null);
  const [hasDraft, setHasDraft] = useState(false);
  const [firstName, setFirstName] = useState('');
  const { leads, visits } = useOwnerLeads();

  useEffect(() => {
    setListings(getOwnerListings());
    setSub(getSubscription());
    setHasDraft(!!getDraft());
    setFirstName((getProfile()?.name || '').split(' ')[0]);
  }, []);

  if (!sub) return null;

  const primary = listings[0];
  const used = listings.length;
  const quotaPct = sub.listingLimit ? Math.min(100, Math.round((used / sub.listingLimit) * 100)) : 0;
  const upcomingVisits = visits.filter((v) => visitBucket(v) !== 'Completed').length;

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
          <span className="text-amber-900">You have an unfinished listing draft.</span>
          <Link href="/owner/dashboard/add-property" className="font-semibold text-amber-700 hover:underline">Continue draft →</Link>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Primary listing */}
        <section className={`${card} overflow-hidden xl:col-span-2`}>
          {primary ? (
            <Link href="/owner/dashboard/properties" className="grid sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
              <div className="relative h-52 bg-slate-100 sm:h-full">
                {primary.photos[0] ? (
                  <img src={primary.photos[0].src} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-xs text-slate-400">No photo</div>
                )}
                <span className="absolute left-3 top-3 rounded-md bg-white/95 px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-700">Primary Listing</span>
              </div>
              <div className="flex flex-col p-6">
                <span className={`self-start rounded-full px-2.5 py-1 text-[11px] font-semibold ${primary.status === 'Pending Verification' ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                  {primary.status === 'Pending Verification' ? 'Pending Verification' : 'Live'}
                </span>
                <h2 className="mt-3 text-xl font-bold text-slate-900">
                  {[primary.bhk, primary.propertyType].filter(Boolean).join(' ')} for {primary.purpose}
                </h2>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-slate-500">
                  <MapPin size={14} /> {[primary.locality, primary.city].filter(Boolean).join(', ') || '—'}
                </p>
                <p className="mt-4 text-2xl font-extrabold text-slate-900">
                  {primary.price ? rupees(Number(primary.price)) : 'Price on request'}
                  {(primary.purpose === 'Rent' || primary.purpose === 'Lease') && <span className="text-sm font-medium text-slate-500"> /month</span>}
                </p>
                <div className="mt-auto flex gap-6 border-t border-slate-100 pt-4 text-sm text-slate-600">
                  <span className="flex items-center gap-1.5"><Eye size={15} /> — Views</span>
                  <span className="flex items-center gap-1.5"><MessageSquareText size={15} /> {leads.length} Enquiries</span>
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

        {/* Owner plan */}
        <section className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 text-slate-900 flex flex-col rounded-[16px] p-6">
          <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-sky-600">
            <Crown size={14} /> Owner Plan
          </p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Current Plan</span><span className="font-semibold">{sub.planName}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Validity</span><span className="font-semibold">{sub.expiresAt ? shortDate(sub.expiresAt) : 'Until deal closed'}</span></div>
            <div>
              <div className="flex justify-between"><span className="text-slate-500">Listing Quota</span><span className="font-semibold">{used} of {sub.listingLimit >= 999 ? '∞' : sub.listingLimit} used</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-[#087ed9]" style={{ width: `${quotaPct}%` }} />
              </div>
            </div>
          </div>
          <Link href="/owner/plans" className="mt-6 inline-flex h-[53px] items-center justify-center rounded-[16px] bg-white text-sm font-semibold text-slate-900 transition hover:bg-sky-50">
            Manage Subscription
          </Link>
        </section>
      </div>

      {/* Metrics */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Metric label="Total inquiries" value={String(leads.length)} icon={MessageSquareText} href="/owner/dashboard/leads" />
        <Metric label="Property views" value="—" icon={Eye} href="/owner/dashboard/properties" />
        <Metric label="Site visits" value={String(upcomingVisits)} icon={CalendarCheck} href="/owner/dashboard/visits" />
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

      {/* Recent enquiries */}
      <section className={`${card} p-5 sm:p-6`}>
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Recent Enquiries</h2>
            <p className="text-xs text-slate-500">{leads.filter((l) => l.status === 'New').length} new • Active today</p>
          </div>
          <Link href="/owner/dashboard/leads" className="inline-flex items-center gap-1 text-sm font-semibold text-[#087ed9] hover:underline">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        {leads.length === 0 ? (
          <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">No buyer leads yet. Buyer enquiries for your properties will appear here.</p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {leads.slice(0, 4).map((l) => (
              <li key={l.id} className="flex flex-wrap items-center gap-4 py-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50 font-bold text-[#087ed9]">
                  {l.customerName.charAt(0)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                    {l.customerName}
                    {l.status === 'New' && <span className="rounded bg-[#087ed9] px-1.5 py-0.5 text-[10px] font-bold text-white">NEW</span>}
                  </p>
                  <p className="truncate text-xs text-slate-500">
                    Buyer enquiry • {l.propertyTitle} • {timeAgo(l.createdAt)}
                  </p>
                </div>
                {l.phone ? (
                  <a href={`tel:${l.phone.replace(/\s/g, '')}`} className="inline-flex h-[53px] items-center gap-2 rounded-[16px] bg-slate-100 px-5 text-sm font-semibold text-slate-900 transition hover:bg-slate-200">
                    <Phone size={16} /> Call Lead
                  </a>
                ) : (
                  <span className="text-xs text-slate-400">Phone number unavailable</span>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
