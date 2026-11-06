"use client";

import React, { Suspense } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  BarChart3,
  Bell,
  Building2,
  ChevronDown,
  ClipboardCheck,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  MessageSquareText,
  Settings2,
  ShieldCheck,
  UsersRound,
  ExternalLink,
  X,
  type LucideIcon,
} from "lucide-react";
import { usePropertyStore } from "@/context/property-context";
import { useEnquiryStore } from "@/context/enquiry-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import type { AdminPermission } from "@/lib/api/admin";

interface NavItem {
  label: string;
  href?: string;
  icon: LucideIcon;
  badge?: "pendingApprovals" | "openEnquiries";
  planned?: boolean;
  /** Admin permission the section needs (checked again by the backend). */
  permission?: AdminPermission;
}

const navGroups: {
  group: string;
  links: NavItem[];
}[] = [
  {
    group: "WORKSPACE",
    links: [
      { label: "Overview", href: "/admin-dashboard", icon: LayoutDashboard },
      { label: "Properties", href: "/admin-dashboard/properties", icon: Building2, badge: "pendingApprovals", permission: "properties.view" },
      { label: "Users", href: "/admin-dashboard/users", icon: UsersRound, permission: "users.view" },
      { label: "Enquiries", href: "/admin-dashboard/enquiries", icon: MessageSquareText, badge: "openEnquiries", permission: "enquiries.view" },
      { label: "Approvals", href: "/admin-dashboard/properties?tab=approvals", icon: ClipboardCheck, badge: "pendingApprovals", permission: "properties.view" },
      { label: "Analytics", href: "/admin-dashboard/analytics", icon: BarChart3, permission: "reports.view" },
    ],
  },
  {
    group: "MANAGEMENT",
    links: [
      { label: "Notifications", icon: Bell, planned: true },
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
    if (item.label === "Overview") {
      return pathname === "/admin-dashboard" || pathname === "/dashboard";
    }
    if (item.label === "Approvals") {
      return (
        (pathname === "/admin-dashboard/properties" || pathname === "/dashboard/properties") &&
        currentTab === "approvals"
      );
    }
    if (item.label === "Properties") {
      return (
        (pathname === "/admin-dashboard/properties" || pathname === "/dashboard/properties") &&
        currentTab !== "approvals"
      );
    }
    if (item.label === "Users") {
      return pathname.startsWith("/admin-dashboard/users") || pathname.startsWith("/dashboard/users");
    }
    if (item.label === "Enquiries") {
      return pathname.startsWith("/admin-dashboard/enquiries") || pathname.startsWith("/dashboard/enquiries");
    }
    if (item.label === "Analytics") {
      return pathname.startsWith("/admin-dashboard/analytics") || pathname.startsWith("/dashboard/analytics");
    }
    if (item.label === "Settings") {
      return pathname.startsWith("/admin-dashboard/settings") || pathname.startsWith("/dashboard/settings");
    }
    return pathname === item.href;
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
              const pendingCount =
                item.badge === "pendingApprovals"
                  ? propStats.pending
                  : item.badge === "openEnquiries"
                  ? enquiryStats.active
                  : 0;

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
                            : item.label === "Approvals" || item.label === "Users"
                            ? "bg-[#fef3c7] text-[#b45309]"
                            : item.label === "Enquiries"
                            ? "bg-sky-100 text-[#087ed9]"
                            : "bg-sky-50 text-[#087ed9]"
                        }`}
                      >
                        {pendingCount}
                      </span>
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
