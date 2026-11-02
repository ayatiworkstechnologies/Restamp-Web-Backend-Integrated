"use client";

import React, { useState } from "react";
import { Shield, CheckCircle2, Lock, Building, Users, MessageSquare, BarChart3, Settings } from "lucide-react";
import { useSettingsStore } from "@/context/settings-context";

const permissionModules = [
  {
    id: "properties",
    name: "Property Listings Management",
    icon: Building,
    permissions: [
      { key: "properties.view", label: "View listings" },
      { key: "properties.approve", label: "Verify listings" },
      { key: "properties.reject", label: "Reject listings" },
      { key: "properties.edit", label: "Edit listings (not available yet)" },
      { key: "properties.delete", label: "Delete listings (not available yet)" },
    ],
  },
  {
    id: "users",
    name: "User Management",
    icon: Users,
    permissions: [
      { key: "users.view", label: "View users" },
      { key: "users.kyc_verify", label: "Verify KYC (not available yet)" },
      { key: "users.suspend", label: "Suspend / reactivate accounts" },
      { key: "users.export", label: "Export users" },
    ],
  },
  {
    id: "enquiries",
    name: "Buyer Enquiries",
    icon: MessageSquare,
    permissions: [
      { key: "enquiries.view", label: "View enquiries" },
      { key: "enquiries.update_status", label: "Update status (not available yet)" },
      { key: "enquiries.delete", label: "Delete enquiries (not available yet)" },
      { key: "enquiries.export", label: "Export enquiries" },
    ],
  },
  {
    id: "reports",
    name: "Reports & Analytics",
    icon: BarChart3,
    permissions: [
      { key: "reports.view", label: "View reports" },
      { key: "reports.export", label: "Export reports" },
    ],
  },
  {
    id: "settings",
    name: "Settings & Security",
    icon: Settings,
    permissions: [
      { key: "settings.manage_team", label: "Manage admin staff" },
      { key: "settings.configure_platform", label: "Configure platform (not available yet)" },
      { key: "settings.view_audit_logs", label: "View audit log" },
    ],
  },
];

/**
 * The backend's role/permission matrix (GET /admin/roles). It is fixed in
 * the backend, so this view is read-only: permissions cannot be edited
 * from the console.
 */
export function RolesPermissionsView() {
  const { roles } = useSettingsStore();
  const [selected, setSelected] = useState<string | null>(null);
  const role = roles.find((r) => r.code === selected) || roles[0];

  if (!role) {
    return <div className="rounded-2xl border border-[#e8ecf4] bg-white p-8 text-center text-sm text-[#94a3b8]">Loading roles…</div>;
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
      <div className="lg:col-span-4 space-y-2">
        {roles.map((r) => (
          <button
            key={r.code}
            type="button"
            onClick={() => setSelected(r.code)}
            className={`w-full rounded-2xl border p-4 text-left transition-all ${
              r.code === role.code ? "border-[#162d66] bg-[#f0f4ff] shadow-sm" : "border-[#e8ecf4] bg-white hover:bg-[#f8fafc]"
            }`}
          >
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#162d66]" />
              <span className="text-sm font-bold text-[#101828]">{r.label}</span>
            </div>
            <p className="mt-1 text-[11px] text-[#64748b]">
              {r.permissions.length} permissions{r.assignable ? "" : " · legacy role, not assignable"}
            </p>
          </button>
        ))}
      </div>

      <div className="lg:col-span-8 rounded-2xl border border-[#e8ecf4] bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between border-b border-[#f1f4f9] pb-3">
          <div>
            <h3 className="text-base font-bold text-[#101828]">{role.label}</h3>
            <p className="text-xs text-[#64748b]">Permissions are defined by the backend and cannot be edited here.</p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-full bg-[#f1f5f9] px-2.5 py-1 text-[11px] font-semibold text-[#64748b]">
            <Lock className="h-3 w-3" /> Read-only
          </span>
        </div>

        <div className="mt-4 space-y-5">
          {permissionModules.map((m) => {
            const Icon = m.icon;
            return (
              <div key={m.id}>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#475467]">
                  <Icon className="h-3.5 w-3.5" /> {m.name}
                </div>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {m.permissions.map((p) => {
                    const granted = role.permissions.includes(p.key);
                    return (
                      <div
                        key={p.key}
                        className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-xs ${
                          granted ? "border-[#bbf7d0] bg-[#f0fdf4] text-[#166534]" : "border-[#e8ecf4] bg-[#f8fafc] text-[#94a3b8]"
                        }`}
                      >
                        {granted ? <CheckCircle2 className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                        <span className="font-semibold">{p.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
