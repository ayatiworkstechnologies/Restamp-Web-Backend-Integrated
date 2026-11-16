'use client';

/**
 * Agent plan payment — the real Razorpay flow through the backend.
 *
 * The order comes from POST /payments/checkout (amount decided by the
 * server), Razorpay's hosted window collects the payment, and POST
 * /payments/verify checks the signature server-side BEFORE the plan is
 * activated. This page never activates anything from a click: with the
 * provider unconfigured the button is disabled and says so; when activation
 * lags the payment (paid first, webhook later) the success screen says
 * "activation pending" instead of claiming a plan that is not active yet.
 *
 * There are no discount codes or added-fee rows here —
 * the backend sells each plan for its price, full stop.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { loginHref, useSession } from '@/lib/api/session';
import { listAgentPlans, type AgentPlanCard } from '@/lib/api/broker';
import {
  createCheckout,
  formatPaise,
  getPaymentConfig,
  loadRazorpay,
  openRazorpayCheckout,
  verifyPayment,
} from '@/lib/api/payments';
import { ApiError, errorMessage, isApiError } from '@/lib/api/client';
import { clearAgentCheckoutDraft, getAgentCheckoutDraft } from '@/lib/agentCheckout';
import {
  AlertCircle,
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock,
  Loader2,
  Lock,
  MapPin,
  ShieldCheck,
} from 'lucide-react';

type Stage = 'summary' | 'processing' | 'success';
type Result = { planName: string; amount: string; reference: string; activated: boolean; localities: number };

/** The backend's detail strings are user-facing by design; prefer them so a
 * 503 ("not configured yet") or 409 ("already recorded") reads exactly right. */
function payErrorMessage(e: unknown, fallback: string): string {
  if (e instanceof ApiError && e.detail) return e.detail;
  return errorMessage(e, fallback);
}

