"use client";

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAdminAuth } from '@/context/admin-auth-context';
import { ShieldCheck, Loader2 } from 'lucide-react';

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, accessError, logout } = useAdminAuth();
  const pathname = usePathname();
  const router = useRouter();

  const isLoginPage = pathname === '/admin-dashboard/login' || pathname === '/admin/login' || pathname === '/admin-login';

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !accessError && !isLoginPage) {
      // Short public URL for the dashboard root: /admin (it forwards to /admin-dashboard).
      const target = pathname === '/admin-dashboard' ? '/admin' : pathname;
      router.replace(`/admin-login?redirect=${encodeURIComponent(target)}`);
    }
  }, [isLoading, isAuthenticated, accessError, isLoginPage, pathname, router]);

  if (isLoginPage) {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-[#087ed9] border border-sky-100 shadow-sm animate-pulse">
            <ShieldCheck size={24} />
          </div>
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-700">
            <Loader2 size={16} className="animate-spin text-[#087ed9]" />
            Verifying Admin Credentials...
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated && accessError) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 max-w-sm text-center" role="alert">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-500 border border-red-100 shadow-sm">
            <ShieldCheck size={24} />
          </div>
          <div className="text-sm font-semibold text-slate-700">{accessError}</div>
          <button
            type="button"
            onClick={logout}
            className="text-xs font-semibold text-[#087ed9] hover:underline cursor-pointer"
          >
            Sign in with a different account
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sky-50 text-[#087ed9] border border-sky-100 shadow-sm">
            <ShieldCheck size={24} />
          </div>
          <div className="text-sm font-semibold text-slate-700">
            Redirecting to Admin Login...
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
