"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { loginHref, useSession } from '@/lib/api/session';
import {
  activatePlan,
  getSubscription,
  ownerPlans,
  priceBreakdown,
  PROMO_CODES,
  type OwnerPlan,
  type OwnerSubscription,
} from '@/lib/ownerPlan';
import { Check, CircleCheck, Crown, CreditCard, Smartphone, Tag, ChevronLeft, ShieldCheck, Lock } from 'lucide-react';

type Stage = 'plans' | 'payment' | 'success';
type Method = 'upi' | 'card';

const upiApps = ['Google Pay', 'PhonePe', 'Paytm'];
const rupees = (n: number) => `₹${n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const card = 'rounded-2xl border border-slate-100 bg-white shadow-[0_12px_45px_-10px_rgba(0,0,0,0.1)]';

export default function OwnerPlansPage() {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>('plans');
  const [category, setCategory] = useState<'Residential' | 'Commercial'>('Residential');
  const [plan, setPlan] = useState<OwnerPlan | null>(null);
  const [current, setCurrent] = useState<OwnerSubscription | null>(null);

  const [promo, setPromo] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoMsg, setPromoMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const [method, setMethod] = useState<Method>('upi');
  const [upiId, setUpiId] = useState('');
  const [cardNo, setCardNo] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [payError, setPayError] = useState('');
  const [paying, setPaying] = useState(false);
  const [result, setResult] = useState<{ sub: OwnerSubscription; paymentId?: string; total: number; method?: string } | null>(null);

  const { session, ready } = useSession();
  useEffect(() => {
    if (ready && !session) router.replace(loginHref('/owner/plans', 'owner'));
    // No plan is ever "current": purchases are not connected to the backend.
    setCurrent(null);
  }, [router, ready, session]);

  const finish = (p: OwnerPlan, payment?: Parameters<typeof activatePlan>[1]) => {
    const saved = activatePlan(p, payment);
    if (!saved) {
      setPayError('Could not save your plan. Please try again.');
      return false;
    }
    setCurrent(saved.sub);
    setResult({ ...saved, total: payment?.total ?? 0, method: payment?.method });
    setStage('success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    return true;
  };

  const choose = (p: OwnerPlan) => {
    if (p.price === 0) {
      // Listing needs no plan today: the free tier simply opens the owner dashboard.
      router.push('/owner/dashboard');
      return;
    }
    setPlan(p);
    setPromo('');
    setDiscount(0);
    setPromoMsg(null);
    setPayError('');
    setStage('payment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const applyPromo = () => {
    const code = promo.trim().toUpperCase();
    if (PROMO_CODES[code]) {
      setDiscount(PROMO_CODES[code]);
      setPromoMsg({ ok: true, text: `Promo code applied successfully! ₹${PROMO_CODES[code]}.00 saved.` });
    } else {
      setDiscount(0);
      setPromoMsg({ ok: false, text: 'Please enter a valid coupon code like RESTAMP or OWNER10.' });
    }
  };

  // Kept for when a payment gateway exists; the Pay button is disabled until then.
  const pay = () => {
    if (!plan) return;
    let methodLabel: string;
    if (method === 'upi') {
      if (!/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) {
        setPayError('Enter a valid UPI ID, e.g. name@okhdfcbank');
        return;
      }
      methodLabel = `UPI · ${upiId.trim()}`;
    } else {
      const digits = cardNo.replace(/\D/g, '');
      if (digits.length < 15) return setPayError('Enter a valid card number');
      if (!cardName.trim()) return setPayError('Enter the name on the card');
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) return setPayError('Enter expiry as MM/YY');
      if (!/^\d{3,4}$/.test(cvv)) return setPayError('Enter a valid CVV');
      methodLabel = `Card · •••• ${digits.slice(-4)}`;
    }
    setPayError('');
    setPaying(true);
    const bill = priceBreakdown(plan, discount);
    // Demo payment: no real gateway is connected yet
    setTimeout(() => {
      setPaying(false);
      finish(plan, { ...bill, promoCode: discount ? promo.trim().toUpperCase() : undefined, method: methodLabel });
    }, 1500);
  };

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-[70vh]">
        <div className="container-site py-10">
          {/* ---------- Choose plan ---------- */}
          {stage === 'plans' && (
            <>
              <p className="eyebrow">Owner Plans</p>
              <h1 className="section-title mt-3">Choose Your Owner Plan</h1>
              <p className="mt-2 text-sm text-slate-500">List flats, villas & commercial properties as an Owner with zero brokerage.</p>

              {current && (
                <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700">
                  <Crown size={16} className="text-[#087ed9]" />
                  Current plan: <span className="font-semibold text-slate-900">{current.planName}</span>
                  <span className="text-slate-500">
                    {current.expiresAt
                      ? `· valid till ${new Date(current.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`
                      : '· until deal closed'}
                  </span>
                </div>
              )}

              <div className="mt-8 inline-flex rounded-lg bg-white p-1 shadow-xs border border-slate-200">
                {(['Residential', 'Commercial'] as const).map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setCategory(c)}
                    className={`rounded-md px-5 py-2 text-sm font-semibold transition cursor-pointer ${
                      category === c ? 'bg-[#087ed9] text-white' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>

              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {ownerPlans[category].map((p) => {
                  const isCurrent = current?.planId === p.id;
                  return (
                    <div
                      key={p.id}
                      className={`relative flex flex-col p-6 ${card} ${p.popular ? 'border-[#087ed9] ring-1 ring-[#087ed9]' : ''}`}
                    >
                      {p.popular && (
                        <span className="absolute -top-3 left-6 rounded-full bg-[#087ed9] px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-white">
                          Most popular
                        </span>
                      )}
                      <h2 className="text-lg font-bold text-slate-900">
                        {p.highlight ? (
                          <>
                            <span className="text-[#087ed9]">{p.highlight}</span> {p.name.replace(p.highlight, '').trim()}
                          </>
                        ) : (
                          p.name
                        )}
                      </h2>
                      <p className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">₹{p.price.toLocaleString('en-IN')}</p>
                      <p className="mt-1 text-sm text-slate-600">{p.priceSub1}</p>
                      <p className="text-xs text-slate-400">{p.priceSub2}</p>

                      <ul className="mt-6 flex-1 space-y-3 border-t border-slate-100 pt-5">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                            <Check size={16} className="mt-0.5 shrink-0 text-[#087ed9]" />
                            {f}
                          </li>
                        ))}
                      </ul>

                      <button
                        type="button"
                        disabled={isCurrent}
                        onClick={() => choose(p)}
                        className={`mt-6 h-[53px] min-w-[200px] rounded-[16px] text-sm font-semibold transition cursor-pointer disabled:cursor-default ${
                          isCurrent
                            ? 'bg-green-50 text-green-700'
                            : p.popular
                              ? 'bg-[#087ed9] text-white hover:bg-sky-600'
                              : 'border border-[#087ed9] text-[#087ed9] hover:bg-sky-50'
                        }`}
                      >
                        {isCurrent ? 'Current plan' : 'Get started'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* ---------- Payment ---------- */}
          {stage === 'payment' && plan && (
            <>
              <button
                type="button"
                onClick={() => setStage('plans')}
                className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-900 cursor-pointer"
              >
                <ChevronLeft size={16} /> Back to plans
              </button>
              <h1 className="section-title mt-3">Confirm Plan</h1>

              <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_380px]">
                <div className="space-y-6">
                  {/* Selected plan */}
                  <div className={`p-6 ${card}`}>
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sky-50 text-[#087ed9]">
                        <Crown size={22} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-slate-900">{plan.name}</p>
                        <p className="text-sm text-slate-500">
                          {plan.validityDays ? `${plan.validityDays} Days` : 'Until deal closed'} • Up to {plan.listingLimit} Listings
                        </p>
                      </div>
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#087ed9] text-white">
                        <Check size={13} strokeWidth={3} />
                      </span>
                    </div>
                    <ul className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                      {['0% Brokerage & direct buyer inquiries', 'Verified Owner badge on search results', 'Site visit scheduling & priority placement'].map(
                        (b) => (
                          <li key={b} className="flex items-center gap-2 text-sm text-slate-600">
                            <CircleCheck size={14} className="text-[#087ed9]" /> {b}
                          </li>
                        )
                      )}
                    </ul>
                  </div>

                  {/* Payment method */}
                  <div className={`p-6 ${card}`}>
                    <h2 className="font-bold text-slate-900">Payment Method</h2>
                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {[
                        { key: 'upi' as const, label: 'UPI', sub: 'Google Pay, PhonePe, Paytm', icon: Smartphone },
                        { key: 'card' as const, label: 'Credit / Debit Card', sub: 'Visa, Mastercard, RuPay', icon: CreditCard },
                      ].map(({ key, label, sub, icon: Icon }) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => {
                            setMethod(key);
                            setPayError('');
                          }}
                          className={`flex items-center gap-3 rounded-xl border p-4 text-left transition cursor-pointer ${
                            method === key ? 'border-[#087ed9] bg-sky-50' : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Icon size={20} className={method === key ? 'text-[#087ed9]' : 'text-slate-400'} />
                          <div>
                            <p className={`text-sm font-semibold ${method === key ? 'text-[#087ed9]' : 'text-slate-900'}`}>{label}</p>
                            <p className="text-xs text-slate-500">{sub}</p>
                          </div>
                        </button>
                      ))}
                    </div>

                    {method === 'upi' ? (
                      <div className="mt-5 space-y-4">
                        <div className="flex flex-wrap gap-2">
                          {upiApps.map((app) => (
                            <span key={app} className="rounded-full border border-slate-200 px-3 py-1 text-xs font-medium text-slate-600">
                              {app}
                            </span>
                          ))}
                        </div>
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">UPI ID / VPA</span>
                          <input
                            value={upiId}
                            onChange={(e) => setUpiId(e.target.value)}
                            placeholder="Enter UPI ID / VPA (e.g. name@okhdfcbank)"
                            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#087ed9]"
                          />
                        </label>
                      </div>
                    ) : (
                      <div className="mt-5 grid gap-4 sm:grid-cols-2">
                        <label className="block sm:col-span-2">
                          <span className="text-sm font-medium text-slate-700">Card Number</span>
                          <input
                            inputMode="numeric"
                            value={cardNo}
                            onChange={(e) =>
                              setCardNo(
                                e.target.value
                                  .replace(/\D/g, '')
                                  .slice(0, 16)
                                  .replace(/(\d{4})(?=\d)/g, '$1 ')
                              )
                            }
                            placeholder="1234 5678 9012 3456"
                            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#087ed9]"
                          />
                        </label>
                        <label className="block sm:col-span-2">
                          <span className="text-sm font-medium text-slate-700">Name on Card</span>
                          <input
                            value={cardName}
                            onChange={(e) => setCardName(e.target.value)}
                            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#087ed9]"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">Expiry</span>
                          <input
                            inputMode="numeric"
                            value={expiry}
                            onChange={(e) => {
                              const d = e.target.value.replace(/\D/g, '').slice(0, 4);
                              setExpiry(d.length > 2 ? `${d.slice(0, 2)}/${d.slice(2)}` : d);
                            }}
                            placeholder="MM/YY"
                            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#087ed9]"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-medium text-slate-700">CVV</span>
                          <input
                            type="password"
                            inputMode="numeric"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                            placeholder="•••"
                            className="mt-1.5 w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[#087ed9]"
                          />
                        </label>
                      </div>
                    )}
                    <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
                      Demo payment — no money is charged. Card details are not saved.
                    </p>
                  </div>
                </div>

                {/* Order summary */}
                <aside className="space-y-4 lg:sticky lg:top-24 lg:self-start">
                  <div className={`p-5 ${card}`}>
                    <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2">
                      <Tag size={16} className="text-slate-400" />
                      <input
                        value={promo}
                        onChange={(e) => {
                          setPromo(e.target.value.toUpperCase());
                          setPromoMsg(null);
                          setDiscount(0);
                        }}
                        placeholder="Enter Promo Code (e.g. RESTAMP)"
                        className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                      />
                      <button
                        type="button"
                        onClick={applyPromo}
                        className={`shrink-0 rounded-full px-3 py-1 text-xs font-semibold transition cursor-pointer ${
                          discount ? 'bg-green-50 text-green-700' : 'bg-sky-50 text-[#087ed9] hover:bg-sky-100'
                        }`}
                      >
                        {discount ? 'Applied' : 'Apply'}
                      </button>
                    </div>
                    {promoMsg && <p className={`mt-2 text-xs ${promoMsg.ok ? 'text-green-600' : 'text-red-500'}`}>{promoMsg.text}</p>}
                  </div>

                  {(() => {
                    const bill = priceBreakdown(plan, discount);
                    return (
                      <div className={`p-5 ${card}`}>
                        <h2 className="font-bold text-slate-900">Order Summary</h2>
                        <dl className="mt-4 space-y-2.5 text-sm">
                          <div className="flex justify-between">
                            <dt className="text-slate-500">Order Amount</dt>
                            <dd className="font-medium text-slate-900">{rupees(bill.amount)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-slate-500">Promo-code</dt>
                            <dd className={bill.discount ? 'font-medium text-green-600' : 'font-medium text-slate-900'}>
                              {bill.discount ? `-${rupees(bill.discount)}` : rupees(0)}
                            </dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-slate-500">GST (18%)</dt>
                            <dd className="font-medium text-slate-900">{rupees(bill.gst)}</dd>
                          </div>
                          <div className="flex justify-between">
                            <dt className="text-slate-500">Listing Limit</dt>
                            <dd className="font-medium text-slate-900">Up to {plan.listingLimit} Properties</dd>
                          </div>
                          <div className="flex justify-between border-t border-slate-100 pt-3 text-base">
                            <dt className="font-bold text-slate-900">Total</dt>
                            <dd className="font-bold text-slate-900">{rupees(bill.total)}</dd>
                          </div>
                        </dl>
                        {payError && <p className="mt-4 text-xs text-red-500">{payError}</p>}
                        <p className="mt-4 rounded-lg bg-amber-50 border border-amber-100 px-3 py-2 text-xs text-amber-900">
                          Online payment is not available yet, so this plan cannot be bought here. You can still{' '}
                          <a href="/owner/dashboard" className="font-semibold underline">list properties for free</a>.
                        </p>
                        <button
                          type="button"
                          onClick={pay}
                          disabled
                          title="Online payment is not available yet"
                          className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-[#087ed9] h-[53px] text-sm font-semibold text-white hover:bg-sky-600 transition disabled:opacity-70 cursor-pointer"
                        >
                          <Lock size={14} />
                          {paying ? 'Processing payment…' : `Pay Now ${rupees(bill.total)}`}
                        </button>
                        <p className="mt-3 flex items-center justify-center gap-1 text-[11px] text-slate-400">
                          <ShieldCheck size={12} /> Secure checkout · RESTAMP Property Owner terms apply
                        </p>
                      </div>
                    );
                  })()}
                </aside>
              </div>
            </>
          )}

          {/* ---------- Success ---------- */}
          {stage === 'success' && result && (
            <div className={`mx-auto max-w-lg p-8 text-center ${card}`}>
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-green-50 text-green-600">
                <CircleCheck size={32} />
              </div>
              <h1 className="mt-5 text-xl font-bold text-slate-900">{result.paymentId ? 'Payment Successful' : 'Plan Activated'}</h1>
              <p className="mt-2 text-sm text-slate-500">
                Your <span className="font-semibold text-slate-900">{result.sub.planName}</span> owner plan is now active.
              </p>
              <dl className="mt-6 space-y-2 rounded-xl bg-slate-50 p-4 text-left text-sm">
                {result.paymentId && (
                  <>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Amount paid</dt>
                      <dd className="font-semibold text-slate-900">{rupees(result.total)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Paid via</dt>
                      <dd className="font-medium text-slate-900">{result.method}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-slate-500">Transaction ID</dt>
                      <dd className="font-mono text-xs text-slate-700">{result.paymentId}</dd>
                    </div>
                  </>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-500">Listing limit</dt>
                  <dd className="font-medium text-slate-900">Up to {result.sub.listingLimit} properties</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Valid till</dt>
                  <dd className="font-medium text-slate-900">
                    {result.sub.expiresAt
                      ? new Date(result.sub.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
                      : 'Until deal closed'}
                  </dd>
                </div>
              </dl>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/owner/dashboard" className="rounded-lg border border-[#087ed9] px-5 py-2.5 text-sm font-semibold text-[#087ed9] hover:bg-sky-50 transition">
                  Go to dashboard
                </Link>
                <Link href="/owner/dashboard/add-property" className="inline-flex items-center justify-center rounded-lg bg-[#087ed9] px-5 h-[53px] text-sm font-semibold text-white hover:bg-sky-600 transition">
                  Post property
                </Link>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
