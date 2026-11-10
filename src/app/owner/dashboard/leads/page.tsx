"use client";

import { useMemo, useState } from 'react';
import {
  activeVisitFor,
  CLOSING_REASONS,
  formatVisit,
  LEAD_STATUS_LABELS,
  LEAD_STATUSES,
  proposeVisit,
  timeAgo,
  updateLeadStatus,
  useOwnerLeads,
  type ClosingReason,
  type LeadStatus,
  type OwnerLead,
} from '@/lib/ownerLeads';
import { errorMessage } from '@/lib/api/client';
import { card } from '../ui';
import { CalendarClock, Loader2, MessageSquareText, Search, X } from 'lucide-react';

const statusTone: Record<LeadStatus, string> = {
  NEW: 'bg-sky-50 text-[#087ed9]',
  CONTACTED: 'bg-violet-50 text-violet-700',
  CLOSED: 'bg-emerald-50 text-emerald-700',
};

// The status select: the backend's statuses, with CLOSED split by the closing
// reason the backend requires.
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: 'NEW', label: 'New' },
  { value: 'CONTACTED', label: 'Contacted' },
  ...CLOSING_REASONS.map((r) => ({ value: `CLOSED:${r}`, label: `Closed · ${r}` })),
];
const optionValue = (l: OwnerLead) =>
  l.status === 'CLOSED' ? `CLOSED:${CLOSING_REASONS.includes(l.closingReason as ClosingReason) ? l.closingReason : 'Not Converted'}` : l.status;

