'use client';

/**
 * Agent plan purchase — Step 1 (choose plan) + Step 2 (choose localities).
 *
 * Everything shown comes from the backend's REAL catalogues:
 * - GET /broker/plans           purchasable agent plans (price, duration, locality limit)
 * - GET /broker/locality-catalog localities an agent may cover (name + pincodes)
 * - GET /payments/config        whether online payment is actually available
 *
 * Nothing is invented: the backend sells each plan for its price with no
 * added fees, and the locality list is the live catalogue — no demand
 * scores, region labels or monthly math. The choice is stored as a draft
 * keyed to the real plan code and handed to /agent/payment for the Razorpay
 * flow.
 */
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getSession, loginHref } from '@/lib/api/session';
import { listAgentPlans, listAgentLocalities, type AgentPlanCard, type AgentLocality } from '@/lib/api/broker';
import { getPaymentConfig, formatPaise } from '@/lib/api/payments';
import { errorMessage } from '@/lib/api/client';
import { saveAgentCheckoutDraft, getAgentCheckoutDraft } from '@/lib/agentCheckout';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  MapPin,
  Search,
  X,
} from 'lucide-react';

/** Map legacy deep-links (?pkg=loc-5 from the marketing cards, or an app id)
 * onto the real plan. Unknown values are ignored (the agent picks manually). */
function planFromParam(param: string | null, plans: AgentPlanCard[]): AgentPlanCard | null {
  if (!param) return null;
  const direct = plans.find((p) => p.code === param || p.app_id === param);
  if (direct) return direct;
  const locMatch = /^loc-(\d+)$/.exec(param);
  if (locMatch) {
    const limit = Number(locMatch[1]);
    return plans.find((p) => p.locality_limit === limit) ?? null;
  }
  return null;
}

