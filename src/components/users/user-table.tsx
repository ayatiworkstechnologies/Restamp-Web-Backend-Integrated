"use client";

import React from "react";
import { ShieldAlert, ShieldCheck, Eye } from "lucide-react";
import { UserStatus } from "@/types/user";
import { AdminUser } from "@/context/user-context";
import { useAdminAuth } from "@/context/admin-auth-context";

interface UserTableProps {
  users: AdminUser[];
  onInspect: (user: AdminUser) => void;
  onSuspend: (user: AdminUser) => void;
}

const TINTS = ["#E6EBFF", "#E7F3EC", "#FDF0DB", "#EDE9FE", "#FCE7F3", "#DCFCE7", "#FEF3C7"];

export const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "U";

export const tintOf = (id: number) => TINTS[id % TINTS.length];

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export function UserTable({ users, onInspect, onSuspend }: UserTableProps) {
  const { can } = useAdminAuth();
  const canSuspend = can("users.suspend");

  const statusPills: Record<UserStatus, { bg: string; text: string; dot: string }> = {
    Active: { bg: "bg-[#e7f8ee]", text: "text-[#199864]", dot: "bg-[#21b879]" },
    "Pending KYC": { bg: "bg-[#fff5e3]", text: "text-[#bf811a]", dot: "bg-[#eca42d]" },
    Suspended: { bg: "bg-[#ffeaeb]", text: "text-[#d45561]", dot: "bg-[#e66a74]" },
    Inactive: { bg: "bg-[#f1f4f9]", text: "text-[#62738b]", dot: "bg-[#94a3b8]" },
  };

  return (
    <div className="relative rounded-2xl border border-[#e8ecf4] bg-white shadow-sm overflow-hidden">
      <div className="table-scroll overflow-x-auto">
        <table className="w-full min-w-[850px] border-collapse text-left">
          <thead className="border-b border-[#edf1f8] bg-[#f9fafc] text-[10px] font-extrabold uppercase tracking-[0.09em] text-[#8e9cb0]">
            <tr>
              <th className="px-4 py-3.5">User Profile</th>
              <th className="px-3 py-3.5">Current Role</th>
              <th className="px-3 py-3.5">Admin Access</th>
              <th className="px-3 py-3.5">Status</th>
              <th className="px-3 py-3.5">Joined</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f3f8]">
            {users.length > 0 ? (
              users.map((user) => {
                const pill = statusPills[user.status];
                const canChange = canSuspend && user.status !== "Inactive";
                return (
                  <tr key={user.id} className="transition-colors hover:bg-[#fbfcfe]">
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => onInspect(user)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-[#2854cb] cursor-pointer"
                          style={{ background: tintOf(user.userId) }}
                        >
                          {initialsOf(user.name)}
                        </div>
                        <div className="min-w-0">
                          <div
                            onClick={() => onInspect(user)}
                            className="cursor-pointer truncate text-xs font-extrabold text-[#1a2b45] hover:text-[#2854cb] transition-colors"
                          >
                            {user.name}
                          </div>
                          <div className="mt-0.5 text-[10px] text-[#9ba8bc]">
                            {user.phoneLast4 ? `Phone ••••${user.phoneLast4} · ` : ""}
                            <span className="font-mono text-[#2854cb]">#{user.id}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-3 py-4 text-xs font-bold text-[#23334e]">{user.roleLabel}</td>

                    <td className="whitespace-nowrap px-3 py-4 text-xs text-[#5a6a82]">
                      {user.adminRole ? (
                        <span className="rounded-full bg-[#eef4ff] px-2 py-0.5 text-[10px] font-bold text-[#2854cb]">{user.adminRole.replace(/_/g, " ")}</span>
                      ) : (
                        "—"
                      )}
                    </td>

                    <td className="whitespace-nowrap px-3 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold before:h-1.5 before:w-1.5 before:rounded-full ${pill.bg} ${pill.text} before:${pill.dot}`}
                      >
                        {user.statusLabel}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-3 py-4 text-xs text-[#8091a7]">{formatDate(user.joinedAt)}</td>

                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => onInspect(user)}
                          className="inline-flex items-center gap-1 rounded-xl border border-[#dce3ef] bg-white px-2.5 py-1.5 text-xs font-bold text-[#445672] shadow-sm hover:bg-[#f6f9fc] hover:text-[#2854cb] transition-colors"
                        >
                          <Eye size={13} />
                          <span>Profile</span>
                        </button>
                        {canChange && (
                          <button
                            type="button"
                            onClick={() => onSuspend(user)}
                            title={user.status === "Suspended" ? "Reactivate account" : "Suspend account"}
                            aria-label={user.status === "Suspended" ? "Reactivate account" : "Suspend account"}
                            className={`rounded-lg p-1.5 transition-colors ${
                              user.status === "Suspended"
                                ? "bg-[#10b981]/10 text-[#10b981] hover:bg-[#10b981] hover:text-white"
                                : "bg-[#ef4444]/10 text-[#ef4444] hover:bg-[#ef4444] hover:text-white"
                            }`}
                          >
                            {user.status === "Suspended" ? <ShieldCheck size={16} /> : <ShieldAlert size={16} />}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={6} className="py-16 text-center text-sm text-[#93a2b7]">
                  No users found matching your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
