"use client";

import React, { useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { useSettingsStore } from "@/context/settings-context";
import { useAdminAuth } from "@/context/admin-auth-context";

const ACTION_LABELS: Record<string, string> = {
  ADMIN_LISTING_VERIFIED: "Listing verified",
  ADMIN_LISTING_REJECTED: "Listing rejected",
  ADMIN_USER_SUSPENDED: "User suspended",
  ADMIN_USER_REACTIVATED: "User reactivated",
  ADMIN_STAFF_GRANTED: "Admin access granted",
  ADMIN_STAFF_ROLE_CHANGED: "Admin role changed",
  ADMIN_STAFF_REVOKED: "Admin access revoked",
  LEAD_CLOSED: "Owner closed an enquiry",
};

const formatDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

/** Short, readable before -> after summary of an audit row (no phone numbers are ever logged). */
function describe(before?: Record<string, unknown> | null, after?: Record<string, unknown> | null): string {
  const parts: string[] = [];
  const target = (after?.listing_id ?? before?.listing_id) as number | undefined;
  const user = (after?.user_id ?? before?.user_id) as number | undefined;
  const enquiry = (after?.enquiry_id ?? before?.enquiry_id) as number | undefined;
  if (target) parts.push(`listing #${target}`);
  if (user) parts.push(`user #${user}`);
  if (enquiry) parts.push(`enquiry #${enquiry}`);
  for (const key of ["verification_status", "status", "admin_role"]) {
    const b = before?.[key];
    const a = after?.[key];
    if (a !== undefined || b !== undefined) parts.push(`${key.replace(/_/g, " ")}: ${b ?? "—"} → ${a ?? "—"}`);
  }
  if (typeof after?.reason === "string") parts.push(`reason: ${after.reason}`);
  if (typeof after?.category === "string") parts.push(`category: ${after.category}`);
  return parts.join(" · ");
}

/** The backend audit log (GET /admin/audit-logs), newest first, with paging. */
export function SecurityAuditView() {
  const { auditLogs, auditTotal, loadMoreAudit, loading } = useSettingsStore();
  const { can } = useAdminAuth();
  const [loadingMore, setLoadingMore] = useState(false);

  if (!can("settings.view_audit_logs")) {
    return (
      <div className="rounded-2xl border border-[#e8ecf4] bg-white p-8 text-center text-sm text-[#94a3b8]">
        Your admin role does not include the audit log.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e8ecf4] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#f1f4f9] px-5 py-4">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-[#162d66]" />
          <h3 className="text-sm font-bold text-[#101828]">Security Audit Trail</h3>
        </div>
        <span className="text-xs text-[#64748b]">{auditTotal} events</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] text-left text-xs">
          <thead className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            <tr>
              <th className="px-5 py-3">When</th>
              <th className="px-3 py-3">Actor</th>
              <th className="px-3 py-3">Action</th>
              <th className="px-3 py-3">Details</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f4f9]">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-[#94a3b8]">Loading…</td>
              </tr>
            ) : auditLogs.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-[#94a3b8]">No audit events recorded yet.</td>
              </tr>
            ) : (
              auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-[#fcfdfe]">
                  <td className="whitespace-nowrap px-5 py-3 text-[#64748b]">{formatDateTime(log.created_at)}</td>
                  <td className="whitespace-nowrap px-3 py-3 font-semibold text-[#101828]">
                    {log.actor_name || "User"} <span className="font-normal text-[#94a3b8]">#{log.actor_user_id}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className="rounded-full bg-[#f0f4ff] px-2 py-0.5 font-semibold text-[#162d66]">{ACTION_LABELS[log.action] || log.action}</span>
                  </td>
                  <td className="px-3 py-3 text-[#475467]">{describe(log.before, log.after)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {auditLogs.length < auditTotal && (
        <div className="border-t border-[#f1f4f9] p-3 text-center">
          <button
            type="button"
            disabled={loadingMore}
            onClick={async () => {
              setLoadingMore(true);
              await loadMoreAudit();
              setLoadingMore(false);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#162d66] hover:underline disabled:opacity-60"
          >
            {loadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Load older events
          </button>
        </div>
      )}
    </div>
  );
}
