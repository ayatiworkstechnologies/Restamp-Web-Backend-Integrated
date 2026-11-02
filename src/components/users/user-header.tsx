"use client";

import React from "react";
import {
  Users,
  UserCheck,
  Building,
  Clock,
  ShieldAlert,
  Download,
  RotateCcw,
  UserPlus,
} from "lucide-react";
import { useUserStore } from "@/context/user-context";
import { useAdminAuth } from "@/context/admin-auth-context";

interface UserHeaderProps {
  totalCount: number;
}

export function UserHeader({ totalCount }: UserHeaderProps) {
  const { stats, users, reload, loading } = useUserStore();
  const { can } = useAdminAuth();

  // CSV of the accounts already loaded (last four phone digits only).
  const handleExportCSV = () => {
    if (users.length === 0) return;
    const q = (v: string) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const headers = ["User ID", "Name", "Phone (last 4)", "Current Role", "Admin Role", "Status", "Joined"];
    const rows = users.map((u) => [u.id, q(u.name), u.phoneLast4 || "", u.roleLabel, u.adminRole || "", u.statusLabel, q(u.joinedAt || "")]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `RESTAMP_Users_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Title & Top Action Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-[26px] font-extrabold tracking-[-0.04em] text-[#16253d] sm:text-[28px]">
              User Management
            </h1>
            <span className="rounded-full border border-[#d9e5fc] bg-[#eff5ff] px-2.5 py-0.5 text-[11px] font-bold text-[#2e5ece]">
              {totalCount} Total Accounts
            </span>
          </div>
          <p className="mt-1 text-[13px] text-[#8696ab]">
            View accounts and suspend or reactivate them. KYC, profile edits and new accounts are not available yet.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={reload}
            disabled={loading}
            title="Reload users from the server"
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e2e8f2] bg-white px-3 py-2 text-xs font-semibold text-[#6a7a92] shadow-sm hover:bg-[#f8fafc] hover:text-[#1e2d42] disabled:opacity-60 transition-colors"
          >
            <RotateCcw size={14} className={loading ? "animate-spin" : ""} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={handleExportCSV}
            disabled={!can("users.export")}
            title={can("users.export") ? "Export user directory as CSV" : "Your admin role cannot export users"}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#e2e8f2] bg-white px-3.5 py-2 text-xs font-semibold text-[#54657e] shadow-sm hover:bg-[#f8fafc] hover:text-[#1e2d42] transition-colors"
          >
            <Download size={14} />
            <span>Export CSV</span>
          </button>

          <button
            disabled
            title="Not available yet: people create accounts by signing in with their mobile number"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2854cb] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_14px_#2854cb38] opacity-50 cursor-not-allowed"
          >
            <UserPlus size={16} strokeWidth={2.5} />
            <span>Add User</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {/* Total Users */}
        <div className="rounded-[16px] border border-[#e8ecf4] bg-white p-4 shadow-sm transition-all hover:border-[#d4dded]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9aa7bb]">
              Total Users
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#eef4ff] text-[#3667e9]">
              <Users size={16} />
            </span>
          </div>
          <div className="mt-2 text-[22px] font-extrabold text-[#1a2942]">{stats.total}</div>
          <div className="mt-1 text-[11px] text-[#8c9bb0]">
            <span className="font-semibold text-[#324564]">{stats.active}</span> active accounts
          </div>
        </div>

        {/* Registered Buyers */}
        <div className="rounded-[16px] border border-[#e8ecf4] bg-white p-4 shadow-sm transition-all hover:border-[#d4dded]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9aa7bb]">
              Buyers
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#10b981]">
              <UserCheck size={16} />
            </span>
          </div>
          <div className="mt-2 text-[22px] font-extrabold text-[#1a2942]">{stats.buyers}</div>
          <div className="mt-1 text-[11px] text-[#10b981] font-semibold">
            {stats.total > 0 ? `${Math.round((stats.buyers / stats.total) * 100)}% of loaded accounts` : "0%"}
          </div>
        </div>

        {/* Property Owners & Brokers */}
        <div className="rounded-[16px] border border-[#e8ecf4] bg-white p-4 shadow-sm transition-all hover:border-[#d4dded]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9aa7bb]">
              Owners & Brokers
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#f5f3ff] text-[#7c3aed]">
              <Building size={16} />
            </span>
          </div>
          <div className="mt-2 text-[22px] font-extrabold text-[#1a2942]">{stats.owners}</div>
          <div className="mt-1 text-[11px] text-[#7c3aed] font-semibold">
            {stats.agents} agent accounts
          </div>
        </div>

        {/* Pending KYC Verifications */}
        <div className="rounded-[16px] border border-[#fde68a] bg-[#fffef9] p-4 shadow-sm opacity-70" title="Not available yet">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#b45309]">
              Pending KYC
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fef3c7] text-[#d97706]">
              <Clock size={16} />
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-[22px] font-extrabold text-[#92400e]">—</span>
          </div>
          <div className="mt-1 text-[11px] text-[#b45309] font-medium">KYC is not available yet</div>
        </div>

        {/* Suspended Accounts */}
        <div className="col-span-2 sm:col-span-1 rounded-[16px] border border-[#e8ecf4] bg-white p-4 shadow-sm transition-all hover:border-[#d4dded]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#9aa7bb]">
              Suspended
            </span>
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#fef2f2] text-[#dc2626]">
              <ShieldAlert size={16} />
            </span>
          </div>
          <div className="mt-2 text-[22px] font-extrabold text-[#1a2942]">{stats.suspended}</div>
          <div className="mt-1 text-[11px] text-[#98a5b8]">Signed out until reactivated</div>
        </div>
      </div>
    </div>
  );
}