export default function OwnerLeadsPage() {
  const { leads, visits, loading, error, reload, replaceLead, upsertVisit } = useOwnerLeads();
  const [tab, setTab] = useState<'All' | LeadStatus>('All');
  const [query, setQuery] = useState('');
  const [proposing, setProposing] = useState<OwnerLead | null>(null);
  const [when, setWhen] = useState('');
  const [note, setNote] = useState('');
  const [formError, setFormError] = useState('');
  const [sending, setSending] = useState(false);
  const [savingId, setSavingId] = useState<number | null>(null);
  const [rowError, setRowError] = useState<{ id: number; text: string } | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return leads.filter(
      (l) =>
        (tab === 'All' || l.status === tab) &&
        (!q || [l.customerName, l.message, l.propertyTitle, l.locality].join(' ').toLowerCase().includes(q)),
    );
  }, [leads, tab, query]);

  const count = (t: 'All' | LeadStatus) => (t === 'All' ? leads.length : leads.filter((l) => l.status === t).length);

  const changeStatus = async (l: OwnerLead, value: string) => {
    const [status, reason] = value.split(':') as [LeadStatus, ClosingReason | undefined];
    setSavingId(l.id);
    setRowError(null);
    try {
      replaceLead(await updateLeadStatus(l.id, status, reason));
    } catch (e) {
      setRowError({ id: l.id, text: errorMessage(e, 'Could not update this lead. Please try again.') });
    } finally {
      setSavingId(null);
    }
  };

  const openPropose = (l: OwnerLead) => {
    const existing = activeVisitFor(l, visits);
    setProposing(l);
    setWhen('');
    setNote(existing?.note || '');
    setFormError('');
  };

  const submitPropose = async () => {
    if (!proposing || sending) return;
    const date = new Date(when);
    if (!when || isNaN(date.getTime()) || date.getTime() <= Date.now()) return setFormError('Please choose a future date and time.');
    setSending(true);
    setFormError('');
    try {
      upsertVisit(await proposeVisit(proposing, date.toISOString(), note.trim() || undefined, activeVisitFor(proposing, visits)));
      setProposing(null);
    } catch (e) {
      // The visit is only shown once the backend has saved it.
      setFormError(errorMessage(e, 'Could not send the visit proposal. Please try again.'));
    } finally {
      setSending(false);
    }
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
              {t === 'All' ? 'All' : LEAD_STATUS_LABELS[t]} <span className={tab === t ? 'text-sky-100' : 'text-slate-400'}>{loading ? '…' : count(t)}</span>
            </button>
          ))}
        </div>
        <label className="flex h-[53px] items-center gap-2 rounded-[16px] border border-slate-200 bg-white px-4 lg:w-80">
          <Search size={17} className="text-slate-400" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name, message, property…" className="w-full bg-transparent text-sm outline-none" />
        </label>
      </div>

      {loading ? (
        <div className={`${card} flex items-center justify-center gap-2 py-16 text-sm text-slate-500`}>
          <Loader2 size={16} className="animate-spin text-[#087ed9]" /> Loading your leads…
        </div>
      ) : error ? (
        <div className={`${card} py-12 text-center text-sm text-red-700`} role="alert">
          <p>{error}</p>
          <button type="button" onClick={reload} className="mt-3 font-semibold underline cursor-pointer">
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${card} py-16 text-center`}>
          <p className="font-semibold text-slate-900">{tab === 'All' ? 'No Leads Yet' : `No ${LEAD_STATUS_LABELS[tab]} Leads`}</p>
          <p className="mt-1 text-sm text-slate-500">
            {tab === 'All'
              ? 'As soon as prospective buyers or tenants express interest in your listings, their enquiries will appear here.'
              : `There are currently no leads categorized under "${LEAD_STATUS_LABELS[tab]}".`}
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {filtered.map((l) => {
            const visit = activeVisitFor(l, visits);
            const saving = savingId === l.id;
            return (
              <article key={l.id} className={`${card} flex flex-col p-5`}>
                <div className="flex items-start gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-sky-50 font-bold text-[#087ed9]">{l.customerName.charAt(0)}</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{l.customerName}</p>
                    <p className="truncate text-xs text-slate-500">{timeAgo(l.createdAt)}</p>
                  </div>
                  <select
                    value={optionValue(l)}
                    disabled={saving}
                    onChange={(e) => void changeStatus(l, e.target.value)}
                    aria-label="Lead status"
                    className={`cursor-pointer rounded-full px-3 py-1 text-xs font-semibold outline-none disabled:opacity-60 ${statusTone[l.status]}`}
                  >
                    {STATUS_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </div>
                <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
                  Buyer enquiry · {[l.propertyTitle, l.locality].filter(Boolean).join(', ')}
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
                {rowError?.id === l.id && <p className="mt-2 text-xs text-red-600" role="alert">{rowError.text}</p>}
                <div className="mt-auto grid grid-cols-2 gap-3 pt-5">
                  {/* The backend never shares a buyer's phone number with the owner here. */}
                  <span className="inline-flex h-[53px] items-center justify-center rounded-[16px] bg-slate-50 text-xs text-slate-400">Phone unavailable</span>
                  <button
                    type="button"
                    onClick={() => openPropose(l)}
                    disabled={l.status === 'CLOSED' || l.listingRemoved}
                    className="inline-flex h-[53px] cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-[#087ed9] text-sm font-semibold text-white transition hover:bg-sky-600 disabled:cursor-not-allowed disabled:opacity-50"
                  >
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
            <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} maxLength={2000} className="mt-1.5 w-full rounded-[16px] border border-slate-200 px-4 py-3 text-sm outline-none focus:border-[#087ed9]" />
            {formError && <p className="mt-2 text-xs font-semibold text-red-500" role="alert">{formError}</p>}
            <p className="mt-3 text-xs text-slate-400">The buyer can confirm or decline the proposed time.</p>
            <button
              type="button"
              onClick={() => void submitPropose()}
              disabled={sending}
              className="mt-5 inline-flex h-[53px] w-full cursor-pointer items-center justify-center gap-2 rounded-[16px] bg-[#087ed9] text-sm font-semibold text-white hover:bg-sky-600 disabled:opacity-60"
            >
              {sending && <Loader2 size={16} className="animate-spin" />} {sending ? 'Sending…' : 'Send proposal'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
