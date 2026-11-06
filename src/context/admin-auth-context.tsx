"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { AdminSession, AdminAuthContextType } from '@/types/admin-auth';
import {
  getAdminSession,
  saveAdminSession,
  clearAdminSession,
  authenticateAdminMobile,
  PRESET_ADMINS,
} from '@/lib/admin-auth';

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const syncSession = useCallback(() => {
    const session = getAdminSession();
    setAdmin(session);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    syncSession();

    const handleAuthChange = () => syncSession();
    window.addEventListener('admin-auth-change', handleAuthChange);
    window.addEventListener('storage', handleAuthChange);

    return () => {
      window.removeEventListener('admin-auth-change', handleAuthChange);
      window.removeEventListener('storage', handleAuthChange);
    };
  }, [syncSession]);

  const loginWithMobile = useCallback((mobile: string, otp: string): boolean => {
    const session = authenticateAdminMobile(mobile, otp);
    if (session) {
      setAdmin(session);
      return true;
    }
    return false;
  }, []);

  const loginQuick = useCallback((adminId: string): boolean => {
    const target = PRESET_ADMINS.find((a) => a.id === adminId) || PRESET_ADMINS[0];
    if (target) {
      const session = { ...target, lastLogin: new Date().toISOString() };
      saveAdminSession(session);
      setAdmin(session);
      return true;
    }
    return false;
  }, []);

  const logout = useCallback(() => {
    clearAdminSession();
    setAdmin(null);
    router.push('/admin-login');
  }, [router]);

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isLoading,
        loginWithMobile,
        loginQuick,
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
