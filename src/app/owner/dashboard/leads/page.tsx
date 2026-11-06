"use client";

import { useMemo, useState } from 'react';
import { activeVisitFor, formatVisit, LEAD_STATUSES, proposeVisit, timeAgo, updateLeadStatus, useOwnerLeads, type LeadStatus, type OwnerLead } from '@/lib/ownerLeads';
import { card } from '../ui';
import { CalendarClock, MessageSquareText, Phone, Search, X } from 'lucide-react';

const statusTone: Record<LeadStatus, string> = {
  New: 'bg-sky-50 text-[#087ed9]',
  Contacted: 'bg-violet-50 text-violet-700',
  Visit: 'bg-amber-50 text-amber-700',
  Negotiating: 'bg-orange-50 text-orange-700',
  Closed: 'bg-emerald-50 text-emerald-700',
};

export default function OwnerLeadsPage() {
  const { leads, visits } = useOwnerLeads();
  const [tab, setTab] = useState<'All' | LeadStatus>('All');
  const [query, setQuery] = useState('');
  const [proposing, setProposing] = useState<OwnerLead | null>(null);
  const [when, setWhen] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter(
      (l) =>
        (tab === 'All' || l.status === tab) &&
        (!q || [l.customerName, l.phone, l.message, l.propertyTitle].join(' ').toLowerCase().includes(q)),
    );
  }, [leads, tab, query]);

  const count = (t: 'All' | LeadStatus) => (t === 'All' ? leads.length : leads.filter((l) => l.status === t).length);

  const openPropose = (l: OwnerLead) => {
    const existing = activeVisitFor(l.id, visits);
    setProposing(l);
    setWhen(existing ? existing.scheduledAt.slice(0, 16) : '');
    setNote(existing?.note || '');
    setError('');
  };

  const submitPropose = () => {
    if (!proposing) return;
    const date = new Date(when);
    if (!when || isNaN(date.getTime()) || date.getTime() <= Date.now()) return setError('Please choose a future date and time.');
    proposeVisit(proposing, date.toISOString(), note.trim() || undefined);
    setProposing(null);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Buyer Leads</h1>
        <p className="mt-1 text-sm text-slate-500">Everyone who enquired about your properties.</p>
      </div>

      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-2 overflow-x-auto pb-1">
          {(['All', ...LEAD_STATUSES] as const).map((t) => (
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
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, phone, message…" className="w-full bg-transparent text-sm outline-none" />
        </label>
      </div>

      {filtered.length === 0 ? (
        <div className={`${card} py-16 text-center`}>
          <p className="font-semibold text-slate-900">{tab === 'All' ? 'No Leads Yet' : `No ${tab} Leads`}</p>
          <p className="mt-1 text-sm text-slate-500">
            {tab === 'All'
              ? 'As soon as prospective buyers or tenants express interest in your listings, their enquiries will appear here.'
              : `There are currently no leads categorized under "${tab}".`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((l) => {
            const visit = activeVisitFor(l.id, visits);
            return (
              <article key={l.id} className={`${card} flex flex-col p-5`}>
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50 font-bold text-[#087ed9]">{l.customerName.charAt(0)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{l.customerName}</p>
                    <p className="truncate text-xs text-slate-500">
                      {l.phone || 'Phone not provided'} · {timeAgo(l.createdAt)}
                    </p>
                  </div>
                  <select
                    value={l.status}
                    onChange={(e) => updateLeadStatus(l.id, e.target.value as LeadStatus)}
                    aria-label="Lead status"
                    className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold outline-none ${statusTone[l.status]}`}
                  >
                    {LEAD_STATUSES.map((s) => (
                      <option key={s}>{s}</option>
                    ))}
                  </select>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Buyer enquiry · {l.propertyTitle}, {l.locality}
                </p>
                <p className="mt-1.5 text-sm text-slate-700">{l.message || 'No message provided.'}</p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400">
                  <MessageSquareText size={13} /> {l.messageCount} {l.messageCount === 1 ? 'message' : 'messages'}
                </p>
                {visit && (
                  <p className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">
                    <CalendarClock size={14} /> Visit {visit.status.toLowerCase()} · {formatVisit(visit.scheduledAt)}
                  </p>
                )}
                <div className="mt-auto grid grid-cols-2 gap-3 pt-5">
                  {l.phone ? (
                    <a href={`tel:${l.phone.replace(/\s/g, '')}`} className="inline-flex h-[53px] items-center justify-center gap-2 rounded-[16px] bg-slate-100 text-sm font-semibold text-slate-900 transition hover:bg-slate-200">
                      <Phone size={16} /> Call
                    </a>
                  ) : (
                    <span className="inline-flex h-[53px] items-center justify-center rounded-[16px] bg-slate-50 text-xs text-slate-400">Phone unavailable</span>
                  )}
                  <button type="button" onClick={() => openPropose(l)} className="inline-flex h-[53px] cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-[#087ed9] text-sm font-semibold text-white transition hover:bg-sky-600">
                    <CalendarClock size={16} /> {visit ? 'Update Visit' : 'Propose a Visit'}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {proposing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setProposing(null)}>
          <div className="w-full max-w-md rounded-[20px] bg-white p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Propose a Visit</h2>
                <p className="text-sm text-slate-500">{proposing.customerName} · {proposing.propertyTitle}</p>
              </div>
              <button type="button" aria-label="Close" onClick={() => setProposing(null)} className="cursor-pointer rounded-lg p-1 text-slate-400 hover:bg-slate-100">
                <X size={18} />
              </button>
            </div>
            <label className="mt-5 block text-xs font-semibold text-slate-600">Date & time</label>
            <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="mt-1.5 h-[53px] w-full rounded-[16px] border border-slate-200 px-4 text-sm outline-none focus:border-[#087ed9]" />
            <label className="mt-4 block text-xs font-semibold text-slate-600">Note (optional)</label>
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} className="mt-1.5 w-full rounded-[16px] border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#087ed9]" />
            {error && <p className="mt-2 text-xs font-semibold text-red-500">{error}</p>}
            <p className="mt-3 text-xs text-slate-400">The buyer can confirm or decline the proposed time.</p>
            <button type="button" onClick={submitPropose} className="mt-5 inline-flex h-[53px] w-full cursor-pointer items-center justify-center rounded-[16px] bg-[#087ed9] text-sm font-semibold text-white hover:bg-sky-600">
              Send proposal
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
