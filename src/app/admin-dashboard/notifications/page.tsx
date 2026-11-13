"use client";

import { toast } from "@/lib/notify";
import React, { useEffect, useMemo, useState } from "react";
import { Megaphone, Pause, Play, Send, Tag, Trash2, TriangleAlert } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import {
  Card,
  ConfirmDialog,
  EmptyState,
  Notice,
  btnPrimary,
  btnSecondary,
  fmtDateTime,
  inputCls,
  selectCls,
  useActor,
} from "@/components/subscriptions/ui";
import { useUserStore } from "@/context/user-context";
import {
  RULE_INFO,
  audienceLabel,
  deleteNotification,
  getAdminNotifications,
  getRules,
  isLive,
  saveRules,
  sendNotification,
  setNotificationActive,
  useNotificationTick,
  type AdminNotification,
  type Audience,
  type NotificationKind,
  type NotificationRules,
  type RuleKey,
} from "@/lib/notifications";

const KINDS: { value: NotificationKind; label: string; icon: typeof Megaphone }[] = [
  { value: "announcement", label: "Announcement", icon: Megaphone },
  { value: "offer", label: "Offer", icon: Tag },
  { value: "alert", label: "Alert", icon: TriangleAlert },
];

const blank = { title: "", message: "", kind: "announcement" as NotificationKind, audience: "all" as Audience, userId: "", link: "", expiresDays: "" };

