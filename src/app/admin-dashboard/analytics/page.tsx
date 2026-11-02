"use client";

import React, { useEffect, useState, Suspense } from "react";
import { BarChart3, Download, Building, Users, MessageSquare, Clock, MapPin, Menu, Loader2 } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useAdminAuth } from "@/context/admin-auth-context";
import { getAdminAnalytics, getAdminDashboard, type AdminAnalytics, type AdminDashboard } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { typeLabel } from "@/lib/api/mappers";

const RANGES = [
  { months: 1, label: "This Month" },
  { months: 3, label: "3 Months" },
  { months: 6, label: "6 Months" },
  { months: 12, label: "1 Year" },
] as const;

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const monthLabel = (key: string) => `${MONTH_NAMES[Number(key.slice(5, 7)) - 1] || key} ${key.slice(2, 4)}`;
const TYPE_COLORS = ["bg-[#2854cb]", "bg-[#38bdf8]", "bg-[#10b981]", "bg-[#8b5cf6]", "bg-[#f59e0b]", "bg-[#ef4444]"];

/**
 * Reports from GET /admin/analytics (review decisions per month, listings
 * by type, enquiry demand by locality) and GET /admin/dashboard (current
 * counts). Metrics with no backend source (listings added per month,
 * approval SLA, growth rates) are stated as not available, never estimated.
 */
function AnalyticsContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [months, setMonths] = useState<number>(6);
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [dash, setDash] = useState<AdminDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { can } = useAdminAuth();

  useEffect(() => {
    getAdminDashboard().then(setDash).catch(() => undefined);
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    getAdminAnalytics(months)
      .then((a) => {
        if (!cancelled) setAnalytics(a);
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e, "Could not load analytics."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [months]);

  const monthsData = analytics?.months || [];
  const maxDecisions = Math.max(1, ...monthsData.map((m) => Math.max(m.verified, m.rejected)));
  const totalVerified = monthsData.reduce((s, m) => s + m.verified, 0);
  const totalRejected = monthsData.reduce((s, m) => s + m.rejected, 0);
  const types = analytics?.listings_by_type || [];
  const typeTotal = types.reduce((s, t) => s + t.count, 0);
  const localities = analytics?.top_enquiry_localities || [];
  const localityTotal = localities.reduce((s, l) => s + l.enquiries, 0);
  const n = (v: number | undefined) => (v === undefined ? "…" : v.toLocaleString("en-IN"));

  const handleExportReport = () => {
    const rows: (string | number)[][] = [
      ["Section", "Item", "Value"],
      ...(dash
        ? [
            ["Counts", "Listings (not removed)", dash.listings_total],
            ["Counts", "Live listings", dash.listings_live],
            ["Counts", "Pending review", dash.listings_pending],
            ["Counts", "Rejected", dash.listings_rejected],
            ["Counts", "Enquiries", dash.enquiries_total],
            ["Counts", "Open enquiries", dash.enquiries_open],
            ["Counts", "Buyers", dash.buyers],
            ["Counts", "Owners", dash.owners],
            ["Counts", "Agents", dash.brokers],
          ]
        : []),
      ...monthsData.flatMap((m) => [
        ["Review decisions", `${m.month} verified`, m.verified],
        ["Review decisions", `${m.month} rejected`, m.rejected],
      ]),
      ...types.map((t) => ["Listings by type", typeLabel(t.property_type), t.count]),
      ...localities.map((l) => ["Enquiries by locality", `${l.locality}, ${l.city}`, l.enquiries]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `restamp_platform_report_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e8ecf4] bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open navigation"
              className="rounded-lg p-2 text-[#475467] hover:bg-[#f1f4f9] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f4ff] text-[#162d66]">
                <BarChart3 className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-[#101828]">Reports & Platform Analytics</span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportReport}
              disabled={!can("reports.export") || !analytics}
              title={can("reports.export") ? "Download the figures shown on this page" : "Your admin role cannot export reports"}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8ecf4] bg-white px-3 py-2 text-xs font-semibold text-[#475467] shadow-sm hover:bg-[#f8fafc] hover:text-[#101828] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="h-3.5 w-3.5 text-[#94a3b8]" />
              <span className="hidden sm:inline">Export Report</span>
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#101828] sm:text-3xl">Platform Activity & Performance</h1>
              <p className="mt-1 text-sm text-[#475467]">
                Listing reviews, inventory mix and buyer demand from live platform data.
              </p>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-[#e8ecf4] bg-white p-1 shadow-sm">
              {RANGES.map((r) => (
                <button
                  key={r.months}
                  type="button"
                  onClick={() => setMonths(r.months)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    months === r.months ? "bg-[#162d66] text-white shadow-sm" : "text-[#64748b] hover:text-[#101828]"
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="rounded-2xl border border-[#fee2e2] bg-[#fef2f2] p-4 text-sm text-[#991b1b]" role="alert">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Listings", value: n(dash?.listings_total), sub: `${n(dash?.listings_live)} live · ${n(dash?.listings_pending)} pending`, icon: Building },
              { label: "Buyer Enquiries", value: n(dash?.enquiries_total), sub: `${n(dash?.enquiries_open)} still open`, icon: MessageSquare },
              { label: "Registered Users", value: n(dash?.users_total), sub: `${n(dash?.buyers)} buyers · ${n(dash?.owners)} owners · ${n(dash?.brokers)} agents`, icon: Users },
              { label: "Review Decisions", value: analytics ? String(totalVerified + totalRejected) : "…", sub: `${totalVerified} verified · ${totalRejected} rejected in range`, icon: Clock },
            ].map(({ label, value, sub, icon: Icon }) => (
              <div key={label} className="rounded-2xl border border-[#e8ecf4] bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-[#64748b]">{label}</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f0f4ff] text-[#162d66]">
                    <Icon className="h-4 w-4" />
                  </div>
                </div>
                <div className="mt-2 text-2xl font-bold text-[#101828]">{value}</div>
                <div className="mt-1 text-[11px] text-[#64748b]">{sub}</div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-8 rounded-2xl border border-[#e8ecf4] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-[#101828]">Listing Review Decisions</h3>
                  <p className="text-xs text-[#64748b]">Verified and rejected per month (UTC). New listings per month are not tracked yet.</p>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-[#64748b]">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#2854cb]" /> Verified</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-[#f87171]" /> Rejected</span>
                </div>
              </div>
              {loading && !analytics ? (
                <div className="flex h-56 items-center justify-center text-xs text-[#94a3b8]">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Loading…
                </div>
              ) : (
                <div className="mt-6 flex h-56 items-end gap-3 border-b border-[#f1f4f9]">
                  {monthsData.map((m) => (
                    <div key={m.month} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                      <div className="flex h-full w-full items-end justify-center gap-1">
                        <div
                          className="w-1/3 max-w-[22px] rounded-t-md bg-[#2854cb]"
                          style={{ height: `${(m.verified / maxDecisions) * 90}%` }}
                          title={`${m.verified} verified`}
                        />
                        <div
                          className="w-1/3 max-w-[22px] rounded-t-md bg-[#f87171]"
                          style={{ height: `${(m.rejected / maxDecisions) * 90}%` }}
                          title={`${m.rejected} rejected`}
                        />
                      </div>
                      <span className="pb-2 text-[10px] font-semibold text-[#94a3b8]">{monthLabel(m.month)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="lg:col-span-4 rounded-2xl border border-[#e8ecf4] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#101828]">Inventory by Property Type</h3>
              <p className="text-xs text-[#64748b]">All listings that are not removed</p>
              <div className="mt-5 space-y-4">
                {types.length === 0 && !loading && <p className="text-xs text-[#94a3b8]">No listings yet.</p>}
                {types.map((t, i) => {
                  const pct = typeTotal ? Math.round((t.count / typeTotal) * 100) : 0;
                  return (
                    <div key={t.property_type}>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-[#344054]">{typeLabel(t.property_type)}</span>
                        <span className="text-[#64748b]">
                          {t.count} · {pct}%
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-[#f1f4f9]">
                        <div className={`h-2 rounded-full ${TYPE_COLORS[i % TYPE_COLORS.length]}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            <div className="lg:col-span-7 rounded-2xl border border-[#e8ecf4] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#101828]">Top Localities by Buyer Enquiries</h3>
              <p className="text-xs text-[#64748b]">All-time enquiries, top 10 localities</p>
              <div className="mt-4 divide-y divide-[#f1f4f9]">
                {localities.length === 0 && !loading && <p className="py-4 text-xs text-[#94a3b8]">No enquiries yet.</p>}
                {localities.map((loc, idx) => (
                  <div key={`${loc.locality}-${loc.city}`} className="flex items-center justify-between py-2.5 text-xs">
                    <span className="flex items-center gap-2 font-semibold text-[#344054]">
                      <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#f0f4ff] text-[10px] font-bold text-[#162d66]">{idx + 1}</span>
                      <MapPin className="h-3.5 w-3.5 text-[#94a3b8]" />
                      {loc.locality}, {loc.city}
                    </span>
                    <span className="text-[#64748b]">
                      {loc.enquiries} enquiries · {localityTotal ? Math.round((loc.enquiries / localityTotal) * 100) : 0}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lg:col-span-5 rounded-2xl border border-[#e8ecf4] bg-white p-5 shadow-sm">
              <h3 className="text-sm font-bold text-[#101828]">Operational SLA & Compliance</h3>
              <div className="mt-4 space-y-3 text-xs text-[#64748b]">
                <p>
                  <span className="font-semibold text-[#344054]">Listings waiting for review:</span> {n(dash?.listings_pending)}
                </p>
                <p>
                  <span className="font-semibold text-[#344054]">Suspended accounts:</span> {n(dash?.users_suspended)}
                </p>
                <p className="rounded-xl border border-dashed border-[#e8ecf4] p-3 text-[#94a3b8]">
                  Approval time (SLA), growth rates and KYC compliance are not available yet: the backend does not track them.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default function AnalyticsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center bg-[#f8fafc] text-sm text-[#64748b]">
          Loading Reports & Analytics Dashboard...
        </div>
      }
    >
      <AnalyticsContent />
    </Suspense>
  );
}
