"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSession, AdminAuthContextType } from '@/types/admin-auth';
import { getAdminMe, type AdminPermission } from '@/lib/api/admin';
import { errorMessage, isApiError } from '@/lib/api/client';
import { signOut } from '@/lib/api/auth';
import { getSession, useSession } from '@/lib/api/session';

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

/**
 * Admin access = a signed-in user (normal mobile OTP login) for whom
 * GET /admin/me succeeds. The backend decides; this provider only mirrors
 * its answer for the UI and re-checks whenever the signed-in user changes.
 */
export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { session, ready } = useSession();
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [accessError, setAccessError] = useState<string | null>(null);
  const userId = session?.userId;

  const refresh = useCallback(async (): Promise<AdminSession | null> => {
    if (!getSession()) {
      setAdmin(null);
      setAccessError(null);
      setIsLoading(false);
      return null;
    }
    setIsLoading(true);
    try {
      const me = await getAdminMe();
      const next: AdminSession = {
        id: String(me.user_id),
        name: me.display_name,
        role: me.role_label,
        roleCode: me.admin_role,
        permissions: me.permissions,
      };
      setAdmin(next);
      setAccessError(null);
      return next;
    } catch (e) {
      setAdmin(null);
      setAccessError(
        isApiError(e, 'denied')
          ? 'This account does not have admin access. Ask a Super Admin to grant it.'
          : isApiError(e, 'login')
          ? null
          : errorMessage(e, 'Could not check admin access. Please try again.')
      );
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    void refresh();
  }, [ready, userId, refresh]);

  const can = useCallback((permission: AdminPermission) => !!admin?.permissions.includes(permission), [admin]);

  const logout = useCallback(() => {
    signOut();
    setAdmin(null);
    router.push('/admin-login');
  }, [router]);

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading: !ready || isLoading,
        accessError,
        refresh,
        can,
        logout,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider');
  }
  return context;
}
