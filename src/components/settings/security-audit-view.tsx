"use client";

import React, { useState } from "react";
import {
  ShieldAlert,
  ShieldCheck,
  Search,
  Filter,
  Clock,
  Laptop,
} from "lucide-react";
import { SecurityAuditLog } from "@/types/settings";
import { useSettingsStore } from "@/context/settings-context";

const categoryColors: Record<
  SecurityAuditLog["category"],
  { bg: string; text: string }
> = {
  Auth: { bg: "bg-[#fee2e2]", text: "text-[#b91c1c]" },
  Listing: { bg: "bg-[#e0f2fe]", text: "text-[#0369a1]" },
  User: { bg: "bg-[#ecfdf5]", text: "text-[#047857]" },
  Setting: { bg: "bg-[#ede9fe]", text: "text-[#6d28d9]" },
  Access: { bg: "bg-[#fef3c7]", text: "text-[#b45309]" },
};

const statusBadges: Record<
  SecurityAuditLog["status"],
  { bg: string; text: string }
> = {
  Success: { bg: "bg-[#e7f8ee]", text: "text-[#199864]" },
  Warning: { bg: "bg-[#fff5e3]", text: "text-[#bf811a]" },
  Blocked: { bg: "bg-[#ffeaeb]", text: "text-[#d45561]" },
};

export function SecurityAuditView() {
  const { auditLogs } = useSettingsStore();

  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredLogs = auditLogs.filter((log) => {
    if (categoryFilter !== "all" && log.category !== categoryFilter)
      return false;
    if (statusFilter !== "all" && log.status !== statusFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchActor = log.actor.toLowerCase().includes(q);
      const matchAction = log.action.toLowerCase().includes(q);
      const matchDetails = log.details.toLowerCase().includes(q);
      const matchIp = log.ipAddress.toLowerCase().includes(q);
      if (!matchActor && !matchAction && !matchDetails && !matchIp) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Filter and Search */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search audit trail by actor, action, IP, or details..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#e8ecf4] bg-white py-2 pl-9 pr-3 text-xs text-[#101828] placeholder-[#94a3b8] focus:border-[#162d66] focus:outline-none"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="rounded-xl border border-[#e8ecf4] bg-white px-3 py-2 text-xs font-medium text-[#475467] shadow-sm focus:border-[#162d66] focus:outline-none"
          >
            <option value="all">All Categories</option>
            <option value="Auth">Authentication</option>
            <option value="Listing">Listings</option>
            <option value="User">Users</option>
            <option value="Setting">Settings</option>
            <option value="Access">Team Access</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-[#e8ecf4] bg-white px-3 py-2 text-xs font-medium text-[#475467] shadow-sm focus:border-[#162d66] focus:outline-none"
          >
            <option value="all">All Outcomes</option>
            <option value="Success">Success</option>
            <option value="Warning">Warning</option>
            <option value="Blocked">Blocked</option>
          </select>
        </div>

        <div className="text-xs text-[#64748b]">
          Showing{" "}
          <span className="font-semibold text-[#101828]">
            {filteredLogs.length}
          </span>{" "}
          security events
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="overflow-hidden rounded-2xl border border-[#e8ecf4] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#f1f4f9] bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                <th className="py-3.5 pl-4 pr-3">Timestamp & IP</th>
                <th className="py-3.5 px-3">Staff Actor</th>
                <th className="py-3.5 px-3">Action & Category</th>
                <th className="py-3.5 px-3">Event Details</th>
                <th className="py-3.5 pr-4 pl-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f4f9] text-xs">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-[#94a3b8]">
                    No security audit logs found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const catStyle = categoryColors[log.category];
                  const statusStyle = statusBadges[log.status];

                  return (
                    <tr
                      key={log.id}
                      className="transition-colors hover:bg-[#fcfdfe]"
                    >
                      {/* Timestamp & IP */}
                      <td className="py-3.5 pl-4 pr-3">
                        <div className="font-medium text-[#101828] text-xs">
                          {log.timestamp}
                        </div>
                        <div className="text-[11px] text-[#64748b] flex items-center gap-1 mt-0.5">
                          <Laptop className="h-3 w-3 text-[#94a3b8]" />
                          <span>{log.ipAddress}</span>
                        </div>
                      </td>

                      {/* Staff Actor */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-[#101828]">
                          {log.actor}
                        </div>
                        <div className="text-[11px] text-[#64748b]">
                          {log.role}
                        </div>
                      </td>

                      {/* Action & Category */}
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-[#101828]">
                          {log.action}
                        </div>
                        <span
                          className={`mt-1 inline-block rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${catStyle.bg} ${catStyle.text}`}
                        >
                          {log.category}
                        </span>
                      </td>

                      {/* Event Details */}
                      <td className="py-3.5 px-3 max-w-md text-[#475467] leading-relaxed">
                        {log.details}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 pr-4 pl-3 text-right">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          {log.status === "Success" && (
                            <ShieldCheck className="h-3 w-3" />
                          )}
                          {log.status === "Blocked" && (
                            <ShieldAlert className="h-3 w-3" />
                          )}
                          <span>{log.status}</span>
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
