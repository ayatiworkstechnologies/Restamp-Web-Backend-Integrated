"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Megaphone, Tag, TriangleAlert, Zap } from "lucide-react";
import type { Profile } from "@/lib/profile";
import { getInbox, getReadIds, markRead, useNotificationTick, type InboxItem } from "@/lib/notifications";

const ICON = { announcement: Megaphone, offer: Tag, alert: TriangleAlert, system: Zap } as const;

function ago(iso: string) {
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.round(h / 24)}d ago`;
}

/** Header bell for signed-in users. Shows admin and automatic notifications. */
export function NotificationBell({ profile }: { profile: Profile }) {
  const tick = useNotificationTick();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { items, unread } = useMemo(() => {
    void tick;
    const items: InboxItem[] = getInbox({ role: profile.role, mobile: profile.mobile });
    const readIds = getReadIds();
    return { items, unread: items.filter((i) => !readIds.has(i.id)).length };
  }, [profile.role, profile.mobile, tick]);
  const readIds = useMemo(() => {
    void tick;
    return getReadIds();
  }, [tick]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        onClick={() => setOpen((o) => !o)}
        className="relative flex items-center justify-center rounded-xl p-2.5 text-slate-600 transition hover:bg-slate-100 hover:text-[#087ed9]"
      >
        <Bell size={20} />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#087ed9] px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 z-50 w-[min(360px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <span className="text-sm font-bold text-slate-900">Notifications</span>
            {unread > 0 && (
              <button type="button" onClick={() => markRead(items.map((i) => i.id))} className="inline-flex items-center gap-1 text-xs font-semibold text-[#087ed9] hover:underline">
                <CheckCheck size={14} /> Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-[420px] divide-y divide-slate-100 overflow-y-auto">
            {items.length === 0 && <li className="px-4 py-10 text-center text-sm text-slate-500">You&apos;re all caught up.</li>}
            {items.map((i) => {
              const Icon = ICON[i.kind];
              const isUnread = !readIds.has(i.id);
              const body = (
                <div className={`flex gap-3 px-4 py-3 ${isUnread ? "bg-sky-50/60" : ""} hover:bg-slate-50`}>
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${i.kind === "alert" ? "bg-amber-50 text-amber-600" : i.kind === "offer" ? "bg-rose-50 text-rose-600" : "bg-sky-50 text-[#087ed9]"}`}>
                    <Icon size={15} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className={`text-sm ${isUnread ? "font-bold text-slate-900" : "font-semibold text-slate-700"}`}>{i.title}</span>
                      <span className="shrink-0 text-[11px] text-slate-400">{ago(i.at)}</span>
                    </span>
                    <span className="mt-0.5 block text-xs leading-relaxed text-slate-500">{i.message}</span>
                  </span>
                </div>
              );
              return (
                <li key={i.id} onClick={() => markRead([i.id])}>
                  {i.link ? (
                    <Link href={i.link} onClick={() => setOpen(false)} className="block">
                      {body}
                    </Link>
                  ) : (
                    body
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
