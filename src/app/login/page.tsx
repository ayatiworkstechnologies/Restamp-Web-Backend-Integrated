"use client";

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { loginWithMobile } from '@/lib/profile';
import { getSubscription } from '@/lib/ownerPlan';
import { hasActiveAgentSubscription } from '@/lib/agentPlan';
import { Smartphone, ShieldCheck, ArrowLeft, ArrowRight } from 'lucide-react';

// Static OTP until a real SMS service is connected
const DEMO_OTP = '123456';
const OTP_LENGTH = 6;

const roleLabels: Record<string, string> = {
  buyer: 'Buyer',
  owner: 'Owner',
  agent: 'Agent',
  admin: 'Administrator',
};

// Owners land on dashboard once plan is active, agents on dashboard if active else package selection
const afterLogin = (role: string) =>
  role === 'owner'
    ? getSubscription()
      ? '/owner/dashboard'
      : '/owner/plans'
    : role === 'agent'
    ? hasActiveAgentSubscription()
      ? '/agent/dashboard'
      : '/agent/packages'
    : '/profile';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const role = params.get('role') ?? '';
  const nextParam = params.get('next');
  // Only allow internal paths, never an external URL.
  const next = nextParam && nextParam.startsWith('/') && !nextParam.startsWith('//') ? nextParam : null;
  const roleLabel = roleLabels[role];

  useEffect(() => {
    if (role === 'admin') {
      router.replace('/admin-login');
    }
  }, [role, router]);

  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^[6-9]\d{9}$/.test(mobile)) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    setError('');
    setOtp(Array(OTP_LENGTH).fill(''));
    setStep('otp');
    setTimeout(() => otpRefs.current[0]?.focus(), 0);
  };

  const changeOtp = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus();
  };

  const otpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus();
  };

  const pasteOtp = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!digits) return;
    e.preventDefault();
    setOtp(Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] ?? ''));
    otpRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
  };

  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.join('') !== DEMO_OTP) {
      setError('Incorrect OTP. Please try again.');
      return;
    }
    setError('');
    const me = loginWithMobile(mobile, role);
    router.push(next ?? afterLogin(me.role));
  };

  const handleSocialLogin = (provider: 'Google' | 'Apple') => {
    const me = loginWithMobile(provider === 'Google' ? '9876543210' : '9876543211', role || 'buyer');
    router.push(next ?? afterLogin(me.role));
  };

  return (
    <div className="w-full max-w-4xl bg-white rounded-[32px] p-4 sm:p-6 md:p-8 shadow-2xl shadow-black/40 flex flex-col md:flex-row gap-6 md:gap-10 items-stretch border border-slate-800/20">
      {/* Left Column: Visual Brand Card in Website Navy with Cyan/Blue Glow */}
      <div className="bg-gradient-to-br from-sky-50 to-white border border-sky-100 text-slate-900 relative w-full md:w-[46%] rounded-[24px] overflow-hidden p-8 sm:p-10 flex flex-col justify-between min-h-[340px] md:min-h-[520px] select-none">
        {/* Top Typography */}
        <div className="relative z-10">
          <span className="inline-block rounded-full bg-sky-500/15 border border-sky-400/20 px-3 py-1 text-[11px] font-semibold text-sky-600 tracking-wider uppercase backdrop-blur-xs mb-4">
            Restamp Marketplace
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-[32px] font-extrabold text-slate-900 leading-[1.2] tracking-tight">
            Convert your ideas into successful business.
          </h2>
          <p className="mt-3.5 text-xs sm:text-sm text-slate-500 leading-relaxed max-w-xs">
            Discover verified properties, transparent agreements, and seamless transactions on Restamp.
          </p>
        </div>

        {/* Ambient Glowing Vertical Light Pillars (Website Blue Palette) */}
        <div className="absolute inset-x-0 bottom-0 h-64 pointer-events-none overflow-hidden flex items-end justify-center">
          <div className="w-16 h-48 bg-gradient-to-t from-[#087ed9]/80 via-[#0284c7]/40 to-transparent blur-xl -translate-x-7" />
          <div className="w-20 h-56 bg-gradient-to-t from-[#38bdf8] via-[#087ed9]/60 to-transparent blur-lg opacity-90" />
          <div className="w-16 h-44 bg-gradient-to-t from-[#0369a1]/80 via-[#087ed9]/30 to-transparent blur-xl translate-x-7" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#087ed9]/50 via-[#38bdf8]/20 to-transparent blur-2xl" />
        </div>

        {/* Bottom Tag */}
        <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-semibold tracking-wider uppercase text-slate-600">
            Verified Portal
          </span>
          <span className="text-sky-600 font-mono">v1.0</span>
        </div>
      </div>

      {/* Right Column: Form */}
      <div className="w-full md:w-[54%] flex flex-col justify-center px-2 sm:px-4 py-2">
        {/* Brand Logo & Back to Home */}
        <div className="mb-5 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/restamp-logo.svg" alt="Restamp" width={149} height={40} className="h-10 w-auto" priority />
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-slate-400 hover:text-[#087ed9] transition"
          >
            ← Back to home
          </Link>
        </div>

        {step === 'mobile' ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                {roleLabel ? `${roleLabel} Login` : 'Get Started'}
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Welcome to Restamp — Let&apos;s get started
              </p>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Your mobile
              </label>
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm focus-within:border-[#087ed9] transition shadow-2xs">
                <Smartphone size={16} className="text-slate-400 shrink-0" />
                <span className="text-slate-600 font-semibold">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoFocus
                  placeholder="Enter 10-digit mobile number"
                  value={mobile}
                  onChange={(e) => setMobile(e.target.value.replace(/\D/g, '').slice(0, 10))}
                  className="w-full bg-transparent text-slate-900 font-medium outline-none placeholder:text-slate-400"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

            <button
              type="submit"
              className="w-full rounded-xl bg-[#087ed9] hover:bg-[#0070c9] h-[53px] text-sm font-semibold text-white transition shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99]"
            >
              <span>Get OTP</span>
              <ArrowRight size={16} />
            </button>

            {/* Social Divider */}
            <div className="relative my-4 flex items-center justify-center">
              <div className="w-full border-t border-slate-200" />
              <span className="absolute bg-white px-3 text-xs text-slate-400">
                Or continue with
              </span>
            </div>

            {/* Social Login Buttons: Google and Apple */}
            <div className="space-y-2.5">
              <button
                type="button"
                onClick={() => handleSocialLogin('Google')}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 sm:py-3 px-4 rounded-full bg-[#f1f3f6] hover:bg-[#e4e7ec] text-slate-800 text-xs sm:text-sm font-medium transition cursor-pointer active:scale-[0.99]"
              >
                {/* Official Gmail / Google M Icon */}
                <svg className="w-5 h-4 shrink-0" viewBox="52 42 88 66">
                  <path fill="#4285f4" d="M58 108h14V74L52 59v43c0 3.32 2.69 6 6 6" />
                  <path fill="#34a853" d="M120 108h14c3.32 0 6-2.69 6-6V59l-20 15" />
                  <path fill="#fbbc04" d="M120 48v26l20-15v-8c0-7.42-8.47-11.65-14.4-7.2" />
                  <path fill="#ea4335" d="M72 74V48l24 18 24-18v26L96 92" />
                  <path fill="#c5221f" d="M52 51v8l20 15V48l-5.6-4.2c-5.94-4.45-14.4-.22-14.4 7.2" />
                </svg>
                <span>Sign In With Google</span>
              </button>

              <button
                type="button"
                onClick={() => handleSocialLogin('Apple')}
                className="w-full flex items-center justify-center gap-2.5 py-2.5 sm:py-3 px-4 rounded-full bg-[#f1f3f6] hover:bg-[#e4e7ec] text-slate-800 text-xs sm:text-sm font-medium transition cursor-pointer active:scale-[0.99]"
              >
                {/* Official Apple Icon */}
                <svg className="w-4 h-4.5 shrink-0 fill-current text-slate-900" viewBox="0 0 814 1000">
                  <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
                </svg>
                <span>Sign In With Apple</span>
              </button>
            </div>

            <div className="pt-2 text-center text-xs text-slate-500">
              Dont have an account?{' '}
              <Link href="/login" className="font-semibold text-[#087ed9] hover:underline">
                Create One
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Verify OTP
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Enter the 6-digit code sent to <span className="font-semibold text-slate-800">+91 {mobile}</span>
              </p>
            </div>

            <p className="rounded-xl bg-sky-50 border border-sky-100 px-3.5 py-2.5 text-center text-xs text-sky-900 font-medium">
              Demo OTP: <span className="font-extrabold tracking-widest text-[#087ed9] ml-1">{DEMO_OTP}</span>
            </p>

            <div className="flex justify-between gap-2 pt-1" onPaste={pasteOtp}>
              {otp.map((digit, i) => (
                <input
                  key={i}
                  ref={(el) => {
                    otpRefs.current[i] = el;
                  }}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`OTP digit ${i + 1}`}
                  value={digit}
                  onChange={(e) => changeOtp(i, e.target.value)}
                  onKeyDown={(e) => otpKeyDown(i, e)}
                  className="h-12 w-12 rounded-xl border border-slate-200 bg-slate-50 text-center text-lg font-bold text-slate-900 outline-none focus:border-[#087ed9] focus:bg-white transition"
                />
              ))}
            </div>

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

            <button
              type="submit"
              disabled={otp.join('').length < OTP_LENGTH}
              className="inline-flex items-center justify-center w-full rounded-xl bg-[#087ed9] hover:bg-[#0070c9] h-[53px] text-sm font-semibold text-white transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-sm"
            >
              Verify &amp; Login
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={() => {
                  setStep('mobile');
                  setError('');
                }}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
              >
                <ArrowLeft size={13} /> Change number
              </button>
              <button
                type="button"
                onClick={() => setOtp(Array(OTP_LENGTH).fill(''))}
                className="text-[#087ed9] hover:underline cursor-pointer font-semibold"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* Link to Administrator Console */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-center text-xs text-slate-400">
          <Link
            href="/admin-login"
            className="hover:text-slate-800 hover:underline inline-flex items-center gap-1.5 font-medium transition"
          >
            <ShieldCheck size={14} className="text-[#087ed9]" />
            Administrator Console Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-[#0b1622] flex flex-col justify-center items-center px-4 py-8 sm:py-12">
      <Suspense fallback={<div className="text-slate-400 text-sm">Loading...</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
