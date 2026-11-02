"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Activity,
  ArrowRight,
  BarChart3,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  CircleHelp,
  Clock3,
  ClipboardCheck,
  Menu,
  MessageSquareText,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  TrendingUp,
  UsersRound,
  X,
  ExternalLink,
} from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { StatCard } from "@/components/dashboard/stat-card";
import { usePropertyStore } from "@/context/property-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import {
  getAdminAnalytics,
  getAdminDashboard,
  listAdminAuditLogs,
  type AdminAnalytics,
  type AdminAuditLog,
  type AdminDashboard,
} from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { PropertyStatus } from "@/types/property";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthLabel = (key: string) => MONTH_NAMES[Number(key.slice(5, 7)) - 1] || key;
const shortDate = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "—";
const timeAgo = (iso: string | null | undefined) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }) : "";

// Audit actions -> readable titles (admin actions and owner lead closures).
const AUDIT_TITLES: Record<string, string> = {
  ADMIN_LISTING_VERIFIED: "Listing verified",
  ADMIN_LISTING_REJECTED: "Listing rejected",
  ADMIN_USER_SUSPENDED: "User suspended",
  ADMIN_USER_REACTIVATED: "User reactivated",
  ADMIN_STAFF_GRANTED: "Admin access granted",
  ADMIN_STAFF_ROLE_CHANGED: "Admin role changed",
  ADMIN_STAFF_REVOKED: "Admin access revoked",
  LEAD_CLOSED: "Owner closed an enquiry",
};

type StatusFilter = "All" | PropertyStatus;
const statuses: StatusFilter[] = ["All", "Active", "Pending", "Rejected"];