export default function NotificationsPage() {
  const { actor, canManage } = useActor();
  const { users } = useUserStore();
  const tick = useNotificationTick();
  const sent = useMemo(() => {
    void tick;
    return getAdminNotifications();
  }, [tick]);
  const [form, setForm] = useState(blank);
  const [error, setError] = useState("");
  const [rules, setRules] = useState<NotificationRules | null>(null);
  const [rulesError, setRulesError] = useState("");
  const [toDelete, setToDelete] = useState<AdminNotification | null>(null);

  useEffect(() => setRules(getRules()), []);

  const done = (m: string) => {
    toast.success(m);
  };
  const set = <K extends keyof typeof blank>(k: K, v: (typeof blank)[K]) => setForm((f) => ({ ...f, [k]: v }));
  const target = users.find((u) => u.id === form.userId);
  const reach =
    form.audience === "all" ? users.length : form.audience === "user" ? (target ? 1 : 0) : users.filter((u) => u.role === form.audience).length;

  const send = () => {
    if (!actor) return;
    setError("");
    try {
      const days = form.expiresDays.trim() ? Number(form.expiresDays) : null;
      if (days !== null && (!Number.isInteger(days) || days < 1 || days > 365)) throw new Error("Expiry must be 1–365 days, or empty.");
      sendNotification(
        {
          title: form.title,
          message: form.message,
          kind: form.kind,
          audience: form.audience,
          targetPhone: target?.phone,
          targetName: target?.name,
          link: form.link.trim() || undefined,
          expiresAt: days ? new Date(Date.now() + days * 864e5).toISOString() : null,
        },
        actor,
      );
      setForm(blank);
      done("Notification sent.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not send.");
    }
  };

  const toggleRule = (k: RuleKey, v: boolean) => {
    if (!actor || !rules) return;
    const next = { ...rules, [k]: v };
    setRules(next);
    saveRules(next, actor);
  };

  const KindIcon = KINDS.find((k) => k.value === form.kind)!.icon;

  return (
    <AdminShell section="Management" title="Notifications">
      {!canManage && <Notice tone="warn">Read-only: sending notifications and changing rules requires a Super Admin or Operations Manager.</Notice>}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <Card className="p-5">
          <h2 className="text-sm font-extrabold text-[#1f2e48]">Send a notification</h2>
          <p className="mt-1 text-xs text-[#8896aa]">Appears in the bell on the website for signed-in users in the chosen audience.</p>
          <fieldset disabled={!canManage} className="mt-4 grid gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#344560]">Audience</span>
              <select className={`${selectCls} w-full`} value={form.audience} onChange={(e) => set("audience", e.target.value as Audience)}>
                <option value="all">All users</option>
                <option value="buyer">All buyers</option>
                <option value="owner">All owners</option>
                <option value="agent">All agents</option>
                <option value="user">One specific user</option>
              </select>
            </label>
            {form.audience === "user" ? (
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-[#344560]">User</span>
                <select className={`${selectCls} w-full`} value={form.userId} onChange={(e) => set("userId", e.target.value)}>
                  <option value="">Choose a user…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>{u.name} · {u.role} · {u.phone}</option>
                  ))}
                </select>
              </label>
            ) : (
              <label className="block">
                <span className="mb-1 block text-xs font-bold text-[#344560]">Type</span>
                <select className={`${selectCls} w-full`} value={form.kind} onChange={(e) => set("kind", e.target.value as NotificationKind)}>
                  {KINDS.map((k) => <option key={k.value} value={k.value}>{k.label}</option>)}
                </select>
              </label>
            )}
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-bold text-[#344560]">Title</span>
              <input className={inputCls} maxLength={80} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Festive offer on owner plans" />
            </label>
            <label className="block sm:col-span-2">
              <span className="mb-1 block text-xs font-bold text-[#344560]">Message</span>
              <textarea className={inputCls} rows={3} maxLength={300} value={form.message} onChange={(e) => set("message", e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#344560]">Link <span className="font-normal text-[#94a1b5]">optional</span></span>
              <input className={inputCls} value={form.link} onChange={(e) => set("link", e.target.value)} placeholder="/owner/plans" />
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-bold text-[#344560]">Expires after (days) <span className="font-normal text-[#94a1b5]">optional</span></span>
              <input className={inputCls} type="number" min={1} value={form.expiresDays} onChange={(e) => set("expiresDays", e.target.value)} placeholder="Never" />
            </label>
          </fieldset>

          <div className="mt-4 rounded-2xl border border-[#eef1f6] bg-[#fafbfe] p-3">
            <div className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a9b3c5]">Preview</div>
            <div className="flex gap-3 rounded-xl bg-white p-3 shadow-sm">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sky-50 text-[#087ed9]"><KindIcon size={15} /></span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-slate-900">{form.title || "Title"}</div>
                <div className="text-xs text-slate-500">{form.message || "Message"}</div>
              </div>
            </div>
            <p className="mt-2 text-[11px] text-[#8896aa]">Reaches {reach} user{reach === 1 ? "" : "s"} in the directory.</p>
          </div>

          {error && <p className="mt-3 text-xs font-semibold text-red-600">{error}</p>}
          <div className="mt-4 flex justify-end">
            <button type="button" className={btnPrimary} onClick={send} disabled={!canManage}>
              <Send size={14} /> Send notification
            </button>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-extrabold text-[#1f2e48]">Automatic notifications</h2>
          <p className="mt-1 text-xs text-[#8896aa]">Generated from live activity. Turning one off hides it for everyone immediately.</p>
          {rules && (
            <ul className="mt-4 divide-y divide-[#f1f4f9]">
              {(Object.keys(RULE_INFO) as RuleKey[]).map((k) => (
                <li key={k} className="flex items-start justify-between gap-4 py-3">
                  <div>
                    <div className="text-xs font-bold text-[#24324b]">{RULE_INFO[k].label}</div>
                    <div className="text-[11px] text-[#8896aa]">{RULE_INFO[k].desc} · {RULE_INFO[k].who}</div>
                    {k === "subscriptionExpiring" && rules.subscriptionExpiring && (
                      <label className="mt-2 flex items-center gap-2 text-[11px] text-[#4b5b74]">
                        Remind
                        <input
                          type="number"
                          min={1}
                          max={60}
                          disabled={!canManage}
                          className="w-16 rounded-lg border border-[#e2e8f2] px-2 py-1 text-xs"
                          value={rules.expiringDays}
                          onChange={(e) => setRules({ ...rules, expiringDays: Number(e.target.value) })}
                          onBlur={() => {
                            if (!actor) return;
                            try {
                              saveRules(rules, actor);
                              setRulesError("");
                            } catch (err) {
                              setRulesError(err instanceof Error ? err.message : "Invalid value");
                            }
                          }}
                        />
                        days before expiry
                      </label>
                    )}
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={rules[k]}
                    aria-label={RULE_INFO[k].label}
                    disabled={!canManage}
                    onClick={() => toggleRule(k, !rules[k])}
                    className={`relative h-6 w-11 shrink-0 rounded-full transition disabled:opacity-50 ${rules[k] ? "bg-[#087ed9]" : "bg-[#d5dce8]"}`}
                  >
                    <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${rules[k] ? "left-[22px]" : "left-0.5"}`} />
                  </button>
                </li>
              ))}
            </ul>
          )}
          {rulesError && <p className="text-xs font-semibold text-red-600">{rulesError}</p>}
        </Card>
      </div>

      <Card className="overflow-hidden">
        <div className="border-b border-[#f1f4f9] px-5 py-4">
          <h2 className="text-sm font-extrabold text-[#1f2e48]">Sent notifications ({sent.length})</h2>
        </div>
        {sent.length === 0 ? (
          <EmptyState title="Nothing sent yet" hint="Notifications you send appear here. You can pause, resume or delete them." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-xs">
              <thead className="bg-[#fafbfe] text-[10px] font-extrabold uppercase tracking-wider text-[#94a1b5]">
                <tr><th className="px-5 py-3">Notification</th><th className="px-3 py-3">Audience</th><th className="px-3 py-3">Sent</th><th className="px-3 py-3">Expires</th><th className="px-3 py-3">Status</th><th className="px-5 py-3 text-right">Actions</th></tr>
              </thead>
              <tbody className="divide-y divide-[#f1f4f9]">
                {sent.map((n) => {
                  const live = isLive(n);
                  return (
                    <tr key={n.id}>
                      <td className="px-5 py-3">
                        <div className="font-bold text-[#1f2e48]">{n.title}</div>
                        <div className="max-w-md truncate text-[11px] text-[#8090a6]">{n.message}</div>
                        <div className="text-[10px] capitalize text-[#a1adbd]">{n.kind}{n.link ? ` · ${n.link}` : ""}</div>
                      </td>
                      <td className="px-3 py-3">{audienceLabel(n)}</td>
                      <td className="px-3 py-3"><div>{fmtDateTime(n.createdAt)}</div><div className="text-[11px] text-[#8090a6]">{n.createdBy}</div></td>
                      <td className="px-3 py-3">{n.expiresAt ? fmtDateTime(n.expiresAt) : "Never"}</td>
                      <td className="px-3 py-3">
                        <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${live ? "bg-[#eaf9f0] text-[#1ca569]" : "bg-slate-100 text-slate-500"}`}>
                          {live ? "Live" : n.active ? "Expired" : "Paused"}
                        </span>
                      </td>
                      <td className="px-5 py-3">
                        {canManage && actor && (
                          <div className="flex justify-end gap-1.5">
                            <button type="button" className={btnSecondary} onClick={() => setNotificationActive(n.id, !n.active, actor)}>
                              {n.active ? <><Pause size={13} /> Pause</> : <><Play size={13} /> Resume</>}
                            </button>
                            <button type="button" className={btnSecondary} onClick={() => setToDelete(n)} aria-label={`Delete ${n.title}`}>
                              <Trash2 size={13} className="text-red-500" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {toDelete && actor && (
        <ConfirmDialog
          open
          onClose={() => setToDelete(null)}
          title={`Delete "${toDelete.title}"?`}
          body="It disappears from every user's notifications."
          confirmLabel="Delete"
          danger
          onConfirm={() => deleteNotification(toDelete.id, actor)}
        />
      )}
    </AdminShell>
  );
}
