"use client";

import Link from "next/link";
import { Briefcase, CalendarClock, Home, IndianRupee, UserRound, UserCheck } from "lucide-react";
import { StatCard } from "@/components/dashboard/stat-card";
import { useUserStore } from "@/context/user-context";
import { useSubscriptionData, EXPIRING_WINDOW_DAYS } from "@/lib/subscription-store";
import { ROLE_LABEL, type SubscriberRole } from "@/types/subscription";
import { inr } from "@/components/subscriptions/ui";

const ROLE_COLORS: Record<SubscriberRole, string> = { buyer: "#3566e9", owner: "#885CE8", agent: "#0e9fb7" };

/** Subscription KPIs + role and plan distribution, all computed from the stores. */
export function SubscriptionOverview() {
  const { stats } = useUserStore();
  const { ready, subscriptions, payments, plans } = useSubscriptionData();

  const live = subscriptions.filter((s) => s.status === "active" || s.status === "expiring");
  const expiring = subscriptions.filter((s) => s.status === "expiring").length;
  const verifiedRevenue = payments.filter((p) => p.verification === "verified").reduce((a, p) => a + p.total, 0);
  const unverified = payments.filter((p) => p.verification === "unverified").reduce((a, p) => a + p.total, 0);

  const cards = [
    { label: "Total Buyers", value: stats.buyers, icon: UserRound, iconBg: "#EAF1FF", iconColor: "#3869E6", href: "/admin-dashboard/users/buyers" },
    { label: "Total Owners", value: stats.owners, icon: Home, iconBg: "#F0EAFF", iconColor: "#885CE8", href: "/admin-dashboard/users/owners" },
    { label: "Total Agents", value: stats.agents, icon: Briefcase, iconBg: "#E3F7FA", iconColor: "#0e9fb7", href: "/admin-dashboard/users/agents" },
    { label: "Active Subscribers", value: ready ? live.length : "—", icon: UserCheck, iconBg: "#E7F8EF", iconColor: "#25A873", href: "/admin-dashboard/subscriptions/active" },
    { label: "Expiring Subscriptions", value: ready ? expiring : "—", detail: `next ${EXPIRING_WINDOW_DAYS} days`, icon: CalendarClock, iconBg: "#FFF4E3", iconColor: "#ECA037", href: "/admin-dashboard/subscriptions/active" },
    {
      label: "Subscription Revenue",
      value: ready ? inr(verifiedRevenue) : "—",
      detail: unverified ? `verified only · ${inr(unverified)} unverified` : "verified payments only",
      icon: IndianRupee,
      iconBg: "#E7F8EF",
      iconColor: "#25A873",
      href: "/admin-dashboard/subscriptions/payments",
    },
  ];

  const roles: SubscriberRole[] = ["buyer", "owner", "agent"];
  const roleTotals = { buyer: stats.buyers, owner: stats.owners, agent: stats.agents };
  const userTotal = roles.reduce((a, r) => a + roleTotals[r], 0);

  const byPlan = plans
    .map((p) => ({ plan: p, count: live.filter((s) => s.planId === p.id).length }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count);
  const maxPlan = Math.max(1, ...byPlan.map((x) => x.count));

  return (
    <section aria-label="Subscription overview" className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-[16px] font-extrabold tracking-[-0.02em] text-[#1d2b44] sm:text-[17px]">Users & Subscriptions</h2>
          <p className="mt-1 text-xs text-[#9aa7b8]">Live counts from the user directory and subscription records</p>
        </div>
        <Link href="/admin-dashboard/subscriptions/plans" className="text-xs font-bold text-[#2854cb] hover:underline">Manage plans →</Link>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {cards.map((c) => (
          <StatCard key={c.label} label={c.label} value={String(c.value)} detail={c.detail ?? ""} icon={c.icon} iconBg={c.iconBg} iconColor={c.iconColor} href={c.href} />
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <div className="rounded-[18px] border border-[#e9edf4] bg-white p-5 shadow-[0_3px_18px_#15223d06] sm:p-6">
          <h3 className="text-sm font-extrabold text-[#1d2b44]">Role distribution</h3>
          <p className="mt-1 text-xs text-[#9aa7b8]">{userTotal} registered users</p>
          <div className="mt-5 flex h-3 overflow-hidden rounded-full bg-[#eef1f6]" role="img" aria-label={roles.map((r) => `${ROLE_LABEL[r]}s ${roleTotals[r]}`).join(", ")}>
            {roles.map((r) => (
              <div key={r} style={{ width: `${userTotal ? (roleTotals[r] / userTotal) * 100 : 0}%`, background: ROLE_COLORS[r] }} />
            ))}
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {roles.map((r) => {
              const subs = live.filter((s) => s.role === r).length;
              return (
                <div key={r}>
                  <div className="flex items-center gap-1.5 text-[11px] font-semibold text-[#8592a7]">
                    <span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: ROLE_COLORS[r] }} /> {ROLE_LABEL[r]}s
                  </div>
                  <div className="mt-1 text-lg font-extrabold text-[#1e2d47]">{roleTotals[r]}</div>
                  <div className="text-[11px] text-[#a1adbc]">{ready ? `${subs} on a live plan` : "—"}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[18px] border border-[#e9edf4] bg-white p-5 shadow-[0_3px_18px_#15223d06] sm:p-6">
          <h3 className="text-sm font-extrabold text-[#1d2b44]">Live subscriptions by plan</h3>
          <p className="mt-1 text-xs text-[#9aa7b8]">{ready ? `${live.length} live across ${byPlan.length} plan${byPlan.length === 1 ? "" : "s"}` : "Loading…"}</p>
          <div className="mt-4 space-y-2.5">
            {ready && byPlan.length === 0 && <p className="text-xs text-[#a1adbc]">No live subscriptions yet.</p>}
            {byPlan.slice(0, 6).map(({ plan, count }) => (
              <div key={plan.id}>
                <div className="flex justify-between text-[11px]">
                  <span className="font-semibold text-[#34445f]">{plan.name} <span className="text-[#a1adbc]">· {ROLE_LABEL[plan.role]}</span></span>
                  <span className="font-extrabold text-[#1e2d47]">{count}</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-[#eef1f6]">
                  <div className="h-2 rounded-full" style={{ width: `${(count / maxPlan) * 100}%`, background: ROLE_COLORS[plan.role] }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
