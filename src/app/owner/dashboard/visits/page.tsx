"use client";

import { useState } from 'react';
import { formatVisit, updateVisitStatus, useOwnerLeads, visitBucket, type OwnerVisit, type VisitStatus } from '@/lib/ownerLeads';
import { errorMessage } from '@/lib/api/client';
import { card } from '../ui';
import { CalendarCheck, Loader2 } from 'lucide-react';

type NextStatus = Exclude<VisitStatus, 'REQUESTED' | 'PROPOSED'>;

const TABS = ['Awaiting', 'Upcoming', 'Completed'] as const;

const tone: Record<VisitStatus, string> = {
  REQUESTED: 'bg-sky-50 text-[#087ed9]',
  PROPOSED: 'bg-violet-50 text-violet-700',
  CONFIRMED: 'bg-amber-50 text-amber-700',
  COMPLETED: 'bg-emerald-50 text-emerald-700',
  DECLINED: 'bg-slate-100 text-slate-500',
  CANCELLED: 'bg-red-50 text-red-600',
};

function actionsFor(v: OwnerVisit): { label: string; next: NextStatus; confirm: string; primary?: boolean }[] {
  if (v.status === 'REQUESTED')
    return [
      { label: 'Decline', next: 'DECLINED', confirm: 'Decline this buyer-requested visit? The buyer can request another time.' },
      { label: 'Confirm', next: 'CONFIRMED', confirm: `Confirm the visit on ${formatVisit(v.scheduledAt)}?`, primary: true },
    ];
  if (v.status === 'PROPOSED') return [{ label: 'Cancel Visit', next: 'CANCELLED', confirm: 'Cancel this site visit?' }];
  if (v.status === 'CONFIRMED')
    return [
      { label: 'Cancel Visit', next: 'CANCELLED', confirm: 'Cancel this site visit?' },
      { label: 'Complete', next: 'COMPLETED', confirm: 'Mark this confirmed visit as completed?', primary: true },
    ];
  return [];
}

export default function OwnerVisitsPage() {
  // Real visits on the owner's properties (GET /owner/visits); actions are
  // saved with PATCH /owner/visits/{id} and shown only after the backend agrees.
  const { visits, loading, error, reload, upsertVisit } = useOwnerLeads();
  const [tab, setTab] = useState<(typeof TABS)[number]>('Awaiting');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<{ id: number; text: string } | null>(null);

  const act = async (v: OwnerVisit, next: NextStatus, question: string) => {
    if (!confirm(question)) return;
    setBusyId(v.id);
    setActionError(null);
    try {
      upsertVisit(await updateVisitStatus(v.id, next));
    } catch (e) {
      setActionError({ id: v.id, text: errorMessage(e, 'Could not update this visit. Please try again.') });
    } finally {
      setBusyId(null);
    }
  };
  const list = visits
    .filter((v) => visitBucket(v) === tab)
    .sort((a, b) => (tab === 'Completed' ? b.scheduledAt.localeCompare(a.scheduledAt) : a.scheduledAt.localeCompare(b.scheduledAt)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Site Visits</h1>
        <p className="mt-1 text-sm text-slate-500">Confirm, complete or cancel buyer visits to your properties.</p>
      </div>

      <div className="inline-flex rounded-[16px] border border-slate-200 bg-white p-1">
        {TABS.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`cursor-pointer rounded-[12px] px-5 py-2.5 text-sm font-semibold transition ${tab === t ? 'bg-[#087ed9] text-white' : 'text-slate-600 hover:text-slate-900'}`}
          >
            {t} <span className={tab === t ? 'text-sky-100' : 'text-slate-400'}>{loading ? '…' : visits.filter((v) => visitBucket(v) === t).length}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className={`${card} flex items-center justify-center gap-2 py-16 text-sm text-slate-500`}>
          <Loader2 size={16} className="animate-spin text-[#087ed9]" /> Loading your visits…
        </div>
      ) : error ? (
        <div className={`${card} py-12 text-center text-sm text-red-700`} role="alert">
          <p>{error}</p>
          <button type="button" onClick={reload} className="mt-3 font-semibold underline cursor-pointer">
            Try again
          </button>
        </div>
      ) : list.length === 0 ? (
        <div className={`${card} py-16 text-center`}>
          <CalendarCheck className="mx-auto text-slate-300" size={32} />
          <p className="mt-3 font-semibold text-slate-900">No {tab.toLowerCase()} visits</p>
          <p className="mt-1 text-sm text-slate-500">Propose a visit from the Leads page to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((v) => (
            <article key={v.id} className={`${card} flex flex-col p-5`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900">{v.customerName}</p>
                  <p className="truncate text-xs text-slate-500">{v.propertyTitle}</p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${tone[v.status]}`}>{v.status}</span>
              </div>
              <p className="mt-4 flex items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5 text-sm font-semibold text-slate-800">
                <CalendarCheck size={16} className="text-[#087ed9]" /> {formatVisit(v.scheduledAt)}
              </p>
              {v.note && <p className="mt-2 text-sm text-slate-600">{v.note}</p>}
              {actionError?.id === v.id && <p className="mt-2 text-xs text-red-600" role="alert">{actionError.text}</p>}
              <div className="mt-auto flex flex-wrap gap-3 pt-5">
                {actionsFor(v).map((a) => (
                  <button
                    key={a.label}
                    type="button"
                    disabled={busyId === v.id}
                    onClick={() => void act(v, a.next, a.confirm)}
                    className={`inline-flex h-[53px] flex-1 cursor-pointer items-center justify-center rounded-[16px] px-4 text-sm font-semibold transition disabled:opacity-60 ${
                      a.primary ? 'bg-[#087ed9] text-white hover:bg-sky-600' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
