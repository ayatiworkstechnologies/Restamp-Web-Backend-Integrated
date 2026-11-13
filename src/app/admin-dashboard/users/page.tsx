"use client";

import React, { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Menu,
  Search,
  UsersRound,
  ShieldAlert,
} from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { UserHeader } from "@/components/users/user-header";
import { UserFiltersBar } from "@/components/users/user-filters";
import { UserTable } from "@/components/users/user-table";
import { UserDetailModal } from "@/components/users/user-detail-modal";
import { UserSuspendModal } from "@/components/users/user-suspend-modal";
import { UserEditModal } from "@/components/users/user-edit-modal";
import { UserAddModal } from "@/components/users/user-add-modal";
import { useUserStore } from "@/context/user-context";
import { User, UserFilters, UserRole } from "@/types/user";

function UserManagementContent() {
  const searchParams = useSearchParams();
  const initialRole = searchParams.get("role") as UserRole | null;
  const initialId = searchParams.get("id");

  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Modals state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSuspendOpen, setIsSuspendOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const {
    users,
    stats,
    suspendUser,
    activateUser,
    updateUser,
    addUser,
  } = useUserStore();

  // Filters state
  const [filters, setFilters] = useState<UserFilters>({
    search: "",
    role: initialRole || "all",
    status: "all",
    ownerType: "all",
    sortBy: "recent",
  });

  // Handle URL query parameters
  useEffect(() => {
    if (initialRole) {
      setFilters((prev) => ({ ...prev, role: initialRole }));
    }
    if (initialId) {
      const match = users.find((u) => u.id === initialId);
      if (match) {
        setSelectedUser(match);
        setIsDetailOpen(true);
      }
    }
  }, [initialRole, initialId, users]);

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

        // Owner type filter
        if (filters.ownerType && filters.ownerType !== "all") {
          if (u.role !== "buyer" && u.ownerType !== filters.ownerType) return false;
        }

        // Search filter
        if (filters.search.trim()) {
          const q = filters.search.toLowerCase().trim();
          const matches =
            u.name.toLowerCase().includes(q) ||
            u.email.toLowerCase().includes(q) ||
            u.phone.toLowerCase().includes(q) ||
            u.id.toLowerCase().includes(q) ||
            u.city.toLowerCase().includes(q) ||
            (u.companyName && u.companyName.toLowerCase().includes(q));
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (filters.sortBy === "name_asc") return a.name.localeCompare(b.name);
        if (filters.sortBy === "listings_desc")
          return (b.totalListingsCount || 0) - (a.totalListingsCount || 0);
        if (filters.sortBy === "enquiries_desc")
          return (b.enquiries?.length || 0) - (a.enquiries?.length || 0);
        // default: recent
        return b.id.localeCompare(a.id);
      });
  }, [users, filters]);

  const roleCounts = useMemo(() => {
    return {
      all: users.length,
      buyers: users.filter((u) => u.role === "buyer").length,
      owners: users.filter((u) => u.role === "owner").length,
      agents: users.filter((u) => u.role === "agent").length,
    };
  }, [users]);

  // Modal handlers
  const handleInspect = (user: User) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };

  const handleOpenSuspend = (user: User) => {
    setSelectedUser(user);
    setIsSuspendOpen(true);
  };

  const handleOpenEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditOpen(true);
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
                All Users Directory
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

            <div className="h-7 w-px bg-[#edf0f5]" />

            {/* Admin Avatar */}
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#dce7ff] text-xs font-extrabold text-[#3c65cc]">
                RA
              </span>
              <div className="hidden sm:block">
                <div className="text-xs font-extrabold text-[#293750]">RESTAMP Admin</div>
                <div className="mt-0.5 text-[10px] text-[#a3aebf]">User Operations</div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="min-w-0 w-full space-y-6 px-4 py-7 sm:px-7 xl:px-9 xl:py-9">
          {/* Header & KPI Summary */}
          <UserHeader
            onAddNew={() => setIsAddOpen(true)}
            filteredCount={filteredUsers.length}
            totalCount={users.length}
          />

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

            <UserTable
              users={filteredUsers}
              onInspect={handleInspect}
              onSuspend={handleOpenSuspend}
              onEdit={handleOpenEdit}
            />
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
        onEdit={(u) => {
          setIsDetailOpen(false);
          handleOpenEdit(u);
        }}
      />

      <UserSuspendModal
        user={selectedUser}
        isOpen={isSuspendOpen}
        onClose={() => setIsSuspendOpen(false)}
        onSuspend={(id, reason) => {
          suspendUser(id, reason);
        }}
        onActivate={(id) => {
          activateUser(id);
        }}
      />

      <UserEditModal
        user={selectedUser}
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSave={(id, updates) => {
          updateUser(id, updates);
        }}
      />

      <UserAddModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onAdd={(newUser) => {
          addUser(newUser);
        }}
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
