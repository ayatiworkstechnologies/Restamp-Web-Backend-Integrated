"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import {
  AdminAuditLog,
  AdminRole,
  AdminStaffRow,
  AssignableRole,
  changeAdminStaffRole,
  getAdminRoles,
  grantAdminStaff,
  listAdminAuditLogs,
  listAdminStaff,
  revokeAdminStaff,
} from "@/lib/api/admin";
import { errorMessage, isApiError } from "@/lib/api/client";
import { usePropertyStore } from "@/context/property-context";
import { useAdminAuth } from "@/context/admin-auth-context";

/**
 * Settings data from the backend: admin staff (/admin/staff,
 * settings.manage_team), the role/permission matrix (/admin/roles, any
 * admin) and the audit log (/admin/audit-logs, settings.view_audit_logs).
 * Each part loads only when the admin's role may see it. Platform
 * configuration has no backend and is not loaded.
 */
interface SettingsContextType {
  staff: AdminStaffRow[];
  roles: AdminRole[];
  auditLogs: AdminAuditLog[];
  auditTotal: number;
  loading: boolean;
  loadError: string | null;
  reload: () => void;
  loadMoreAudit: () => Promise<void>;
  /** Each resolves true when the backend accepted the change; failures are toasted. */
  grantStaff: (userId: number, role: AssignableRole) => Promise<boolean>;
  changeStaffRole: (userId: number, role: AssignableRole) => Promise<boolean>;
  revokeStaff: (userId: number) => Promise<boolean>;
}

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const AUDIT_PAGE = 50;

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const { showToast } = usePropertyStore();
  const { admin, can } = useAdminAuth();
  const [staff, setStaff] = useState<AdminStaffRow[]>([]);
  const [roles, setRoles] = useState<AdminRole[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [auditTotal, setAuditTotal] = useState(0);
  const [auditPage, setAuditPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const canTeam = !!admin && can("settings.manage_team");
  const canAudit = !!admin && can("settings.view_audit_logs");

  useEffect(() => {
    if (!admin) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setLoadError(null);
    (async () => {
      try {
        const [r, s, a] = await Promise.all([
          getAdminRoles(),
          canTeam ? listAdminStaff() : Promise.resolve(null),
          canAudit ? listAdminAuditLogs({}, 1, AUDIT_PAGE) : Promise.resolve(null),
        ]);
        if (cancelled) return;
        setRoles(r.items);
        setStaff(s?.items || []);
        setAuditLogs(a?.items || []);
        setAuditTotal(a?.total || 0);
        setAuditPage(1);
      } catch (e) {
        if (!cancelled) setLoadError(errorMessage(e, "Could not load settings."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [admin, canTeam, canAudit, reloadKey]);

  const loadMoreAudit = useCallback(async () => {
    try {
      const res = await listAdminAuditLogs({}, auditPage + 1, AUDIT_PAGE);
      setAuditLogs((prev) => [...prev, ...res.items.filter((x) => !prev.some((p) => p.id === x.id))]);
      setAuditTotal(res.total);
      setAuditPage(auditPage + 1);
    } catch (e) {
      showToast(errorMessage(e, "Could not load more audit entries."), "error");
    }
  }, [auditPage, showToast]);

  const failure = useCallback(
    (e: unknown, fallback: string) => {
      const text =
        isApiError(e) && (e.kind === "validation" || e.kind === "denied" || e.status === 409) && e.detail
          ? e.detail
          : errorMessage(e, fallback);
      showToast(text, "error");
    },
    [showToast]
  );

  const grantStaff = useCallback(
    async (userId: number, role: AssignableRole) => {
      try {
        const row = await grantAdminStaff(userId, role);
        setStaff((prev) => [...prev.filter((s) => s.user_id !== row.user_id), row]);
        showToast("Admin access granted.", "success");
        return true;
      } catch (e) {
        failure(e, "Could not grant admin access.");
        return false;
      }
    },
    [failure, showToast]
  );

  const changeStaffRole = useCallback(
    async (userId: number, role: AssignableRole) => {
      try {
        const row = await changeAdminStaffRole(userId, role);
        setStaff((prev) => prev.map((s) => (s.user_id === row.user_id ? row : s)));
        showToast("Admin role updated.", "success");
        return true;
      } catch (e) {
        failure(e, "Could not change this admin's role.");
        return false;
      }
    },
    [failure, showToast]
  );

  const revokeStaff = useCallback(
    async (userId: number) => {
      try {
        await revokeAdminStaff(userId);
        setStaff((prev) => prev.filter((s) => s.user_id !== userId));
        showToast("Admin access revoked.", "success");
        return true;
      } catch (e) {
        failure(e, "Could not revoke admin access.");
        return false;
      }
    },
    [failure, showToast]
  );

  return (
    <SettingsContext.Provider
      value={{
        staff,
        roles,
        auditLogs,
        auditTotal,
        loading,
        loadError,
        reload: () => setReloadKey((k) => k + 1),
        loadMoreAudit,
        grantStaff,
        changeStaffRole,
        revokeStaff,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettingsStore() {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error("useSettingsStore must be used within a SettingsProvider");
  }
  return context;
}
