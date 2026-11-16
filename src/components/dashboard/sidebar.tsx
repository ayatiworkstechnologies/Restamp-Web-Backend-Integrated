"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Bell,
  Briefcase,
  Building2,
  CalendarCheck,
  ClipboardCheck,
  FileText,
  History,
  Home,
  Layers,
  LayoutDashboard,
  LogOut,
  MessageSquareText,
  Settings2,
  ShieldCheck,
  UserRound,
  UsersRound,
  ExternalLink,
  X,
  type LucideIcon,
} from "lucide-react";
import { usePropertyStore } from "@/context/property-context";
import { useEnquiryStore } from "@/context/enquiry-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import type { AdminPermission } from "@/lib/api/admin";

type BadgeKey = "pendingApprovals" | "openEnquiries";

interface NavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  badge?: BadgeKey;
  planned?: boolean;
  /** Admin permission the section needs (checked again by the backend). */
  permission?: AdminPermission;
  /** Marks modules added in the subscription release. */
  isNew?: boolean;
  /** "exact" = only this path; default also matches sub-paths. */
  match?: "exact" | "prefix";
}

const navGroups: {
  group: string;
  links: NavItem[];
}[] = [
  {
    group: "WORKSPACE",
    links: [
      { label: "Dashboard Overview", href: "/admin-dashboard", icon: LayoutDashboard, match: "exact" },
      { label: "Properties", href: "/admin-dashboard/properties", icon: Building2, badge: "pendingApprovals", permission: "properties.view" },
      { label: "Approvals", href: "/admin-dashboard/properties?tab=approvals", icon: ClipboardCheck, badge: "pendingApprovals", permission: "properties.view" },
      { label: "Enquiries", href: "/admin-dashboard/enquiries", icon: MessageSquareText, badge: "openEnquiries", permission: "enquiries.view" },
      { label: "Analytics", href: "/admin-dashboard/analytics", icon: BarChart3, permission: "reports.view" },
    ],
  },
  {
    group: "USER MANAGEMENT",
    links: [
      { label: "All Users", href: "/admin-dashboard/users", icon: UsersRound, match: "exact", permission: "users.view" },
      { label: "Buyers", href: "/admin-dashboard/users/buyers", icon: UserRound, permission: "users.view" },
      { label: "Owners", href: "/admin-dashboard/users/owners", icon: Home, permission: "users.view" },
      { label: "Agents", href: "/admin-dashboard/users/agents", icon: Briefcase, permission: "users.view" },
    ],
  },
  {
    group: "SUBSCRIPTION MANAGEMENT",
    links: [
      // Admin-wide billing APIs do not exist yet: these pages show honest
      // "not available yet" states (no browser-stored or seeded records).
      { label: "Subscription Plans", href: "/admin-dashboard/subscriptions/plans", icon: Layers },
      { label: "Active Subscriptions", href: "/admin-dashboard/subscriptions/active", icon: CalendarCheck },
      { label: "Payments & Invoices", href: "/admin-dashboard/subscriptions/payments", icon: FileText },
      { label: "Pricing History", href: "/admin-dashboard/subscriptions/pricing-history", icon: History },
    ],
  },
  {
    group: "MANAGEMENT",
    links: [
      { label: "Notifications", href: "/admin-dashboard/notifications", icon: Bell },
      { label: "Settings", href: "/admin-dashboard/settings", icon: Settings2 },
    ],
  },
];

