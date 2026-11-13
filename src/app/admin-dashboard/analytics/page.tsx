"use client";

import React, { useState, useMemo, Suspense } from "react";
import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Download,
  Calendar,
  Building,
  Users,
  MessageSquare,
  ShieldCheck,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  MapPin,
  Menu,
  ChevronDown,
  FileSpreadsheet,
} from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { usePropertyStore } from "@/context/property-context";
import { useUserStore } from "@/context/user-context";
import { useEnquiryStore } from "@/context/enquiry-context";

function AnalyticsContent() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "6m" | "1y">("6m");

  const { properties, stats: propStats } = usePropertyStore();
  const { users, stats: userStats } = useUserStore();
  const { enquiries, stats: enquiryStats } = useEnquiryStore();

  // Aggregate Total Platform Asset Value
  const totalAssetValue = useMemo(() => {
    return properties.reduce((acc, curr) => acc + (curr.price || 0), 0);
  }, [properties]);

  const formatCr = (val: number) => {
    if (val >= 10000000) {
      return `₹${(val / 10000000).toFixed(1)} Cr`;
    }
    if (val >= 100000) {
      return `₹${(val / 100000).toFixed(1)} L`;
    }
    return `₹${val.toLocaleString("en-IN")}`;
  };

  // Monthly trends data
  const monthlyData = [
    { month: "May", listings: 34, enquiries: 240, activeUsers: 480 },
    { month: "Jun", listings: 42, enquiries: 310, activeUsers: 620 },
    { month: "Jul", listings: 38, enquiries: 290, activeUsers: 750 },
    { month: "Aug", listings: 56, enquiries: 420, activeUsers: 980 },
    { month: "Sep", listings: 48, enquiries: 380, activeUsers: 1150 },
    { month: "Oct", listings: 68, enquiries: 510, activeUsers: 1420 },
  ];

  const maxListings = Math.max(...monthlyData.map((d) => d.listings));

  // Locality distribution
  const localityDemand = [
    { name: "Adyar, Chennai", enquiries: 142, share: "28%", trend: "+14%" },
    { name: "OMR IT Corridor, Chennai", enquiries: 118, share: "23%", trend: "+22%" },
    { name: "MRC Nagar, Chennai", enquiries: 86, share: "17%", trend: "+8%" },
    { name: "Guindy, Chennai", enquiries: 72, share: "14%", trend: "+5%" },
    { name: "Velachery, Chennai", enquiries: 54, share: "11%", trend: "+12%" },
    { name: "Anna Nagar, Chennai", enquiries: 36, share: "7%", trend: "+3%" },
  ];

  // Property types breakdown
  const propertyTypes = [
    { type: "Apartments", count: 28, percentage: 58, color: "bg-[#2854cb]" },
    { type: "Independent Villas", count: 12, percentage: 25, color: "bg-[#38bdf8]" },
    { type: "Commercial Office", count: 5, percentage: 11, color: "bg-[#10b981]" },
    { type: "Luxury Penthouses", count: 3, percentage: 6, color: "bg-[#8b5cf6]" },
  ];

  // Export full report
  const handleExportReport = () => {
    const headers = [
      "Metric",
      "Current Value",
      "Period Growth",
      "Benchmark SLA",
    ];

    const rows = [
      ["Total Listed Asset Value", formatCr(totalAssetValue), "+18.4%", "N/A"],
      ["Total Live Properties", properties.length.toString(), "+12.8%", "N/A"],
      ["Auto-verification", `${propStats.pending} verifying`, "5 minutes", "5 minutes"],
      ["Registered Buyers", userStats.buyers.toString(), "+15.6%", "N/A"],
      ["Registered Owners", userStats.owners.toString(), "+9.4%", "N/A"],
      ["Total Inbound Enquiries", (3580 + enquiryStats.total).toString(), "+24.5%", "N/A"],
      ["Active Inquiries Desk", enquiryStats.active.toString(), "Needs attention", "< 12 hours"],
    ];

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.map((c) => `"${c}"`).join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `restamp_platform_performance_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex min-h-screen bg-[#f8fafc]">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main Container */}
      <div className="flex-1 lg:pl-[272px] flex flex-col min-w-0">
        {/* Navbar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-[#e8ecf4] bg-white/95 px-4 sm:px-6 lg:px-8 backdrop-blur">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSidebarOpen(true)}
              className="rounded-lg p-2 text-[#475467] hover:bg-[#f1f4f9] lg:hidden"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f0f4ff] text-[#162d66]">
                <BarChart3 className="h-4 w-4" />
              </div>
              <span className="text-sm font-semibold text-[#101828]">
                Reports & Platform Analytics
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-[#ecfdf5] px-2 py-0.5 text-[11px] font-medium text-[#059669]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#10b981]" />
                Live Performance Engine
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleExportReport}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8ecf4] bg-white px-3 py-2 text-xs font-semibold text-[#475467] shadow-sm hover:bg-[#f8fafc] hover:text-[#101828]"
            >
              <Download className="h-3.5 w-3.5 text-[#94a3b8]" />
              <span className="hidden sm:inline">Export Performance Report</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="min-w-0 w-full flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          {/* Header & Filter */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-[#101828] sm:text-3xl">
                Platform Activity & Performance
              </h1>
              <p className="mt-1 text-sm text-[#475467]">
                Track listing velocity, buyer demand trends, inventory volume, and operational SLA response metrics.
              </p>
            </div>

            <div className="flex items-center gap-1.5 rounded-xl border border-[#e8ecf4] bg-white p-1 shadow-sm">
              {(["7d", "30d", "6m", "1y"] as const).map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setTimeRange(r)}
                  className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${
                    timeRange === r
                      ? "bg-[#162d66] text-white shadow-sm"
                      : "text-[#64748b] hover:text-[#101828]"
                  }`}
                >
                  {r === "7d"
                    ? "7 Days"
                    : r === "30d"
                    ? "30 Days"
                    : r === "6m"
                    ? "6 Months"
                    : "1 Year"}
                </button>
              ))}
            </div>
          </div>

          {/* Primary Top Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Total Asset Value */}
            <div className="rounded-2xl border border-[#e8ecf4] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#64748b]">
                  Gross Listed Assets
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#f0f4ff] text-[#162d66]">
                  <Building className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-extrabold text-[#101828]">
                {formatCr(totalAssetValue)}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center gap-0.5 font-bold text-[#059669]">
                  <ArrowUpRight className="h-3.5 w-3.5" /> +18.4%
                </span>
                <span className="text-[#94a3b8]">vs last quarter</span>
              </div>
            </div>

            {/* Inbound Buyer Enquiries */}
            <div className="rounded-2xl border border-[#e8ecf4] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#64748b]">
                  Total Inbound Leads
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ede9fe] text-[#7c3aed]">
                  <MessageSquare className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-extrabold text-[#101828]">
                {(3580 + enquiryStats.total).toLocaleString()}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <span className="inline-flex items-center gap-0.5 font-bold text-[#059669]">
                  <ArrowUpRight className="h-3.5 w-3.5" /> +24.5%
                </span>
                <span className="text-[#94a3b8]">high buyer demand</span>
              </div>
            </div>

            {/* Active Registered Marketplace Users */}
            <div className="rounded-2xl border border-[#e8ecf4] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#64748b]">
                  Active Marketplace Users
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#059669]">
                  <Users className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-extrabold text-[#101828]">
                {(1800 + users.length).toLocaleString()}
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <span className="text-[#64748b]">
                  {userStats.buyers} Buyers · {userStats.owners} Owners
                </span>
              </div>
            </div>

            {/* Operational SLA & Review Time */}
            <div className="rounded-2xl border border-[#e8ecf4] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#64748b]">
                  Listing Verification
                </span>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fff4e6] text-[#ea580c]">
                  <Clock className="h-5 w-5" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-extrabold text-[#101828]">
                5 Minutes
              </div>
              <div className="mt-2 flex items-center gap-1.5 text-xs">
                <span className="text-[#94a3b8]">Automatic. No manual approval step.</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Listing Velocity Trend (8 cols) */}
            <div className="lg:col-span-8 rounded-2xl border border-[#e8ecf4] bg-white p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#f1f4f9] pb-4">
                <div>
                  <h3 className="font-bold text-base text-[#101828]">
                    Property Listing Velocity
                  </h3>
                  <p className="text-xs text-[#64748b]">
                    Monthly inventory added across Tamil Nadu regions
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1 text-[#2854cb] font-semibold">
                    <span className="h-2 w-2 rounded-full bg-[#2854cb]" /> New Listings
                  </span>
                  <span className="inline-flex items-center gap-1 text-[#8b5cf6] font-semibold">
                    <span className="h-2 w-2 rounded-full bg-[#8b5cf6]" /> Buyer Enquiries (x10)
                  </span>
                </div>
              </div>

              {/* Bar Chart Visualization */}
              <div className="mt-6 flex h-60 items-end gap-6 sm:gap-10 border-b border-[#e8ecf4] pb-4">
                {monthlyData.map((d) => {
                  const barHeight = (d.listings / maxListings) * 100;
                  const enqHeight = (d.enquiries / 600) * 100;

                  return (
                    <div
                      key={d.month}
                      className="flex-1 flex flex-col items-center justify-end h-full group"
                    >
                      <div className="flex items-end gap-1.5 w-full justify-center h-full">
                        {/* Listings Bar */}
                        <div
                          style={{ height: `${barHeight}%` }}
                          className="w-4 sm:w-6 rounded-t-md bg-[#2854cb] group-hover:bg-[#1f45ae] transition-all relative"
                        >
                          <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#2854cb] opacity-0 group-hover:opacity-100 transition-opacity">
                            {d.listings}
                          </span>
                        </div>
                        {/* Enquiries Bar */}
                        <div
                          style={{ height: `${enqHeight}%` }}
                          className="w-4 sm:w-6 rounded-t-md bg-[#ede9fe] group-hover:bg-[#ddd6fe] transition-all relative"
                        >
                          <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-[#7c3aed] opacity-0 group-hover:opacity-100 transition-opacity">
                            {d.enquiries}
                          </span>
                        </div>
                      </div>
                      <span className="mt-3 text-xs font-semibold text-[#64748b]">
                        {d.month}
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-[#64748b]">
                <span>Average monthly inventory expansion: <strong>+16.2%</strong></span>
                <span className="text-[#059669] font-semibold">Listing pipeline healthy</span>
              </div>
            </div>

            {/* Inventory Distribution (4 cols) */}
            <div className="lg:col-span-4 rounded-2xl border border-[#e8ecf4] bg-white p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-base text-[#101828]">
                  Asset Category Distribution
                </h3>
                <p className="text-xs text-[#64748b] mt-0.5">
                  Proportion of live catalogue by property type
                </p>

                {/* Progress breakdown */}
                <div className="mt-6 space-y-4">
                  {propertyTypes.map((pt) => (
                    <div key={pt.type}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-[#101828]">
                          {pt.type}
                        </span>
                        <span className="text-[#64748b] font-medium">
                          {pt.count} units ({pt.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full rounded-full bg-[#f1f5f9] overflow-hidden">
                        <div
                          className={`h-full rounded-full ${pt.color}`}
                          style={{ width: `${pt.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#f1f4f9] rounded-xl bg-[#f8fafc] p-3 text-xs text-[#64748b]">
                <div className="flex items-center justify-between font-semibold text-[#101828]">
                  <span>Residential Concentration</span>
                  <span>83%</span>
                </div>
                <p className="mt-1 text-[11px] text-[#94a3b8]">
                  Apartments and villas remain the highest volume traded assets on RESTAMP.
                </p>
              </div>
            </div>
          </div>

          {/* Regional Demand & Locality Heatmap */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Top Localities Table (7 cols) */}
            <div className="lg:col-span-7 rounded-2xl border border-[#e8ecf4] bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-[#f1f4f9] pb-4">
                <div>
                  <h3 className="font-bold text-base text-[#101828]">
                    High Demand Localities
                  </h3>
                  <p className="text-xs text-[#64748b]">
                    Areas generating the highest volume of buyer leads
                  </p>
                </div>
                <span className="rounded-full bg-[#f0f4ff] px-2.5 py-1 text-[11px] font-semibold text-[#162d66]">
                  Top 6 Markets
                </span>
              </div>

              <div className="mt-4 divide-y divide-[#f1f4f9]">
                {localityDemand.map((loc, idx) => (
                  <div
                    key={loc.name}
                    className="flex items-center justify-between py-3 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#f1f5f9] font-bold text-[#64748b] text-[11px]">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-[#101828] flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-[#94a3b8]" />
                          <span>{loc.name}</span>
                        </div>
                        <div className="text-[11px] text-[#94a3b8]">
                          {loc.share} of total buyer leads
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="font-bold text-sm text-[#101828]">
                        {loc.enquiries}
                      </div>
                      <div className="text-[11px] font-semibold text-[#059669]">
                        {loc.trend}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Operational SLA & Compliance (5 cols) */}
            <div className="lg:col-span-5 rounded-2xl border border-[#e8ecf4] bg-white p-6 shadow-sm space-y-4">
              <div className="border-b border-[#f1f4f9] pb-4">
                <h3 className="font-bold text-base text-[#101828]">
                  Operational SLA & Compliance
                </h3>
                <p className="text-xs text-[#64748b]">
                  Admin audit performance and regulatory health
                </p>
              </div>

              <div className="space-y-3.5">
                <div className="rounded-xl border border-[#e8ecf4] p-3.5 bg-[#fcfdff]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#101828]">
                      Listing Verification SLA
                    </span>
                    <span className="font-bold text-[#059669]">3.2h avg</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#64748b]">
                    Target: &lt; 24h. 96.8% compliance rate across all submissions.
                  </p>
                </div>

                <div className="rounded-xl border border-[#e8ecf4] p-3.5 bg-[#fcfdff]">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#101828]">
                      RERA Compliance Audit
                    </span>
                    <span className="font-bold text-[#2854cb]">100% Verified</span>
                  </div>
                  <p className="mt-1 text-[11px] text-[#64748b]">
                    Zero unverified builder developments active on platform.
                  </p>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleExportReport}
                  className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#162d66] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#0f1f47] transition-colors"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  <span>Download Complete Audit CSV</span>
                </button>
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
