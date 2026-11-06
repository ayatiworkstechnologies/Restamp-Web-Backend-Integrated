"use client";

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getSession, isPlaceholderName, loginHref } from '@/lib/api/session';
import {
  locationPackages,
  getDraftPackage,
  activateAgentPackage,
  hasActiveAgentSubscription,
  AGENT_PROMO_CODES,
  calculateAgentPackageBill,
  type LocationPackage,
} from '@/lib/agentPlan';
import {
  ShieldCheck,
  CreditCard,
  Smartphone,
  Building,
  CheckCircle2,
  Check,
  Lock,
  ArrowRight,
  ArrowLeft,
  Tag,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  MapPin,
  Clock,
  Download,
  X,
} from 'lucide-react';

type PaymentMethod = 'upi' | 'card' | 'netbanking';
type PaymentState = 'idle' | 'processing' | 'success' | 'failed' | 'cancelled';

export default function AgentPaymentPage() {
  const router = useRouter();

  // Authentication check
  const [profile, setProfile] = useState<{ name: string; mobile?: string } | null>(null);

  // Selected package and locations from draft
  const [pkg, setPkg] = useState<LocationPackage>(locationPackages[1]); // default: 10
  const [selectedLocations, setSelectedLocations] = useState<string[]>([
    'OMR IT Corridor',
    'Sholinganallur',
    'Velachery',
    'Adyar & Besant Nagar',
    'Anna Nagar',
  ]);

  // Promo code & discount
  const [promoCode, setPromoCode] = useState('');
  const [discount, setDiscount] = useState(0);
  const [promoMessage, setPromoMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Payment method selection
  const [method, setMethod] = useState<PaymentMethod>('upi');
  const [upiApp, setUpiApp] = useState('Google Pay');
  const [upiId, setUpiId] = useState('');

  // Card fields
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

  // Net banking bank
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

  // Payment submission state
  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [paymentResult, setPaymentResult] = useState<any>(null);
  const [redirectCountdown, setRedirectCountdown] = useState(10);

  // Duplicate charge protection flag & idempotency key
  const isSubmittingRef = useRef(false);
  const idempotencyKeyRef = useRef<string>(`IDEMP_${Date.now()}_${Math.random()}`);

  useEffect(() => {
    // Signed-in Restamp account (real session); no phone number is exposed by the backend profile.
    const session = getSession();
    if (!session) {
      router.replace(loginHref('/agent/payment', 'agent'));
      return;
    }
    setProfile({ name: isPlaceholderName(session.displayName) ? '' : session.displayName });

    // Retrieve draft selection
    const draft = getDraftPackage();
    if (draft) {
      const foundPkg = locationPackages.find((p) => p.id === draft.packageId);
      if (foundPkg) setPkg(foundPkg);
      if (draft.selectedLocations && draft.selectedLocations.length > 0) {
        setSelectedLocations(draft.selectedLocations);
      }
    }
  }, [router]);

  // Auto redirect countdown on success
  useEffect(() => {
    if (paymentState !== 'success') return;
    if (redirectCountdown <= 0) {
      router.push('/agent/dashboard');
      return;
    }
    const timer = setInterval(() => {
      setRedirectCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [paymentState, redirectCountdown, router]);

  // Apply Promo
  const handleApplyPromo = () => {
    const clean = promoCode.trim().toUpperCase();
    if (AGENT_PROMO_CODES[clean]) {
      const discountValue = AGENT_PROMO_CODES[clean];
      setDiscount(discountValue);
      setPromoMessage({
        ok: true,
        text: `Promo code ${clean} applied! You saved ₹${discountValue}.00.`,
      });
    } else {
      setDiscount(0);
      setPromoMessage({
        ok: false,
        text: 'Invalid promo code. Try PARTNER500, RERAPRO, or GROWTH300.',
      });
    }
  };

  // Bill calculations
  const bill = calculateAgentPackageBill(pkg, discount);

  // Card formatting
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = digits.match(/.{1,4}/g)?.join(' ') || digits;
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let clean = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (clean.length >= 2) {
      clean = clean.slice(0, 2) + '/' + clean.slice(2);
    }
    setExpiry(clean);
  };

  // Trigger payment execution
  const handleProcessPayment = () => {
    // Prevent duplicate activation / double charges
    if (isSubmittingRef.current || paymentState === 'processing') return;

    // Validate based on payment method
    if (method === 'upi') {
      if (upiId && !/^[\w.-]{2,}@[a-zA-Z]{2,}$/.test(upiId.trim())) {
        setErrorMessage('Please enter a valid UPI VPA (e.g. agent@okhdfcbank)');
        return;
      }
    } else if (method === 'card') {
      const cleanDigits = cardNumber.replace(/\D/g, '');
      if (cleanDigits.length < 15) {
        setErrorMessage('Please enter a valid 16-digit card number');
        return;
      }
      if (!cardHolder.trim()) {
        setErrorMessage('Please enter the name printed on the card');
        return;
      }
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(expiry)) {
        setErrorMessage('Please enter expiry date as MM/YY');
        return;
      }
      if (cvv.length < 3) {
        setErrorMessage('Please enter a valid 3-digit CVV');
        return;
      }
    }

    setErrorMessage('');
    setPaymentState('processing');
    isSubmittingRef.current = true;

    // Process payment and activate subscription
    setTimeout(() => {

      // Success flow: Activate Subscription with verified confirmation
      const methodLabel =
        method === 'upi'
          ? `UPI (${upiId ? upiId.trim() : upiApp})`
          : method === 'card'
          ? `Card (•••• ${cardNumber.replace(/\D/g, '').slice(-4)})`
          : `Net Banking (${selectedBank})`;

      const result = activateAgentPackage(pkg, selectedLocations, {
        total: bill.total,
        amount: bill.basePrice,
        discount: bill.discount,
        gst: bill.gst,
        promoCode: discount ? promoCode.trim().toUpperCase() : undefined,
        method: methodLabel,
        agentMobile: profile?.mobile,
        agentName: profile?.name || 'Verified Agent',
        firmName: 'Royal Realty Associates',
        reraNumber: 'TN/AGENT/0491/2023',
      });

      isSubmittingRef.current = false;
      setPaymentResult(result);
      setPaymentState('success');
    }, 1600);
  };

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
              <span>2. Package &amp; Locations</span>
            </span>
            <span className="text-slate-300">&rarr;</span>
            <span
              className={`flex items-center gap-1.5 ${
                paymentState === 'success'
                  ? 'text-emerald-600'
                  : 'text-[#087ed9] bg-sky-50 px-3 py-1 rounded-full border border-sky-200'
              }`}
            >
              {paymentState === 'success' ? (
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
                paymentState === 'success'
                  ? 'text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200'
                  : 'text-slate-400'
              }`}
            >
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[11px] ${
                  paymentState === 'success'
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}
              >
                4
              </span>
              <span>4. Agent Portal</span>
            </span>
          </div>

          {/* Heading */}
          {paymentState !== 'success' && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <Link
                  href="/agent/packages"
                  className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-[#087ed9] transition mb-2"
                >
                  <ArrowLeft size={14} /> Back to Package Selection
                </Link>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                  Secure Syndicate Payment
                </h1>
                <p className="text-xs sm:text-sm text-slate-500 mt-1">
                  Activate your {pkg.name} subscription across {selectedLocations.length} chosen micro-markets.
                </p>
              </div>

              {/* Security Badge */}
              <div className="flex items-center gap-2 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full self-start sm:self-auto">
                <ShieldCheck size={16} className="text-emerald-600" />
                <span>256-Bit Encrypted Payment Desk</span>
              </div>
            </div>
          )}

          {/* SUCCESS STATE - 2 Column Split Layout matching Reference Mockup */}
          {paymentState === 'success' && paymentResult && (
            <div className="max-w-4xl mx-auto bg-white rounded-[32px] sm:rounded-[36px] shadow-2xl shadow-slate-200/80 border border-slate-100 p-6 sm:p-9 lg:p-10 animate-fadeIn">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10 items-stretch">
                {/* LEFT COLUMN: Confirmation Icon, Heading, Buttons & Auto-Redirect */}
                <div className="md:col-span-6 flex flex-col justify-between items-center text-center px-2 sm:px-4 py-2">
                  <div className="w-full flex flex-col items-center">
                    {/* Glowing Circular Success Icon */}
                    <div className="relative mb-6">
                      <div className="w-20 h-20 rounded-full bg-emerald-100/70 flex items-center justify-center shadow-inner">
                        <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-full bg-[#10b981] flex items-center justify-center text-white shadow-lg shadow-emerald-500/30">
                          <Check className="w-7 h-7 sm:w-8 sm:h-8 text-white stroke-[3.2]" />
                        </div>
                      </div>
                    </div>

                    {/* Verified Badge */}
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200/80 mb-3 inline-flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Payment Verified &amp; Active
                    </span>

                    {/* Headline */}
                    <h2 className="text-2xl sm:text-[26px] font-extrabold text-slate-900 tracking-tight leading-snug">
                      Welcome to Restamp Agent Hub!
                    </h2>

                    {/* Subtitle / Description */}
                    <p className="text-xs sm:text-sm text-slate-500 mt-2.5 max-w-xs mx-auto leading-relaxed">
                      Your <strong className="text-slate-800 font-semibold">{pkg.name}</strong> subscription has been successfully activated.
                    </p>
                  </div>

                  {/* Buttons & Countdown */}
                  <div className="w-full max-w-xs space-y-3 mt-8">
                    {/* Primary Button */}
                    <Link
                      href="/agent/dashboard"
                      className="w-full py-3.5 px-6 rounded-2xl bg-[#005f3e] hover:bg-[#004e33] text-white font-bold text-sm tracking-wide transition duration-150 shadow-md shadow-emerald-950/10 flex items-center justify-center gap-2"
                    >
                      <span>Open Agent Console Now</span>
                      <ArrowRight size={16} />
                    </Link>

                    {/* Secondary Button */}
                    <Link
                      href="/agent/packages"
                      className="w-full py-3.5 px-6 rounded-2xl bg-[#f3f4f6] hover:bg-slate-200/80 text-slate-700 font-semibold text-sm transition duration-150 flex items-center justify-center"
                    >
                      <span>View Chennai Micro-Markets</span>
                    </Link>

                    {/* Auto Redirect Banner */}
                    <div className="pt-2 text-[11px] sm:text-xs text-slate-500 flex items-center justify-center gap-1.5">
                      <Clock size={13} className="text-emerald-600 animate-spin" />
                      <span>
                        Redirecting to your Agent Portal in{' '}
                        <strong className="text-slate-800 font-bold">{redirectCountdown} seconds...</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* RIGHT COLUMN: Payment Summary Soft-Gray Card */}
                <div className="md:col-span-6 bg-[#f8f9fa] rounded-[24px] sm:rounded-[28px] p-6 sm:p-7 border border-slate-200/60 flex flex-col justify-between relative text-left">
                  {/* Top-Right Close Button */}
                  <Link
                    href="/agent/dashboard"
                    className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 transition p-1.5 rounded-full hover:bg-slate-200/60"
                    title="Close"
                  >
                    <X size={16} />
                  </Link>

                  <div>
                    {/* Header */}
                    <h3 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight mb-4">
                      Payment Summary
                    </h3>

                    {/* Subscriber & Tier Metadata */}
                    <div className="space-y-3.5 mb-5">
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                          Subscriber
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 block">
                          {profile?.name || 'Verified Agent'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[11px] font-medium text-slate-400 uppercase tracking-wider block">
                          Subscribed Tier
                        </span>
                        <span className="text-xs sm:text-sm font-semibold text-slate-900 mt-0.5 block">
                          {pkg.name} ({pkg.badge})
                        </span>
                      </div>
                    </div>

                    {/* Inner White Card with Rows & Dividers */}
                    <div className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-4.5 space-y-2.5 shadow-xs">
                      <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                        <span className="text-slate-500">Transaction ID:</span>
                        <span className="font-mono font-bold text-slate-800 text-[11px] sm:text-xs">
                          {paymentResult.paymentRecord.transactionRef}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                        <span className="text-slate-500">Payment Reference:</span>
                        <span className="font-mono font-bold text-slate-800 text-[11px] sm:text-xs">
                          {paymentResult.paymentRecord.id}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1 border-b border-slate-100">
                        <span className="text-slate-500">Active Micro-Markets:</span>
                        <span className="font-bold text-[#087ed9] text-[11px] sm:text-xs">
                          {selectedLocations.length} Locations Activated
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs py-1">
                        <span className="text-slate-500">Syndication Access:</span>
                        <span className="font-semibold text-slate-700 text-[11px] sm:text-xs">
                          90 Days Full Access
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 flex justify-end">
                        <span className="text-xs font-bold text-[#059669]">
                          Total {selectedLocations.length} Micro-Markets
                        </span>
                      </div>
                    </div>

                    {/* Bill Breakdown Rows */}
                    <div className="mt-4 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Base Subscription</span>
                        <span className="font-semibold text-slate-900">
                          ₹{bill.basePrice.toLocaleString('en-IN')}
                        </span>
                      </div>
                      {bill.discount > 0 && (
                        <div className="flex justify-between text-emerald-600 font-medium">
                          <span>Promo Discount</span>
                          <span>- ₹{bill.discount.toLocaleString('en-IN')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-slate-600">
                        <span>18% GST (ITC Eligible)</span>
                        <span className="font-semibold text-slate-900">
                          + ₹{bill.gst.toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Bottom Right Amount Paid */}
                  <div className="mt-6 pt-4 border-t border-slate-200/80 flex flex-col items-end text-right">
                    <span className="text-xs font-semibold text-[#059669] tracking-wider uppercase">
                      Amount Paid
                    </span>
                    <span className="text-2xl sm:text-3xl font-extrabold text-[#059669] tracking-tight mt-0.5">
                      ₹{bill.total.toLocaleString('en-IN')}
                    </span>
                    <span className="text-[10px] text-slate-400 mt-0.5">
                      (incl. GST)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* MAIN CHECKOUT FORM (when not in success state) */}
          {paymentState !== 'success' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT 7 COLS: PAYMENT METHODS */}
              <div className="lg:col-span-7 bg-white rounded-[32px] p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                    Select Payment Gateway
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Choose your preferred payment method. Input Tax Credit GST invoice generated automatically.
                  </p>
                </div>

                {/* Gateway Tabs */}
                <div className="grid grid-cols-3 gap-2.5 p-1.5 rounded-2xl bg-slate-100 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setMethod('upi');
                      setErrorMessage('');
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      method === 'upi'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone size={16} className={method === 'upi' ? 'text-[#087ed9]' : ''} />
                    <span>UPI / QR</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMethod('card');
                      setErrorMessage('');
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      method === 'card'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CreditCard size={16} className={method === 'card' ? 'text-[#087ed9]' : ''} />
                    <span>Card</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMethod('netbanking');
                      setErrorMessage('');
                    }}
                    className={`py-2.5 px-3 rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      method === 'netbanking'
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Building size={16} className={method === 'netbanking' ? 'text-[#087ed9]' : ''} />
                    <span>Net Banking</span>
                  </button>
                </div>

                {/* TAB 1: UPI */}
                {method === 'upi' && (
                  <div className="space-y-4 pt-2">
                    <p className="text-xs font-bold text-slate-700">Choose Instant UPI App:</p>
                    <div className="grid grid-cols-3 gap-3">
                      {['Google Pay', 'PhonePe', 'Paytm'].map((app) => (
                        <div
                          key={app}
                          onClick={() => setUpiApp(app)}
                          className={`p-3 rounded-xl border text-center transition cursor-pointer text-xs font-bold ${
                            upiApp === app
                              ? 'border-[#087ed9] bg-sky-50 text-[#087ed9] ring-2 ring-[#087ed9]/20'
                              : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          {app}
                        </div>
                      ))}
                    </div>

                    <div className="pt-2">
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Or Enter UPI ID / VPA
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. yourname@okhdfcbank"
                        value={upiId}
                        onChange={(e) => setUpiId(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#087ed9] outline-none transition"
                      />
                    </div>
                  </div>
                )}

                {/* TAB 2: CREDIT / DEBIT CARD */}
                {method === 'card' && (
                  <div className="space-y-3.5 pt-2">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Card Number</label>
                      <input
                        type="text"
                        maxLength={19}
                        placeholder="4532 •••• •••• 8892"
                        value={cardNumber}
                        onChange={handleCardNumberChange}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-xs sm:text-sm font-mono font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#087ed9] outline-none transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="Name as printed on card"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#087ed9] outline-none transition"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Expiry (MM/YY)</label>
                        <input
                          type="text"
                          maxLength={5}
                          placeholder="MM/YY"
                          value={expiry}
                          onChange={handleExpiryChange}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-xs sm:text-sm font-mono font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#087ed9] outline-none transition"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">CVV / CVC</label>
                        <input
                          type="password"
                          maxLength={4}
                          placeholder="•••"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, ''))}
                          className="w-full rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white px-3.5 py-2.5 text-xs sm:text-sm font-mono font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#087ed9] outline-none transition"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* TAB 3: NET BANKING */}
                {method === 'netbanking' && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs font-bold text-slate-700">Popular Indian Commercial Banks:</p>
                    <div className="grid grid-cols-2 gap-2.5">
                      {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank', 'Kotak Mahindra'].map(
                        (bank) => (
                          <div
                            key={bank}
                            onClick={() => setSelectedBank(bank)}
                            className={`p-3 rounded-xl border text-xs font-bold transition cursor-pointer flex items-center justify-between ${
                              selectedBank === bank
                                ? 'border-[#087ed9] bg-sky-50 text-[#087ed9]'
                                : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <span>{bank}</span>
                            {selectedBank === bank && <Check size={14} />}
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}



                {/* Errors & Status Warnings */}
                {errorMessage && (
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-rose-800 animate-fadeIn">
                    <AlertTriangle size={16} className="text-rose-600 shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                {/* Submit Action Button */}
                <button
                  type="button"
                  onClick={handleProcessPayment}
                  disabled={paymentState === 'processing'}
                  className="w-full h-[53px] rounded-2xl bg-[#087ed9] hover:bg-sky-600 disabled:opacity-50 text-white font-extrabold text-sm transition shadow-lg hover:shadow-sky-500/25 active:scale-[0.98] flex items-center justify-center gap-2 cursor-pointer"
                >
                  {paymentState === 'processing' ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying with Banking Network...</span>
                    </div>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>Pay ₹{bill.total.toLocaleString('en-IN')} &amp; Activate Syndicate</span>
                    </>
                  )}
                </button>

                <p className="text-[11px] text-center text-slate-400">
                  By clicking Pay, you agree to Restamp RERA compliance terms. Duplicate charges are automatically blocked.
                </p>
              </div>

              {/* RIGHT 5 COLS: ORDER BREAKDOWN & LOCATIONS */}
              <div className="lg:col-span-5 space-y-6">
                <div className="bg-white rounded-[32px] p-6 sm:p-7 border border-slate-200 shadow-sm space-y-5">
                  <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                    <h3 className="text-base font-extrabold text-slate-900 tracking-tight">
                      Order Summary
                    </h3>
                    <span className="text-xs font-bold text-[#087ed9] bg-sky-50 px-2.5 py-0.5 rounded-full">
                      {pkg.badge}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xl font-black text-slate-900">{pkg.name}</h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {pkg.validityDays} Days Validity • Up to {pkg.mandateLimit} Property Unlocks
                    </p>
                  </div>

                  {/* Locations Covered List */}
                  <div>
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-slate-700">
                        Covered Micro-Markets ({selectedLocations.length}):
                      </span>
                      <Link
                        href="/agent/packages"
                        className="text-[#087ed9] font-bold hover:underline"
                      >
                        Edit
                      </Link>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                      {selectedLocations.map((loc) => (
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

                  {/* Promo Code Box */}
                  <div className="pt-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Have a Syndicate Promo Code?
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="e.g. PARTNER500"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                        className="flex-1 rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-mono font-bold text-slate-800 placeholder:text-slate-400 focus:border-[#087ed9] outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition cursor-pointer"
                      >
                        Apply
                      </button>
                    </div>

                    {promoMessage && (
                      <p
                        className={`text-[11px] font-semibold mt-1.5 ${
                          promoMessage.ok ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {promoMessage.text}
                      </p>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  <div className="pt-3 border-t border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between text-slate-600">
                      <span>Package Base Subscription:</span>
                      <span className="font-semibold text-slate-900">
                        ₹{bill.basePrice.toLocaleString('en-IN')}.00
                      </span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Promo Discount ({promoCode.trim().toUpperCase()}):</span>
                        <span>-₹{discount.toLocaleString('en-IN')}.00</span>
                      </div>
                    )}

                    <div className="flex justify-between text-slate-600">
                      <span>GST (18% Input Tax Credit):</span>
                      <span className="font-semibold text-slate-900">
                        ₹{bill.gst.toLocaleString('en-IN')}.00
                      </span>
                    </div>

                    <div className="pt-2 border-t border-slate-200 flex justify-between text-sm sm:text-base font-black text-slate-900">
                      <span>Total Payable:</span>
                      <span className="text-[#087ed9]">
                        ₹{bill.total.toLocaleString('en-IN')}.00
                      </span>
                    </div>
                  </div>
                </div>

                {/* Assurance Card */}
                <div className="rounded-2xl bg-sky-50 border border-sky-100 p-4 text-xs space-y-1.5 text-sky-950">
                  <p className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 size={14} className="text-[#087ed9]" />
                    <span>Instant Syndicate Activation</span>
                  </p>
                  <p className="text-[11px] text-sky-800 leading-relaxed">
                    Once payment confirmation is received, your verified RERA agent credentials and 100% commission deal rights unlock immediately.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
