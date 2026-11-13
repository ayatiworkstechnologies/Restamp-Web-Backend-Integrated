"use client";

import { confirmDialog } from "@/components/common/confirm-dialog";
import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  UserCheck,
  Plus,
  Search,
  MoreVertical,
  Mail,
  Phone,
  Trash2,
  Edit2,
  Lock,
} from "lucide-react";
import { AdminUser, AdminRoleType, AdminUserStatus } from "@/types/settings";
import { useSettingsStore } from "@/context/settings-context";

interface AdminUsersTableProps {
  onOpenInvite: () => void;
  onEditUser: (user: AdminUser) => void;
}

const roleColors: Record<AdminRoleType, { bg: string; text: string }> = {
  "Super Admin": { bg: "bg-[#ede9fe]", text: "text-[#6d28d9]" },
  "Operations Manager": { bg: "bg-[#e0f2fe]", text: "text-[#0369a1]" },
  "Listing Reviewer": { bg: "bg-[#fef3c7]", text: "text-[#b45309]" },
  "Support Specialist": { bg: "bg-[#ccfbf1]", text: "text-[#0f766e]" },
};

const statusColors: Record<AdminUserStatus, { bg: string; text: string; dot: string }> = {
  Active: { bg: "bg-[#e7f8ee]", text: "text-[#199864]", dot: "bg-[#21b879]" },
  Invited: { bg: "bg-[#fff5e3]", text: "text-[#bf811a]", dot: "bg-[#eca42d]" },
  Suspended: { bg: "bg-[#ffeaeb]", text: "text-[#d45561]", dot: "bg-[#e66a74]" },
};

export function AdminUsersTable({
  onOpenInvite,
  onEditUser,
}: AdminUsersTableProps) {
  const { adminUsers, updateAdminUser, deleteAdminUser } = useSettingsStore();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<"all" | AdminRoleType>("all");
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const filteredUsers = adminUsers.filter((user) => {
    if (roleFilter !== "all" && user.role !== roleFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const matchName = user.name.toLowerCase().includes(q);
      const matchEmail = user.email.toLowerCase().includes(q);
      const matchDept = user.department.toLowerCase().includes(q);
      if (!matchName && !matchEmail && !matchDept) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4">
      {/* Top Search & Filter Bar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2.5 flex-1 max-w-md">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[#94a3b8]" />
            <input
              type="text"
              placeholder="Search staff by name, email, department..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-[#e8ecf4] bg-white py-2 pl-9 pr-3 text-xs text-[#101828] placeholder-[#94a3b8] focus:border-[#162d66] focus:outline-none"
            />
          </div>

          <select
            value={roleFilter}
            onChange={(e) =>
              setRoleFilter(e.target.value as "all" | AdminRoleType)
            }
            className="rounded-xl border border-[#e8ecf4] bg-white px-3 py-2 text-xs font-medium text-[#475467] shadow-sm focus:border-[#162d66] focus:outline-none"
          >
            <option value="all">All Admin Roles</option>
            <option value="Super Admin">Super Admin</option>
            <option value="Operations Manager">Operations Manager</option>
            <option value="Listing Reviewer">Listing Reviewer</option>
            <option value="Support Specialist">Support Specialist</option>
          </select>
        </div>

        <button
          type="button"
          onClick={onOpenInvite}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#162d66] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0f1f47] transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Invite Team Member</span>
        </button>
      </div>

      {/* Table Container */}
      <div className="overflow-hidden rounded-2xl border border-[#e8ecf4] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#f1f4f9] bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                <th className="py-3.5 pl-4 pr-3">Staff Member</th>
                <th className="py-3.5 px-3">Role & Permissions</th>
                <th className="py-3.5 px-3">Department</th>
                <th className="py-3.5 px-3">Security & 2FA</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 px-3">Last Active</th>
                <th className="py-3.5 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f4f9] text-xs">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-[#94a3b8]">
                    No staff members found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleStyle = roleColors[user.role];
                  const statusStyle = statusColors[user.status];

                  return (
                    <tr
                      key={user.id}
                      className="transition-colors hover:bg-[#fcfdfe]"
                    >
                      {/* Member Name & Email */}
                      <td className="py-3.5 pl-4 pr-3">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#162d66] text-xs font-bold text-white">
                            {user.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-semibold text-[#101828]">
                              {user.name}
                            </div>
                            <div className="text-[11px] text-[#64748b]">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex rounded-lg px-2.5 py-1 text-[11px] font-semibold ${roleStyle.bg} ${roleStyle.text}`}
                        >
                          {user.role}
                        </span>
                      </td>

                      {/* Department */}
                      <td className="py-3.5 px-3 text-[#475467]">
                        {user.department}
                      </td>

                      {/* 2FA */}
                      <td className="py-3.5 px-3">
                        {user.twoFactorEnabled ? (
                          <span className="inline-flex items-center gap-1 text-[#10b981] font-medium text-[11px]">
                            <ShieldCheck className="h-3.5 w-3.5" />
                            <span>2FA Enforced</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[#94a3b8] text-[11px]">
                            <ShieldAlert className="h-3.5 w-3.5" />
                            <span>Disabled</span>
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`}
                          />
                          {user.status}
                        </span>
                      </td>

                      {/* Last Active */}
                      <td className="py-3.5 px-3 text-[#64748b] text-[11px]">
                        {user.lastActive}
                      </td>

                      {/* Actions Menu */}
                      <td className="py-3.5 pr-4 pl-3 text-right">
                        <div className="relative inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => onEditUser(user)}
                            className="rounded-lg border border-[#e8ecf4] bg-white px-2.5 py-1 text-xs font-semibold text-[#162d66] hover:bg-[#f0f4ff]"
                          >
                            Edit
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuId(
                                  activeMenuId === user.id ? null : user.id
                                )
                              }
                              className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#334155]"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {activeMenuId === user.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-[#e8ecf4] bg-white p-1.5 shadow-xl text-left text-xs"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onEditUser(user);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[#334155] hover:bg-[#f1f5f9]"
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                  <span>Edit Profile & Role</span>
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    updateAdminUser(user.id, {
                                      status:
                                        user.status === "Suspended"
                                          ? "Active"
                                          : "Suspended",
                                    });
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[#334155] hover:bg-[#f1f5f9]"
                                >
                                  <Lock className="h-3.5 w-3.5" />
                                  <span>
                                    {user.status === "Suspended"
                                      ? "Activate Account"
                                      : "Suspend Access"}
                                  </span>
                                </button>

                                <div className="my-1 border-t border-[#f1f4f9]" />

                                <button
                                  type="button"
                                  onClick={async () => {
                                    setActiveMenuId(null);
                                    if (await confirmDialog({ title: "Remove member", body: `Are you sure you want to remove ${user.name} from the admin team? They will lose access immediately.`, confirmLabel: "Remove" })) {
                                      deleteAdminUser(user.id);
                                    }
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-[#ef4444] hover:bg-[#fef2f2]"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Remove Member</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
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
