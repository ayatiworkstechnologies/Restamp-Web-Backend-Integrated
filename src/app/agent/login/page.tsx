"use client";

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import Header from '@/components/layout/Header';
import Footer from '@/components/layout/Footer';
import { getProfile, loginWithMobile, saveProfile } from '@/lib/profile';
import { safeInternalPath } from '@/lib/safeRedirect';
import {
  hasActiveAgentSubscription,
  seedExistingPartnerSubscription,
  getAgentSubscription,
} from '@/lib/agentPlan';
import {
  ShieldCheck,
  Smartphone,
  Briefcase,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Check,
  Building2,
  Lock,
  Sparkles,
  Zap,
} from 'lucide-react';

const DEMO_OTP = '123456';
const OTP_LENGTH = 6;

function AgentLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Same-site paths only (rejects //host, "\" and tab tricks, full URLs).
  const nextUrl = safeInternalPath(searchParams.get('next'));

  // Tab: 'login' | 'register'
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [step, setStep] = useState<'details' | 'otp'>('details');

  // Fields
  const [mobile, setMobile] = useState('');
  const [name, setName] = useState('');
  const [firmName, setFirmName] = useState('');
  const [reraNumber, setReraNumber] = useState('');
  const [city, setCity] = useState('Chennai');

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Check if already logged in as agent
  useEffect(() => {
    const existing = getProfile();
    if (existing && existing.role === 'agent') {
      if (hasActiveAgentSubscription()) {
        router.replace(nextUrl || '/agent/dashboard');
      }
    }
  }, [router, nextUrl]);

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(mobile.trim())) {
      setError('Please enter a valid 10-digit Indian mobile number');
      return;
    }
    if (mode === 'register') {
      if (!name.trim()) {
        setError('Please enter your full name');
        return;
      }
      if (!firmName.trim()) {
        setError('Please enter your brokerage / agency firm name');
        return;
      }
    }
    setError('');
    setStep('otp');
    setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  const handleOtpChange = (index: number, val: string) => {
    const digit = val.replace(/\D/g, '').slice(-1);
    const nextOtp = [...otp];
    nextOtp[index] = digit;
    setOtp(nextOtp);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    setOtp(Array.from({ length: OTP_LENGTH }, (_, i) => pasted[i] || ''));
    otpRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const entered = otp.join('');
    if (entered !== DEMO_OTP) {
      setError(`Incorrect OTP. For testing, please enter default code: ${DEMO_OTP}`);
      return;
    }

    setLoading(true);
    setError('');

    setTimeout(() => {
      // Authenticate agent using existing profile auth
      const profile = loginWithMobile(mobile.trim(), 'agent');
      if (mode === 'register' || name || firmName) {
        saveProfile({
          ...profile,
          name: name.trim() || profile.name || 'Verified Channel Partner',
          city: city.trim() || profile.city || 'Chennai',
        });
      }

      // Check whether agent has active subscription
      const isSubscribed = hasActiveAgentSubscription();

      setLoading(false);
      if (isSubscribed) {
        // Direct to partner console
        router.push(nextUrl || '/agent/dashboard');
      } else {
        // Direct to location package selection page
        router.push('/agent/packages');
      }
    }, 600);
  };

  // Demo 1-Click Fast Fill for quick testing
  const handleQuickSeedLogin = (type: 'paid' | 'new') => {
    if (type === 'paid') {
      const demoMobile = '9840123456';
      setMobile(demoMobile);
      setName('Arun Kumar');
      setFirmName('Royal Realty Associates');
      setReraNumber('TN/AGENT/0491/2023');
      setMode('login');
      // Seed subscription for existing paid partner test
      seedExistingPartnerSubscription(demoMobile);
      loginWithMobile(demoMobile, 'agent');
      router.push('/agent/dashboard');
    } else {
      const newMobile = '9876543210';
      setMobile(newMobile);
      setName('Vikram S');
      setFirmName('Apex Property Advisory');
      setReraNumber('TN/AGENT/0998/2024');
      setMode('register');
      setStep('details');
      setError('');
    }
  };

  return (
    <div className="w-full max-w-5xl bg-white rounded-[32px] p-4 sm:p-6 md:p-8 shadow-2xl shadow-black/20 flex flex-col md:flex-row gap-8 items-stretch border border-slate-200">
      {/* Left Column: Visual Brand Card in Deep Navy with Cyan Accent */}
      <div className="relative w-full md:w-[45%] rounded-[24px] bg-[#070e17] overflow-hidden p-8 sm:p-10 flex flex-col justify-between min-h-[460px] md:min-h-[560px] select-none border border-slate-800 text-white">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-[#087ed9]/20 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full bg-sky-500/15 border border-sky-400/25 px-3 py-1 text-xs font-semibold text-sky-300">
            <span className="h-2 w-2 rounded-full bg-[#38bdf8] animate-pulse" />
            <span>Channel Partner Syndicate</span>
          </div>

          <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white leading-snug">
            Scale deals with verified Indian buyers.
          </h2>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Access pre-approved mortgage buyers, post exclusive mandates, and close transactions with zero broker collision and 0% platform commission.
          </p>

          <div className="pt-2 space-y-2.5 text-xs text-slate-200">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#38bdf8] shrink-0" />
              <span>RERA Registered Channel Partner Protection</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#38bdf8] shrink-0" />
              <span>Direct WhatsApp alerts for hot buyer leads</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} className="text-[#38bdf8] shrink-0" />
              <span>Coverage in high-demand micro-market packages</span>
            </div>
          </div>
        </div>

        {/* Demo Fast-Action Helper */}
        <div className="relative z-10 pt-6 mt-6 border-t border-slate-800">
          <p className="text-[11px] font-bold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Zap size={13} /> Quick Testing Profiles:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleQuickSeedLogin('paid')}
              className="text-left p-2.5 rounded-xl bg-slate-900/90 border border-emerald-500/30 hover:border-emerald-400/60 transition group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-emerald-400">Paid Partner</span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded">Active Sub</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">Royal Realty • 10 Locations</p>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSeedLogin('new')}
              className="text-left p-2.5 rounded-xl bg-slate-900/90 border border-sky-500/30 hover:border-sky-400/60 transition group cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-sky-400">New Broker</span>
                <span className="text-[9px] bg-sky-500/20 text-sky-300 px-1.5 py-0.5 rounded">Select Pkg</span>
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5 truncate">First-Time Setup Flow</p>
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: Interaction Form */}
      <div className="flex-1 flex flex-col justify-center py-2 sm:py-4">
        {/* Toggle Mode */}
        <div className="flex items-center justify-between mb-6">
          <div className="inline-flex p-1 rounded-2xl bg-slate-100 border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setStep('details');
                setError('');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                mode === 'login' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Broker Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setStep('details');
                setError('');
              }}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                mode === 'register' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              New Partner Register
            </button>
          </div>

          <Link
            href="/login"
            className="text-xs font-semibold text-slate-400 hover:text-[#087ed9] transition"
          >
            Buyer / Owner Login &rarr;
          </Link>
        </div>

        {/* Step: Details */}
        {step === 'details' ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {mode === 'login' ? 'Welcome back to Restamp' : 'Join Restamp Channel Partner Network'}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                {mode === 'login'
                  ? 'Enter your registered broker phone number to access your console.'
                  : 'Register your brokerage to select micro-market packages and receive verified buyer leads.'}
              </p>
            </div>

            {mode === 'register' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-2">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Broker Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Arun Kumar"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#087ed9] focus:ring-2 focus:ring-[#087ed9]/20 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Brokerage / Firm Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Royal Realty Associates"
                    value={firmName}
                    onChange={(e) => setFirmName(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#087ed9] focus:ring-2 focus:ring-[#087ed9]/20 outline-none transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">State RERA Number (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. TN/AGENT/0491/2023"
                    value={reraNumber}
                    onChange={(e) => setReraNumber(e.target.value.toUpperCase())}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 placeholder:text-slate-400 focus:border-[#087ed9] focus:ring-2 focus:ring-[#087ed9]/20 outline-none uppercase transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Primary Operating City</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:border-[#087ed9] focus:ring-2 focus:ring-[#087ed9]/20 outline-none transition cursor-pointer"
                  >
                    <option value="Chennai">Chennai, Tamil Nadu</option>
                    <option value="Bangalore">Bangalore, Karnataka</option>
                    <option value="Hyderabad">Hyderabad, Telangana</option>
                  </select>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Phone Number *</label>
              <div className="flex items-center rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 transition focus-within:border-[#087ed9] focus-within:ring-2 focus-within:ring-[#087ed9]/20">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-500 pr-2.5 border-r border-slate-200 mr-2.5">
                  <span className="text-base">🇮🇳</span> +91
                </span>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  placeholder="Enter 10-digit mobile"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-transparent text-xs sm:text-sm font-semibold text-slate-800 placeholder:text-slate-400 outline-none"
                />
              </div>
            </div>

            {error && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full mt-2 rounded-2xl bg-[#087ed9] hover:bg-sky-600 active:scale-[0.98] text-white font-bold text-sm py-3.5 px-4 shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Get Verification OTP</span>
              <ArrowRight size={16} />
            </button>

            <p className="text-[11px] text-slate-400 text-center leading-relaxed">
              By proceeding, you agree to Restamp&apos;s Partner Code of Conduct and Zero-Broker Collision Syndicate Terms.
            </p>
          </form>
        ) : (
          /* Step: OTP Verification */
          <form onSubmit={handleVerifyOtp} className="space-y-5">
            <button
              type="button"
              onClick={() => {
                setStep('details');
                setError('');
              }}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-[#087ed9] transition cursor-pointer"
            >
              <ArrowLeft size={14} /> Back to details
            </button>

            <div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Enter 6-Digit OTP
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-1">
                Sent to <strong className="text-slate-800">+91 {mobile}</strong>.{' '}
                <span className="text-[#087ed9] font-medium">Demo code: {DEMO_OTP}</span>
              </p>
            </div>

            {/* OTP Boxes */}
            <div className="flex items-center justify-between gap-2 max-w-sm" onPaste={handleOtpPaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => {
                    otpRefs.current[idx] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  className="h-12 w-12 text-center text-lg font-extrabold rounded-xl border border-slate-200 bg-white text-slate-900 outline-none focus:border-[#087ed9] focus:ring-2 focus:ring-[#087ed9]/20 transition"
                />
              ))}
            </div>

            {error && (
              <p className="text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 px-3 py-2 rounded-xl">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-2xl bg-[#087ed9] hover:bg-sky-600 disabled:opacity-60 active:scale-[0.98] text-white font-bold text-sm py-3.5 px-4 shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading ? (
                <span>Checking Syndicate Status...</span>
              ) : (
                <>
                  <span>Verify &amp; Continue</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Didn&apos;t receive code?</span>
              <button
                type="button"
                onClick={() => {
                  setOtp(Array(OTP_LENGTH).fill(''));
                  setError('');
                  setTimeout(() => otpRefs.current[0]?.focus(), 50);
                }}
                className="font-bold text-[#087ed9] hover:underline cursor-pointer"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AgentLoginPage() {
  return (
    <>
      <Header />
      <main className="min-h-[85vh] bg-slate-50 py-10 sm:py-14 md:py-16 flex items-center justify-center px-4">
        <div className="w-full max-w-5xl space-y-6">
          {/* Breadcrumb / Step Indicator */}
          <div className="flex items-center justify-center gap-2 sm:gap-4 text-xs font-bold text-slate-400">
            <span className="flex items-center gap-1.5 text-[#087ed9]">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#087ed9] text-white text-[11px]">
                1
              </span>
              Agent Login
            </span>
            <span className="text-slate-300">&rarr;</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-[11px]">
                2
              </span>
              Choose Location Package
            </span>
            <span className="text-slate-300">&rarr;</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-[11px]">
                3
              </span>
              Payment &amp; Activation
            </span>
            <span className="text-slate-300">&rarr;</span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-200 text-slate-600 text-[11px]">
                4
              </span>
              Partner Console
            </span>
          </div>

          <Suspense
            fallback={
              <div className="w-full max-w-4xl h-96 bg-white rounded-3xl animate-pulse mx-auto" />
            }
          >
            <AgentLoginForm />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
