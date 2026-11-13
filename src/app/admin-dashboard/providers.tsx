"use client";

import React from 'react';
import { AdminAuthProvider } from '@/context/admin-auth-context';
import { PropertyProvider } from '@/context/property-context';
import { UserProvider } from '@/context/user-context';
import { EnquiryProvider } from '@/context/enquiry-context';
import { SettingsProvider } from '@/context/settings-context';
import { AdminAuthGuard } from '@/components/dashboard/admin-auth-guard';

export function AdminDashboardProviders({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <PropertyProvider>
        <UserProvider>
          <EnquiryProvider>
            <SettingsProvider>
              <AdminAuthGuard>
                {children}
              </AdminAuthGuard>
            </SettingsProvider>
          </EnquiryProvider>
        </UserProvider>
      </PropertyProvider>
    </AdminAuthProvider>
  );
}
