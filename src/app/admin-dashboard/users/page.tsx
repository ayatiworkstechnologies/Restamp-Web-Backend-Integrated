"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Menu,
  Bell,
  Search,
  X,
  UsersRound,
  ShieldAlert,
} from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { UserHeader } from "@/components/users/user-header";
import { UserFiltersBar } from "@/components/users/user-filters";
import { UserTable } from "@/components/users/user-table";
import { UserDetailModal } from "@/components/users/user-detail-modal";
import { UserSuspendModal } from "@/components/users/user-suspend-modal";
import { AdminUser, useUserStore } from "@/context/user-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import { UserFilters, UserRole } from "@/types/user";

function UserManagementContent() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") as UserRole | null;
  const initialTab = searchParams.get("tab");
  const initialId = searchParams.get("id");

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Modals state
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);

  const { users, stats, loading, loadError, truncated, reload, suspendUser, activateUser } = useUserStore();
  const { admin } = useAdminAuth();
  const selectedUser = users.find((u) => u.userId === selectedId) || null;

  // Filters state
  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    role: initialRole || "all",
    status: "all",
    kycStatus: initialTab === "kyc" ? "Pending" : "all",
    ownerType: "all",
    sortBy: "recent",
  });

  // Handle URL query parameters
  useEffect(() => {
    if (initialRole) {
      setFilters((prev) => ({ ...prev, role: initialRole }));
    }
    if (initialTab === "kyc") {
      setFilters((prev) => ({ ...prev, kycStatus: "Pending" }));
    }
    if (initialId) {
      const match = users.find((u) => u.id === initialId);
      if (match) {
        setSelectedId(match.userId);
        setIsDetailOpen(true);
      }
    }
  }, [initialRole, initialTab, initialId, users]);

  const handleFilterChange = (newFilters: Partial<UserFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  };

  // Filtered and sorted users
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        // Role filter
        if (filters.role !== "all" && u.role !== filters.role) return false;

        // Status filter
        if (filters.status !== "all" && u.status !== filters.status) return false;


        // Search filter
        if (filters.search.trim()) {
          const q = filters.search.toLowerCase().trim();
          const matches =
            u.name.toLowerCase().includes(q) ||
            u.id.includes(q) ||
            (!!u.phoneLast4 && q.replace(/\D/g, "").endsWith(u.phoneLast4));
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === "name_asc") return a.name.localeCompare(b.name);
        // default: recent (higher id = registered later)
        return b.userId - a.userId;
      });
  }, [users, filters]);

  const roleCounts = useMemo(() => {
    return {
      all: users.length,
      buyers: users.filter((u) => u.role === "buyer").length,
      owners: users.filter((u) => u.role === "owner").length,
    };
  }, [users]);

  // Modal handlers
  const handleInspect = (user: AdminUser) => {
    setSelectedId(user.userId);
    setIsDetailOpen(true);
  };

  const handleOpenSuspend = (user: AdminUser) => {
    setSelectedId(user.userId);
    setIsSuspendOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="min-w-0 lg:pl-[272px]">
        {/* Top Header */}
        <header className="sticky top-0 z-20 flex h-[77px] items-center justify-between border-b border-[#e9edf5] bg-white/95 px-4 backdrop-blur-md sm:px-7 xl:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              type="button"
              aria-label="Open navigation"
              className="rounded-xl border border-[#e8edf5] p-2 text-[#60708a] lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div>
              <div className="text-[11px] font-semibold text-[#abb5c5]">
                Workspace <span className="px-2 text-[#c4cbd6]">/</span> Users
              </div>
              <div className="mt-0.5 text-[15px] font-extrabold text-[#24324b] sm:text-[16px]">
                Buyers & Owners Directory
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-5">
            {/* Quick search input */}
            <div className="hidden items-center gap-2 rounded-xl border border-[#e9edf5] bg-[#fafbfe] px-3.5 py-2.5 md:flex">
              <Search size={16} className="text-[#a5afc0]" />
              <input
                type="search"
                value={filters.search}
                onChange={(e) => handleFilterChange({ search: e.target.value })}
                className="w-36 bg-transparent text-xs text-[#24324b] outline-none placeholder:text-[#a8b3c4] xl:w-52"
                placeholder="Search buyers, owners..."
              />
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                type="button"
                aria-label="View notifications"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative rounded-xl p-2 text-[#6c7b91] hover:bg-[#f3f6fd]"
              >
                <Bell size={20} />

              </button>

              {notificationsOpen && (
                <div className="absolute right-0 top-12 z-30 w-[min(340px,85vw)] rounded-2xl border border-[#e5ebf4] bg-white p-4 shadow-xl">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-bold text-[#22314b]">Suspended Accounts</div>
                    <button
                      type="button"
                      onClick={() => setNotificationsOpen(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X size={16} />
                    </button>
                  </div>
                  <div className="mt-3 space-y-2.5 border-t border-[#eef1f6] pt-3">
                    {users.filter((u) => u.status === "Suspended").length === 0 && (
                      <div className="text-xs text-[#7f8fa5]">No suspended accounts.</div>
                    )}
                    {users
                      .filter((u) => u.status === "Suspended")
                      .slice(0, 3)
                      .map((item) => (
                        <div
                          key={item.id}
                          onClick={() => {
                            setNotificationsOpen(false);
                            handleInspect(item);
                          }}
                          className="cursor-pointer rounded-xl p-2 hover:bg-[#f8fafc] transition-colors"
                        >
                          <div className="text-xs font-bold text-[#1f2e48]">{item.name}</div>
                          <div className="text-[11px] text-[#7f8fa5]">
                            {item.roleLabel} · <span className="font-semibold text-[#dc2626]">Suspended</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <div className="h-7 w-px bg-[#edf0f5]" />

            {/* Admin Avatar */}
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#dce7ff] text-xs font-extrabold text-[#3c65cc]">
                {(admin?.name || "Admin").slice(0, 2).toUpperCase()}
              </span>
              <div className="hidden sm:block">
                <div className="text-xs font-extrabold text-[#293750]">{admin?.name || "Admin"}</div>
                <div className="mt-0.5 text-[10px] text-[#a3aebf]">{admin?.role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="mx-auto max-w-[1650px] space-y-6 px-4 py-7 sm:px-7 xl:px-9 xl:py-9">
          {/* Header & KPI Summary */}
          <UserHeader totalCount={users.length} />

          {loadError && (
            <div className="rounded-2xl border border-[#fee2e2] bg-[#fef2f2] p-4 text-sm text-[#991b1b]" role="alert">
              {loadError}{" "}
              <button type="button" onClick={reload} className="font-bold underline">
                Try again
              </button>
            </div>
          )}
          {truncated && (
            <div className="rounded-2xl border border-[#fde68a] bg-[#fffbeb] p-3 text-xs text-[#92400e]">
              Showing the newest {users.length} accounts only.
            </div>
          )}

          {/* Filters Bar */}
          <UserFiltersBar
            filters={filters}
            onFilterChange={handleFilterChange}
            roleCounts={roleCounts}
          />

          {/* User Table */}
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs text-[#8090a6]">
              <span>
                Showing <span className="font-bold text-[#23334d]">{filteredUsers.length}</span> of{" "}
                <span className="font-bold text-[#23334d]">{users.length}</span> user accounts
                {filters.role !== "all" && ` (${filters.role}s)`}
              </span>

            </div>

            {loading ? (
              <div className="rounded-2xl border border-[#e8ecf4] bg-white py-16 text-center text-sm text-[#93a2b7]">Loading users…</div>
            ) : (
              <UserTable users={filteredUsers} onInspect={handleInspect} onSuspend={handleOpenSuspend} />
            )}
          </div>
        </main>
      </div>

      {/* Modals */}
      <UserDetailModal
        user={selectedUser}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onSuspend={(u) => {
          setIsDetailOpen(false);
          handleOpenSuspend(u);
        }}
      />

      <UserSuspendModal
        user={selectedUser}
        isOpen={isSuspendOpen}
        onClose={() => setIsSuspendOpen(false)}
        onSuspend={(id, reason) => suspendUser(id, reason)}
        onActivate={(id, reason) => activateUser(id, reason)}
      />
    </div>
  );
}

export default function UserManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-sm text-slate-500">
          Loading User Management Directory...
        </div>
      }
    >
      <UserManagementContent />
    </Suspense>
  );
}