function SidebarNavContent({ onClose }: { onClose: () => void }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentTab = searchParams ? searchParams.get("tab") : null;
  const { stats: propStats } = usePropertyStore();
  const { stats: enquiryStats } = useEnquiryStore();
  const { can } = useAdminAuth();

  const isLinkActive = (item: NavItem) => {
    if (!item.href) return false;
    const [path, query] = item.href.split("?");
    if (query) return pathname === path && currentTab === new URLSearchParams(query).get("tab");
    // Properties stays inactive while the Approvals tab is open.
    if (item.label === "Properties") return pathname === path && currentTab !== "approvals";
    if (item.match === "exact") return pathname === path;
    return pathname === path || pathname.startsWith(`${path}/`);
  };

  const badgeCount: Record<BadgeKey, number> = {
    pendingApprovals: propStats.pending,
    openEnquiries: enquiryStats.active,
  };

  return (
    <div className="flex-1 space-y-6 overflow-y-auto px-4 py-5">
      {navGroups.map((section) => (
        <div key={section.group}>
          <div className="mb-2 px-3 text-[10px] font-extrabold tracking-[0.18em] text-[#a9b3c5]">
            {section.group}
          </div>
          <nav aria-label={section.group} className="space-y-1">
            {section.links.map((item) => {
              const Icon = item.icon;
              const active = isLinkActive(item);
              const pendingCount = item.badge ? badgeCount[item.badge] : 0;

              if (item.href && !item.planned && (!item.permission || can(item.permission))) {
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    onClick={onClose}
                    aria-current={active ? "page" : undefined}
                    className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-semibold transition-all ${
                      active
                        ? "bg-[#087ed9] text-white font-bold shadow-sm shadow-[#087ed9]/25"
                        : "text-slate-600 hover:bg-sky-50/60 hover:text-[#087ed9]"
                    }`}
                  >
                    <Icon
                      size={18}
                      strokeWidth={active ? 2.2 : 1.8}
                      className={active ? "text-white" : "text-slate-400 group-hover:text-[#087ed9]"}
                    />
                    <span className="flex-1">{item.label}</span>
                    {pendingCount > 0 && (
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${
                          active
                            ? "bg-white/25 text-white"
                            : item.badge === "pendingApprovals"
                            ? "bg-[#fef3c7] text-[#b45309]"
                            : item.label === "Enquiries"
                            ? "bg-sky-100 text-[#087ed9]"
                            : "bg-sky-50 text-[#087ed9]"
                        }`}
                      >
                        {pendingCount}
                      </span>
                    )}
                    {item.isNew && !active && pendingCount === 0 && (
                      <span className="rounded-full bg-[#eaf9f0] px-1.5 py-0.5 text-[9px] font-extrabold text-[#1ca569]">New</span>
                    )}
                    {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </Link>
                );
              }

              return (
                <button
                  key={item.label}
                  disabled
                  title={item.planned ? `${item.label}: will be built in a later phase` : `${item.label}: your admin role does not include this`}
                  className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-[13px] font-semibold text-slate-400 opacity-60 cursor-not-allowed"
                >
                  <Icon size={18} strokeWidth={1.8} />
                  <span className="flex-1">{item.label}</span>
                  <span className="text-[9px] font-medium text-slate-300">{item.planned ? "Soon" : "No access"}</span>
                </button>
              );
            })}
          </nav>
        </div>
      ))}

      {/* Quick link to live public site */}
      <div className="pt-2">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/80 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:border-slate-300 hover:bg-slate-100 hover:text-slate-900 transition"
        >
          <span className="flex items-center gap-2">
            <Building2 size={14} className="text-[#087ed9]" />
            View Marketplace
          </span>
          <ExternalLink size={12} className="text-slate-400" />
        </Link>
      </div>
    </div>
  );
}

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { admin, logout } = useAdminAuth();

  return (
    <>
      {open && (
        <button
          aria-label="Close navigation"
          className="fixed inset-0 z-30 bg-slate-950/40 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-[272px] flex-col border-r border-slate-100 bg-white transition-transform duration-200 lg:translate-x-0 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        {/* Brand header */}
        <div className="flex h-[88px] items-center justify-between border-b border-slate-100 px-6">
          <Link href="/admin-dashboard" className="flex items-center gap-2.5">
            <div>
              <Image src="/restamp-logo.svg" alt="Restamp" width={134} height={36} className="h-9 w-auto" priority />
              <span className="inline-block mt-0.5 rounded bg-sky-50 px-1.5 py-0.2 text-[9px] font-bold uppercase tracking-wider text-[#087ed9] border border-sky-200">
                ADMIN CONSOLE
              </span>
            </div>
          </Link>
          <button
            type="button"
            aria-label="Close sidebar"
            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        </div>

        <Suspense fallback={<div className="flex-1 space-y-8 overflow-y-auto px-4 py-7" />}>
          <SidebarNavContent onClose={onClose} />
        </Suspense>

        {/* Admin User Card & Sign Out */}
        <div className="border-t border-slate-100 p-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 border border-slate-100">
            <div className="flex items-center gap-2.5 min-w-0 pr-1">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#087ed9] text-xs font-bold text-white shadow-xs">
                {admin?.name
                  ? admin.name
                      .split(" ")
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join("")
                  : "AD"}
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold text-slate-800 truncate">
                  {admin?.name || "Administrator"}
                </div>
                <div className="text-[10px] font-semibold text-[#087ed9] truncate">
                  {admin?.role || "Console Admin"}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={logout}
              title="Sign Out of Admin Console"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 transition"
            >
              <LogOut size={16} />
            </button>
          </div>

          <div className="mt-2.5 flex items-center justify-between px-1 text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 font-semibold text-slate-500">
              <ShieldCheck size={13} className="text-[#009b4d]" /> Active Console
            </span>
            <span>v1.5</span>
          </div>
        </div>
      </aside>
    </>
  );
}
