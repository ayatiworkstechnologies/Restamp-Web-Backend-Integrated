"use client";

import React from "react";
import {
  Building2,
  Clock3,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Download,
  RotateCcw,
  Plus,
  ShieldAlert,
} from "lucide-react";
import { usePropertyStore } from "@/context/property-context";

interface PropertyHeaderProps {
  onFilterPending: () => void;
  filteredCount: number;
  totalCount: number;
  currentFilterStatus: string;
}

export function PropertyHeader({ onFilterPending, totalCount, currentFilterStatus }: PropertyHeaderProps) {
  const { stats, properties, showToast, reload, loading } = usePropertyStore();

  // CSV of the listings already loaded in the console (no extra data, no phone numbers).
  const handleExportCSV = () => {
    if (properties.length === 0) {
      showToast("No properties to export", "info");
      return;
    }
    const q = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const headers = ["ID", "Title", "Type", "Deal", "Price", "Status", "Locality", "City", "Pincode", "Owner", "Owner ID", "Submitted At"];
    const rows = properties.map((p) => [
      p.id,
      q(p.title),
      q(p.typeLabel),
      q(p.dealLabel),
      q(p.priceDisplay),
      q(p.statusLabel),
      q(p.locality),
      q(p.city),
      p.pincode,
      q(p.ownerName),
      p.ownerId,
      q(p.submittedAt || ""),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `RESTAMP_Properties_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("Exported listings to CSV.", "success");
  };

  return (
    <div className="space-y-6">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[26px] font-extrabold tracking-[-0.04em] text-[#16253d] sm:text-[28px]">
              Property Management
            </h1>
            <span className="rounded-full border border-[#d9e5fc] bg-[#eff5ff] px-2.5 py-0.5 text-[11px] font-bold text-[#2e5ece]">
              {totalCount} Total
            </span>
          </div>
          <p className="mt-1 text-[13px] text-[#8696ab]">
            Review pending listings and verify or reject them. Listing edits and documents are not available yet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={reload}
            disabled={loading}
            title="Reload listings from the server"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e2e8f2] bg-white px-3 py-2 text-xs font-semibold text-[#6a7a92] shadow-sm hover:bg-[#f8fafc] hover:text-[#1e2d42] disabled:opacity-60 transition-colors"
          >
            <RotateCcw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            title="Download CSV report of listings"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e2e8f2] bg-white px-3.5 py-2 text-xs font-semibold text-[#54657e] shadow-sm hover:bg-[#f8fafc] hover:text-[#1e2d42] transition-colors"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            disabled
            title="Not available yet: listings are created by owners"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2854cb] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_14px_#2854cb38] opacity-50 cursor-not-allowed"
          >
            <Plus size={16} strokeWidth={2.5} />
            <span>Add Property</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Properties */}
        <div className="rounded-[16px] border border-[#e8ecf4] bg-white p-4 shadow-sm transition-all hover:border-[#d4dded]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9aa7bb]">
              Total Listings
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef4ff] text-[#3667e9]">
              <Building2 size={16} />
            </span>
          </div>
          <div className="mt-2 text-[22px] font-extrabold text-[#1a2942]">{stats.total}</div>
          <div className="mt-1 text-[11px] text-[#8c9bb0]">Including removed listings</div>
        </div>

        {/* Pending Approvals */}
        <div
          onClick={onFilterPending}
          className={`cursor-pointer rounded-[16px] border p-4 shadow-sm transition-all ${
            currentFilterStatus === "Pending"
              ? "border-[#f59e0b] bg-[#fffcf5] ring-2 ring-[#f59e0b]/30"
              : "border-[#fde68a] bg-[#fffef9] hover:border-[#f59e0b]/60"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#b45309]">
              Pending Review
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fef3c7] text-[#d97706]">
              <Clock3 size={16} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[22px] font-extrabold text-[#92400e]">{stats.pending}</span>
            {stats.pending > 0 && (
              <span className="rounded-full bg-[#fef3c7] px-2 py-0.5 text-[10px] font-bold text-[#b45309]">
                Action Needed
              </span>
            )}
          </div>
          <div className="mt-1 text-[11px] text-[#b45309] font-medium">Click to filter review queue</div>
        </div>

        {/* Active Listings */}
        <div className="rounded-[16px] border border-[#e8ecf4] bg-white p-4 shadow-sm transition-all hover:border-[#d4dded]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9aa7bb]">
              Active & Live
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eaf8f0] text-[#16a34a]">
              <CheckCircle2 size={16} />
            </span>
          </div>
          <div className="mt-2 text-[22px] font-extrabold text-[#1a2942]">{stats.active}</div>
          <div className="mt-1 text-[11px] text-[#16a34a] font-semibold">Verified and available to buyers</div>
        </div>

        {/* Rejected Listings */}
        <div className="rounded-[16px] border border-[#e8ecf4] bg-white p-4 shadow-sm transition-all hover:border-[#d4dded]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9aa7bb]">
              Rejected
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fef2f2] text-[#dc2626]">
              <XCircle size={16} />
            </span>
          </div>
          <div className="mt-2 text-[22px] font-extrabold text-[#1a2942]">{stats.rejected}</div>
          <div className="mt-1 text-[11px] text-[#98a5b8]">Owners can resubmit</div>
        </div>

        {/* Avg Property Value */}
        <div className="col-span-2 sm:col-span-1 rounded-[16px] border border-[#e8ecf4] bg-white p-4 shadow-sm transition-all hover:border-[#d4dded]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9aa7bb]">
              Not Live
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f5f3ff] text-[#7c3aed]">
              <TrendingUp size={16} />
            </span>
          </div>
          <div className="mt-2 text-[22px] font-extrabold text-[#1a2942]">{stats.inactive}</div>
          <div className="mt-1 text-[11px] text-[#98a5b8]">Hidden, closed or removed</div>
        </div>
      </div>
    </div>
  );
}
