"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Crown, Loader2, MapPin } from 'lucide-react';
import { getBrokerPlan, planActive, type BrokerPlan } from '@/lib/api/broker';
import { errorMessage } from '@/lib/api/client';
import { agentCard as card } from '../ui';

const shortDate = (iso: string) => {
  const d = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

// The agent's real plan (GET /broker/plan). Online payment is not connected
// and the backend has no payment-history endpoint for agents, so no payments
// are listed (none are ever invented or kept in the browser).
export default function AgentPaymentsPage() {
  const [plan, setPlan] = useState<BrokerPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    getBrokerPlan()
      .then((p) => !cancelled && setPlan(p))
      .catch((e) => !cancelled && setError(errorMessage(e, 'Could not load your agent plan.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const active = planActive(plan);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Plan & Payments</h1>
        <p className="mt-1 text-sm text-slate-500">Your active plan and payment history.</p>
      </div>

      {loading ? (
        <div className={`${card} flex items-center justify-center gap-2 py-16 text-sm text-slate-500`}>
          <Loader2 size={16} className="animate-spin text-[#087ed9]" /> Loading your plan…
        </div>
      ) : error ? (
        <div className={`${card} py-12 text-center text-sm text-red-700`} role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setAttempt((a) => a + 1)} className="mt-3 font-semibold underline cursor-pointer">
            Try again
          </button>
        </div>
      ) : plan?.has_plan ? (
        <section className={`${card} flex flex-wrap items-start justify-between gap-6 p-6`}>
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#087ed9]">
              <Crown size={16} /> {active ? 'Active plan' : 'Expired plan'}
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{plan.plan_name}</h2>
            <p className="mt-1 text-sm text-slate-500">
              {plan.start_date ? `Started ${shortDate(plan.start_date)} · ` : ''}
              {plan.valid_until ? `${active ? 'Expires' : 'Expired'} ${shortDate(plan.valid_until)}` : 'No end date'}
              {plan.locality_limit != null ? ` · ${plan.locality_limit} locations` : ''}
            </p>
            {(plan.localities || []).length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(plan.localities || []).map((l) => (
                  <span key={l} className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-[#087ed9]">
                    <MapPin size={12} /> {l}
                  </span>
                ))}
              </div>
            )}
          </div>
          <Link href="/agent/packages" className="rounded-xl border border-[#087ed9] px-4 py-2.5 text-sm font-semibold text-[#087ed9] hover:bg-sky-50 transition">
            View plans
          </Link>
        </section>
      ) : (
        <section className={`${card} flex flex-wrap items-center justify-between gap-4 p-6`}>
          <div>
            <h2 className="text-lg font-bold text-slate-900">No active plan</h2>
            <p className="mt-1 text-sm text-slate-500">An agent plan unlocks owner properties in your chosen locations. Online plan purchase is not available yet.</p>
          </div>
          <Link href="/agent/packages" className="rounded-xl bg-[#087ed9] px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition">
            View plans
          </Link>
        </section>
      )}

      <section className={`${card} overflow-x-auto`}>
        <h2 className="px-6 pt-5 font-bold text-slate-900">Payment history</h2>
        <p className="px-6 py-8 text-sm text-slate-500">Online payments are not available yet, so there is no payment history to show.</p>
      </section>
    </div>
  );
}
