"use client";

import React from "react";
import {
  MessageSquare,
  Clock,
  CheckCircle2,
  Archive,
  Download,
  RotateCcw,
  Plus,
} from "lucide-react";
import { useEnquiryStore } from "@/context/enquiry-context";
import { useAdminAuth } from "@/context/admin-auth-context";

interface EnquiryHeaderProps {
  onFilterActive: () => void;
  filteredCount: number;
  totalCount: number;
  currentStatusFilter: string;
}

export function EnquiryHeader({ onFilterActive, filteredCount, totalCount, currentStatusFilter }: EnquiryHeaderProps) {
  const { stats, enquiries, reload, loading } = useEnquiryStore();
  const { can } = useAdminAuth();

  // CSV of the enquiries already loaded (names and ids only; no phone numbers).
  const handleExportCSV = () => {
    if (enquiries.length === 0) return;
    const q = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const headers = ["Enquiry ID", "Date", "Buyer", "Buyer ID", "Listing", "Listing ID", "Owner", "Owner ID", "Messages", "Last Message", "Status"];
    const rows = enquiries.map((e) => [
      e.id,
      q(e.createdAt || ""),
      q(e.buyerName),
      e.buyerId,
      q(e.listingTitle),
      e.listingId,
      q(e.ownerName),
      e.ownerId,
      e.messageCount,
      q(e.lastMessage),
      q(e.statusLabel),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `restamp_buyer_enquiries_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & Quick Actions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-[#101828] sm:text-3xl">
              Buyer Enquiries & Leads
            </h1>
            <span className="rounded-full bg-[#f0f4ff] px-2.5 py-0.5 text-xs font-semibold text-[#162d66] border border-[#d0e0ff]">
              {filteredCount} of {totalCount} records
            </span>
          </div>
          <p className="mt-1 text-sm text-[#475467]">
            Read buyer enquiries and their conversations. Status is managed by each property owner.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={reload}
            disabled={loading}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e8ecf4] bg-white px-3 py-2 text-xs font-semibold text-[#475467] shadow-sm hover:bg-[#f8fafc] hover:text-[#101828] disabled:opacity-60 transition-colors"
            title="Reload enquiries from the server"
          >
            <RotateCcw className={`h-3.5 w-3.5 text-[#94a3b8] ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={!can("enquiries.export")}
            title={can("enquiries.export") ? undefined : "Your admin role cannot export enquiries"}
            className="disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5 rounded-xl border border-[#e8ecf4] bg-white px-3 py-2 text-xs font-semibold text-[#475467] shadow-sm hover:bg-[#f8fafc] hover:text-[#101828] transition-colors"
          >
            <Download className="h-3.5 w-3.5 text-[#94a3b8]" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            disabled
            title="Not available yet: enquiries are created by buyers"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#162d66] px-4 py-2 text-xs font-bold text-white shadow-sm opacity-50 cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
            <span>Log Inbound Lead</span>
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {/* Total Enquiries */}
        <div className="rounded-2xl border border-[#e8ecf4] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b]">Total Inquiries</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f0f4ff] text-[#162d66]">
              <MessageSquare className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#101828]">{stats.total}</span>
            <span className="text-[11px] text-[#64748b]">All time</span>
          </div>
        </div>

        {/* Active Enquiries */}
        <div
          onClick={onFilterActive}
          className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition-all hover:border-[#f59e0b] ${
            currentStatusFilter === "Active"
              ? "border-[#f59e0b] bg-[#fffbf0]"
              : "border-[#e8ecf4] bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b]">New</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fef3c7] text-[#d97706]">
              <Clock className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#d97706]">{stats.active}</span>
            <span className="text-[11px] text-[#b45309]">Owner has not responded yet</span>
          </div>
        </div>

        {/* Addressed Enquiries */}
        <div className="rounded-2xl border border-[#e8ecf4] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b]">Owner responded</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#10b981]">
              <CheckCircle2 className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#10b981]">{stats.addressed}</span>
            <span className="text-[11px] text-[#059669]">In conversation</span>
          </div>
        </div>

        {/* Archived Enquiries */}
        <div className="rounded-2xl border border-[#e8ecf4] bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#64748b]">Closed</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f1f5f9] text-[#64748b]">
              <Archive className="h-4 w-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[#64748b]">{stats.archived}</span>
            <span className="text-[11px] text-[#94a3b8]">Closed by owner</span>
          </div>
        </div>
      </div>
    </div>
  );
}
