"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { findPlan, getPayments, getSubscription, type OwnerSubscription, type Payment } from '@/lib/ownerPlan';
import { card, rupees, shortDate } from '../ui';
import { Check, Crown } from 'lucide-react';

export default function OwnerPaymentsPage() {
  const [sub, setSub] = useState<OwnerSubscription | null>(null);
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    setSub(getSubscription());
    setPayments(getPayments());
  }, []);

  if (!sub) return null;
  const plan = findPlan(sub.planId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Plan & Payments</h1>
        <p className="mt-1 text-sm text-slate-500">Your active plan and payment history.</p>
      </div>

      <section className={`${card} flex flex-wrap items-start justify-between gap-6 p-6`}>
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#087ed9]">
            <Crown size={16} /> Active plan
          </div>
          <h2 className="mt-1 text-xl font-bold text-slate-900">{sub.planName}</h2>
          <p className="mt-1 text-sm text-slate-500">
            Started {shortDate(sub.startedAt)} · {sub.expiresAt ? `Expires ${shortDate(sub.expiresAt)}` : 'Valid until deal closed'} · Up to {sub.listingLimit} properties
          </p>
          {plan && (
            <ul className="mt-4 space-y-1.5">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-700">
                  <Check size={15} className="text-green-600" /> {f}
                </li>
              ))}
            </ul>
          )}
        </div>
        <Link href="/owner/plans" className="rounded-xl border border-[#087ed9] px-4 py-2.5 text-sm font-semibold text-[#087ed9] hover:bg-sky-50 transition">
          Change plan
        </Link>
      </section>

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
                <th className="px-6 py-3 text-right font-semibold">Amount</th>
                <th className="px-6 py-3 text-right font-semibold">Invoice</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id}>
                  <td className="px-6 py-3 font-mono text-xs text-slate-600">{p.id}</td>
                  <td className="px-6 py-3 font-semibold text-slate-900">{p.planName}</td>
                  <td className="px-6 py-3 text-slate-600">{shortDate(p.paidAt)}</td>
                  <td className="px-6 py-3 text-slate-600">{p.method}</td>
                  <td className="px-6 py-3 text-right">
                    <span className="font-semibold text-slate-900">{rupees(p.total)}</span>
                    <span className="block text-[11px] text-slate-400">incl. {rupees(p.gst)} GST{p.discount ? ` · ${rupees(p.discount)} off` : ''}</span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <a
                      href={`/invoice/${encodeURIComponent(p.id)}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-[#087ed9] hover:underline"
                    >
                      View / PDF
                    </a>
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
