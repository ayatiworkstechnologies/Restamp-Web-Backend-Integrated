'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Bell, Loader2, Smartphone } from 'lucide-react';
import { useSession } from '@/lib/api/session';
import { getPushStatus, savePushPreferences } from '@/lib/api/push';
import {
  PUSH_PREFERENCE_ITEMS,
  PUSH_UNAVAILABLE_NOTE,
  pushDevicesLine,
  pushErrorMessage,
  toPushStatus,
  type PushAction,
  type PushStatus,
} from '@/lib/pushSettings';

const DEFAULT_CARD =
  'rounded-2xl border border-slate-100 bg-white p-6 md:p-8 shadow-[0_12px_45px_-10px_rgba(0,0,0,0.1)]';

type Notice = { type: 'success' | 'error'; text: string } | null;

/**
 * Push notifications (notification system Phase 4) — the ONE web
 * implementation, rendered by the buyer, owner and agent profile pages.
 *
 * Preference-only: the website shows and changes the account's push
 * preferences, which the mobile app's registered devices follow. It never
 * registers a browser as a push device and never handles a push token.
 * Everything shown is the server's confirmed state; failures say so. State
 * is dropped when the signed-in account changes and responses from an
 * earlier account are ignored. Push preferences are INDEPENDENT of email
 * and in-app preferences (a separate backend switch set).
 */
export default function PushSettingsCard({ className = DEFAULT_CARD }: { className?: string }) {
  const { session } = useSession();
  const userId = session?.userId ?? null;

  const [status, setStatus] = useState<PushStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState<PushAction | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const accountEpoch = useRef(0);
  const loadSeq = useRef(0);

  useEffect(() => {
    accountEpoch.current += 1;
    setStatus(null);
    setNotice(null);
    setBusy(null);
    setLoading(true);
  }, [userId]);

  const load = useCallback(() => {
    if (userId == null) return;
    const epoch = accountEpoch.current;
    const seq = ++loadSeq.current;
    setLoadError('');
    getPushStatus().then(
      (raw) => {
        if (accountEpoch.current !== epoch || loadSeq.current !== seq) return;
        setStatus(toPushStatus(raw));
        setLoading(false);
      },
      (e) => {
        if (accountEpoch.current !== epoch || loadSeq.current !== seq) return;
        setLoadError(pushErrorMessage(e, 'load'));
        setLoading(false);
      },
    );
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  const onToggle = (key: keyof PushStatus['preferences']) => {
    if (!status || !status.available) return;
    const base = status;
    const next = { ...status.preferences, [key]: !status.preferences[key] };
    const epoch = accountEpoch.current;
    if (busy) return;
    setStatus({ ...status, preferences: next });
    setBusy('prefs');
    setNotice(null);
    savePushPreferences(next).then(
      (raw) => {
        if (accountEpoch.current !== epoch) return;
        setStatus(toPushStatus(raw));
        setBusy(null);
      },
      (e) => {
        if (accountEpoch.current !== epoch) return;
        setStatus(base); // revert the optimistic switch
        setNotice({ type: 'error', text: pushErrorMessage(e, 'prefs') });
        setBusy(null);
      },
    );
  };

  const devicesLine = pushDevicesLine(status);
  const dormant = !!(status && !status.available);

  return (
    <section className={className} aria-labelledby="push-settings-title">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-50 text-[#087ed9]">
            <Bell size={18} />
          </span>
          <div>
            <h2 id="push-settings-title" className="text-lg font-bold text-slate-900">
              Push notifications
            </h2>
            <p className="mt-0.5 text-sm text-slate-500">
              Mobile push alerts, independent of your email notification choices.
            </p>
          </div>
        </div>
        {!loading && !loadError && dormant && (
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-500">Not available yet</span>
        )}
      </div>

      {loading && !status ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-slate-500">
          <Loader2 size={16} className="animate-spin" /> Loading notification settings…
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

          {dormant && (
            <p className="mt-5 rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">{PUSH_UNAVAILABLE_NOTE}</p>
          )}

          <div className="mt-6 border-t border-slate-100 pt-5">
            <div className="flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Bell size={16} className="text-slate-400" /> Push alerts
              </p>
              {busy === 'prefs' && <Loader2 size={16} className="animate-spin text-[#087ed9]" />}
            </div>
            <p className="mt-1 text-sm text-slate-500">
              {status?.available
                ? 'Choose which alerts reach your signed-in mobile devices.'
                : 'Choose which alerts should reach your mobile devices once push is switched on.'}
            </p>
            <ul className="mt-3 divide-y divide-slate-100">
              {PUSH_PREFERENCE_ITEMS.map((item) => {
                const on = !!status?.preferences[item.key];
                const disabled = !status || !status.available || !!busy;
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
                      disabled={disabled}
                      onClick={() => onToggle(item.key)}
                      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 ${
                        on && status?.available ? 'bg-[#087ed9]' : 'bg-slate-300'
                      }`}
                    >
                      <span
                        className={`inline-block h-5 w-5 rounded-full bg-white shadow transition ${
                          on && status?.available ? 'translate-x-5' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </li>
                );
              })}
            </ul>
            <p className="mt-3 flex items-start gap-2 text-xs text-slate-500">
              <Smartphone size={14} className="mt-0.5 shrink-0 text-slate-400" />
              {devicesLine || 'Alerts are delivered to devices signed in to the RESTAMP mobile app.'}
            </p>
          </div>
        </>
      )}
    </section>
  );
}
