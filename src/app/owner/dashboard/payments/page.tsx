"use client";

import Link from 'next/link';
import { card } from '../ui';
import { Crown } from 'lucide-react';

// Plans, subscriptions and payments exist only as backend tables today; there
// is no payment API, so nothing here claims a plan was bought or paid for.
export default function OwnerPaymentsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Plan & Payments</h1>
        <p className="mt-1 text-sm text-slate-500">Your plan and payment history.</p>
      </div>

      <section className={`${card} flex flex-wrap items-start justify-between gap-6 p-6`}>
        <div>
          <div className="flex items-center gap-2 text-sm font-semibold text-[#087ed9]">
            <Crown size={16} /> Plans
          </div>
          <h2 className="mt-1 text-xl font-bold text-slate-900">Online plan purchase is not available yet</h2>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            You can list properties without a plan. When paid plans launch, your active plan and receipts will appear here.
          </p>
        </div>
        <Link href="/owner/plans" className="rounded-xl border border-[#087ed9] px-4 py-2.5 text-sm font-semibold text-[#087ed9] hover:bg-sky-50 transition">
          View plans
        </Link>
      </section>

      <section className={`${card} p-6`}>
        <h2 className="font-bold text-slate-900">Payment history</h2>
        <p className="mt-3 text-sm text-slate-500">No payments yet.</p>
      </section>
    </div>
  );
}
