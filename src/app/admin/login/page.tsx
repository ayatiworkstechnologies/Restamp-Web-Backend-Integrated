"use client";

import { Suspense, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { Smartphone, ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useAdminAuth } from '@/context/admin-auth-context';
import { safeInternalPath } from '@/lib/safeRedirect';
import { OTP_LENGTH, useOtpLogin } from '@/lib/useOtpLogin';

/**
 * Admin sign-in uses the same mobile OTP login as everyone else; admin
 * access is then decided by the backend (GET /admin/me). There are no
 * preset admins, demo codes or client-side role grants.
 */
function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectUrl = safeInternalPath(searchParams.get('redirect')) || '/admin-dashboard';
  const { isAuthenticated, isLoading, accessError, refresh } = useAdminAuth();

  const login = useOtpLogin();
  const { step, mobile, setMobile, otp, error, setError, busy, debugCode, otpRefs, changeOtp, otpKeyDown, pasteOtp } = login;
  const isVerifying = busy;

  // Already an admin: go straight to the console.
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push(redirectUrl);
    }
  }, [isAuthenticated, isLoading, router, redirectUrl]);

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    await login.sendCode();
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const session = await login.verifyCode();
    if (!session) return;
    const admin = await refresh();
    if (admin) router.push(redirectUrl);
    else setError('Signed in, but this account does not have admin access.');
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
            <Image
              src="/restamplogo.svg"
              alt="Restamp Logo"
              width={34}
              height={34}
              className="h-8.5 w-8.5 object-contain"
              priority
            />
            <span className="text-slate-900 font-bold text-lg tracking-tight">
              Re<span className="text-[#087ed9]">stamp</span>
            </span>
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
              <div className="flex items-center gap-2.5 rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-sm focus-within:border-[#087ed9] focus-within:ring-2 focus-within:ring-[#087ed9]/20 transition shadow-2xs">
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

            {(error || accessError) && <p className="text-xs text-red-500 font-medium" role="alert">{error || accessError}</p>}

            <button
              type="submit"
              disabled={busy}
              className="w-full rounded-xl bg-[#087ed9] hover:bg-[#0070c9] py-3 text-sm font-semibold text-white transition shadow-sm hover:shadow-md cursor-pointer flex items-center justify-center gap-2 active:scale-[0.99] disabled:opacity-60"
            >
              {busy && <Loader2 size={16} className="animate-spin" />}
              <span>{busy ? 'Sending…' : 'Get Security OTP'}</span>
              {!busy && <ArrowRight size={16} />}
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

            {debugCode && (
              <p className="rounded-xl bg-amber-50 border border-amber-100 px-3.5 py-2.5 text-center text-xs text-amber-900 font-medium">
                Test mode code from the server: <span className="font-extrabold tracking-widest ml-1">{debugCode}</span>
              </p>
            )}

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
                  className="h-12 w-12 rounded-xl border border-slate-200 bg-slate-50 text-center text-lg font-bold text-slate-900 outline-none focus:border-[#087ed9] focus:bg-white focus:ring-2 focus:ring-[#087ed9]/20 transition"
                />
              ))}
            </div>

            {error && <p className="text-xs text-red-500 font-medium">{error}</p>}

            <button
              type="submit"
              disabled={otp.join('').length < OTP_LENGTH || isVerifying}
              className="w-full rounded-xl bg-[#087ed9] hover:bg-[#0070c9] py-3 text-sm font-semibold text-white transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed shadow-sm"
            >
              {isVerifying ? 'Authenticating...' : 'Verify & Open Console'}
            </button>

            <div className="flex items-center justify-between text-xs pt-1">
              <button
                type="button"
                onClick={login.backToMobile}
                className="flex items-center gap-1 text-slate-500 hover:text-slate-800 cursor-pointer font-medium"
              >
                <ArrowLeft size={13} /> Change number
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => void login.sendCode()}
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