export default function AgentPaymentPage() {
  const router = useRouter();
  const { session, ready } = useSession();

  const [plans, setPlans] = useState<AgentPlanCard[] | null>(null);
  const [provider, setProvider] = useState<'razorpay' | 'none' | null>(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);

  const [stage, setStage] = useState<Stage>('summary');
  const [payError, setPayError] = useState('');
  const [choiceWarnings, setChoiceWarnings] = useState<string[]>([]);
  const [result, setResult] = useState<Result | null>(null);

  // The draft (plan code + localities) written by /agent/packages.
  const [draft, setDraft] = useState<{ plan_code: string; localities: string[] } | null>(null);

  // Signed-in agents only: the checkout order belongs to an account.
  useEffect(() => {
    if (ready && !session) router.replace(loginHref('/agent/payment', 'agent'));
  }, [ready, session, router]);

  // Read the draft after mount (sessionStorage is browser-only).
  useEffect(() => {
    const d = getAgentCheckoutDraft();
    setDraft(d ? { plan_code: d.plan_code, localities: d.localities } : null);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadError('');
    Promise.all([listAgentPlans(), getPaymentConfig()])
      .then(([items, config]) => {
        if (cancelled) return;
        setPlans(items);
        setProvider(config.provider);
      })
      .catch((e) => !cancelled && setLoadError(errorMessage(e, 'Could not load the payment details. Please try again.')));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  const plan = useMemo(
    () => (draft && plans ? plans.find((p) => p.code === draft.plan_code) ?? null : null),
    [draft, plans]
  );

  const pay = async () => {
    if (!plan || !draft) return;
    setPayError('');
    setChoiceWarnings([]);
    setStage('processing');
    try {
      const checkout = await createCheckout('agent', plan.code, draft.localities);
      // The server validated the locality choice at checkout; if any chosen
      // locality could not be covered, stop and let the agent fix it BEFORE
      // any money moves.
      const warnings: string[] = [];
      if (checkout.unmatched_localities?.length) {
        warnings.push(
          `Not in the coverage catalogue (excluded): ${checkout.unmatched_localities.join(', ')}`
        );
      }
      if (checkout.unavailable_localities?.length) {
        warnings.push(
          `Currently not serviceable (excluded): ${checkout.unavailable_localities.join(', ')}`
        );
      }
      if (warnings.length) {
        setChoiceWarnings(warnings);
        setStage('summary');
        return;
      }

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
      });
      // Verified by the backend (signature + order re-fetch) before anything
      // is activated — this screen only reflects the verification result.
      const verified = await verifyPayment(
        response.razorpay_order_id,
        response.razorpay_payment_id,
        response.razorpay_signature
      );
      setResult({
        planName: verified.plan_name || plan.name,
        amount: formatPaise(verified.amount_paise ?? checkout.amount_paise),
        reference: verified.transaction_id || String(verified.payment_id),
        activated: verified.activated,
        localities: draft.localities.length,
      });
      clearAgentCheckoutDraft();
      setStage('success');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      const message =
        e instanceof Error && e.message === 'dismissed'
          ? 'The payment window was closed before the payment was completed. Nothing has been charged and no plan was activated.'
          : e instanceof Error && e.message === 'unavailable'
          ? 'The payment window could not be opened. Check your connection and try again.'
          : payErrorMessage(e, 'The payment could not be completed. Please try again.');
      setPayError(message);
      setStage('summary');
    }
  };

  // --- Waiting for the session/draft/catalogue -------------------------------

  if (!ready || !session || !draft || (!plans && !loadError)) {
    return (
      <>
        <Header />
        <main className="min-h-[70vh] bg-slate-50/80 flex items-center justify-center">
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <Loader2 size={16} className="animate-spin text-[#087ed9]" /> Preparing your payment…
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const paid = stage === 'success' && result;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50/80 py-8 sm:py-12 md:py-14 text-slate-900">
        <div className="container-site max-w-6xl mx-auto space-y-8">
          {/* Step Progress Bar */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>1. Agent Verification</span>
            </span>
            <span className="text-slate-300">&rarr;</span>
            <span className="flex items-center gap-1.5 text-emerald-600">
              <CheckCircle2 size={16} className="text-emerald-500" />
              <span>2. Plan &amp; Localities</span>
            </span>
            <span className="text-slate-300">&rarr;</span>
            <span
              className={`flex items-center gap-1.5 ${
                paid ? 'text-emerald-600' : 'text-[#087ed9] bg-sky-50 px-3 py-1 rounded-full border border-sky-200'
              }`}
            >
              {paid ? (
                <CheckCircle2 size={16} className="text-emerald-500" />
              ) : (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#087ed9] text-white text-[11px]">
                  3
                </span>
              )}
              <span>3. Payment Confirmation</span>
            </span>
            <span className="text-slate-300">&rarr;</span>
            <span
              className={`flex items-center gap-1.5 ${
                paid ? 'text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200' : 'text-slate-400'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  paid ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}
              >
                4
              </span>
              <span>4. Agent Portal</span>
            </span>
          </div>

          {/* SUCCESS */}
          {paid ? (
            <div className="max-w-4xl mx-auto bg-white rounded-[32px] sm:rounded-[36px] shadow-2xl shadow-slate-200/80 border border-slate-100 p-6 sm:p-9 lg:p-10 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 items-stretch">
                <div className="md:col-span-6 flex flex-col justify-between items-center text-center px-2 sm:px-4 py-2">
                  <div className="w-full flex flex-col items-center">
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-full bg-emerald-100/70 flex items-center justify-center shadow-inner">
                        <div className="w-14 h-14 sm:w-14 sm:h-14 rounded-full bg-[#10b981] flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                          <Check className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[3.2]" />
                        </div>
                      </div>
                    </div>

                    <span
                      className={`text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full border mb-3 inline-flex items-center gap-1.5 ${
                        result!.activated
                          ? 'text-emerald-700 bg-emerald-50 border-emerald-200/80'
                          : 'text-amber-700 bg-amber-50 border-amber-200/80'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          result!.activated ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500 animate-pulse'
                        }`}
                      />
                      {result!.activated ? 'Payment Verified & Active' : 'Payment Verified · Activation Pending'}
                    </span>

                    <h2 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight leading-snug">
                      {result!.activated ? 'Welcome to Restamp Agent Hub!' : 'Payment received'}
                    </h2>

                    <p className="text-xs sm:text-sm text-slate-500 mt-2.5 max-w-xs mx-auto leading-relaxed">
                      {result!.activated
                        ? `Your ${result!.planName} subscription is now active on your account.`
                        : `${result!.planName} was paid and confirmed by the payment provider. Activation is completed by the backend shortly — if it does not reflect in your dashboard, contact support.`}
                    </p>
                  </div>

                  <div className="w-full max-w-xs space-y-3 mt-8">
                    <Link
                      href="/agent/dashboard"
                      className="w-full py-3.5 px-6 rounded-2xl bg-[#005f3e] hover:bg-[#004e33] text-white font-bold text-sm tracking-wide transition duration-150 shadow-md shadow-emerald-950/10 flex items-center justify-center gap-2"
                    >
                      <span>Open Agent Console</span>
                      <ArrowRight size={16} />
                    </Link>
                    <Link
                      href="/agent/dashboard/payments"
                      className="w-full py-3.5 px-6 rounded-2xl bg-[#f3f4f6] hover:bg-slate-200/80 text-slate-700 font-semibold text-sm transition duration-150 flex items-center justify-center"
                    >
                      <span>View Payment History</span>
                    </Link>
                    <div className="pt-2 text-[11px] sm:text-xs text-slate-400 flex items-center justify-center gap-1.5">
                      <Clock size={13} className="text-slate-400" />
                      <span>
                        A signed Razorpay webhook can also complete activation if the browser closed early.
                      </span>
                    </div>
                  </div>
                </div>

                <div className="md:col-span-6 bg-[#f8f9fa] rounded-[24px] sm:rounded-[28px] p-6 sm:p-7 border border-slate-200/60 flex flex-col justify-between relative text-left">
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mb-4">
                      Payment Summary
                    </h3>

                    <div className="space-y-3.5 mb-5">
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                          Plan
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 block">
                          {result!.planName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                          Covered Localities
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 block">
                          {result!.localities} selected at checkout
                        </span>
                      </div>
                    </div>

                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between text-xs py-1">
                        <span className="text-slate-500">Payment reference:</span>
                        <span className="font-mono font-bold text-slate-800 text-[11px] sm:text-xs">
                          {result!.reference}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1">
                        <span className="text-slate-500">Verification:</span>
                        <span className="font-semibold text-emerald-700 text-[11px] sm:text-xs">
                          Signature verified by RESTAMP backend
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-slate-200/80 flex flex-col items-end text-right">
                    <span className="text-xs font-semibold text-[#059669] tracking-wider uppercase">Amount Paid</span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#059669] tracking-tight mt-0.5">
                      {result!.amount}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">No extra fees added by Restamp</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Heading */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <Link
                    href="/agent/packages"
                    className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#087ed9] transition mb-2"
                  >
                    <ArrowLeft size={14} /> Back to Plan Selection
                  </Link>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                    Secure Plan Payment
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-500 mt-1">
                    Pay for your chosen plan and localities — activation happens after the backend verifies the
                    payment.
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full self-start sm:self-auto">
                  <ShieldCheck size={16} className="text-emerald-600" />
                  <span>Razorpay secured · verified by Restamp</span>
                </div>
              </div>

              {loadError ? (
                <div className="flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
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
              ) : !plan ? (
                <div className="rounded-[32px] bg-white p-8 border border-slate-200 shadow-sm text-center space-y-3">
                  <AlertCircle size={28} className="mx-auto text-slate-300" />
                  <h2 className="text-lg font-extrabold text-slate-900">No plan is selected yet</h2>
                  <p className="text-xs sm:text-sm text-slate-500 max-w-sm mx-auto">
                    Pick a plan and your localities first — this page takes the payment for that exact choice.
                  </p>
                  <Link
                    href="/agent/packages"
                    className="inline-flex items-center gap-2 rounded-2xl bg-[#087ed9] hover:bg-sky-600 text-white text-sm font-bold px-6 h-[48px] transition"
                  >
                    Choose a plan <ArrowRight size={15} />
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  {/* LEFT 7 COLS: PAYMENT */}
                  <div className="lg:col-span-7 bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                    <div>
                      <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                        Pay with Razorpay
                      </h2>
                      <p className="text-xs text-slate-500 mt-0.5">
                        The amount is set by Restamp&apos;s backend for your plan. Razorpay&apos;s hosted window
                        handles the payment; Restamp verifies it before activating anything.
                      </p>
                    </div>

                    {provider === 'none' && (
                      <div className="flex items-start gap-2.5 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 animate-fadeIn">
                        <AlertCircle size={16} className="mt-0.5 text-amber-600 shrink-0" />
                        <span>
                          <strong className="font-bold">Online payments are not configured yet.</strong> Nothing can
                          be charged from this page and no plan is activated. Please try again later.
                        </span>
                      </div>
                    )}

                    {choiceWarnings.length > 0 && (
                      <div className="flex items-start gap-2.5 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 animate-fadeIn">
                        <AlertTriangle size={16} className="mt-0.5 text-amber-600 shrink-0" />
                        <div className="space-y-1.5">
                          {choiceWarnings.map((w) => (
                            <p key={w}>{w}</p>
                          ))}
                          <Link href="/agent/packages" className="block font-bold underline">
                            Edit your localities before paying
                          </Link>
                        </div>
                      </div>
                    )}

                    {payError && (
                      <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-rose-800 animate-fadeIn">
                        <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                        <span>{payError}</span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => void pay()}
                      disabled={stage === 'processing' || provider !== 'razorpay'}
                      title={
                        provider === 'none' ? 'Online payment is not configured yet' : undefined
                      }
                      className="w-full h-[53px] rounded-2xl bg-[#087ed9] hover:bg-sky-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-extrabold text-sm transition shadow-lg hover:shadow-sky-500/25 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {stage === 'processing' ? (
                        <div className="flex items-center gap-2">
                          <Loader2 size={16} className="animate-spin" />
                          <span>Opening the payment window…</span>
                        </div>
                      ) : (
                        <>
                          <Lock size={16} />
                          <span>Pay {formatPaise(plan.price_paise)} securely</span>
                        </>
                      )}
                    </button>

                    <p className="text-[11px] text-center text-slate-400">
                      Closing the payment window charges nothing. Restamp never sees or stores your card details.
                    </p>
                  </div>

                  {/* RIGHT 5 COLS: ORDER SUMMARY */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white rounded-[32px] p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
                      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                        <h3 className="text-base font-extrabold text-slate-900 tracking-tight">Order Summary</h3>
                        <span className="text-xs font-bold text-[#087ed9] bg-sky-50 px-2.5 py-0.5 rounded-full">
                          {plan.duration_days} days
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xl font-black text-slate-900">{plan.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          Up to {plan.locality_limit} localities • {plan.duration_days} days validity
                        </p>
                      </div>

                      <div>
                        <div className="flex items-center justify-between text-xs mb-2">
                          <span className="font-bold text-slate-700">Chosen Localities ({draft.localities.length}):</span>
                          <Link href="/agent/packages" className="text-[#087ed9] font-bold hover:underline">
                            Edit
                          </Link>
                        </div>
                        <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto pr-1">
                          {draft.localities.map((loc) => (
                            <span
                              key={loc}
                              className="inline-flex items-center gap-1 text-[11px] font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg"
                            >
                              <MapPin size={10} className="text-[#087ed9]" />
                              <span>{loc}</span>
                            </span>
                          ))}
                        </div>
                      </div>

                      <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                        <div className="flex justify-between text-slate-600">
                          <span>Plan subscription:</span>
                          <span className="font-semibold text-slate-900">{formatPaise(plan.price_paise)}</span>
                        </div>
                        <div className="pt-2 border-t border-slate-200 flex justify-between text-sm sm:text-base font-black text-slate-900">
                          <span>Total payable:</span>
                          <span className="text-[#087ed9]">{formatPaise(plan.price_paise)}</span>
                        </div>
                        <p className="text-[10.5px] text-slate-400">
                          The backend charges exactly the plan price — no added fees. Your localities are recorded
                          on the order and re-verified at activation.
                        </p>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 text-xs space-y-1.5 text-sky-950">
                      <p className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 size={14} className="text-[#087ed9]" />
                        <span>What happens after you pay</span>
                      </p>
                      <p className="text-[11px] text-sky-800 leading-relaxed">
                        Restamp&apos;s backend verifies the payment signature and order amount, then activates your
                        plan and coverage. If activation is briefly delayed, your payment stays recorded and can be
                        completed from your dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
