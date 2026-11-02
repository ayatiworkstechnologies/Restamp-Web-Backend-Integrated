"use client";

import React, { useState } from "react";
import { Trash2, Loader2, ShieldCheck } from "lucide-react";
import { useSettingsStore } from "@/context/settings-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import type { AssignableRole } from "@/lib/api/admin";

interface AdminUsersTableProps {
  onOpenInvite: () => void;
}

export const ASSIGNABLE_ROLES: { code: AssignableRole; label: string }[] = [
  { code: "SUPER_ADMIN", label: "Super Admin" },
  { code: "OPERATIONS_MANAGER", label: "Operations Manager" },
  { code: "LISTING_REVIEWER", label: "Listing Reviewer" },
  { code: "SUPPORT_SPECIALIST", label: "Support Specialist" },
];

/**
 * Admin staff from GET /admin/staff. Role changes and revocation go to the
 * backend, which refuses self-changes and removing the last active Super
 * Admin; its message is shown when it does.
 */
export function AdminUsersTable({ onOpenInvite }: AdminUsersTableProps) {
  const { staff, changeStaffRole, revokeStaff, loading } = useSettingsStore();
  const { admin, can } = useAdminAuth();
  const [busyId, setBusyId] = useState<number | null>(null);

  if (!can("settings.manage_team")) {
    return (
      <div className="rounded-2xl border border-[#e8ecf4] bg-white p-8 text-center text-sm text-[#94a3b8]">
        Your admin role does not include managing admin staff.
      </div>
    );
  }

  const run = async (userId: number, action: () => Promise<boolean>) => {
    setBusyId(userId);
    await action();
    setBusyId(null);
  };

  return (
    <div className="rounded-2xl border border-[#e8ecf4] bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between border-b border-[#f1f4f9] px-5 py-4">
        <h3 className="text-sm font-bold text-[#101828]">Admin Staff & Team</h3>
        <button type="button" onClick={onOpenInvite} className="text-xs font-semibold text-[#162d66] hover:underline">
          + Grant admin access
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left text-xs">
          <thead className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            <tr>
              <th className="px-5 py-3">Team member</th>
              <th className="px-3 py-3">Role</th>
              <th className="px-3 py-3">Account</th>
              <th className="px-5 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f4f9]">
            {loading ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-[#94a3b8]">Loading…</td>
              </tr>
            ) : staff.length === 0 ? (
              <tr>
                <td colSpan={4} className="py-10 text-center text-[#94a3b8]">No admin staff found.</td>
              </tr>
            ) : (
              staff.map((s) => {
                const isSelf = String(s.user_id) === admin?.id;
                const busy = busyId === s.user_id;
                const assignable = ASSIGNABLE_ROLES.some((r) => r.code === s.admin_role);
                return (
                  <tr key={s.user_id} className="hover:bg-[#fcfdfe]">
                    <td className="px-5 py-3">
                      <div className="font-semibold text-[#101828]">
                        {s.display_name || "Restamp user"} {isSelf && <span className="text-[10px] font-normal text-[#94a3b8]">(you)</span>}
                      </div>
                      <div className="text-[11px] text-[#94a3b8]">User #{s.user_id}</div>
                    </td>
                    <td className="px-3 py-3">
                      <select
                        value={assignable ? s.admin_role : ""}
                        disabled={isSelf || busy}
                        title={isSelf ? "You cannot change your own admin access" : undefined}
                        onChange={(e) => void run(s.user_id, () => changeStaffRole(s.user_id, e.target.value as AssignableRole))}
                        className="rounded-lg border border-[#e8ecf4] bg-white px-2 py-1.5 text-xs font-semibold text-[#344054] disabled:opacity-60"
                      >
                        {!assignable && <option value="">{s.role_label} (legacy)</option>}
                        {ASSIGNABLE_ROLES.map((r) => (
                          <option key={r.code} value={r.code}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-3 capitalize text-[#475467]">{s.status}</td>
                    <td className="px-5 py-3 text-right">
                      {busy ? (
                        <Loader2 className="ml-auto h-4 w-4 animate-spin text-[#94a3b8]" />
                      ) : isSelf ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-[#94a3b8]">
                          <ShieldCheck className="h-3.5 w-3.5" /> You
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`Revoke admin access for ${s.display_name || `user #${s.user_id}`}?`)) {
                              void run(s.user_id, () => revokeStaff(s.user_id));
                            }
                          }}
                          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-[#dc2626] hover:bg-[#fef2f2]"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
