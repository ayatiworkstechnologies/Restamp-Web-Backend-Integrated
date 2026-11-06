"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Check, Crown, MapPin } from 'lucide-react';
import {
  getAgentPayments,
  getAgentSubscription,
  locationPackages,
  type AgentPaymentRecord,
  type AgentSubscription,
} from '@/lib/agentPlan';
import { agentCard as card } from '../ui';

const rupees = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const statusStyle: Record<AgentPaymentRecord['status'], string> = {
  success: 'bg-green-50 text-green-700',
  pending: 'bg-amber-50 text-amber-700',
  failed: 'bg-red-50 text-red-700',
  cancelled: 'bg-slate-100 text-slate-600',
};

export default function AgentPaymentsPage() {
  const [sub, setSub] = useState<AgentSubscription | null>(null);
  const [payments, setPayments] = useState<AgentPaymentRecord[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setSub(getAgentSubscription());
    setPayments(getAgentPayments());
    setLoaded(true);
  }, []);

  if (!loaded) return null;
  const pkg = sub ? locationPackages.find((p) => p.id === sub.planId) : undefined;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Plan & Payments</h1>
        <p className="mt-1 text-sm text-slate-500">Your active plan and payment history.</p>
      </div>

      {sub ? (
        <section className={`${card} flex flex-wrap items-start justify-between gap-6 p-6`}>
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-[#087ed9]">
              <Crown size={16} /> Active plan
            </div>
            <h2 className="mt-1 text-xl font-bold text-slate-900">{sub.planName}</h2>
            <p className="mt-1 text-sm text-slate-500">
              Started {shortDate(sub.startedAt)} · {sub.expiresAt ? `Expires ${shortDate(sub.expiresAt)}` : 'No expiry'} · {sub.locationLimit} locations
            </p>
            {sub.selectedLocations.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {sub.selectedLocations.map((l) => (
                  <span key={l} className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2.5 py-1 text-xs font-medium text-[#087ed9]">
                    <MapPin size={12} /> {l}
                  </span>
                ))}
              </div>
            )}
            {pkg && (
              <ul className="mt-4 space-y-1.5">
                {pkg.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                    <Check size={15} className="text-green-600" /> {f}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <Link href="/agent/packages" className="rounded-xl border border-[#087ed9] px-4 py-2.5 text-sm font-semibold text-[#087ed9] hover:bg-sky-50 transition">
            Change plan
          </Link>
        </section>
      ) : (
        <section className={`${card} flex flex-wrap items-center justify-between gap-4 p-6`}>
          <div>
            <h2 className="text-lg font-bold text-slate-900">No active plan</h2>
            <p className="mt-1 text-sm text-slate-500">Choose a location package to unlock owner properties and buyer enquiries.</p>
          </div>
          <Link href="/agent/packages" className="rounded-xl bg-[#087ed9] px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition">
            View plans
          </Link>
        </section>
      )}

      <section className={`${card} overflow-x-auto`}>
        <h2 className="px-6 pt-5 font-bold text-slate-900">Payment history</h2>
        {payments.length === 0 ? (
          <p className="px-6 py-8 text-sm text-slate-500">No payments yet.</p>
        ) : (
          <table className="mt-3 w-full min-w-[720px] text-left text-sm">
            <thead className="border-y border-slate-100 bg-slate-50 text-xs uppercase tracking-wide text-slate-400">
              <tr>
                <th className="px-6 py-3 font-semibold">Transaction ID</th>
                <th className="px-6 py-3 font-semibold">Plan</th>
                <th className="px-6 py-3 font-semibold">Date</th>
                <th className="px-6 py-3 font-semibold">Method</th>
                <th className="px-6 py-3 font-semibold">Status</th>
                <th className="px-6 py-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-3 font-mono text-xs text-slate-600">{p.transactionRef || p.id}</td>
                  <td className="px-6 py-3">
                    <span className="font-semibold text-slate-900">{p.packageName}</span>
                    <span className="block text-[11px] text-slate-400">{p.locationsCount} locations</span>
                  </td>
                  <td className="px-6 py-3 text-slate-600">{shortDate(p.paidAt)}</td>
                  <td className="px-6 py-3 text-slate-600">{p.method}</td>
                  <td className="px-6 py-3">
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${statusStyle[p.status]}`}>{p.status}</span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <span className="font-semibold text-slate-900">{rupees(p.total)}</span>
                    <span className="block text-[11px] text-slate-400">incl. {rupees(p.gst)} GST{p.discount ? ` · ${rupees(p.discount)} off` : ''}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
