"use client";

import React, { useMemo, useState } from "react";
import { UserTable } from "@/components/users/user-table";
import { UserDetailModal } from "@/components/users/user-detail-modal";
import { UserSuspendModal } from "@/components/users/user-suspend-modal";
import { AdminUser, useUserStore } from "@/context/user-context";

interface RoleUserListProps {
  role: "buyer" | "owner" | "agent";
  title: string;
}

export function RoleUserList({ role, title }: RoleUserListProps) {
  const { users, loading, loadError, suspendUser, activateUser } = useUserStore();
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);

  const filtered = useMemo(() => users.filter((u) => u.role === role), [users, role]);
  const target = selectedUser ? filtered.find((u) => u.userId === selectedUser.userId) || null : null;

  const handleInspect = (user: AdminUser) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };

  const handleOpenSuspend = (user: AdminUser) => {
    setSelectedUser(user);
    setIsSuspendOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-[26px] font-extrabold tracking-[-0.04em] text-[#16253d]">{title}</h2>
        <p className="mt-1 text-[13px] text-[#8696ab]">
          {filtered.length} account{filtered.length !== 1 ? "s" : ""} loaded from the backend
        </p>
      </div>
      {loadError && (
        <div className="rounded-xl border border-[#fee2e2] bg-[#fef2f2] p-3 text-xs text-[#991b1b]" role="alert">
          {loadError}
        </div>
      )}
      {loading ? (
        <div className="rounded-xl border border-[#e8ecf4] bg-white py-20 text-center text-sm text-[#93a2b7]">
          Loading {title.toLowerCase()}…
        </div>
      ) : (
        <UserTable users={filtered} onInspect={handleInspect} onSuspend={handleOpenSuspend} />
      )}
      <UserDetailModal
        user={target}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onSuspend={(u) => {
          setIsDetailOpen(false);
          handleOpenSuspend(u);
        }}
      />
      <UserSuspendModal
        user={target}
        isOpen={isSuspendOpen}
        onClose={() => setIsSuspendOpen(false)}
        onSuspend={(id, reason) => suspendUser(id, reason)}
        onActivate={(id, reason) => activateUser(id, reason)}
      />
    </div>
  );
}
