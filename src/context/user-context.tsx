"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { UserRole, UserStatus } from "@/types/user";
import {
  AdminUserDetail,
  AdminUserRow,
  getAdminUser,
  listAdminUsers,
  reactivateAdminUser,
  suspendAdminUser,
} from "@/lib/api/admin";
import { errorMessage, isApiError } from "@/lib/api/client";
import { usePropertyStore } from "@/context/property-context";
import { useAdminAuth } from "@/context/admin-auth-context";

/**
 * One account from GET /admin/users, shaped for the console. Lists carry
 * only the last four phone digits; the full number is on the user detail.
 * KYC, email, city and buyer preferences do not exist on the backend.
 */
export interface AdminUser {
  id: string;
  userId: number;
  name: string;
  /** Current role; null when the account never chose one. */
  role: UserRole | "agent" | null;
  roleLabel: string;
  status: UserStatus;
  statusLabel: string;
  adminRole: string | null;
  phoneLast4: string | null;
  joinedAt: string | null;
}

const ROLE: Record<string, { role: AdminUser["role"]; label: string }> = {
  BUYER: { role: "buyer", label: "Buyer" },
  OWNER: { role: "owner", label: "Owner" },
  BROKER: { role: "agent", label: "Agent" },
};

const STATUS: Record<string, { status: UserStatus; label: string }> = {
  active: { status: "Active", label: "Active" },
  suspended: { status: "Suspended", label: "Suspended" },
  closed: { status: "Inactive", label: "Closed" },
};

export function toAdminUser(r: AdminUserRow): AdminUser {
  const role = ROLE[r.current_role || ""];
  const status = STATUS[r.status] || { status: "Inactive" as UserStatus, label: r.status };
  return {
    id: String(r.user_id),
    userId: r.user_id,
    name: r.display_name || "Restamp user",
    role: role?.role ?? null,
    roleLabel: role?.label ?? "—",
    status: status.status,
    statusLabel: status.label,
    adminRole: r.admin_role || null,
    phoneLast4: r.phone_last4 || null,
    joinedAt: r.joined_at || null,
  };
}

interface UserContextType {
  users: AdminUser[];
  loading: boolean;
  loadError: string | null;
  truncated: boolean;
  stats: { total: number; buyers: number; owners: number; agents: number; suspended: number; active: number };
  reload: () => void;
  getDetail: (userId: number) => Promise<AdminUserDetail>;
  /** Resolves true when the backend accepted the change; failures are toasted. */
  suspendUser: (userId: number, reason: string) => Promise<boolean>;
  activateUser: (userId: number, reason?: string) => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

const MAX_PAGES = 5;

export function UserProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = usePropertyStore();
  const { admin, can } = useAdminAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [truncated, setTruncated] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  const canView = !!admin && can("users.view");

  useEffect(() => {
    if (!canView) {
      setUsers([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const rows: AdminUserRow[] = [];
        let total = 0;
        for (let page = 1; page <= MAX_PAGES; page++) {
          const res = await listAdminUsers({}, page, 100);
          rows.push(...res.items);
          total = res.total;
          if (rows.length >= total || res.items.length === 0) break;
        }
        if (cancelled) return;
        setUsers(rows.map(toAdminUser));
        setTruncated(rows.length < total);
      } catch (e) {
        if (!cancelled) setLoadError(errorMessage(e, "Could not load users."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [canView, reloadKey]);

  const applyDetail = useCallback((d: AdminUserDetail) => {
    setUsers((prev) =>
      prev.map((u) =>
        u.userId === d.user_id
          ? toAdminUser({
              user_id: d.user_id,
              display_name: d.display_name,
              status: d.status,
              current_role: d.current_role,
              admin_role: d.admin_role,
              phone_last4: u.phoneLast4,
              joined_at: d.joined_at,
            })
          : u
      )
    );
  }, []);

  const failure = useCallback(
    (e: unknown, fallback: string) => {
      const text = isApiError(e) && (e.kind === "validation" || e.kind === "denied") && e.detail ? e.detail : errorMessage(e, fallback);
      showToast(text, "error");
    },
    [showToast]
  );

  const suspendUser = useCallback(
    async (userId: number, reason: string) => {
      try {
        applyDetail(await suspendAdminUser(userId, reason));
        showToast("Account suspended. The user is signed out of every session.", "success");
        return true;
      } catch (e) {
        failure(e, "Could not suspend this account.");
        return false;
      }
    },
    [applyDetail, failure, showToast]
  );

  const activateUser = useCallback(
    async (userId: number, reason?: string) => {
      try {
        applyDetail(await reactivateAdminUser(userId, reason));
        showToast("Account reactivated.", "success");
        return true;
      } catch (e) {
        failure(e, "Could not reactivate this account.");
        return false;
      }
    },
    [applyDetail, failure, showToast]
  );

  const stats = useMemo(
    () => ({
      total: users.length,
      buyers: users.filter((u) => u.role === "buyer").length,
      owners: users.filter((u) => u.role === "owner").length,
      agents: users.filter((u) => u.role === "agent").length,
      suspended: users.filter((u) => u.status === "Suspended").length,
      active: users.filter((u) => u.status === "Active").length,
    }),
    [users]
  );

  return (
    <UserContext.Provider
      value={{
        users,
        loading,
        loadError,
        truncated,
        stats,
        reload: () => setReloadKey((k) => k + 1),
        getDetail: getAdminUser,
        suspendUser,
        activateUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserStore() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUserStore must be used within a UserProvider");
  }
  return context;
}
