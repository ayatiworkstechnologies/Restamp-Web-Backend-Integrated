"use client";

import { useEffect, useMemo, useState } from 'react';
import { getAgentCatalogProperties, type AgentPropertyItem } from '@/lib/agent-data';
import { AGENT_LEAD_STATUSES, isFollowUp, timeAgo, updateAgentLead, useAgentLeads, type AgentLead, type AgentLeadStatus } from '@/lib/agentLeads';
import MatchModal from '@/components/agent/MatchModal';
import { agentCard } from '../ui';
import { CalendarClock, CheckCircle2, MessageCircle, Phone, Search } from 'lucide-react';

const VIEWS = ['All Leads', 'Follow-ups', 'Visits'] as const;

const tone: Record<AgentLeadStatus, string> = {
  New: 'bg-sky-50 text-[#087ed9]',
  Contacted: 'bg-violet-50 text-violet-700',
  'Visit Scheduled': 'bg-amber-50 text-amber-700',
  Negotiating: 'bg-orange-50 text-orange-700',
  Closed: 'bg-emerald-50 text-emerald-700',
};

export default function AgentLeadsPage() {
  const { leads } = useAgentLeads();
  const [properties, setProperties] = useState<AgentPropertyItem[]>([]);
  const [view, setView] = useState<(typeof VIEWS)[number]>('All Leads');
  const [status, setStatus] = useState<'All' | AgentLeadStatus>('All');
  const [query, setQuery] = useState('');
  const [matching, setMatching] = useState<AgentLead | null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => setProperties(getAgentCatalogProperties()), []);

  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter((l) => {
      if (view === 'Follow-ups' && !isFollowUp(l)) return false;
      if (view === 'Visits' && l.status !== 'Visit Scheduled') return false;
      if (status !== 'All' && l.status !== status) return false;
      if (q && ![l.customerName, l.requirement, l.preferredLocality].join(' ').toLowerCase().includes(q)) return false;
      return true;
    });
  }, [leads, view, status, query]);

  const viewCount = (v: (typeof VIEWS)[number]) =>
    v === 'All Leads' ? leads.length : v === 'Follow-ups' ? leads.filter(isFollowUp).length : leads.filter((l) => l.status === 'Visit Scheduled').length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Leads</h1>
        <p className="mt-1 text-sm text-slate-500">Manage your customer enquiries.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {VIEWS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setView(v)}
            className={`cursor-pointer rounded-[16px] border p-5 text-left transition ${view === v ? 'border-[#087ed9] bg-sky-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
          >
            <p className="text-2xl font-extrabold text-slate-900">{viewCount(v)}</p>
            <p className={`text-sm font-semibold ${view === v ? 'text-[#087ed9]' : 'text-slate-500'}`}>{v}</p>
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['All', ...AGENT_LEAD_STATUSES] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setStatus(s)}
              className={`shrink-0 cursor-pointer rounded-full px-4 py-2 text-sm font-semibold transition ${
                status === s ? 'bg-[#087ed9] text-white' : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <label className="flex h-[53px] items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-4 lg:w-96">
          <Search size={17} className="text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search leads by name, locality, or requirement..." className="w-full bg-transparent text-sm outline-none" />
        </label>
      </div>

      {shown.length === 0 ? (
        <div className={`${agentCard} py-16 text-center`}>
          <p className="font-semibold text-slate-900">No leads here yet.</p>
          <p className="mt-1 text-sm text-slate-500">Leads from interested buyers in your localities will appear here.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {shown.map((l) => {
            const digits = l.phone.replace(/[^0-9]/g, '');
            return (
              <article key={l.id} className={`${agentCard} flex flex-col p-5`}>
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50 font-bold text-[#087ed9]">{l.customerName.charAt(0)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-900">{l.customerName}</p>
                    <p className="truncate text-xs text-slate-500">{l.phone || 'No phone on file'} · {timeAgo(l.createdAt)}</p>
                  </div>
                  <select
                    value={l.status}
                    onChange={(e) => updateAgentLead(l.id, { status: e.target.value as AgentLeadStatus })}
                    aria-label="Lead status"
                    className={`max-w-[120px] cursor-pointer rounded-full px-3 py-1 text-xs font-semibold outline-none ${tone[l.status]}`}
                  >
                    {AGENT_LEAD_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <dl className="mt-4 space-y-1.5 rounded-[14px] bg-slate-50 p-3 text-xs">
                  <div className="flex gap-2"><dt className="w-28 shrink-0 text-slate-400">Requirement:</dt><dd className="font-semibold text-slate-800">{l.requirement}</dd></div>
                  <div className="flex gap-2"><dt className="w-28 shrink-0 text-slate-400">Purpose:</dt><dd className="font-semibold text-slate-800">{l.purpose}</dd></div>
                  <div className="flex gap-2"><dt className="w-28 shrink-0 text-slate-400">Preferred Location:</dt><dd className="font-semibold text-slate-800">{l.preferredLocality}</dd></div>
                  <div className="flex gap-2"><dt className="w-28 shrink-0 text-slate-400">Budget:</dt><dd className="font-semibold text-slate-800">{l.budget}</dd></div>
                </dl>

                {l.matchedPropertyTitle && (
                  <p className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <CheckCircle2 size={14} /> Matched: {l.matchedPropertyTitle}
                  </p>
                )}
                {l.visitAt && l.status === 'Visit Scheduled' && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-amber-700">
                    <CalendarClock size={14} /> Visit · {new Date(l.visitAt).toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })}
                  </p>
                )}

                <div className="mt-auto flex gap-2 pt-5">
                  {digits ? (
                    <>
                      <a href={`tel:${digits}`} aria-label={`Call ${l.customerName}`} className="inline-flex h-[53px] w-[53px] shrink-0 items-center justify-center rounded-[16px] bg-slate-100 text-slate-900 hover:bg-slate-200">
                        <Phone size={17} />
                      </a>
                      <a href={`https://wa.me/${digits}`} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${l.customerName}`} className="inline-flex h-[53px] w-[53px] shrink-0 items-center justify-center rounded-[16px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100">
                        <MessageCircle size={17} />
                      </a>
                    </>
                  ) : null}
                  <button type="button" onClick={() => setMatching(l)} className="inline-flex h-[53px] flex-1 cursor-pointer items-center justify-center rounded-[16px] bg-[#087ed9] px-4 text-sm font-semibold text-white hover:bg-sky-600">
                    {l.matchedPropertyTitle ? 'Change Match' : 'Match Property'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

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