function StatusPill({ status, label }: { status: PropertyStatus; label?: string }) {
  const color = {
    Active: "bg-[#e7f8ee] text-[#199864] before:bg-[#21b879]",
    Pending: "bg-[#fff5e3] text-[#bf811a] before:bg-[#eca42d]",
    Rejected: "bg-[#ffeaeb] text-[#d45561] before:bg-[#e66a74]",
    Draft: "bg-[#f1f4f9] text-[#62738b] before:bg-[#94a3b8]",
  }[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-bold before:h-1.5 before:w-1.5 before:rounded-full ${color}`}
    >
      {label || status}
    </span>
  );
}

function SectionHeading({
  title,
  subtitle,
  icon,
}: {
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center gap-2.5">
        {icon}
        <h2 className="text-[16px] font-extrabold tracking-[-0.02em] text-[#1d2b44] sm:text-[17px]">
          {title}
        </h2>
      </div>
      {subtitle && <p className="mt-1 text-xs text-[#9aa7b8]">{subtitle}</p>}
    </div>
  );
}

function ListingsChart({ points }: { points: { month: string; count: number }[] }) {
  const max = Math.max(1, ...points.map((point) => point.count));
  return (
    <div className="flex h-[213px] items-end gap-3 border-b border-[#e7ebf2] pt-6 sm:gap-6">
      {points.map((point, i) => (
        <div
          className="flex h-full min-w-0 flex-1 flex-col items-center justify-end gap-3"
          key={point.month}
        >
          <div className="group relative flex h-full w-full max-w-[53px] items-end justify-center">
            <div
              aria-label={`${point.count} review decisions in ${point.month}`}
              className={`w-full rounded-t-[9px] transition-all duration-300 ${
                i === points.length - 1 ? "bg-[#3566e9]" : "bg-[#dfe8ff] group-hover:bg-[#a9c2ff]"
              }`}
              style={{ height: `${(point.count / max) * 91}%` }}
            >
              <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#71819a] opacity-0 transition-opacity group-hover:opacity-100">
                {point.count}
              </span>
            </div>
          </div>
          <span className="pb-3 text-[11px] font-semibold text-[#9ba9bc]">{point.month}</span>
        </div>
      ))}
    </div>
  );
}

export default function DashboardPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<StatusFilter>("All");

  const { properties } = usePropertyStore();
  const { admin, can } = useAdminAuth();
  const [dash, setDash] = useState<AdminDashboard | null>(null);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [dashError, setDashError] = useState("");
  const canReports = can("reports.view");
  const canAudit = can("settings.view_audit_logs");

  // Real counts from the backend; each panel loads independently and
  // only when the admin's role is allowed to see it.
  useEffect(() => {
    getAdminDashboard()
      .then(setDash)
      .catch((e) => setDashError(errorMessage(e, "Could not load dashboard counts.")));
  }, []);
  useEffect(() => {
    if (canReports) getAdminAnalytics(6).then(setAnalytics).catch(() => undefined);
  }, [canReports]);
  useEffect(() => {
    if (canAudit) listAdminAuditLogs({}, 1, 6).then((res) => setLogs(res.items)).catch(() => undefined);
  }, [canAudit]);

  const n = (v: number | undefined) => (v === undefined ? "…" : v.toLocaleString("en-IN"));
  const chartPoints = (analytics?.months || []).map((m) => ({ month: monthLabel(m.month), count: m.verified + m.rejected }));
  const decisions = chartPoints.reduce((sum, p) => sum + p.count, 0);
  const live = dash?.listings_live ?? 0;
  const pending = dash?.listings_pending ?? 0;
  const rejected = dash?.listings_rejected ?? 0;
  const pieTotal = live + pending + rejected;
  const pct = (v: number) => (pieTotal ? (v / pieTotal) * 100 : 0);
  const pie = pieTotal
    ? `conic-gradient(#3566e9 0 ${pct(live)}%, #f4b64c ${pct(live)}% ${pct(live) + pct(pending)}%, #e66a74 ${pct(live) + pct(pending)}% 100%)`
    : "conic-gradient(#e8edf5 0 100%)";

  const dynamicStats = [
    {
      label: "Total Properties",
      value: n(dash?.listings_total),
      detail: "excluding removed listings",
      icon: Building2,
      iconBg: "#EAF1FF",
      iconColor: "#3869E6",
      href: "/admin-dashboard/properties",
    },
    {
      label: "Active Listings",
      value: n(dash?.listings_live),
      detail: "verified and available",
      icon: CheckCircle2,
      iconBg: "#E7F8EF",
      iconColor: "#25A873",
      href: "/admin-dashboard/properties?status=Active",
    },
    {
      label: "Pending Approvals",
      value: n(dash?.listings_pending),
      detail: "ready for review",
      icon: Clock3,
      iconBg: "#FFF4E3",
      iconColor: "#ECA037",
      href: "/admin-dashboard/properties?tab=approvals",
    },
    {
      label: "Total Enquiries",
      value: n(dash?.enquiries_total),
      detail: `${n(dash?.enquiries_open)} open`,
      icon: MessageSquareText,
      iconBg: "#F0EAFF",
      iconColor: "#885CE8",
      href: "/admin-dashboard/enquiries",
    },
  ];

  const filteredProperties = useMemo(() => {
    const q = search.toLowerCase().trim();
    return properties.filter((property) => {
      const matchesStatus = filter === "All" || property.status === filter;
      const matchesQuery =
        !q ||
        [property.title, property.locality, property.ownerName, property.id].some((value) =>
          value.toLowerCase().includes(q)
        );
      return matchesStatus && matchesQuery;
    });
  }, [properties, search, filter]);

  const pendingQueue = useMemo(() => {
    return properties.filter((p) => p.status === "Pending");
  }, [properties]);

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 lg:pl-[272px]">
        <header className="sticky top-0 z-20 flex h-[77px] items-center justify-between border-b border-[#e9edf5] bg-white/95 px-4 backdrop-blur-md sm:px-7 xl:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              type="button"
              aria-label="Open navigation"
              className="rounded-xl border border-[#e8edf5] p-2 text-[#60708a] lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="text-[11px] font-semibold text-[#abb5c5]">
                Workspace <span className="px-2 text-[#c4cbd6]">/</span> Overview
              </div>
              <div className="mt-0.5 text-[15px] font-extrabold text-[#24324b] sm:text-[16px]">
                Dashboard
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-5">
            <div className="hidden items-center gap-2 rounded-xl border border-[#e9edf5] bg-[#fafbfe] px-3.5 py-2.5 md:flex">
              <Search size={16} className="text-[#a5afc0]" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-32 bg-transparent text-xs text-[#24324b] outline-none placeholder:text-[#a8b3c4] xl:w-44"
                placeholder="Search properties..."
                aria-label="Search property listings"
              />
            </div>
            <div className="relative">
              <button
                type="button"
                aria-label="View notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative rounded-xl p-2 text-[#6c7b91] hover:bg-[#f3f6fd]"
              >
                <Bell size={20} />
                {pending > 0 && (
                  <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-white bg-[#f59e0b]" />
                )}
              </button>
              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-30 w-[min(320px,80vw)] rounded-2xl border border-[#e5ebf4] bg-white p-4 shadow-[0_18px_50px_#1b2a4a1c]">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-[#22314b]">Notifications</div>
                    <button
                      type="button"
                      aria-label="Close notifications"
                      onClick={() => setNotificationsOpen(false)}
                    >
                      <X size={16} className="text-[#9aa8bc]" />
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-[#9ba8ba]">
                    {pending} properties waiting for approval
                  </p>
                  <div className="mt-3 space-y-2 border-t border-[#eef1f6] pt-3">
                    {pendingQueue.slice(0, 3).map((item) => (
                      <Link
                        key={item.id}
                        href={`/admin-dashboard/properties?id=${item.id}`}
                        className="block rounded-lg p-1.5 text-xs text-[#54637b] hover:bg-[#f5f8ff]"
                      >
                        <span className="font-semibold text-[#2854cb]">{item.id}:</span>{" "}
                        {item.title}
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="h-7 w-px bg-[#edf0f5]" />
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#dce7ff] text-xs font-extrabold text-[#3c65cc]">
                RA
              </span>
              <div className="hidden sm:block">
                <div className="text-xs font-extrabold text-[#293750]">{admin?.name || "Admin"}</div>
                <div className="mt-0.5 text-[10px] text-[#a3aebf]">Administrator</div>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-[1650px] space-y-6 px-4 py-7 sm:px-7 xl:px-9 xl:py-9">
          <div className="animate-fade-in flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="flex flex-wrap items-center gap-2.5">
                <h1 className="text-[25px] font-extrabold tracking-[-0.045em] text-[#182740] sm:text-[30px]">
                  Dashboard Overview
                </h1>
                <span className="rounded-full border border-[#d9e4fb] bg-[#edf3ff] px-2.5 py-1 text-[10px] font-bold text-[#486ac0]">
                  LIVE DATA
                </span>
              </div>
              <p className="mt-2 text-[13px] text-[#92a0b4]">
                Real-time operational metrics across the RESTAMP property marketplace.
              </p>
            </div>
            <div className="flex items-center gap-2.5">
              <Link
                href="/admin-dashboard/enquiries"
                className="inline-flex items-center gap-1.5 rounded-xl border border-[#dbe4f4] bg-white px-3.5 py-2.5 text-xs font-bold text-[#162d66] shadow-sm hover:bg-[#f4f7fc] transition-colors"
              >
                <MessageSquareText size={15} className="text-[#3869e6]" />
                <span>Lead Desk</span>
              </Link>
              <Link
                href="/admin-dashboard/properties"
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#2854cb] px-4 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#1f45ae] transition-colors"
              >
                <Building2 size={15} />
                <span>Manage Properties</span>
              </Link>
              <span className="inline-flex items-center gap-2 rounded-xl border border-[#e5eaf3] bg-white px-3.5 py-2.5 text-xs font-semibold text-[#71809a] shadow-sm">
                <CalendarDays size={15} className="text-[#8a99ae]" /> 28 Oct 2026
              </span>
            </div>
          </div>

          <section
            aria-label="Key performance indicators"
            className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
          >
            {dynamicStats.map((item) => (
              <StatCard key={item.label} {...item} />
            ))}
          </section>
          {dashError && (
            <p className="rounded-xl border border-[#fee2e2] bg-[#fef2f2] px-4 py-2 text-xs text-[#991b1b]" role="alert">
              {dashError}
            </p>
          )}

          <section
            aria-label="Platform charts"
            className="grid gap-5 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,1fr)]"
          >
            <div className="rounded-[18px] border border-[#e9edf4] bg-white p-5 shadow-[0_3px_18px_#15223d06] sm:p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <SectionHeading
                  title="Listing Review Trends"
                  subtitle="Listings verified or rejected per month (last six months). New listings per month are not tracked yet."
                />
                <div className="flex items-center gap-2 rounded-lg bg-[#f7f9fd] px-3 py-2 text-[11px] font-semibold text-[#8795ab]">
                  <span className="h-2 w-2 rounded-sm bg-[#3566e9]" /> Review decisions
                </div>
              </div>
              {canReports ? (
                <>
                  <div className="mt-2 flex items-end justify-between">
                    <div>
                      <span className="text-[29px] font-extrabold tracking-[-0.04em] text-[#1d2c45]">
                        {analytics ? decisions : "…"}
                      </span>
                      <span className="ml-2 text-xs text-[#98a5b8]">decisions</span>
                    </div>
                  </div>
                  <ListingsChart points={chartPoints} />
                </>
              ) : (
                <p className="mt-6 text-xs text-[#98a5b8]">Your admin role does not include reports.</p>
              )}
            </div>

            <div className="rounded-[18px] border border-[#e9edf4] bg-white p-5 shadow-[0_3px_18px_#15223d06] sm:p-6">
              <SectionHeading
                title="Listing Status Breakdown"
                subtitle="Live properties distribution by status"
              />
              <div className="flex flex-wrap items-center justify-center gap-6 py-8 sm:flex-nowrap xl:gap-4">
                <div
                  role="img"
                  aria-label="Distribution chart"
                  className="relative h-[168px] w-[168px] shrink-0 rounded-full"
                  style={{
                    background: pie,
                  }}
                >
                  <div className="absolute inset-[24px] flex flex-col items-center justify-center rounded-full bg-white">
                    <div className="text-[25px] font-extrabold text-[#1e2d47]">
                      {pieTotal}
                    </div>
                    <div className="text-[10px] font-semibold text-[#a1adbe]">Properties</div>
                  </div>
                </div>
                <div className="min-w-[120px] space-y-4">
                  {[
                    { label: "Active", value: live, color: "#3566e9" },
                    { label: "Pending", value: pending, color: "#f4b64c" },
                    { label: "Rejected", value: rejected, color: "#e66a74" },
                  ].map((item) => (
                    <div key={item.label} className="flex items-center justify-between gap-5">
                      <span className="flex items-center gap-2 text-[11px] font-semibold text-[#8592a7]">
                        <span
                          className="h-2.5 w-2.5 rounded-[3px]"
                          style={{ background: item.color }}
                        />
                        {item.label}
                      </span>
                      <span className="text-xs font-extrabold text-[#2c3b56]">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-[#edf1f6] pt-4 text-center text-[11px] text-[#a1adbc]">
                <Link
                  href="/admin-dashboard/properties"
                  className="font-bold text-[#2854cb] hover:underline"
                >
                  Manage all {properties.length} listings →
                </Link>
              </div>
            </div>
          </section>

          <section
            aria-label="Property listings and approvals"
            className="grid gap-5 2xl:grid-cols-[minmax(0,1.8fr)_minmax(320px,.9fr)]"
          >
            <div className="min-w-0 rounded-[18px] border border-[#e9edf4] bg-white shadow-[0_3px_18px_#15223d06]">
              <div className="flex flex-wrap items-start justify-between gap-3 px-5 pb-3 pt-5 sm:px-6 sm:pt-6">
                <SectionHeading
                  title="Recent Property Listings"
                  subtitle="Latest properties submitted to the platform"
                />
                <Link
                  href="/admin-dashboard/properties"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2854cb] hover:underline"
                >
                  <span>Open Full Management</span>
                  <ExternalLink size={13} />
                </Link>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 sm:px-6">
                <div
                  role="group"
                  aria-label="Filter properties by status"
                  className="flex flex-wrap items-center gap-1 rounded-xl bg-[#f5f7fb] p-1"
                >
                  {statuses.map((status) => (
                    <button
                      key={status}
                      type="button"
                      aria-pressed={filter === status}
                      onClick={() => setFilter(status)}
                      className={`rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors ${
                        filter === status
                          ? "bg-white text-[#3566e9] shadow-sm"
                          : "text-[#9ca7b8] hover:text-[#62748e]"
                      }`}
                    >
                      {status}
                    </button>
                  ))}
                </div>
                <div className="flex w-full items-center gap-2 rounded-lg border border-[#e9edf5] px-3 py-2 md:hidden">
                  <Search size={15} className="text-[#a3afbf]" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search listings"
                    className="min-w-0 flex-1 bg-transparent text-xs outline-none"
                  />
                </div>
              </div>
              <div className="table-scroll overflow-x-auto">
                <table className="w-full min-w-[730px] border-collapse text-left">
                  <thead className="border-y border-[#eff1f6] bg-[#fbfcfe] text-[10px] font-extrabold uppercase tracking-[0.09em] text-[#a1adbf]">
                    <tr>
                      <th className="px-6 py-3.5">Property</th>
                      <th className="px-3 py-3.5">Owner</th>
                      <th className="px-3 py-3.5">Price</th>
                      <th className="px-3 py-3.5">Status</th>
                      <th className="px-3 py-3.5">Submitted</th>
                      <th className="px-4 py-3.5 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredProperties.length ? (
                      filteredProperties.slice(0, 6).map((property) => (
                        <tr
                          key={property.id}
                          className="border-b border-[#f0f2f7] last:border-b-0 hover:bg-[#fbfcff]"
                        >
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-3">
                              <span
                                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[11px] text-[10px] font-extrabold text-[#5b708f]"
                                style={{ background: "#EBF3FE" }}
                              >
                                {property.title.slice(0, 2).toUpperCase()}
                              </span>
                              <span className="min-w-0">
                                <Link
                                  href={`/admin-dashboard/properties?id=${property.id}`}
                                  className="block max-w-[210px] truncate text-[12px] font-extrabold text-[#2c3b55] hover:text-[#2854cb]"
                                >
                                  {property.title}
                                </Link>
                                <span className="mt-1 block text-[10px] text-[#a1adbe]">
                                  {property.locality}, {property.city} · {property.typeLabel}
                                </span>
                              </span>
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 text-xs font-semibold text-[#6b7b94]">
                            {property.ownerName}
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 text-xs font-bold text-[#30415c]">
                            {property.priceDisplay}
                          </td>
                          <td className="px-3 py-3.5">
                            <StatusPill status={property.status} label={property.statusLabel} />
                          </td>
                          <td className="whitespace-nowrap px-3 py-3.5 text-[11px] text-[#8f9db2]">
                            {shortDate(property.submittedAt)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3.5 text-right">
                            <Link
                              href={`/admin-dashboard/properties?id=${property.id}`}
                              className="inline-flex items-center gap-1 rounded-lg border border-[#e2e8f2] px-2.5 py-1 text-[11px] font-bold text-[#2854cb] hover:bg-[#eff4ff]"
                            >
                              Review
                            </Link>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-sm text-[#96a4b8]">
                          No properties match your search and filter.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center justify-between border-t border-[#f0f2f7] px-6 py-4">
                <span className="text-[11px] text-[#a1adbc]">
                  Showing {Math.min(6, filteredProperties.length)} of {properties.length} listings
                </span>
                <Link
                  href="/admin-dashboard/properties"
                  className="text-[11px] font-bold text-[#2854cb] hover:underline"
                >
                  Manage, approve & reject all listings <ArrowRight size={13} className="ml-1 inline" />
                </Link>
              </div>
            </div>

            <div
              id="approval-queue"
              className="rounded-[18px] border border-[#e9edf4] bg-white p-5 shadow-[0_3px_18px_#15223d06] sm:p-6"
            >
              <div className="flex items-center justify-between gap-3">
                <SectionHeading
                  title="Approval Queue"
                  subtitle={`${pendingQueue.length} items waiting for admin review`}
                />
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#fff5e7] text-[#eea33f]">
                  <ShieldAlert size={17} />
                </span>
              </div>
              <div className="mt-5 space-y-4">
                {pendingQueue.length > 0 ? (
                  pendingQueue.slice(0, 4).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-3 border-b border-[#f0f2f6] pb-4 last:border-0 last:pb-0"
                    >
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#f0f4ff] text-[11px] font-extrabold text-[#5978ce]">
                        {item.title.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/admin-dashboard/properties?id=${item.id}`}
                          className="truncate text-[12px] font-extrabold text-[#36445d] hover:text-[#2854cb]"
                        >
                          {item.title}
                        </Link>
                        <div className="mt-0.5 text-[11px] text-[#97a4b7]">
                          {item.typeLabel} · {item.priceDisplay} · {item.ownerName}
                        </div>
                        <div className="mt-1 flex items-center gap-1.5 text-[10px] text-[#b0bac9]">
                          <Clock3 size={12} />
                          {shortDate(item.submittedAt)}
                        </div>
                      </div>
                      <Link
                        href={`/admin-dashboard/properties?id=${item.id}`}
                        className="rounded-lg bg-[#f0f4ff] px-2 py-1 text-[11px] font-bold text-[#2854cb] hover:bg-[#2854cb] hover:text-white transition-colors"
                      >
                        Review
                      </Link>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-xs text-[#95a3b7]">
                    🎉 All pending listings have been reviewed! No items in queue.
                  </div>
                )}
              </div>
              <div className="mt-5">
                <Link
                  href="/admin-dashboard/properties?tab=approvals"
                  className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-[#f5f8ff] py-2.5 text-xs font-bold text-[#2854cb] hover:bg-[#ebf1ff] transition-colors"
                >
                  <ClipboardCheck size={14} />
                  <span>Open Dedicated Approval Queue ({pendingQueue.length})</span>
                </Link>
              </div>
            </div>
          </section>

          <section
            aria-label="Additional dashboard insights"
            className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]"
          >
            <div className="rounded-[18px] border border-[#e9edf4] bg-white p-5 shadow-[0_3px_18px_#15223d06] sm:p-6">
              <SectionHeading
                title="Platform Snapshot"
                subtitle="Quick view of users and demand"
                icon={<BarChart3 size={17} className="text-[#5475d7]" />}
              />
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  {
                    label: "Registered buyers",
                    value: n(dash?.buyers),
                    href: "/admin-dashboard/users?role=buyer",
                    icon: UsersRound,
                    color: "#eaf0ff",
                    text: "#486fdb",
                  },
                  {
                    label: "Registered owners",
                    value: n(dash?.owners),
                    href: "/admin-dashboard/users?role=owner",
                    icon: Building2,
                    color: "#e9f8f2",
                    text: "#3dae83",
                  },
                  {
                    label: "Open enquiries",
                    value: n(dash?.enquiries_open),
                    href: "/admin-dashboard/enquiries?status=Active",
                    icon: MessageSquareText,
                    color: "#fff4e6",
                    text: "#d8a24e",
                  },
                  {
                    label: "Pending KYC (not available yet)",
                    value: "—",
                    href: "",
                    icon: ClipboardCheck,
                    color: "#f3edff",
                    text: "#9469dc",
                  },
                ].map(({ label, value, href, icon: Icon, color, text }) => {
                  const cardContent = (
                    <div
                      key={label}
                      className="rounded-xl border border-[#eff2f7] bg-[#fcfdff] p-4 transition-all hover:border-[#ccd7ea] hover:shadow-sm"
                    >
                      <span
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg"
                        style={{ background: color, color: text }}
                      >
                        <Icon size={16} />
                      </span>
                      <div className="mt-3 text-[20px] font-extrabold text-[#273852]">{value}</div>
                      <div className="mt-1 text-[11px] text-[#95a4b7]">{label}</div>
                    </div>
                  );

                  return href ? (
                    <Link key={label} href={href}>
                      {cardContent}
                    </Link>
                  ) : (
                    <div key={label}>{cardContent}</div>
                  );
                })}
              </div>
            </div>
            <div className="rounded-[18px] border border-[#e9edf4] bg-white p-5 shadow-[0_3px_18px_#15223d06] sm:p-6">
              <SectionHeading
                title="Recent Activity"
                subtitle="Latest events across the platform"
                icon={<Activity size={17} className="text-[#5475d7]" />}
              />
              <div className="mt-5 space-y-4">
                {!canAudit ? (
                  <p className="text-xs text-[#9ca9bb]">Your admin role does not include the audit log.</p>
                ) : logs.length === 0 ? (
                  <p className="text-xs text-[#9ca9bb]">No recorded admin activity yet.</p>
                ) : (
                  logs.map((event, i) => (
                    <div className="flex gap-3" key={event.id}>
                      <div className="flex flex-col items-center">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#ecf2ff] text-[#4570dc]">
                          {event.entity === "enquiry" ? (
                            <MessageSquareText size={14} />
                          ) : event.entity === "property_listing" ? (
                            <CheckCircle2 size={14} />
                          ) : event.entity === "user" || event.entity === "admin_account" ? (
                            <UsersRound size={14} />
                          ) : (
                            <Building2 size={14} />
                          )}
                        </span>
                        {i < logs.length - 1 && <div className="mt-1 h-8 w-px bg-[#eaf0f8]" />}
                      </div>
                      <div className="min-w-0 flex-1 pb-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          <span className="text-xs font-bold text-[#3b4960]">{AUDIT_TITLES[event.action] || event.action}</span>
                          <span className="text-[10px] text-[#afbac9]">{timeAgo(event.created_at)}</span>
                        </div>
                        <p className="mt-1 truncate text-[11px] text-[#9ca9bb]">
                          By {event.actor_name || `user #${event.actor_user_id}`}
                          {event.after && typeof event.after.reason === "string" ? ` · ${event.after.reason}` : ""}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
          <div className="flex flex-wrap items-center justify-between gap-2 pb-3 text-[11px] text-[#abb6c5]">
            <span>© 2026 RESTAMP · Admin Console</span>
            <span className="flex items-center gap-1.5">
              <CircleHelp size={13} /> Real Estate Asset Management Platform
            </span>
          </div>
        </main>
      </div>
    </div>
  );
}
