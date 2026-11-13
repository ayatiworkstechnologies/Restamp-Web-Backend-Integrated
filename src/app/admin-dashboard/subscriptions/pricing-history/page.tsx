"use client";

import React, { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { Card, EmptyState, Pagination, RoleBadge, TableSkeleton, fmtDateTime, inr, selectCls, usePaged } from "@/components/subscriptions/ui";
import { useSubscriptionData } from "@/lib/subscription-store";
import { ROLE_LABEL, type SubscriberRole } from "@/types/subscription";

export default function PricingHistoryPage() {
  const { ready, history, audit, plans } = useSubscriptionData();
  const [tab, setTab] = useState<"pricing" | "audit">("pricing");
  const [role, setRole] = useState<"all" | SubscriberRole>("all");
  const [plan, setPlan] = useState("all");

  const rows = useMemo(
    () => history.filter((h) => (role === "all" || h.role === role) && (plan === "all" || h.planId === plan)),
    [history, role, plan],
  );
  const pagedHistory = usePaged(rows, `${role}|${plan}`);
  const pagedAudit = usePaged(audit, "audit");

  return (
    <AdminShell section="Subscription Management" title="Pricing History">
      <div role="tablist" className="inline-flex gap-1 rounded-2xl bg-white p-1 shadow-sm ring-1 ring-[#e9edf4]">
        {(["pricing", "audit"] as const).map((t) => (
          <button
            key={t}
            role="tab"
            type="button"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={`rounded-xl px-4 py-2 text-xs font-bold transition ${tab === t ? "bg-[#087ed9] text-white" : "text-[#6f7e95] hover:text-[#24324b]"}`}
          >
            {t === "pricing" ? `Plan changes (${history.length})` : `Admin audit log (${audit.length})`}
          </button>
        ))}
      </div>

      {tab === "pricing" ? (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap gap-3 border-b border-[#f1f4f9] p-4">
            <select aria-label="Role" className={selectCls} value={role} onChange={(e) => { setRole(e.target.value as typeof role); setPlan("all"); }}>
              <option value="all">All roles</option>
              {(["buyer", "owner", "agent"] as const).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
            </select>
            <select aria-label="Plan" className={selectCls} value={plan} onChange={(e) => setPlan(e.target.value)}>
              <option value="all">All plans</option>
              {plans.filter((p) => role === "all" || p.role === role).map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          {!ready ? (
            <TableSkeleton />
          ) : rows.length === 0 ? (
            <EmptyState title="No plan changes recorded yet" hint="Every create, edit, price change, publish, pause and archive is recorded here with the admin and time." />
          ) : (
            <ul className="divide-y divide-[#f1f4f9]">
              {pagedHistory.slice.map((h) => (
                <li key={h.id} className="p-4 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <RoleBadge role={h.role} />
                    <span className="font-extrabold text-[#1f2e48]">{h.planName}</span>
                    <span className="text-[#8896aa]">{h.fromVersion ? `v${h.fromVersion} → v${h.toVersion}` : `created v${h.toVersion}`}</span>
                    <span className="ml-auto text-[#8896aa]">{h.changedBy} · {fmtDateTime(h.changedAt)}</span>
                  </div>
                  {h.oldPrice !== h.newPrice && (
                    <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#fffbeb] px-2.5 py-1 font-bold text-[#92400e]">
                      {h.oldPrice === null ? "Price set" : <><span className="line-through opacity-70">{inr(h.oldPrice)}</span><ArrowRight size={12} /></>}
                      <span>{inr(h.newPrice)}</span>
                    </div>
                  )}
                  {h.changes.filter((c) => c.field !== "price").length > 0 && (
                    <ul className="mt-2 space-y-0.5 text-[#4b5b74]">
                      {h.changes.filter((c) => c.field !== "price").map((c) => (
                        <li key={c.field}><span className="font-semibold">{c.field}</span>: {h.fromVersion ? <><span className="text-slate-400 line-through">{c.from}</span> → </> : null}{c.to}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
            </ul>
          )}
          <Pagination {...pagedHistory} />
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {!ready ? (
            <TableSkeleton />
          ) : audit.length === 0 ? (
            <EmptyState title="No admin actions recorded yet" hint="Plan changes, subscription status changes and account suspensions are logged here." />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-xs">
                <thead className="bg-[#fafbfe] text-[10px] font-extrabold uppercase tracking-wider text-[#94a1b5]">
                  <tr><th className="px-4 py-3">When</th><th className="px-3 py-3">Admin</th><th className="px-3 py-3">Action</th><th className="px-3 py-3">Target</th><th className="px-4 py-3">Details</th></tr>
                </thead>
                <tbody className="divide-y divide-[#f1f4f9]">
                  {pagedAudit.slice.map((a) => (
                    <tr key={a.id}>
                      <td className="whitespace-nowrap px-4 py-3">{fmtDateTime(a.at)}</td>
                      <td className="px-3 py-3"><div className="font-semibold">{a.actor}</div><div className="text-[11px] text-[#8090a6]">{a.actorRole}</div></td>
                      <td className="px-3 py-3 font-semibold">{a.action}</td>
                      <td className="px-3 py-3">{a.target}</td>
                      <td className="px-4 py-3 text-[#4b5b74]">{a.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <Pagination {...pagedAudit} />
        </Card>
      )}
    </AdminShell>
  );
}
