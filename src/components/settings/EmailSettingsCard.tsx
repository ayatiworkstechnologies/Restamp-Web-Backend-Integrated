"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Loader2, Mail, ShieldCheck } from 'lucide-react';
import { useSession } from '@/lib/api/session';
import {
  getEmailStatus,
  removeEmailAddress,
  resendEmailCode,
  saveEmailAddress,
  saveEmailPreferences,
  verifyEmailCode,
} from '@/lib/api/email';
import {
  EMAIL_PREFERENCE_ITEMS,
  MANDATORY_EMAIL_NOTE,
  RESEND_COOLDOWN_SECONDS,
  codeSentMessage,
  emailErrorMessage,
  emailStatusLabel,
  isCodeShape,
  isPlausibleEmail,
  normalizeEmailInput,
  toEmailStatus,
  type EmailAction,
  type EmailStatus,
} from '@/lib/emailSettings';

const DEFAULT_CARD =
  'rounded-2xl border border-slate-100 bg-white p-6 md:p-8 shadow-[0_12px_45px_-10px_rgba(0,0,0,0.1)]';

type Notice = { type: 'success' | 'error'; text: string } | null;

/**
 * Email & notifications (notification system Phase 3) — the ONE web
 * implementation, rendered by the buyer, owner and agent profile pages.
 *
 * Add or change the contact email, verify it with the emailed 6-digit code,
 * and choose optional notification email. Everything shown is the server's
 * confirmed state; failures say so. State is dropped when the signed-in
 * account changes and responses from an earlier account are ignored. A
 * development backend may return `debug_code` (never production); only then a
 * "development code" hint is shown, like the login page's.
 */
