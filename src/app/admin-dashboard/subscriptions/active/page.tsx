"use client";

import React, { useMemo, useState } from "react";
import { Ban, RotateCcw, Search, X } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import {
  Card,
  ConfirmDialog,
  EmptyState,
  Notice,
  Pagination,
  PaymentBadge,
  RoleBadge,
  SeedTag,
  SubscriptionBadge,
  TableSkeleton,
  btnSecondary,
  fmtDate,
  inr,
  limitLabel,
  selectCls,
  useActor,
  usePaged,
} from "@/components/subscriptions/ui";
import { EXPIRING_WINDOW_DAYS, setSubscriptionAdminStatus, useSubscriptionData, type SubscriptionView } from "@/lib/subscription-store";
import { remaining, usageFor } from "@/lib/subscription-usage";
import { useUserStore } from "@/context/user-context";
import { usePropertyStore } from "@/context/property-context";
import { BILLING_LABEL, ROLE_LABEL, type SubscriberRole, type SubscriptionStatus } from "@/types/subscription";

const STATUSES: SubscriptionStatus[] = ["active", "expiring", "expired", "cancelled", "suspended"];

export default function ActiveSubscriptionsPage() {
  const { ready, subscriptions, plans } = useSubscriptionData();
  const { users } = useUserStore();
  const { properties } = usePropertyStore();
  const { actor, canManage } = useActor();
  const [role, setRole] = useState<"all" | SubscriberRole>("all");
  const [plan, setPlan] = useState("all");
  const [status, setStatus] = useState<"all" | SubscriptionStatus>("all");
  const [q, setQ] = useState("");
  const [target, setTarget] = useState<{ sub: SubscriptionView; to: "suspended" | "cancelled" | null } | null>(null);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return subscriptions.filter((x) => {
      if (role !== "all" && x.role !== role) return false;
      if (plan !== "all" && x.planId !== plan) return false;
      if (status !== "all" && x.status !== status) return false;
      if (s && !`${x.subscriberName} ${x.subscriberPhone} ${x.id}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [subscriptions, role, plan, status, q]);
  const paged = usePaged(filtered, `${role}|${plan}|${status}|${q}`);
  const planOptions = plans.filter((p) => role === "all" || p.role === role);
  const hasFilters = role !== "all" || plan !== "all" || status !== "all" || q;

  const summary = {
    live: subscriptions.filter((s) => s.status === "active" || s.status === "expiring").length,
    expiring: subscriptions.filter((s) => s.status === "expiring").length,
    expired: subscriptions.filter((s) => s.status === "expired").length,
    unverified: subscriptions.filter((s) => (s.status === "active" || s.status === "expiring") && s.payment?.verification === "unverified").length,
  };

  return (
    <AdminShell section="Subscription Management" title="Active Subscriptions">
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          ["Live subscriptions", summary.live],
          [`Expiring in ${EXPIRING_WINDOW_DAYS} days`, summary.expiring],
          ["Expired", summary.expired],
          ["Live with unverified payment", summary.unverified],
        ].map(([k, v]) => (
          <Card key={k as string} className="p-4">
            <div className="text-[12px] font-semibold text-[#8896aa]">{k}</div>
            <div className="mt-1 text-[26px] font-extrabold tracking-[-0.04em] text-[#16233d]">{ready ? v : "—"}</div>
          </Card>
        ))}
      </div>

      {summary.unverified > 0 && (
        <Notice tone="warn">
          {summary.unverified} live subscription{summary.unverified === 1 ? " was" : "s were"} activated without a verified payment. That's either seed data
          or the test checkout, because no payment gateway is connected yet. See PAYMENTS.md for what's needed.
        </Notice>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#f1f4f9] p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9da9bc]" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search subscriber, phone or ID" className="w-full rounded-xl border border-[#e2e8f2] bg-[#fbfcfe] py-2 pl-9 pr-3 text-xs outline-none focus:border-[#087ed9]" />
          </div>
          <select aria-label="Role" className={selectCls} value={role} onChange={(e) => { setRole(e.target.value as typeof role); setPlan("all"); }}>
            <option value="all">All roles</option>
            {(["buyer", "owner", "agent"] as const).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
          <select aria-label="Plan" className={selectCls} value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="all">All plans</option>
            {planOptions.map((p) => <option key={p.id} value={p.id}>{p.name} ({ROLE_LABEL[p.role]})</option>)}
          </select>
          <select aria-label="Status" className={selectCls} value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
            <option value="all">All statuses</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {hasFilters && (
            <button type="button" className="inline-flex items-center gap-1 text-xs font-bold text-[#087ed9]" onClick={() => { setRole("all"); setPlan("all"); setStatus("all"); setQ(""); }}>
              <X size={13} /> Clear
            </button>
          )}
        </div>
        {!ready ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState title="No subscriptions match" hint={hasFilters ? "Try clearing a filter." : "Subscriptions appear here after a checkout."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1080px] text-left text-xs">
              <thead className="bg-[#fafbfe] text-[10px] font-extrabold uppercase tracking-wider text-[#94a1b5]">
                <tr>
                  <th className="px-4 py-3">Subscriber</th>
                  <th className="px-3 py-3">Plan</th>
                  <th className="px-3 py-3">Price paid</th>
                  <th className="px-3 py-3">Billing</th>
                  <th className="px-3 py-3">Activated</th>
                  <th className="px-3 py-3">Expiry</th>
                  <th className="px-3 py-3">Status</th>
                  <th className="px-3 py-3">Payment</th>
                  <th className="px-3 py-3">Usage / remaining</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f4f9]">
                {paged.slice.map((s) => (
                  <tr key={s.id} className="hover:bg-[#fafcff]">
                    <td className="px-4 py-3">
                      <div className="font-bold text-[#1f2e48]">{s.subscriberName}</div>
                      <div className="mt-0.5 flex items-center gap-1"><RoleBadge role={s.role} />{s.source === "seed" && <SeedTag />}</div>
                      <div className="text-[11px] text-[#8090a6]">{s.subscriberPhone || "—"}</div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-semibold text-[#24324b]">{s.snapshot.name}</div>
                      <div className="text-[11px] text-[#8090a6]">v{s.snapshot.version} · list {s.snapshot.price === 0 ? "free" : inr(s.snapshot.price)}</div>
                    </td>
                    <td className="px-3 py-3 font-semibold">{inr(s.amountPaid)} <span className="text-[10px] text-[#8090a6]">{s.currency}</span></td>
                    <td className="px-3 py-3">{BILLING_LABEL[s.snapshot.billingCycle]}</td>
                    <td className="px-3 py-3">{fmtDate(s.activatedAt)}</td>
                    <td className="px-3 py-3">{fmtDate(s.expiresAt, "No expiry")}</td>
                    <td className="px-3 py-3"><SubscriptionBadge status={s.status} /></td>
                    <td className="px-3 py-3">{s.payment ? <PaymentBadge status={s.payment.verification} /> : "—"}</td>
                    <td className="px-3 py-3">
                      {usageFor(s, users, properties).map((u) => {
                        const left = remaining(u);
                        return (
                          <div key={u.key}>
                            {u.label}: <span className="font-bold">{u.used}</span>/{limitLabel(u.limit)}
                            <span className={`ml-1 ${left === 0 ? "text-red-600" : "text-[#8090a6]"}`}>({left === Infinity ? "∞" : left} left)</span>
                          </div>
                        );
                      })}
                    </td>
                    <td className="px-4 py-3">
                      {canManage && (
                        <div className="flex justify-end gap-1.5">
                          {s.status === "suspended" || s.status === "cancelled" ? (
                            <button type="button" className={btnSecondary} onClick={() => setTarget({ sub: s, to: null })}><RotateCcw size={13} /> Restore</button>
                          ) : s.status !== "expired" ? (
                            <>
                              <button type="button" className={btnSecondary} onClick={() => setTarget({ sub: s, to: "suspended" })}><Ban size={13} /> Suspend</button>
                              <button type="button" className={btnSecondary} onClick={() => setTarget({ sub: s, to: "cancelled" })}><X size={13} className="text-red-500" /> Cancel</button>
                            </>
                          ) : null}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination {...paged} />
      </Card>

      {target && actor && (
        <ConfirmDialog
          open
          onClose={() => setTarget(null)}
          title={
            target.to === null
              ? `Restore ${target.sub.subscriberName}'s subscription?`
              : `${target.to === "cancelled" ? "Cancel" : "Suspend"} ${target.sub.subscriberName}'s subscription?`
          }
          body={
            target.to === null
              ? "The subscription returns to its normal status based on its expiry date."
              : target.to === "cancelled"
                ? "Access ends now. No refund is issued from here. Refunds must go through the payment provider."
                : "Access is paused until restored. The expiry date does not change."
          }
          confirmLabel={target.to === null ? "Restore" : target.to === "cancelled" ? "Cancel subscription" : "Suspend"}
          danger={target.to !== null}
          requireReason
          onConfirm={(reason) => setSubscriptionAdminStatus(target.sub.id, target.to, reason, actor)}
        />
      )}
    </AdminShell>
  );
}
