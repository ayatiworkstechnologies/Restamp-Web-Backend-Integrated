"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSession, isPlaceholderName } from '@/lib/api/session';
import { getBrokerDashboard, getBrokerPlan, listBrokerListings, planActive, type BrokerDashboard, type BrokerPlan } from '@/lib/api/broker';
import type { ListingCard } from '@/lib/api/buyer';
import { errorMessage } from '@/lib/api/client';
import { cleanImageUrl, typeLabel } from '@/lib/api/mappers';
import { agentCard } from './ui';
import { ArrowRight, Building2, Loader2, MapPin, Users, type LucideIcon } from 'lucide-react';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
};

const shortDate = (iso: string) => {
  const d = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

function Stat({ label, value, icon: Icon, href }: { label: string; value: string; icon: LucideIcon; href: string }) {
  return (
    <Link href={href} className={`${agentCard} group flex items-center gap-4 p-5 transition hover:border-sky-100 hover:shadow-lg`}>
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

// Everything here is the agent's real data: plan + covered localities
// (GET /broker/plan), counts (GET /broker/dashboard) and the newest listings
// inside the agent's coverage (GET /broker/listings). The backend has no
// agent-lead source yet, so lead figures are shown as unavailable, never guessed.
export default function AgentDashboardPage() {
  const [plan, setPlan] = useState<BrokerPlan | null>(null);
  const [stats, setStats] = useState<BrokerDashboard | null>(null);
  const [recent, setRecent] = useState<ListingCard[]>([]);
  const [firstName, setFirstName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    // The signed-in account's chosen name (never the phone-number placeholder).
    const name = getSession()?.displayName;
    setFirstName(isPlaceholderName(name) ? '' : (name || '').split(' ')[0]);
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([getBrokerPlan(), getBrokerDashboard(), listBrokerListings({}, 1, 4)])
      .then(([p, d, l]) => {
        if (cancelled) return;
        setPlan(p);
        setStats(d);
        setRecent(l.items);
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e, 'Could not load your agent dashboard.'));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const dateLine = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });

  if (loading) {
    return (
      <div className={`${agentCard} flex items-center justify-center gap-2 py-16 text-sm text-slate-500`}>
        <Loader2 size={16} className="animate-spin text-[#087ed9]" /> Loading your dashboard…
      </div>
    );
  }
  if (error || !stats) {
    return (
      <div className={`${agentCard} py-12 text-center text-sm text-red-700`} role="alert">
        <p>{error || 'Could not load your agent dashboard.'}</p>
        <button type="button" onClick={() => setAttempt((a) => a + 1)} className="mt-3 font-semibold underline cursor-pointer">
          Try again
        </button>
      </div>
    );
  }

  const hasPlan = !!plan?.has_plan;
  const active = planActive(plan);
  const expired = hasPlan && !active;
  const locations = plan?.localities || [];
  const limit = plan?.locality_limit ?? stats.coverage_limit ?? null;
  const locPct = limit ? Math.min(100, Math.round((locations.length / limit) * 100)) : 0;
  const propertyCount = stats.available_property_count;

  return (
    <div className="space-y-6">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{dateLine}</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
            {greeting()}, {firstName || 'Agent'}
          </h1>
        </div>
        <Link href="/agent/dashboard/properties" className="inline-flex h-[53px] items-center gap-2 rounded-[16px] bg-[#087ed9] px-5 text-sm font-semibold text-white transition hover:bg-sky-600">
          Browse Properties <ArrowRight size={16} />
        </Link>
      </div>

      {expired && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-red-100 bg-red-50 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-red-800">Your Agent Plan has expired.</p>
            <p className="text-xs text-red-700">Renew to unlock new property listings in your localities.</p>
          </div>
          <Link href="/agent/packages" className="inline-flex h-[53px] items-center rounded-[16px] bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700">
            View Plans
          </Link>
        </div>
      )}

      {/* Welcome hero */}
      <section className="relative overflow-hidden rounded-[20px] bg-[#087ed9] p-6 text-white sm:p-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
        <p className="text-sm font-semibold text-sky-100">Welcome back 👋</p>
        <h2 className="mt-2 max-w-xl text-xl font-bold sm:text-2xl">
          {propertyCount} owner {propertyCount === 1 ? 'property' : 'properties'} live in your localities
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/20 pt-5">
          <div>
            <p className="text-xl font-extrabold sm:text-2xl">{hasPlan ? plan?.plan_name : 'No plan'}</p>
            <p className="text-xs text-sky-100">{!hasPlan ? 'No active agent plan' : expired ? 'Plan expired' : 'Active plan'}</p>
          </div>
          <div>
            <p className="text-xl font-extrabold sm:text-2xl">
              {locations.length}
              {limit ? `/${limit}` : ''}
            </p>
            <p className="text-xs text-sky-100">localities</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Browse Properties" value={String(propertyCount)} icon={Building2} href="/agent/dashboard/properties" />
        <Stat label="New Leads (not available yet)" value={stats.new_lead_count == null ? '—' : String(stats.new_lead_count)} icon={Users} href="/agent/dashboard/leads" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Newest properties in the agent's coverage */}
        <section className={`${agentCard} p-5 sm:p-6 xl:col-span-2`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Latest Properties</h2>
              <p className="text-xs text-slate-500">Newest owner listings in your covered localities</p>
            </div>
            <Link href="/agent/dashboard/properties" className="inline-flex items-center gap-1 text-sm font-semibold text-[#087ed9] hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {recent.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
              {locations.length === 0
                ? 'No covered localities yet. Properties appear here once your agent plan covers an area.'
                : 'No live owner listings in your localities right now.'}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((l) => {
                const cover = cleanImageUrl(l.cover_image_url);
                return (
                  <li key={l.listing_id} className="flex flex-wrap items-center gap-4 py-4">
                    <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-slate-100">
                      {cover && <img src={cover} alt="" className="h-full w-full object-cover" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-slate-900">{l.title}</p>
                      <p className="truncate text-xs text-slate-500">
                        {[typeLabel(l.property_type), [l.locality, l.city].filter(Boolean).join(', ')].filter(Boolean).join(' • ')}
                      </p>
                    </div>
                    <p className="text-sm font-bold text-slate-900">{l.price_display}</p>
                    <Link href={`/properties/${l.listing_id}`} className="inline-flex h-[53px] items-center rounded-[16px] bg-slate-100 px-5 text-sm font-semibold text-slate-900 hover:bg-slate-200">
                      View
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        {/* Subscription & locations */}
        <section className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 text-slate-900 flex flex-col rounded-[16px] p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-600">Agent Subscription</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Current Plan</span>
              <span className="font-semibold">{hasPlan ? plan?.plan_name : 'None'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className={`font-semibold ${active ? 'text-emerald-600' : 'text-red-400'}`}>{!hasPlan ? 'No plan' : expired ? 'Expired' : 'Active'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Active until</span>
              <span className="font-semibold">{hasPlan ? (plan?.valid_until ? shortDate(plan.valid_until) : 'No end date') : '—'}</span>
            </div>
            {limit != null && (
              <div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Coverage Limit</span>
                  <span className="font-semibold">
                    {locations.length} of {limit} Locations Used
                  </span>
                </div>
                <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                  <div className="h-full rounded-full bg-[#087ed9]" style={{ width: `${locPct}%` }} />
                </div>
              </div>
            )}
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-500">Your Covered Locations</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {locations.length === 0 && <span className="text-xs text-slate-500">None yet</span>}
            {locations.slice(0, 5).map((loc) => (
              <span key={loc} className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 text-xs">
                <MapPin size={11} /> {loc}
              </span>
            ))}
            {locations.length > 5 && <span className="rounded-full bg-white px-2.5 py-1 text-xs">+{locations.length - 5} more</span>}
          </div>
          <Link href="/agent/dashboard/payments" className="mt-6 inline-flex h-[53px] items-center justify-center rounded-[16px] bg-[#087ed9] text-sm font-semibold text-white transition hover:bg-sky-600">
            Plan & Payments
          </Link>
        </section>
      </div>
    </div>
  );
}
