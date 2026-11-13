'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Check, Info, Loader2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getProfile, type Profile } from '@/lib/profile';
import { GST_RATE } from '@/lib/ownerPlan';
import { recordCheckout, useSubscriptionData, normalizePhone } from '@/lib/subscription-store';
import { BILLING_LABEL, type SubscriptionPlan } from '@/types/subscription';

const inr = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const limitText = (n: number | undefined) => (n === undefined || n < 0 ? 'Unlimited shortlist' : `Shortlist up to ${n} properties`);

export default function BuyerPlansPage() {
  const router = useRouter();
  const { ready, plans, subscriptions } = useSubscriptionData();
  const [me, setMe] = useState<Profile | null>(null);
  const [selected, setSelected] = useState<SubscriptionPlan | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => setMe(getProfile()), []);

  const buyerPlans = plans.filter((p) => p.role === 'buyer' && p.status === 'active' && p.visible);
  const current = me
    ? subscriptions.find(
        (s) => s.role === 'buyer' && normalizePhone(s.subscriberPhone) === normalizePhone(me.mobile) && (s.status === 'active' || s.status === 'expiring'),
      )
    : undefined;

  const choose = (p: SubscriptionPlan) => {
    setError('');
    if (!me) {
      router.push('/login?role=buyer&next=/plans');
      return;
    }
    setSelected(p);
  };

  const confirm = () => {
    if (!selected || !me || busy) return;
    setBusy(true);
    try {
      const gst = Math.round(selected.price * GST_RATE);
      recordCheckout({
        role: 'buyer',
        planId: selected.id,
        subscriberName: me.name || 'Buyer',
        subscriberPhone: me.mobile,
        baseAmount: selected.price,
        discount: 0,
        gst,
        total: selected.price + gst,
        method: selected.price === 0 ? 'Free plan' : 'Test checkout',
        transactionRef: `BUY-${normalizePhone(me.mobile)}-${selected.id}-${Date.now()}`,
      });
      setDone(selected.name);
      setSelected(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not activate the plan.');
    } finally {
      setBusy(false);
    }
  };

  const gst = selected ? Math.round(selected.price * GST_RATE) : 0;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50/80 py-10 sm:py-14">
        <div className="container-site mx-auto max-w-5xl px-4">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 sm:text-4xl">Buyer plans</h1>
          <p className="mt-2 max-w-2xl text-slate-600">Save and compare more properties while you search.</p>

          {current && (
            <p className="mt-6 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-slate-700">
              Your current plan: <strong>{current.snapshot.name}</strong>
              {current.expiresAt ? ` · valid until ${new Date(current.expiresAt).toLocaleDateString('en-IN')}` : ''}
            </p>
          )}
          {done && (
            <p className="mt-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {done} is now active. <Link href="/saved" className="font-semibold underline">Go to your shortlist</Link>
            </p>
          )}

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {!ready &&
              [0, 1, 2].map((i) => <div key={i} className="h-72 animate-pulse rounded-3xl border border-slate-200 bg-white" />)}
            {ready && buyerPlans.length === 0 && (
              <p className="col-span-full rounded-2xl border border-slate-200 bg-white p-8 text-center text-slate-500">
                No buyer plans are available right now.
              </p>
            )}
            {buyerPlans.map((p) => {
              const isCurrent = current?.planId === p.id;
              return (
                <div
                  key={p.id}
                  className={`relative flex flex-col rounded-3xl border bg-white p-6 shadow-sm ${
                    p.recommended ? 'border-[#087ed9] ring-1 ring-[#087ed9]' : 'border-slate-200'
                  }`}
                >
                  {p.recommended && (
                    <span className="absolute -top-3 left-6 rounded-full bg-[#087ed9] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                      Recommended
                    </span>
                  )}
                  <h2 className="text-lg font-bold text-slate-900">{p.name}</h2>
                  <p className="mt-1 min-h-10 text-sm text-slate-500">{p.description}</p>
                  <div className="mt-4 text-3xl font-extrabold text-slate-900">
                    {p.price === 0 ? 'Free' : inr(p.price)}
                    {p.price > 0 && <span className="ml-1 text-sm font-medium text-slate-500">+ GST · {BILLING_LABEL[p.billingCycle]}</span>}
                  </div>
                  <ul className="mt-5 flex-1 space-y-2 text-sm text-slate-700">
                    <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[#087ed9]" />{limitText(p.limits.savedPropertyLimit)}</li>
                    <li className="flex gap-2"><Check size={16} className="mt-0.5 shrink-0 text-[#087ed9]" />{p.validityDays ? `Valid for ${p.validityDays} days` : 'No expiry'}</li>
                  </ul>
                  <button
                    type="button"
                    disabled={isCurrent}
                    onClick={() => choose(p)}
                    className="mt-6 rounded-xl bg-[#087ed9] px-4 py-2.5 text-sm font-bold text-white transition hover:bg-[#066db9] disabled:cursor-default disabled:bg-slate-200 disabled:text-slate-500"
                  >
                    {isCurrent ? 'Current plan' : p.price === 0 ? 'Use free plan' : 'Choose plan'}
                  </button>
                </div>
              );
            })}
          </div>

          {selected && (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-slate-900">Confirm {selected.name}</h2>
              <dl className="mt-4 max-w-sm space-y-1.5 text-sm">
                <div className="flex justify-between"><dt className="text-slate-500">Plan price</dt><dd>{inr(selected.price)}</dd></div>
                <div className="flex justify-between"><dt className="text-slate-500">GST (18%)</dt><dd>{inr(gst)}</dd></div>
                <div className="flex justify-between border-t border-slate-100 pt-1.5 font-bold"><dt>Total</dt><dd>{inr(selected.price + gst)}</dd></div>
              </dl>
              {selected.price > 0 && (
                <p className="mt-4 flex gap-2 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
                  <Info size={14} className="mt-0.5 shrink-0" />
                  Test checkout: no payment gateway is connected yet, so no money is charged and the payment is recorded as unverified.
                </p>
              )}
              {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
              <div className="mt-5 flex gap-3">
                <button type="button" onClick={confirm} disabled={busy} className="inline-flex items-center gap-2 rounded-xl bg-[#087ed9] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#066db9] disabled:opacity-60">
                  {busy && <Loader2 size={16} className="animate-spin" />}
                  {selected.price === 0 ? 'Activate' : `Pay ${inr(selected.price + gst)}`}
                </button>
                <button type="button" onClick={() => setSelected(null)} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
