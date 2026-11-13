"use client";

import React, { useState } from "react";
import { Menu } from "lucide-react";
import { Sidebar } from "@/components/dashboard/sidebar";
import { useAdminAuth } from "@/context/admin-auth-context";

/**
 * Page frame used by the admin pages: sidebar, sticky top bar with
 * breadcrumb + title, and the content column. Same markup/spacing as the
 * existing Users / Enquiries pages.
 */
export function AdminShell({
  section,
  title,
  actions,
  children,
}: {
  section: string;
  title: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { admin } = useAdminAuth();
  const initials = (admin?.name || "RESTAMP Admin")
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="min-h-screen bg-[#f7f9fc]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="min-w-0 lg:pl-[272px]">
        <header className="sticky top-0 z-20 flex h-[77px] items-center justify-between gap-3 border-b border-[#e9edf5] bg-white/95 px-4 backdrop-blur-md sm:px-7 xl:px-9">
          <div className="flex min-w-0 items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              type="button"
              aria-label="Open navigation"
              className="rounded-xl border border-[#e8edf5] p-2 text-[#60708a] lg:hidden"
            >
              <Menu size={20} />
            </button>
            <div className="min-w-0">
              <div className="truncate text-[11px] font-semibold text-[#abb5c5]">
                {section} <span className="px-2 text-[#c4cbd6]">/</span> {title}
              </div>
              <h1 className="mt-0.5 truncate text-[15px] font-extrabold text-[#24324b] sm:text-[16px]">{title}</h1>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {actions}
            <div className="hidden items-center gap-2.5 sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-[#dce7ff] text-xs font-extrabold text-[#3c65cc]">
                {initials}
              </span>
              <div>
                <div className="text-xs font-extrabold text-[#293750]">{admin?.name || "RESTAMP Admin"}</div>
                <div className="mt-0.5 text-[10px] text-[#a3aebf]">{admin?.role || "Administrator"}</div>
              </div>
            </div>
          </div>
        </header>
        <main className="min-w-0 w-full space-y-6 px-4 py-7 sm:px-7 xl:px-9 xl:py-9">{children}</main>
      </div>
    </div>
  );
}
