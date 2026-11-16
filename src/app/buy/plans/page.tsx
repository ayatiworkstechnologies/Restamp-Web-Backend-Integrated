"use client";

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getSession, loginHref, useSession } from '@/lib/api/session';
import { getBuyerPlanStatus, isBuyerPlanRequired, listBuyerPlans, type BuyerPlanCard, type BuyerPlanStatus } from '@/lib/api/buyer';
import {
  createCheckout,
  formatPaise,
  getPaymentConfig,
  loadRazorpay,
  openRazorpayCheckout,
  verifyPayment,
} from '@/lib/api/payments';
import { errorMessage, isApiError } from '@/lib/api/client';
import {
  AlertCircle,
  ArrowRight,
  Check,
  CheckCircle2,
  Crown,
  Loader2,
  Lock,
  ShieldCheck,
} from 'lucide-react';

type Stage = 'plans' | 'processing' | 'success';

/**
 * RESTAMP buyer plans (lead quota), bought through the backend's real
 * payment flow: the amount comes from the server, Razorpay's hosted checkout
 * collects the payment, and the signature is verified by the backend before
 * a plan is activated. With the provider unconfigured the page stays open
 * and says so plainly — nothing is ever simulated.
 */
export default function BuyerPlansPage() {
  const router = useRouter();
  const { session, ready } = useSession();

  const [plans, setPlans] = useState<BuyerPlanCard[] | null>(null);
  const [status, setStatus] = useState<BuyerPlanStatus | null>(null);
  const [provider, setProvider] = useState<'razorpay' | 'none' | null>(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);

  const [stage, setStage] = useState<Stage>('plans');
  const [payError, setPayError] = useState('');
  const [pendingCode, setPendingCode] = useState<string | null>(null);
  const [result, setResult] = useState<{ planName: string; amount: string; paymentId: string; activated: boolean } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadError('');
    Promise.all([listBuyerPlans(), getPaymentConfig()])
      .then(([items, config]) => {
        if (cancelled) return;
        setPlans(items);
        setProvider(config.provider);
      })
      .catch((e) => !cancelled && setLoadError(errorMessage(e, 'Could not load the plans. Please try again.')));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  useEffect(() => {
    if (!ready || !session) return;
    let cancelled = false;
    getBuyerPlanStatus()
      .then((s) => !cancelled && setStatus(s))
      .catch(() => undefined); // quota status is a nice-to-have; buying still works
    return () => {
      cancelled = true;
    };
  }, [ready, session, stage]);

  const buy = useCallback(
    async (plan: BuyerPlanCard) => {
      if (plan.is_free) return; // the free tier needs no purchase
      if (!getSession()) {
        router.push(loginHref('/buy/plans', 'buyer'));
        return;
      }
      setPendingCode(plan.code);
      setPayError('');
      setStage('processing');
      try {
        const checkout = await createCheckout('buyer', plan.code);
        const scriptReady = await loadRazorpay();
        if (!scriptReady) {
          throw new Error('The payment window could not be loaded. Check your connection and try again.');
        }
        const response = await openRazorpayCheckout({
          keyId: checkout.razorpay_key_id,
          orderId: checkout.razorpay_order_id,
          amountPaise: checkout.amount_paise,
          currency: checkout.currency,
          name: 'RESTAMP',
          description: plan.name,
          prefillName: session && !/^(\+?\d{10,15})$/.test(session.displayName.trim()) ? session.displayName : null,
        });
        // The backend verifies Razorpay's signature server-side before the
        // plan is activated — this page's success screen only reflects it.
        const verified = await verifyPayment(
          response.razorpay_order_id,
          response.razorpay_payment_id,
          response.razorpay_signature
        );
        setResult({
          planName: verified.plan_name || plan.name,
          amount: formatPaise(checkout.amount_paise),
          paymentId: verified.transaction_id || String(verified.payment_id),
          activated: verified.activated,
        });
        setStage('success');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch (e) {
        const message =
          e instanceof Error && e.message === 'dismissed'
            ? 'The payment window was closed before the payment was completed. Nothing has been charged to your plan.'
            : e instanceof Error && e.message === 'unavailable'
            ? 'The payment window could not be opened. Check your connection and try again.'
            : isBuyerPlanRequired(e)
            ? 'This payment is not needed for the current plan.'
            : errorMessage(e, 'The payment could not be completed. Please try again.');
        setPayError(message);
        setStage('plans');
      } finally {
        setPendingCode(null);
      }
    },
    [router, session]
  );

  const currentPlanCode = status && !status.is_free && (status.leads_remaining === null || status.leads_remaining > 0) ? status.plan_code : null;

  return (
    <>
      <Header />
      <main className="bg-slate-50 min-h-[70vh]">
        <div className="container-site py-10">
          {stage === 'success' && result ? (
            <div className="max-w-xl mx-auto text-center py-10">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
                <CheckCircle2 size={34} className="text-emerald-600" />
              </div>
              <h1 className="section-title mt-5">
                {result.activated ? 'Your plan is active' : 'Payment received'}
              </h1>
              <p className="mt-2 text-sm text-slate-600">
                {result.activated
                  ? `${result.planName} (${result.amount}) is now active on your account.`
                  : `${result.planName} (${result.amount}) was paid and confirmed by the payment provider. Activation is completed by the backend shortly — if it does not reflect, contact support.`}
              </p>
              <p className="mt-1 text-xs text-slate-400 font-mono">Payment reference: {result.paymentId}</p>
              <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
                <Link
                  href="/buy"
                  className="inline-flex items-center gap-2 rounded-xl bg-[#087ed9] hover:bg-sky-600 text-white text-sm font-semibold px-6 h-[46px] transition"
                >
                  Continue browsing properties <ArrowRight size={15} />
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setStage('plans');
                    setAttempt((n) => n + 1);
                  }}
                  className="rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-sm font-semibold px-6 h-[46px] transition cursor-pointer"
                >
                  Back to plans
                </button>
              </div>
            </div>
          ) : (
            <>
              <p className="eyebrow">Buyer Plans</p>
              <h1 className="section-title mt-3">Reveal More Owner Numbers</h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-500">
                Every RESTAMP account starts free: reveal up to 3 distinct owner numbers in a rolling 30-day
                window. A paid plan raises that quota.
              </p>

              {status && (
                <div className="mt-6 flex flex-wrap items-center gap-3 rounded-xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-slate-700">
                  <Crown size={16} className="text-[#087ed9]" />
                  Current plan: <span className="font-semibold text-slate-900">{status.plan_name}</span>
                  <span className="text-slate-500">
                    · {status.leads_used} of {status.lead_limit === null ? 'unlimited' : status.lead_limit} leads used
                    {status.valid_until ? ` · valid till ${new Date(/Z|[+-]\d\d:\d\d$/.test(status.valid_until) ? status.valid_until : `${status.valid_until}Z`).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}` : ''}
                  </span>
                </div>
              )}

              {loadError ? (
                <div className="mt-8 flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                  <AlertCircle size={16} />
                  <span>{loadError}</span>
                  <button
                    type="button"
                    onClick={() => setAttempt((n) => n + 1)}
                    className="ml-auto text-xs font-bold text-rose-800 hover:underline cursor-pointer"
                  >
                    Retry
                  </button>
                </div>
              ) : !plans ? (
                <div className="mt-10 flex items-center justify-center gap-2 py-16 text-sm text-slate-500">
                  <Loader2 size={16} className="animate-spin text-[#087ed9]" /> Loading plans…
                </div>
              ) : (
                <>
                  {provider === 'none' && (
                    <div className="mt-6 flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>
                        Online payments are not available yet, so paid plans cannot be bought right now. Your free
                        quota keeps working — nothing is charged or simulated here.
                      </span>
                    </div>
                  )}

                  <div className="mt-8 grid gap-6 md:grid-cols-3 items-stretch">
                    {plans.map((plan) => {
                      const isCurrent = plan.code === currentPlanCode;
                      const isFree = plan.is_free;
                      const buying = pendingCode === plan.code;
                      return (
                        <div
                          key={plan.code}
                          className={`flex flex-col rounded-2xl border bg-white p-6 shadow-[0_12px_45px_-10px_rgba(0,0,0,0.1)] ${
                            isFree ? 'border-slate-100' : 'border-[#087ed9]/30'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <h2 className="text-lg font-bold text-slate-900">{plan.name}</h2>
                            {isFree ? (
                              <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600">
                                Included
                              </span>
                            ) : (
                              <span className="rounded-full bg-sky-50 px-2.5 py-0.5 text-[11px] font-bold text-[#087ed9]">
                                {plan.duration_days} days
                              </span>
                            )}
                          </div>
                          <div className="mt-4 flex items-baseline gap-1">
                            <span className="text-3xl font-extrabold tracking-tight text-slate-900">
                              {isFree ? 'Free' : formatPaise(plan.price_paise)}
                            </span>
                            {!isFree && <span className="text-xs text-slate-400">/ {plan.duration_days} days</span>}
                          </div>
                          <ul className="mt-5 space-y-2.5 text-sm text-slate-600 flex-1">
                            <li className="flex items-start gap-2">
                              <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                              <span>
                                {plan.lead_limit === null
                                  ? 'Unlimited owner-number reveals'
                                  : `Up to ${plan.lead_limit} distinct owner-number reveals`}
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                              <span>
                                {isFree
                                  ? `${plan.leads_label} (rolling 30-day window)`
                                  : `${plan.leads_label} · validity from activation`}
                              </span>
                            </li>
                            <li className="flex items-start gap-2">
                              <Check size={16} className="mt-0.5 shrink-0 text-emerald-600" />
                              <span>Re-revealing a property you already opened stays free</span>
                            </li>
                          </ul>
                          <button
                            type="button"
                            disabled={isFree || provider === 'none' || buying || Boolean(pendingCode)}
                            onClick={() => void buy(plan)}
                            title={
                              isFree
                                ? 'Every account starts free — no purchase needed'
                                : provider === 'none'
                                ? 'Online payment is not available yet'
                                : undefined
                            }
                            className={`mt-6 flex h-[53px] w-full items-center justify-center gap-2 rounded-[16px] text-sm font-semibold transition cursor-pointer ${
                              isCurrent
                                ? 'bg-slate-900 text-white hover:bg-black'
                                : isFree || provider === 'none'
                                ? 'bg-slate-100 text-slate-500 cursor-not-allowed'
                                : 'bg-[#087ed9] text-white hover:bg-sky-600'
                            } disabled:opacity-70`}
                          >
                            {buying ? (
                              <>
                                <Loader2 size={15} className="animate-spin" /> Opening payment window…
                              </>
                            ) : isCurrent ? (
                              <>
                                <CheckCircle2 size={15} /> Your current plan
                              </>
                            ) : isFree ? (
                              'Included free'
                            ) : (
                              <>
                                <Lock size={14} /> Buy with {formatPaise(plan.price_paise)}
                              </>
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>

                  {payError && (
                    <div className="mt-6 flex items-start gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                      <AlertCircle size={16} className="mt-0.5 shrink-0" />
                      <span>{payError}</span>
                    </div>
                  )}

                  <p className="mt-8 flex items-center gap-2 text-xs text-slate-400">
                    <ShieldCheck size={14} />
                    Payments are processed by Razorpay. Your plan activates only after the payment is verified by
                    the RESTAMP server — never by this page alone.
                  </p>
                </>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
