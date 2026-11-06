"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getProfile } from '@/lib/profile';
import { getAgentSubscription, type AgentSubscription } from '@/lib/agentPlan';
import { getAgentCatalogProperties, type AgentPropertyItem } from '@/lib/agent-data';
import { timeAgo, useAgentLeads, type AgentLead } from '@/lib/agentLeads';
import MatchModal from '@/components/agent/MatchModal';
import { agentCard } from './ui';
import { ArrowRight, Building2, CheckCircle2, MapPin, Phone, Users, type LucideIcon } from 'lucide-react';

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good Morning' : h < 17 ? 'Good Afternoon' : 'Good Evening';
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

export default function AgentDashboardPage() {
  const [sub, setSub] = useState<AgentSubscription | null>(null);
  const [firstName, setFirstName] = useState('');
  const [properties, setProperties] = useState<AgentPropertyItem[]>([]);
  const [matching, setMatching] = useState<AgentLead | null>(null);
  const [toast, setToast] = useState('');
  const { leads } = useAgentLeads();

  useEffect(() => {
    setSub(getAgentSubscription());
    setFirstName((getProfile()?.name || '').split(' ')[0]);
    setProperties(getAgentCatalogProperties());
  }, []);

  if (!sub) return null;

  const today = new Date();
  const dateLine = today.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  const expired = !!sub.expiresAt && new Date(sub.expiresAt).getTime() < Date.now();
  const locations = sub.selectedLocations || [];
  const newLeads = leads.filter((l) => l.status === 'New');
  const locPct = sub.locationLimit ? Math.min(100, Math.round((locations.length / sub.locationLimit) * 100)) : 0;

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
        <Link href="/agent/dashboard/leads" className="inline-flex h-[53px] items-center gap-2 rounded-[16px] bg-[#087ed9] px-5 text-sm font-semibold text-white transition hover:bg-sky-600">
          View New Leads <ArrowRight size={16} />
        </Link>
      </div>

      {expired && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[16px] border border-red-100 bg-red-50 px-5 py-4">
          <div>
            <p className="text-sm font-semibold text-red-800">Your Agent Plan has expired.</p>
            <p className="text-xs text-red-700">Renew to unlock new property listings and fresh customer enquiries.</p>
          </div>
          <Link href="/agent/packages" className="inline-flex h-[53px] items-center rounded-[16px] bg-red-600 px-5 text-sm font-semibold text-white hover:bg-red-700">
            Renew Plan
          </Link>
        </div>
      )}

      {/* Welcome hero */}
      <section className="relative overflow-hidden rounded-[20px] bg-[#087ed9] p-6 text-white sm:p-8">
        <div className="absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/10" />
        <p className="text-sm font-semibold text-sky-100">Welcome back 👋</p>
        <h2 className="mt-2 max-w-xl text-xl font-bold sm:text-2xl">
          {properties.length} owner {properties.length === 1 ? 'property' : 'properties'} live in your localities
        </h2>
        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-white/20 pt-5">
          <div>
            <p className="text-xl font-extrabold sm:text-2xl">{sub.planName}</p>
            <p className="text-xs text-sky-100">{expired ? 'Plan expired' : 'Active plan'}</p>
          </div>
          <div>
            <p className="text-xl font-extrabold sm:text-2xl">
              {locations.length}/{sub.locationLimit}
            </p>
            <p className="text-xs text-sky-100">localities</p>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Stat label="Browse Properties" value={String(properties.length)} icon={Building2} href="/agent/dashboard/properties" />
        <Stat label="New Leads" value={String(newLeads.length)} icon={Users} href="/agent/dashboard/leads" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        {/* Recent leads */}
        <section className={`${agentCard} p-5 sm:p-6 xl:col-span-2`}>
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h2 className="font-bold text-slate-900">Recent Leads</h2>
              <p className="text-xs text-slate-500">{leads.length} customer enquiries • Active today</p>
            </div>
            <Link href="/agent/dashboard/leads" className="inline-flex items-center gap-1 text-sm font-semibold text-[#087ed9] hover:underline">
              View all <ArrowRight size={14} />
            </Link>
          </div>
          {leads.length === 0 ? (
            <p className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-500">
              No new leads yet. Leads from interested buyers in your localities will appear here.
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {leads.slice(0, 4).map((l) => (
                <li key={l.id} className="flex flex-wrap items-center gap-4 py-4">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50 font-bold text-[#087ed9]">{l.customerName.charAt(0)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                      {l.customerName}
                      {l.status === 'New' && <span className="rounded bg-[#087ed9] px-1.5 py-0.5 text-[10px] font-bold text-white">NEW</span>}
                    </p>
                    <p className="truncate text-xs text-slate-500">
                      {l.requirement} • {l.preferredLocality} • {timeAgo(l.createdAt)}
                    </p>
                    {l.matchedPropertyTitle && (
                      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-700">
                        <CheckCircle2 size={13} /> Matched: {l.matchedPropertyTitle}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {l.phone && (
                      <a href={`tel:${l.phone.replace(/\s/g, '')}`} aria-label={`Call ${l.customerName}`} className="inline-flex h-[53px] w-[53px] items-center justify-center rounded-[16px] bg-slate-100 text-slate-900 hover:bg-slate-200">
                        <Phone size={17} />
                      </a>
                    )}
                    <button type="button" onClick={() => setMatching(l)} className="inline-flex h-[53px] cursor-pointer items-center rounded-[16px] bg-slate-100 px-5 text-sm font-semibold text-slate-900 hover:bg-slate-200">
                      Match Property
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Subscription & locations */}
        <section className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 text-slate-900 flex flex-col rounded-[16px] p-6">
          <p className="text-xs font-bold uppercase tracking-wider text-sky-600">Agent Subscription</p>
          <div className="mt-4 space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-500">Current Plan</span>
              <span className="font-semibold">{sub.planName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Status</span>
              <span className={`font-semibold ${expired ? 'text-red-400' : 'text-emerald-600'}`}>{expired ? 'Expired' : 'Active'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Active until</span>
              <span className="font-semibold">
                {sub.expiresAt ? new Date(sub.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </span>
            </div>
            <div>
              <div className="flex justify-between">
                <span className="text-slate-500">Coverage Limit</span>
                <span className="font-semibold">
                  {locations.length} of {sub.locationLimit} Locations Used
                </span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                <div className="h-full rounded-full bg-[#087ed9]" style={{ width: `${locPct}%` }} />
              </div>
            </div>
          </div>
          <p className="mt-5 text-xs font-bold uppercase tracking-wider text-slate-500">Your Covered Locations</p>
          <div className="mt-2 flex flex-wrap gap-2">
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

      {matching && (
        <MatchModal
          mode="lead-to-property"
          lead={matching}
          properties={properties}
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
          <p className="font-semibold">Property Matched! 🎉</p>
          <p className="mt-0.5 text-slate-300">{toast}</p>
        </div>
      )}
    </div>
  );
}