export default function EmailSettingsCard({
  className = DEFAULT_CARD,
  onStatus,
}: {
  className?: string;
  onStatus?: (status: EmailStatus | null) => void;
}) {
  const { session } = useSession();
  const userId = session?.userId ?? null;

  const [status, setStatus] = useState<EmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState<EmailAction | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [cooldownUntil, setCooldownUntil] = useState(0);
  const [clock, setClock] = useState(() => Date.now());
  const accountEpoch = useRef(0);
  const loadSeq = useRef(0);

  useEffect(() => {
    accountEpoch.current += 1;
    setStatus(null);
    setEmailInput('');
    setCode('');
    setNotice(null);
    setBusy(null);
    setCooldownUntil(0);
    setLoading(true);
  }, [userId]);

  useEffect(() => {
    onStatus?.(status);
  }, [status, onStatus]);

  const apply = useCallback((raw: unknown) => {
    const next = toEmailStatus(raw);
    setStatus(next);
    setEmailInput(next.email || '');
    return next;
  }, []);

  const load = useCallback(() => {
    if (userId == null) return;
    const epoch = accountEpoch.current;
    const seq = ++loadSeq.current;
    setLoadError('');
    getEmailStatus().then(
      (raw) => {
        if (accountEpoch.current !== epoch || loadSeq.current !== seq) return;
        apply(raw);
        setLoading(false);
      },
      (e) => {
        if (accountEpoch.current !== epoch || loadSeq.current !== seq) return;
        setLoadError(emailErrorMessage(e, 'load'));
        setLoading(false);
      },
    );
  }, [userId, apply]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (cooldownUntil <= Date.now()) return undefined;
    const timer = setInterval(() => setClock(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [cooldownUntil]);
  const cooldownLeft = Math.max(0, Math.ceil((cooldownUntil - clock) / 1000));
  const startCooldown = () => {
    setClock(Date.now());
    setCooldownUntil(Date.now() + RESEND_COOLDOWN_SECONDS * 1000);
  };

  const run = async (action: EmailAction, request: () => Promise<unknown>, onSuccess: (raw: unknown) => void) => {
    if (busy) return;
    const epoch = accountEpoch.current;
    setBusy(action);
    setNotice(null);
    try {
      const raw = await request();
      if (accountEpoch.current !== epoch) return;
      onSuccess(raw);
    } catch (e) {
      if (accountEpoch.current !== epoch) return;
      setNotice({ type: 'error', text: emailErrorMessage(e, action) });
      const statusCode = (e as { status?: number } | null)?.status;
      if (statusCode === 429 && (action === 'save' || action === 'resend')) startCooldown();
    } finally {
      if (accountEpoch.current === epoch) setBusy(null);
    }
  };

  const onSave = (e: React.FormEvent) => {
    e.preventDefault();
    const value = normalizeEmailInput(emailInput);
    if (!isPlausibleEmail(value)) {
      setNotice({ type: 'error', text: 'Please enter a valid email address.' });
      return;
    }
    if (status?.email === value && status.verified) {
      setNotice({ type: 'success', text: 'This address is already verified.' });
      return;
    }
    run('save', () => saveEmailAddress(value), (raw) => {
      const next = apply(raw);
      setCode('');
      if (!next.verified) startCooldown();
      setNotice({ type: 'success', text: codeSentMessage(next) || 'Your email address is saved.' });
    });
  };

  const onVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const value = code.trim();
    if (!isCodeShape(value)) {
      setNotice({ type: 'error', text: 'Enter the 6-digit code from the email.' });
      return;
    }
    run('verify', () => verifyEmailCode(value), (raw) => {
      apply(raw);
      setCode('');
      setNotice({ type: 'success', text: 'Your email address is verified.' });
    });
  };

  const onResend = () =>
    run('resend', resendEmailCode, (raw) => {
      const next = apply(raw);
      startCooldown();
      setNotice({ type: 'success', text: codeSentMessage(next) || 'Your email address is already verified.' });
    });

  const onToggle = (key: keyof EmailStatus['preferences']) => {
    if (!status?.email) return;
    const next = { ...status.preferences, [key]: !status.preferences[key] };
    run('prefs', () => saveEmailPreferences(next), (raw) => {
      apply(raw);
    });
  };

  const onRemove = () => {
    if (!window.confirm('Remove your email address? RESTAMP will stop sending emails to it.')) return;
    run('remove', removeEmailAddress, () => {
      setStatus(toEmailStatus({ delivery_available: status?.deliveryAvailable ?? false }));
      setEmailInput('');
      setCode('');
      setNotice({ type: 'success', text: 'Your email address was removed.' });
    });
  };

  const pending = !!(status?.email && !status.verified);
  const label = emailStatusLabel(status);
  const inputChanged = normalizeEmailInput(emailInput) !== (status?.email || '');
  const badgeClass = status?.verified
    ? 'bg-green-50 text-green-700'
    : status?.email
      ? 'bg-amber-50 text-amber-700'
      : 'bg-slate-100 text-slate-500';

  return (
    <section className={className} aria-labelledby="email-settings-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-[#087ed9]">
            <Mail size={18} />
          </span>
          <div>
            <h2 id="email-settings-title" className="text-lg font-bold text-slate-900">
              Email &amp; notifications
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">Used only for RESTAMP notifications about your account.</p>
          </div>
        </div>
        {!loading && !loadError && (
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>{label}</span>
        )}
      </div>

      {loading && !status ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Loading email settings…
        </p>
      ) : loadError && !status ? (
        <div className="mt-6 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">
          {loadError}{' '}
          <button type="button" onClick={load} className="font-semibold underline cursor-pointer">
            Try again
          </button>
        </div>
      ) : (
        <>
          {notice && (
            <p
              className={`mt-5 rounded-xl px-4 py-3 text-sm ${
                notice.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'
              }`}
              role={notice.type === 'error' ? 'alert' : 'status'}
            >
              {notice.text}
            </p>
          )}

          <form onSubmit={onSave} noValidate className="mt-6 flex flex-col gap-3 sm:flex-row">
            <label className="flex-1">
              <span className="sr-only">Email address</span>
              <input
                type="email"
                value={emailInput}
                maxLength={254}
                autoComplete="email"
                onChange={(e) => {
                  setEmailInput(e.target.value);
                  setNotice(null);
                }}
                placeholder="you@example.com"
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 focus:border-[#087ed9]"
              />
            </label>
            <button
              type="submit"
              disabled={!inputChanged || !!busy}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#087ed9] px-5 h-[44px] text-sm font-semibold text-white hover:bg-[#0670c2] disabled:opacity-50 transition cursor-pointer disabled:cursor-not-allowed"
            >
              {busy === 'save' && <Loader2 size={16} className="animate-spin" />}
              {status?.email ? 'Change email' : 'Save email'}
            </button>
          </form>

          {pending && status && (
            <form onSubmit={onVerify} noValidate className="mt-5 border-t border-slate-100 pt-5">
              <p className="text-sm font-semibold text-slate-900">Verify {status.email}</p>
              <p className="mt-1 text-sm text-slate-500">
                Enter the 6-digit code we emailed you. The code expires after 15 minutes.
              </p>
              {!status.deliveryAvailable && !status.debugCode && (
                <p className="mt-2 text-sm text-amber-700">
                  Email delivery isn&apos;t switched on yet, so codes can&apos;t be sent right now. Your address is saved.
                </p>
              )}
              {status.debugCode && (
                <button
                  type="button"
                  onClick={() => setCode(status.debugCode || '')}
                  className="mt-2 text-sm font-semibold text-[#087ed9] cursor-pointer"
                >
                  Development code: {status.debugCode} • Click to fill
                </button>
              )}
              <div className="mt-3 flex flex-col gap-3 sm:flex-row">
                <input
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  value={code}
                  maxLength={6}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="6-digit code"
                  aria-label="Verification code"
                  className="w-full sm:w-44 rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm tracking-[0.3em] text-slate-900 outline-none placeholder:tracking-normal placeholder:text-slate-400 focus:border-[#087ed9]"
                />
                <button
                  type="submit"
                  disabled={!isCodeShape(code) || !!busy}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#087ed9] px-5 h-[44px] text-sm font-semibold text-white hover:bg-[#0670c2] disabled:opacity-50 transition cursor-pointer disabled:cursor-not-allowed"
                >
                  {busy === 'verify' && <Loader2 size={16} className="animate-spin" />}
                  Verify
                </button>
                <button
                  type="button"
                  onClick={onResend}
                  disabled={cooldownLeft > 0 || !!busy}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-sky-200 bg-sky-50 px-5 h-[44px] text-sm font-semibold text-[#087ed9] hover:bg-sky-100 disabled:opacity-50 transition cursor-pointer disabled:cursor-not-allowed"
                >
                  {busy === 'resend' && <Loader2 size={16} className="animate-spin" />}
                  {cooldownLeft > 0 ? `Resend in ${cooldownLeft}s` : 'Resend code'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Bell size={16} className="text-slate-400" /> Email notifications
              </p>
              {busy === 'prefs' && <Loader2 size={16} className="animate-spin text-[#087ed9]" />}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {status?.email
                ? status.verified
                  ? 'Choose which updates you also get by email.'
                  : 'Emails start once your address is verified.'
                : 'Add an email address to choose email notifications.'}
            </p>
            <ul className="mt-3 divide-y divide-slate-100">
              {EMAIL_PREFERENCE_ITEMS.map((item) => {
                const on = !!status?.preferences[item.key];
                return (
                  <li key={item.key} className="flex items-center justify-between gap-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{item.label}</p>
                      <p className="text-xs text-slate-500">{item.hint}</p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={on}
                      aria-label={item.label}
                      disabled={!status?.email || !!busy}
                      onClick={() => onToggle(item.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                        on ? 'bg-[#087ed9]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${on ? 'translate-x-5' : 'translate-x-0.5'}`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 flex items-start gap-2 text-xs text-slate-500">
              <ShieldCheck size={14} className="mt-0.5 shrink-0 text-slate-400" />
              {MANDATORY_EMAIL_NOTE}
            </p>
          </div>

          {status?.email && (
            <button
              type="button"
              onClick={onRemove}
              disabled={!!busy}
              className="mt-4 text-sm font-semibold text-red-500 hover:text-red-600 disabled:opacity-50 cursor-pointer"
            >
              Remove email address
            </button>
          )}
        </>
      )}
    </section>
  );
}
