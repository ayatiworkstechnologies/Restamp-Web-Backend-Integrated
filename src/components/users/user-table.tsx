"use client";

import React, { useState } from "react";
import {
  ShieldCheck,
  ShieldAlert,
  Eye,
  MoreVertical,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  FileText,
  UserCheck,
  Building,
  Clock,
} from "lucide-react";
import { User, UserStatus, KycStatus } from "@/types/user";
import { useUserStore } from "@/context/user-context";

interface UserTableProps {
  users: User[];
  onInspect: (user: User) => void;
  onVerifyKyc: (user: User) => void;
  onSuspend: (user: User) => void;
  onEdit: (user: User) => void;
}

export function UserTable({
  users,
  onInspect,
  onVerifyKyc,
  onSuspend,
  onEdit,
}: UserTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const { batchVerifyKyc, batchSuspend, deleteUser } = useUserStore();

  const handleSelectAll = () => {
    if (selectedIds.length === users.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(users.map((u) => u.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBatchVerify = () => {
    if (selectedIds.length === 0) return;
    batchVerifyKyc(selectedIds);
    setSelectedIds([]);
  };

  const handleBatchSuspend = () => {
    if (selectedIds.length === 0) return;
    batchSuspend(selectedIds, "Administrative bulk compliance suspension.");
    setSelectedIds([]);
  };

  const statusPills: Record<UserStatus, { bg: string; text: string; dot: string }> = {
    Active: { bg: "bg-[#e7f8ee]", text: "text-[#199864]", dot: "bg-[#21b879]" },
    "Pending KYC": { bg: "bg-[#fff5e3]", text: "text-[#bf811a]", dot: "bg-[#eca42d]" },
    Suspended: { bg: "bg-[#ffeaeb]", text: "text-[#d45561]", dot: "bg-[#e66a74]" },
    Inactive: { bg: "bg-[#f1f4f9]", text: "text-[#62738b]", dot: "bg-[#94a3b8]" },
  };

  const kycBadges: Record<KycStatus, { bg: string; text: string; icon: React.ReactNode }> = {
    Verified: {
      bg: "bg-[#ecfdf5] text-[#059669]",
      text: "KYC Verified",
      icon: <ShieldCheck size={11} />,
    },
    Pending: {
      bg: "bg-[#fffbeb] text-[#d97706]",
      text: "KYC Pending",
      icon: <Clock size={11} />,
    },
    Rejected: {
      bg: "bg-[#fef2f2] text-[#dc2626]",
      text: "KYC Rejected",
      icon: <ShieldAlert size={11} />,
    },
    "Not Submitted": {
      bg: "bg-[#f1f4f9] text-[#6b7b92]",
      text: "No KYC",
      icon: null,
    },
  };

  return (
    <div className="relative rounded-2xl border border-[#e8ecf4] bg-white shadow-sm overflow-hidden">
      <div className="table-scroll overflow-x-auto">
        <table className="w-full min-w-[950px] border-collapse text-left">
          <thead className="border-b border-[#edf1f8] bg-[#f9fafc] text-[10px] font-extrabold uppercase tracking-[0.09em] text-[#8e9cb0]">
            <tr>
              <th className="w-10 px-4 py-3.5 text-center">
                <input
                  type="checkbox"
                  checked={users.length > 0 && selectedIds.length === users.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-[#2854cb]"
                />
              </th>
              <th className="px-4 py-3.5">User Profile</th>
              <th className="px-3 py-3.5">Role & Type</th>
              <th className="px-3 py-3.5">KYC Status</th>
              <th className="px-3 py-3.5">Platform Activity</th>
              <th className="px-3 py-3.5">Location</th>
              <th className="px-3 py-3.5">Status</th>
              <th className="px-3 py-3.5">Joined</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f3f8]">
            {users.length > 0 ? (
              users.map((user) => {
                const isSelected = selectedIds.includes(user.id);
                const pill = statusPills[user.status];
                const kyc = kycBadges[user.kycStatus];

                return (
                  <tr
                    key={user.id}
                    className={`transition-colors hover:bg-[#fbfcfe] ${
                      isSelected ? "bg-[#f4f7fe]" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(user.id)}
                        className="rounded border-gray-300 text-[#2854cb]"
                      />
                    </td>

                    {/* User Profile */}
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <div
                          onClick={() => onInspect(user)}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-black text-[#2854cb] cursor-pointer"
                          style={{ background: user.tint }}
                        >
                          {user.initials}
                        </div>
                        <div className="min-w-0">
                          <div
                            onClick={() => onInspect(user)}
                            className="cursor-pointer truncate text-xs font-extrabold text-[#1a2b45] hover:text-[#2854cb] transition-colors"
                          >
                            {user.name}
                          </div>
                          <div className="mt-0.5 text-[11px] text-[#7d8ea5]">
                            {user.email}
                          </div>
                          <div className="mt-0.5 text-[10px] text-[#9ba8bc]">
                            {user.phone} · <span className="font-mono text-[#2854cb]">{user.id}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Role & Type */}
                    <td className="whitespace-nowrap px-3 py-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold capitalize ${
                            user.role === "owner"
                              ? "bg-[#f5f3ff] text-[#7c3aed]"
                              : "bg-[#eff6ff] text-[#2563eb]"
                          }`}
                        >
                          {user.role === "owner" ? <Building size={11} /> : <UserCheck size={11} />}
                          <span>{user.role}</span>
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-[#6d7e96] font-medium">
                        {user.role === "owner"
                          ? user.companyName || user.ownerType || "Individual"
                          : "Property Seeker"}
                      </div>
                    </td>

                    {/* KYC Status */}
                    <td className="whitespace-nowrap px-3 py-4">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${kyc.bg}`}
                      >
                        {kyc.icon}
                        <span>{kyc.text}</span>
                      </span>
                    </td>

                    {/* Activity */}
                    <td className="whitespace-nowrap px-3 py-4 text-xs">
                      {user.role === "owner" ? (
                        <div>
                          <div className="font-bold text-[#23334d]">
                            {user.totalListingsCount || 0} Listed
                          </div>
                          <div className="text-[10px] text-[#8697ae]">
                            {user.activeListingsCount || 0} active live
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-bold text-[#23334d]">
                            {user.enquiries?.length || 0} Inquiries
                          </div>
                          <div className="text-[10px] text-[#8697ae]">
                            {user.savedPropertyIds?.length || 0} saved items
                          </div>
                        </div>
                      )}
                    </td>

                    {/* Location */}
                    <td className="whitespace-nowrap px-3 py-4 text-xs text-[#63748c]">
                      <div className="font-medium">{user.city}</div>
                      <div className="text-[10px] text-[#93a2b7]">{user.state}</div>
                    </td>

                    {/* Account Status */}
                    <td className="whitespace-nowrap px-3 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold before:h-1.5 before:w-1.5 before:rounded-full ${pill.bg} ${pill.text} before:${pill.dot}`}
                      >
                        {user.status}
                      </span>
                    </td>

                    {/* Joined Date */}
                    <td className="whitespace-nowrap px-3 py-4 text-xs text-[#8091a7]">
                      <div>{user.joinedDate}</div>
                      <div className="text-[10px] text-[#a0afbf]">{user.lastActive}</div>
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {user.kycStatus === "Pending" && (
                          <button
                            type="button"
                            onClick={() => onVerifyKyc(user)}
                            className="rounded-lg bg-[#10b981]/10 p-1.5 text-[#10b981] hover:bg-[#10b981] hover:text-white transition-colors"
                            title="Verify KYC Documents"
                          >
                            <ShieldCheck size={16} />
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => onInspect(user)}
                          className="inline-flex items-center gap-1 rounded-xl border border-[#dce3ef] bg-white px-2.5 py-1.5 text-xs font-bold text-[#445672] shadow-sm hover:bg-[#f6f9fc] hover:text-[#2854cb] transition-colors"
                        >
                          <Eye size={13} />
                          <span>Profile</span>
                        </button>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(activeMenuId === user.id ? null : user.id)
                            }
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeMenuId === user.id && (
                            <div className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-[#e4ebf5] bg-white py-1.5 shadow-xl text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onInspect(user);
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#384962] hover:bg-[#f6f8fb]"
                              >
                                <Eye size={14} /> Full Details
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onVerifyKyc(user);
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#384962] hover:bg-[#f6f8fb]"
                              >
                                <ShieldCheck size={14} className="text-[#10b981]" /> KYC Review
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onEdit(user);
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#384962] hover:bg-[#f6f8fb]"
                              >
                                <Edit size={14} /> Edit User
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onSuspend(user);
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#384962] hover:bg-[#f6f8fb]"
                              >
                                {user.status === "Suspended" ? (
                                  <>
                                    <CheckCircle2 size={14} className="text-[#10b981]" /> Restore Account
                                  </>
                                ) : (
                                  <>
                                    <XCircle size={14} className="text-[#ef4444]" /> Suspend Account
                                  </>
                                )}
                              </button>
                              <div className="my-1 border-t border-[#f0f3f8]" />
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  if (confirm(`Are you sure you want to delete user ${user.id}?`)) {
                                    deleteUser(user.id);
                                  }
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#dc2626] hover:bg-[#fef2f2]"
                              >
                                <Trash2 size={14} /> Delete User
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={9} className="py-16 text-center text-sm text-[#93a2b7]">
                  No users found matching your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Batch Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-fade-in flex items-center gap-3 rounded-2xl border border-[#2854cb]/30 bg-[#17253d] px-5 py-3 text-white shadow-2xl backdrop-blur-md">
          <span className="text-xs font-bold text-[#b4cbfa]">
            {selectedIds.length} users selected
          </span>
          <div className="h-4 w-px bg-white/20" />
          <button
            type="button"
            onClick={handleBatchVerify}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#10b981] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#059669] transition-all"
          >
            <ShieldCheck size={14} />
            <span>Verify Selected KYC</span>
          </button>
          <button
            type="button"
            onClick={handleBatchSuspend}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#ef4444] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#dc2626] transition-all"
          >
            <ShieldAlert size={14} />
            <span>Suspend Selected</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Deselect
          </button>
        </div>
      )}
    </div>
  );
}
