"use client";

import React, { useState } from "react";
import {
  Shield,
  CheckCircle2,
  Lock,
  Save,
  RotateCcw,
  Building,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
} from "lucide-react";
import { RoleDefinition } from "@/types/settings";
import { useSettingsStore } from "@/context/settings-context";

export function RolesPermissionsView() {
  const { roles, updateRolePermissions } = useSettingsStore();

  const [selectedRoleId, setSelectedRoleId] = useState<string>(roles[0]?.id || "");
  const selectedRole = roles.find((r) => r.id === selectedRoleId) || roles[0];

  const [currentPermissions, setCurrentPermissions] = useState(
    selectedRole?.permissions
  );

  // Sync when selected role changes
  const handleSelectRole = (r: RoleDefinition) => {
    setSelectedRoleId(r.id);
    setCurrentPermissions(r.permissions);
  };

  const handleToggle = (
    moduleKey: keyof RoleDefinition["permissions"],
    permKey: string
  ) => {
    if (!currentPermissions) return;
    if (selectedRole?.name === "Super Admin") return; // Super admin permissions are locked to true

    const updatedModule = {
      ...currentPermissions[moduleKey],
      [permKey]: !(currentPermissions[moduleKey] as any)[permKey],
    };

    setCurrentPermissions({
      ...currentPermissions,
      [moduleKey]: updatedModule,
    });
  };

  const handleSave = () => {
    if (!selectedRole || !currentPermissions) return;
    updateRolePermissions(selectedRole.id, currentPermissions);
  };

  const permissionModules = [
    {
      id: "properties",
      name: "Property Listings Management",
      icon: Building,
      desc: "Controls access to view, review, approve, reject, and edit real estate listings.",
      permissions: [
        { key: "view", label: "View Listings Catalogue", desc: "Browse and inspect all submitted properties" },
        { key: "approve", label: "Approve Listings", desc: "Publish pending properties to public marketplace" },
        { key: "reject", label: "Reject Listings", desc: "Reject listings with reason and notify owner" },
        { key: "edit", label: "Edit Property Details", desc: "Modify pricing, BHK, locality, and photos" },
        { key: "delete", label: "Delete Property", desc: "Permanently delete property records" },
      ],
    },
    {
      id: "users",
      name: "User Management",
      icon: Users,
      desc: "Controls access to manage buyers, property owners, agents and accounts.",
      permissions: [
        { key: "view", label: "View User Profiles", desc: "Access user registry, phone numbers, and activity" },
        { key: "suspend", label: "Suspend Accounts", desc: "Block fraudulent buyers or non-compliant owners" },
        { key: "export", label: "Export User Data", desc: "Download CSV spreadsheets of registered users" },
      ],
    },
    {
      id: "enquiries",
      name: "Buyer Enquiries & Lead Desk",
      icon: MessageSquare,
      desc: "Controls access to inbound buyer queries, contact logs, and inquiry resolution.",
      permissions: [
        { key: "view", label: "View Buyer Enquiries", desc: "Access buyer queries, messages, and contact logs" },
        { key: "update_status", label: "Update Inquiry Status", desc: "Mark inquiries as Active, Addressed, or Archived" },
        { key: "delete", label: "Delete Inquiry Records", desc: "Remove spam or duplicate inquiries" },
        { key: "export", label: "Export Leads CSV", desc: "Download lead reports for CRM integration" },
      ],
    },
    {
      id: "reports",
      name: "Reports & Platform Analytics",
      icon: BarChart3,
      desc: "Controls access to financial figures, listing volume trends, and platform KPIs.",
      permissions: [
        { key: "view", label: "View Platform Reports", desc: "Access analytics dashboards and listing metrics" },
        { key: "export", label: "Export Audit Reports", desc: "Download platform activity summaries and logs" },
      ],
    },
    {
      id: "settings",
      name: "System Settings & Admin Security",
      icon: Settings,
      desc: "Controls administrative access, role delegation, and marketplace configuration.",
      permissions: [
        { key: "manage_team", label: "Manage Staff & Roles", desc: "Invite admin team members and assign roles" },
        { key: "configure_platform", label: "Platform Configuration", desc: "Modify RERA rules, expiration times, and notifications" },
        { key: "view_audit_logs", label: "View Security Audit Logs", desc: "Inspect admin actions and IP security records" },
      ],
    },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left Column: Role Selector */}
      <div className="space-y-3 lg:sticky lg:top-24 lg:col-span-4 lg:self-start xl:col-span-3">
        <h3 className="font-semibold text-sm text-[#101828]">
          Select Admin Role
        </h3>
        <p className="text-xs text-[#64748b]">
          Configure default permissions for team members assigned to each role.
        </p>

        <div className="space-y-2 pt-1">
          {roles.map((r) => {
            const isSelected = r.id === selectedRoleId;
            return (
              <div
                key={r.id}
                onClick={() => handleSelectRole(r)}
                className={`cursor-pointer rounded-2xl border p-3.5 transition-all ${
                  isSelected
                    ? "border-[#162d66] bg-[#f0f4ff] shadow-sm"
                    : "border-[#e8ecf4] bg-white hover:border-[#ccd7ea]"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-[#101828]">
                    {r.name}
                  </span>
                  {r.name === "Super Admin" ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#ede9fe] px-2 py-0.5 text-[10px] font-bold text-[#6d28d9]">
                      <Lock className="h-2.5 w-2.5" /> All Permissions
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#64748b]">
                      Role Definition
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs text-[#64748b] leading-relaxed">
                  {r.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Column: Permission Matrix */}
      <div className="min-w-0 space-y-5 lg:col-span-8 xl:col-span-9">
        <div className="flex items-center justify-between border-b border-[#e8ecf4] pb-3">
          <div>
            <h3 className="font-bold text-base text-[#101828]">
              {selectedRole?.name} Permissions
            </h3>
            <p className="text-xs text-[#64748b]">
              {selectedRole?.name === "Super Admin"
                ? "Super Admin permissions are permanently active across all platform systems."
                : "Toggle specific permissions for this administrative role."}
            </p>
          </div>

          {selectedRole?.name !== "Super Admin" && (
            <button
              type="button"
              onClick={handleSave}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#162d66] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0f1f47] transition-colors"
            >
              <Save className="h-4 w-4" />
              <span>Save Permissions</span>
            </button>
          )}
        </div>

        {/* Modules List */}
        <div className="space-y-4">
          {permissionModules.map((mod) => {
            const ModIcon = mod.icon;
            const modulePerms = currentPermissions
              ? (currentPermissions as any)[mod.id]
              : {};

            return (
              <div
                key={mod.id}
                className="rounded-2xl border border-[#e8ecf4] bg-white p-4 shadow-sm"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#f0f4ff] text-[#162d66]">
                    <ModIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="font-bold text-xs text-[#101828]">
                      {mod.name}
                    </h4>
                    <p className="text-[11px] text-[#64748b]">{mod.desc}</p>
                  </div>
                </div>

                <div className="mt-3 divide-y divide-[#f8fafc] border-t border-[#f1f4f9]">
                  {mod.permissions.map((perm) => {
                    const isAllowed =
                      selectedRole?.name === "Super Admin" ||
                      Boolean(modulePerms?.[perm.key]);

                    return (
                      <div
                        key={perm.key}
                        className="flex items-center justify-between py-2 text-xs"
                      >
                        <div>
                          <span className="font-medium text-[#101828]">
                            {perm.label}
                          </span>
                          <p className="text-[11px] text-[#94a3b8]">
                            {perm.desc}
                          </p>
                        </div>

                        <button
                          type="button"
                          disabled={selectedRole?.name === "Super Admin"}
                          onClick={() =>
                            handleToggle(
                              mod.id as keyof RoleDefinition["permissions"],
                              perm.key
                            )
                          }
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isAllowed ? "bg-[#162d66]" : "bg-[#cbd5e1]"
                          } ${
                            selectedRole?.name === "Super Admin"
                              ? "opacity-60 cursor-not-allowed"
                              : ""
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isAllowed ? "translate-x-4" : "translate-x-0"
                            }`}
                          />
                        </button>
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
