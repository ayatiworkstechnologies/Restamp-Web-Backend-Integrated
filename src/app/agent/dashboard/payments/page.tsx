'use client';

/**
 * Agent Plan & Payments dashboard.
 *
 * - Plan section: GET /broker/plan (unchanged source).
 * - Payment history: GET /payments/history — the caller's REAL payment
 *   records (both Razorpay checkouts and earlier simulated purchases are
 *   genuine records of what this account paid). No history is invented or
 *   kept in the browser.
 * - Invoice: GET /payments/{id}/invoice — only SUCCESS payments have one;
 *   the backend derives it from the verified payment and 404s other users'.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertCircle, Crown, FileText, Loader2, MapPin, X } from 'lucide-react';
import { getBrokerPlan, planActive, type BrokerPlan } from '@/lib/api/broker';
import { getPaymentHistory, getInvoice, formatPaise, type PaymentRecord, type InvoiceOut } from '@/lib/api/payments';
import { errorMessage } from '@/lib/api/client';
import { agentCard as card } from '../ui';

const shortDate = (iso: string) => {
  const d = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

const fullDate = (iso: string) => {
  const d = new Date(/[zZ]|[+-]\d\d:\d\d$/.test(iso) ? iso : `${iso}Z`);
  return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

const STATUS_STYLE: Record<PaymentRecord['status'], string> = {
  SUCCESS: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INITIATED: 'bg-amber-50 text-amber-700 border-amber-200',
  FAILED: 'bg-rose-50 text-rose-700 border-rose-200',
};

export default function AgentPaymentsPage() {
  const [plan, setPlan] = useState<BrokerPlan | null>(null);
  const [history, setHistory] = useState<PaymentRecord[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  // Invoice viewer: SUCCESS payments only.
  const [invoiceFor, setInvoiceFor] = useState<PaymentRecord | null>(null);
  const [invoice, setInvoice] = useState<InvoiceOut | null>(null);
  const [invoiceError, setInvoiceError] = useState('');
  const [invoiceLoading, setInvoiceLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    Promise.all([
      getBrokerPlan().catch(() => null),
      getPaymentHistory(),
    ])
      .then(([p, records]) => {
        if (cancelled) return;
        setPlan(p);
        setHistory(records);
      })
      .catch((e) => !cancelled && setError(errorMessage(e, 'Could not load your payments. Please try again.')))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const openInvoice = (record: PaymentRecord) => {
    setInvoiceFor(record);
    setInvoice(null);
    setInvoiceError('');
    setInvoiceLoading(true);
    getInvoice(record.payment_id)
      .then(setInvoice)
      .catch((e) => setInvoiceError(errorMessage(e, 'The invoice could not be loaded. Please try again.')))
      .finally(() => setInvoiceLoading(false));
  };

  const active = planActive(plan);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">Plan &amp; Payments</h1>
        <p className="mt-1 text-sm text-slate-500">Your active plan and payment history.</p>
      </div>

      {loading ? (
        <div className={`${card} flex items-center justify-center gap-2 py-16 text-sm text-slate-500`}>
          <Loader2 size={16} className="animate-spin text-[#087ed9]" /> Loading your payments…
        </div>
      ) : error ? (
        <div className={`${card} py-12 text-center text-sm text-red-700`} role="alert">
          <p>{error}</p>
          <button type="button" onClick={() => setAttempt((a) => a + 1)} className="mt-3 font-semibold underline cursor-pointer">
            Try again
          </button>
        </div>
      ) : (
        <>
          {plan?.has_plan ? (
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
                <p className="mt-1 text-sm text-slate-500">An agent plan unlocks owner properties in your chosen localities.</p>
              </div>
              <Link href="/agent/packages" className="rounded-xl bg-[#087ed9] px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-600 transition">
                View plans
              </Link>
            </section>
          )}

          {/* Real payment history */}
          <section className={`${card} overflow-x-auto`}>
            <h2 className="px-6 pt-5 font-bold text-slate-900">Payment history</h2>
            {history && history.length === 0 ? (
              <p className="px-6 py-8 text-sm text-slate-500">
                No payments yet. When you buy an agent plan, every payment is recorded here.
              </p>
            ) : (
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="border-b border-slate-100 text-left text-xs uppercase tracking-wide text-slate-400">
                    <th className="px-6 py-3 font-semibold">Date</th>
                    <th className="px-3 py-3 font-semibold">Plan</th>
                    <th className="px-3 py-3 font-semibold">Amount</th>
                    <th className="px-3 py-3 font-semibold">Status</th>
                    <th className="px-6 py-3 text-right font-semibold">Invoice</th>
                  </tr>
                </thead>
                <tbody>
                  {(history ?? []).map((record) => (
                    <tr key={record.payment_id} className="border-b border-slate-50 last:border-0">
                      <td className="px-6 py-3.5 text-slate-600">{shortDate(record.paid_at || record.created_at || '')}</td>
                      <td className="px-3 py-3.5 font-semibold text-slate-900">{record.plan_name || '—'}</td>
                      <td className="px-3 py-3.5 text-slate-900">{formatPaise(record.amount_paise)}</td>
                      <td className="px-3 py-3.5">
                        <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${STATUS_STYLE[record.status]}`}>
                          {record.status === 'INITIATED' ? 'Payment pending' : record.status === 'FAILED' ? 'Failed' : 'Paid'}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        {record.status === 'SUCCESS' ? (
                          <button
                            type="button"
                            onClick={() => openInvoice(record)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:border-[#087ed9]/40 hover:text-[#087ed9] transition cursor-pointer"
                          >
                            <FileText size={13} /> View invoice
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">After payment succeeds</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>
        </>
      )}

      {/* Invoice modal (SUCCESS payments only — backend-derived) */}
      {invoiceFor && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setInvoiceFor(null)}
        >
          <div
            className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900">Invoice</h3>
                {invoice && <p className="mt-0.5 font-mono text-xs text-slate-500">{invoice.invoice_number}</p>}
              </div>
              <button
                type="button"
                onClick={() => setInvoiceFor(null)}
                aria-label="Close invoice"
                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {invoiceLoading ? (
              <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-500">
                <Loader2 size={16} className="animate-spin text-[#087ed9]" /> Loading invoice…
              </div>
            ) : invoiceError ? (
              <div className="mt-4 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{invoiceError}</span>
              </div>
            ) : invoice ? (
              <div className="mt-4 space-y-4 text-sm">
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Issued</span>
                    <span className="font-semibold text-slate-900">{fullDate(invoice.issued_at)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Billed to</span>
                    <span className="font-semibold text-slate-900">{invoice.buyer.name || `User #${invoice.buyer.user_id}`}</span>
                  </div>
                  {invoice.buyer.email && (
                    <div className="flex justify-between">
                      <span className="text-slate-500">Email</span>
                      <span className="font-semibold text-slate-900">{invoice.buyer.email}</span>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-slate-100 p-4">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Plan</span>
                    <span className="font-semibold text-slate-900">{invoice.plan.name || '—'}</span>
                  </div>
                  {invoice.plan.description && (
                    <p className="mt-1 text-xs text-slate-500">{invoice.plan.description}</p>
                  )}
                  <div className="mt-3 flex justify-between border-t border-slate-100 pt-3">
                    <span className="text-slate-500">Payment</span>
                    <span className="font-mono text-xs font-semibold text-slate-900">
                      {invoice.payment.provider}
                      {invoice.payment.provider_payment_id ? ` · ${invoice.payment.provider_payment_id}` : ''}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3">
                    <span className="font-bold text-slate-900">Total</span>
                    <span className="text-lg font-extrabold text-slate-900">{formatPaise(invoice.amount_paise)}</span>
                  </div>
                </div>

                <p className="text-[11px] leading-relaxed text-slate-400">
                  {invoice.note}
                  {invoice.seller.support ? ` Questions? ${invoice.seller.support}` : ''}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