export default function AgentPackagesPage() {
  const router = useRouter();

  // Wizard sub-step: 1 = Choose Plan, 2 = Choose Localities
  const [step, setStep] = useState<1 | 2>(1);

  const [plans, setPlans] = useState<AgentPlanCard[] | null>(null);
  const [localities, setLocalities] = useState<AgentLocality[] | null>(null);
  const [provider, setProvider] = useState<'razorpay' | 'none' | null>(null);
  const [loadError, setLoadError] = useState('');
  const [attempt, setAttempt] = useState(0);

  const [selectedPlan, setSelectedPlan] = useState<AgentPlanCard | null>(null);
  const [selectedLocalities, setSelectedLocalities] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [limitWarning, setLimitWarning] = useState<string | null>(null);

  // Load the real catalogues (public endpoints: the agent picks before login).
  useEffect(() => {
    let cancelled = false;
    setLoadError('');
    Promise.all([listAgentPlans(), listAgentLocalities(), getPaymentConfig()])
      .then(([planItems, locItems, config]) => {
        if (cancelled) return;
        const sorted = [...planItems].sort((a, b) => a.locality_limit - b.locality_limit);
        setPlans(sorted);
        setLocalities(locItems);
        setProvider(config.provider);
        setSelectedPlan((current) => current ?? sorted[0] ?? null);
      })
      .catch((e) => !cancelled && setLoadError(errorMessage(e, 'Could not load the plans. Please try again.')));
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  // Restore a draft (or honor ?pkg= deep link) once the plans arrive.
  useEffect(() => {
    if (!plans) return;
    const params = new URLSearchParams(window.location.search);
    const fromUrl = planFromParam(params.get('pkg'), plans);
    const draft = getAgentCheckoutDraft();
    const fromDraft = draft ? plans.find((p) => p.code === draft.plan_code) ?? null : null;
    if (fromUrl || fromDraft) {
      setSelectedPlan(fromUrl ?? fromDraft);
      if (fromUrl) setStep(2);
    }
    if (draft?.localities?.length) {
      setSelectedLocalities(draft.localities);
    }
  }, [plans]);

  const planLimit = selectedPlan?.locality_limit ?? 0;

  const filteredLocalities = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return localities ?? [];
    return (localities ?? []).filter(
      (loc) => loc.name.toLowerCase().includes(q) || loc.pincodes.some((pin) => pin.includes(q))
    );
  }, [localities, searchQuery]);

  const goToStep2 = (plan: AgentPlanCard) => {
    setSelectedPlan(plan);
    // Trim the selection if the newly chosen plan covers fewer localities.
    setSelectedLocalities((current) => current.slice(0, plan.locality_limit));
    setLimitWarning(null);
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const changePlanInStep2 = (plan: AgentPlanCard) => {
    setSelectedPlan(plan);
    if (selectedLocalities.length > plan.locality_limit) {
      setSelectedLocalities(selectedLocalities.slice(0, plan.locality_limit));
      setLimitWarning(`Selection adjusted to ${plan.locality_limit} localities for ${plan.name}.`);
    } else {
      setLimitWarning(null);
    }
  };

  const toggleLocality = (name: string) => {
    setLimitWarning(null);
    if (selectedLocalities.includes(name)) {
      setSelectedLocalities(selectedLocalities.filter((l) => l !== name));
      return;
    }
    if (selectedLocalities.length >= planLimit) {
      const nextPlan =
        plans && selectedPlan
          ? [...plans].sort((a, b) => a.locality_limit - b.locality_limit).find((p) => p.locality_limit > planLimit)
          : undefined;
      setLimitWarning(
        nextPlan
          ? `You have reached the ${planLimit}-locality limit. Upgrade to ${nextPlan.name} (${nextPlan.locality_limit} localities) to add more.`
          : `Maximum ${planLimit} localities allowed for this plan. Deselect one to add this.`
      );
      return;
    }
    setSelectedLocalities([...selectedLocalities, name]);
  };

  const handleContinueToPayment = () => {
    if (!selectedPlan || selectedLocalities.length === 0) {
      setLimitWarning('Please select at least 1 locality to continue.');
      return;
    }
    saveAgentCheckoutDraft({
      plan_code: selectedPlan.code,
      localities: selectedLocalities,
      updatedAt: new Date().toISOString(),
    });
    if (!getSession()) {
      router.push(loginHref('/agent/payment', 'agent'));
      return;
    }
    router.push('/agent/payment');
  };

  return (
    <>
      <Header />
      <main className="min-h-screen bg-slate-50/70 py-8 sm:py-12 md:py-14 text-slate-900">
        <div className="container-site max-w-7xl mx-auto space-y-10">
          {/* Top Master Breadcrumbs Indicator */}
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs font-medium text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-600 font-semibold">
              <CheckCircle2 size={15} className="text-emerald-500" />
              <span>1. Verification</span>
            </span>
            <span className="text-slate-300">/</span>
            <button
              type="button"
              onClick={() => {
                setStep(1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition cursor-pointer ${
                step === 1
                  ? 'bg-sky-50 text-[#087ed9] border-sky-300 font-bold'
                  : 'bg-white text-emerald-600 border-emerald-200 font-semibold'
              }`}
            >
              {step === 2 ? (
                <CheckCircle2 size={13} className="text-emerald-500" />
              ) : (
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#087ed9] text-white text-[10px] font-bold">
                  2
                </span>
              )}
              <span>Plan: {selectedPlan?.name ?? '—'}</span>
            </button>
            <span className="text-slate-300">/</span>
            <span
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition ${
                step === 2
                  ? 'bg-sky-50 text-[#087ed9] border-sky-300 font-bold shadow-2xs'
                  : 'bg-slate-100 text-slate-400 border-slate-200'
              }`}
            >
              <span
                className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${
                  step === 2 ? 'bg-[#087ed9] text-white' : 'bg-slate-300 text-slate-700'
                }`}
              >
                3
              </span>
              <span>Choose Localities</span>
            </span>
            <span className="text-slate-300">/</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold">
                4
              </span>
              <span>Payment</span>
            </span>
            <span className="text-slate-300">/</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-slate-200 text-slate-500 text-[10px] font-bold">
                5
              </span>
              <span>Portal</span>
            </span>
          </div>

          {loadError ? (
            <div className="mx-auto max-w-xl flex items-center gap-2 rounded-xl border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
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
          ) : !plans || !localities ? (
            <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-500">
              <Loader2 size={16} className="animate-spin text-[#087ed9]" /> Loading agent plans…
            </div>
          ) : (
            <>
              {provider === 'none' && (
                <div className="flex items-start gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>
                    Online payments are not available yet, so plans cannot be bought right now. You can still
                    choose a plan and localities — nothing is charged or simulated here.
                  </span>
                </div>
              )}

              {/* ================================================================= */}
              {/* SUB-STEP 1: CHOOSE PLAN TIER                                      */}
              {/* ================================================================= */}
              {step === 1 && (
                <div className="space-y-8 animate-fadeIn">
                  <div className="text-center max-w-3xl mx-auto space-y-3">
                    <span className="inline-block px-3 py-1 rounded-full bg-sky-100/70 text-xs font-bold text-[#087ed9] uppercase tracking-wider">
                      Step 1 of 2: Select Plan
                    </span>
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-[1.15]">
                      Choose Your <span className="text-[#087ed9]">Agent Plan</span>
                    </h1>
                    <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                      Pick how many Chennai localities you want to cover. In the next step, you handpick the
                      exact localities from the live catalogue.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 items-stretch pt-2">
                    {plans.map((plan, idx) => {
                      const isFeatured = plans.length === 3 && idx === 1;
                      const isSelected = selectedPlan?.code === plan.code;
                      return (
                        <div
                          key={plan.code}
                          onClick={() => setSelectedPlan(plan)}
                          className={`relative rounded-[32px] sm:rounded-[36px] bg-white p-7 sm:p-9 flex flex-col justify-between transition-all duration-300 cursor-pointer ${
                            isFeatured
                              ? 'border border-slate-200/80 shadow-xl shadow-slate-300/40 overflow-hidden'
                              : 'border border-slate-200/80 shadow-sm hover:shadow-xl hover:shadow-slate-200/40'
                          } ${isSelected ? 'ring-2 ring-slate-900' : ''}`}
                        >
                          {isFeatured && (
                            <div
                              className="absolute -top-12 -left-12 -right-12 h-64 pointer-events-none rounded-t-[36px] overflow-hidden opacity-90"
                              style={{
                                background:
                                  'radial-gradient(ellipse at 50% 28%, rgba(147, 197, 253, 0.55) 0%, rgba(254, 215, 170, 0.6) 45%, rgba(251, 207, 232, 0.4) 75%, transparent 100%)',
                                filter: 'blur(36px)',
                              }}
                            />
                          )}

                          <div>
                            <div className="flex items-center justify-between relative z-10">
                              <span
                                className={`text-xl font-bold tracking-tight ${
                                  isFeatured
                                    ? 'bg-gradient-to-r from-sky-600 via-amber-600 to-rose-600 bg-clip-text text-transparent'
                                    : 'text-slate-900'
                                }`}
                              >
                                {plan.name}
                              </span>
                              {isFeatured && (
                                <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
                                  Popular
                                </span>
                              )}
                            </div>

                            <div className="mt-4 flex items-baseline gap-3 relative z-10">
                              <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                                {formatPaise(plan.price_paise)}
                              </span>
                              <div className="text-[11px] leading-tight font-medium">
                                <span className={`block font-bold ${isFeatured ? 'text-slate-900' : 'text-slate-700'}`}>
                                  / {plan.duration_days} days access
                                </span>
                                <span className="block text-slate-400">
                                  {plan.locality_limit} localities
                                </span>
                              </div>
                            </div>

                            <div className="mt-6 relative z-10">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  goToStep2(plan);
                                }}
                                className={`w-full py-4 px-6 rounded-2xl font-bold text-sm tracking-wide transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer ${
                                  isFeatured
                                    ? 'bg-[#18181b] hover:bg-black text-white shadow-md shadow-slate-900/10'
                                    : 'bg-[#f4f4f5] hover:bg-[#e4e4e7] text-slate-900'
                                }`}
                              >
                                <span>Choose {plan.locality_limit} Localities</span>
                                <ArrowRight size={15} />
                              </button>
                            </div>

                            <div className="mt-8 pt-7 border-t border-slate-100 relative z-10" />

                            <div className="space-y-3.5 relative z-10">
                              {[
                                `${plan.locality_limit} chosen Chennai localities`,
                                `${plan.duration_days} days of coverage from activation`,
                                'Direct buyer enquiries inside your covered localities',
                                'Agent dashboard with your live coverage list',
                                '0% brokerage — you keep your full commission',
                              ].map((feature) => (
                                <div
                                  key={feature}
                                  className={`flex items-start gap-3 text-sm leading-snug ${
                                    isFeatured ? 'text-slate-800 font-medium' : 'text-slate-600'
                                  }`}
                                >
                                  <Check
                                    size={16}
                                    strokeWidth={isFeatured ? 2.5 : 2.2}
                                    className={`shrink-0 mt-0.5 ${isFeatured ? 'text-[#087ed9]' : 'text-slate-900'}`}
                                  />
                                  <span>{feature}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="pt-8 mt-8 border-t border-slate-100 relative z-10">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                goToStep2(plan);
                              }}
                              className="text-xs text-slate-400 hover:text-slate-700 font-medium transition inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Handpick your localities</span>
                              <span className="text-[#087ed9] font-semibold">&rarr;</span>
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="bg-slate-900 rounded-3xl p-5 sm:p-6 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-bold text-sky-400 uppercase tracking-wider block">
                        Selected Plan
                      </span>
                      <p className="text-lg font-black text-white">
                        {selectedPlan?.name ?? '—'} • {selectedPlan ? formatPaise(selectedPlan.price_paise) : '—'}
                      </p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Covers {selectedPlan?.locality_limit ?? 0} localities for {selectedPlan?.duration_days ?? 0}{' '}
                        days
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => selectedPlan && goToStep2(selectedPlan)}
                      className="w-full sm:w-auto px-7 h-[53px] rounded-2xl bg-[#087ed9] hover:bg-sky-500 text-white text-sm font-extrabold transition shadow-lg hover:shadow-sky-500/25 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <span>Continue to Step 2: Choose {selectedPlan?.locality_limit ?? 0} Localities</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* ================================================================= */}
              {/* SUB-STEP 2: CHOOSE LOCALITIES                                     */}
              {/* ================================================================= */}
              {step === 2 && selectedPlan && (
                <div className="space-y-6 animate-fadeIn">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setStep(1);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      className="inline-flex items-center gap-1.5 font-bold text-slate-600 hover:text-slate-900 transition cursor-pointer"
                    >
                      <ArrowLeft size={15} />
                      <span>Change Plan</span>
                    </button>

                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 font-medium">Plan:</span>
                      <span className="font-extrabold text-slate-900">
                        {selectedPlan.name} ({formatPaise(selectedPlan.price_paise)})
                      </span>
                      <div className="flex items-center gap-1 p-1 bg-[#f4f4f5] rounded-full border border-slate-200/80">
                        {plans.map((p) => (
                          <button
                            key={p.code}
                            type="button"
                            onClick={() => changePlanInStep2(p)}
                            className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all duration-200 cursor-pointer ${
                              selectedPlan.code === p.code
                                ? 'bg-[#18181b] text-white shadow-xs'
                                : 'text-slate-600 hover:text-slate-900'
                            }`}
                          >
                            {p.locality_limit} Loc
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-[32px] sm:rounded-[36px] p-7 sm:p-9 border border-slate-200/80 shadow-xs space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-100">
                      <div>
                        <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                          Choose Your {planLimit} Localities
                        </h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                          Select the areas where you hold listings to receive direct buyer enquiries.
                        </p>
                      </div>

                      <div className="flex items-center gap-3 self-start sm:self-auto bg-[#f4f4f5] px-4 py-2.5 rounded-2xl border border-slate-200/80">
                        <span className="text-xs text-slate-600 font-medium">
                          Slots:{' '}
                          <strong className="text-slate-900 font-black">
                            <span className="text-slate-900">{selectedLocalities.length}</span> of {planLimit}
                          </strong>
                        </span>
                        <div className="w-20 bg-slate-200 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-slate-900 transition-all duration-300 rounded-full"
                            style={{ width: `${Math.min(100, (selectedLocalities.length / planLimit) * 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>

                    {limitWarning && (
                      <div className="flex items-center justify-between gap-3 p-3.5 bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl text-xs font-semibold animate-fadeIn">
                        <div className="flex items-center gap-2">
                          <AlertCircle size={15} className="text-amber-600 shrink-0" />
                          <span>{limitWarning}</span>
                        </div>
                        {plans &&
                          selectedPlan &&
                          [...plans]
                            .sort((a, b) => a.locality_limit - b.locality_limit)
                            .some((p) => p.locality_limit > planLimit) && (
                            <button
                              type="button"
                              onClick={() => {
                                const next = [...plans]
                                  .sort((a, b) => a.locality_limit - b.locality_limit)
                                  .find((p) => p.locality_limit > planLimit);
                                if (next) changePlanInStep2(next);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-[11px] font-bold transition shrink-0 cursor-pointer"
                            >
                              Upgrade &rarr;
                            </button>
                          )}
                      </div>
                    )}

                    <div className="relative max-w-sm">
                      <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search locality or pincode…"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 bg-[#f4f4f5]/60 focus:bg-white focus:border-slate-900 outline-none transition font-medium"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                      {filteredLocalities.map((loc) => {
                        const isSelected = selectedLocalities.includes(loc.name);
                        const isMaxReached = !isSelected && selectedLocalities.length >= planLimit;
                        return (
                          <div
                            key={loc.locality_id}
                            onClick={() => toggleLocality(loc.name)}
                            className={`p-4 rounded-2xl border transition-all duration-200 cursor-pointer select-none flex items-center justify-between gap-3 ${
                              isSelected
                                ? 'border-slate-900 bg-slate-50/90 shadow-md shadow-slate-900/5 ring-2 ring-slate-900'
                                : isMaxReached
                                ? 'border-slate-200/60 bg-white opacity-40 hover:opacity-80'
                                : 'border-slate-200 bg-white hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5'
                            }`}
                          >
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-slate-900 truncate tracking-tight">{loc.name}</h4>
                              <p className="text-xs text-slate-500 mt-0.5 truncate">
                                {loc.pincodes.length} pincode{loc.pincodes.length === 1 ? '' : 's'} •{' '}
                                {loc.pincodes[0]}
                                {loc.pincodes.length > 1 ? '…' : ''}
                              </p>
                            </div>
                            <div
                              className={`h-5 w-5 rounded-full border flex items-center justify-center shrink-0 transition-all duration-200 ${
                                isSelected ? 'border-[#18181b] bg-[#18181b] text-white shadow-xs' : 'border-slate-300 bg-white'
                              }`}
                            >
                              {isSelected && <Check size={12} strokeWidth={2.8} />}
                            </div>
                          </div>
                        );
                      })}
                      {filteredLocalities.length === 0 && (
                        <p className="col-span-full py-8 text-center text-xs text-slate-400">
                          No localities match “{searchQuery}”. Try a pincode number.
                        </p>
                      )}
                    </div>

                    {selectedLocalities.length > 0 && (
                      <div className="pt-4 border-t border-slate-100 space-y-2.5">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-slate-800">
                            Selected ({selectedLocalities.length}/{planLimit}):
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedLocalities([])}
                            className="text-rose-600 hover:underline font-semibold cursor-pointer"
                          >
                            Clear all
                          </button>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedLocalities.map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 border border-slate-200/80 text-xs font-bold text-slate-800"
                            >
                              <MapPin size={11} className="text-[#087ed9]" />
                              <span>{name}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedLocalities(selectedLocalities.filter((l) => l !== name));
                                }}
                                className="hover:text-rose-600 transition ml-0.5 cursor-pointer"
                              >
                                <X size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="sticky bottom-4 z-30 bg-[#18181b]/95 backdrop-blur-xl text-white rounded-[28px] p-5 sm:p-6 shadow-2xl border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-4 sm:gap-8">
                      <div>
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Plan
                        </span>
                        <span className="text-sm sm:text-base font-extrabold text-white">{selectedPlan.name}</span>
                      </div>
                      <div className="border-l border-white/15 pl-4 sm:pl-8">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Localities
                        </span>
                        <span
                          className={`text-sm sm:text-base font-extrabold ${
                            selectedLocalities.length === planLimit ? 'text-emerald-400' : 'text-white'
                          }`}
                        >
                          {selectedLocalities.length} of {planLimit} Selected
                        </span>
                      </div>
                      <div className="border-l border-white/15 pl-4 sm:pl-8">
                        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                          Amount
                        </span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-xl sm:text-2xl font-black text-[#38bdf8] tracking-tight">
                            {formatPaise(selectedPlan.price_paise)}
                          </span>
                          <span className="text-xs text-slate-400 font-normal">
                            for {selectedPlan.duration_days} days
                          </span>
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleContinueToPayment}
                      disabled={selectedLocalities.length === 0}
                      className={`w-full sm:w-auto px-8 py-3.5 rounded-full text-sm font-bold transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer ${
                        selectedLocalities.length > 0
                          ? 'bg-white hover:bg-slate-100 text-slate-900 shadow-xl hover:scale-[1.02] active:scale-[0.98]'
                          : 'bg-white/20 text-white/40 cursor-not-allowed'
                      }`}
                    >
                      <span>Proceed to Payment</span>
                      <ArrowRight size={15} />
                    </button>
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
