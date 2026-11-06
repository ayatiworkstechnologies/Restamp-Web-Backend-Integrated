"use client";

import { Suspense, useRef, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Smartphone, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAdminAuth } from '@/context/admin-auth-context';
import { DEMO_ADMIN_OTP } from '@/lib/admin-auth';

const OTP_LENGTH = 6;

function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = searchParams.get('redirect') || '/admin';
  const { loginWithMobile, isAuthenticated, isLoading } = useAdminAuth();

  const [step, setStep] = useState<'mobile' | 'otp'>('mobile');
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // If already authenticated, redirect to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, isLoading, router, redirectUrl]);

  const sendOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = mobile.replace(/\D/g, '');
    if (!/^[6-9]\d{9}$/.test(clean)) {
      setError('Enter a valid 10-digit registered mobile number');
      return;
    }
    setError('');
    setOtp(Array(OTP_LENGTH).fill(''));
    setStep('otp');
    setTimeout(() => otpRefs.current[0]?.focus(), 50);
  };

  const changeOtp = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otp];
    next[index] = digit;
    setOtp(next);
    if (digit && index < OTP_LENGTH - 1) {
      otpRefs.current[index + 1]?.focus();
    }
  };

  const otpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const pasteOtp = (e: React.ClipboardEvent) => {
    const digits = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!digits) return;
    e.preventDefault();
    const newOtp = Array.from({ length: OTP_LENGTH }, (_, i) => digits[i] ?? '');
    setOtp(newOtp);
    otpRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus();
  };

  const verifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    if (code !== DEMO_ADMIN_OTP) {
      setError('Incorrect admin OTP code. Please use demo OTP: 123456');
      return;
    }

    setIsVerifying(true);
    setError('');

    const success = loginWithMobile(mobile, code);
    if (success) {
      router.push(redirectUrl);
    } else {
      setIsVerifying(false);
      setError('Admin verification failed. Please try again.');
    }
  };

  return (
    <div className="w-full max-w-4xl bg-white rounded-[32px] p-4 sm:p-6 md:p-8 shadow-2xl shadow-black/40 flex flex-col md:flex-row gap-6 md:gap-10 items-stretch border border-slate-800/20">
      {/* Left Column: Dark Graphic Card with Website Blue Glow */}
      <div className="relative w-full md:w-[46%] rounded-[24px] bg-[#070e17] overflow-hidden p-8 sm:p-10 flex flex-col justify-between min-h-[340px] md:min-h-[520px] select-none border border-slate-800">
        {/* Top Typography */}
        <div className="relative z-10">
          <span className="inline-block rounded-full bg-sky-500/15 border border-sky-400/20 px-3 py-1 text-[11px] font-semibold text-sky-400 tracking-wider uppercase backdrop-blur-xs mb-4">
            Security &amp; Asset Console
          </span>
          <h2 className="text-2xl sm:text-3xl md:text-[32px] font-extrabold text-white leading-[1.2] tracking-tight">
            Convert your ideas into successful business.
          </h2>
          <p className="mt-3.5 text-xs sm:text-sm text-slate-400 leading-relaxed max-w-xs">
            Manage properties, verify owner credentials, audit marketplace inquiries, and streamline platform approvals.
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
        <div className="relative z-10 flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-semibold tracking-wider uppercase text-slate-300">
            Restamp Administration
          </span>
          <span className="text-sky-400 font-mono flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-sky-400 animate-pulse" />
            Active Gateway
          </span>
        </div>
      </div>

      {/* Right Column: Admin Form */}
      <div className="w-full md:w-[54%] flex flex-col justify-center px-2 sm:px-4 py-2">
        {/* Brand Logo & Back to Site */}
        <div className="mb-5 flex items-center justify-between">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/restamp-logo.svg" alt="Restamp" width={149} height={40} className="h-10 w-auto" priority />
            <span className="rounded bg-slate-900 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
              Admin
            </span>
          </Link>
          <Link
            href="/"
            className="text-xs font-semibold text-slate-400 hover:text-[#087ed9] transition"
          >
            ← Main Marketplace
          </Link>
        </div>

        {step === 'mobile' ? (
          <form onSubmit={sendOtp} className="space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Admin Sign In
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Welcome to Restamp — Authorized console authentication
              </p>
            </div>

            <div className="pt-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Registered admin mobile
              </label>
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm focus-within:border-[#087ed9] transition shadow-2xs">
                <Smartphone size={16} className="text-slate-400 shrink-0" />
                <span className="text-slate-600 font-semibold">+91</span>
                <input
                  type="tel"
                  inputMode="numeric"
                  autoFocus
                  placeholder="Enter 10-digit registered mobile"
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
              <span>Get Security OTP</span>
              <ArrowRight size={16} />
            </button>
          </form>
        ) : (
          <form onSubmit={verifyOtp} className="space-y-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Verify Admin OTP
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-slate-500">
                Enter the 6-digit access OTP sent to <span className="font-semibold text-slate-800">+91 {mobile}</span>
              </p>
            </div>

            <p className="rounded-xl bg-sky-50 border border-sky-100 px-3.5 py-2.5 text-center text-xs text-sky-900 font-medium">
              Demo Admin OTP: <span className="font-extrabold tracking-widest text-[#087ed9] ml-1">{DEMO_ADMIN_OTP}</span>
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
              disabled={otp.join('').length < OTP_LENGTH || isVerifying}
              className="inline-flex items-center justify-center w-full rounded-xl bg-[#087ed9] hover:bg-[#0070c9] h-[53px] text-sm font-semibold text-white transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-sm"
            >
              {isVerifying ? 'Authenticating...' : 'Verify & Open Console'}
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
                onClick={() => {
                  setOtp(Array(OTP_LENGTH).fill(''));
                  setError('');
                }}
                className="text-[#087ed9] hover:underline cursor-pointer font-semibold"
              >
                Resend OTP
              </button>
            </div>
          </form>
        )}

        {/* Footer Link */}
        <div className="mt-8 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <Link href="/" className="hover:text-slate-800 hover:underline">
            ← Marketplace
          </Link>
          <Link href="/login" className="text-[#087ed9] hover:underline font-semibold">
            Buyer / Owner Login
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function AdminLoginPage() {
  return (
    <main className="min-h-screen bg-[#0b1622] flex flex-col justify-center items-center px-4 py-8 sm:py-12">
      <Suspense fallback={<div className="text-slate-400 text-sm">Loading Admin Portal...</div>}>
        <AdminLoginForm />
      </Suspense>
    </main>
  );
}
