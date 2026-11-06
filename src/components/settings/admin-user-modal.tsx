"use client";

import React, { useState } from "react";
import { X, ShieldCheck, Mail, Phone, User, Briefcase } from "lucide-react";
import { AdminUser, AdminRoleType, AdminUserStatus } from "@/types/settings";

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Omit<AdminUser, "id" | "createdAt" | "lastActive">) => void;
  initialUser?: AdminUser | null;
}

const roles: { role: AdminRoleType; desc: string }[] = [
  {
    role: "Super Admin",
    desc: "Unrestricted platform control, staff delegation, and platform configuration.",
  },
  {
    role: "Operations Manager",
    desc: "Manage property listings, KYC verification, and export operational reports.",
  },
  {
    role: "Listing Reviewer",
    desc: "Inspect title deeds, documents, photos, and approve/reject listings.",
  },
  {
    role: "Support Specialist",
    desc: "Handle buyer enquiries, customer tickets, and update lead statuses.",
  },
];

export function AdminUserModal({
  isOpen,
  onClose,
  onSave,
  initialUser,
}: AdminUserModalProps) {
  const [name, setName] = useState(initialUser?.name || "");
  const [email, setEmail] = useState(initialUser?.email || "");
  const [phone, setPhone] = useState(initialUser?.phone || "+91 ");
  const [role, setRole] = useState<AdminRoleType>(
    initialUser?.role || "Listing Reviewer"
  );
  const [department, setDepartment] = useState(
    initialUser?.department || "Quality Assurance"
  );
  const [status, setStatus] = useState<AdminUserStatus>(
    initialUser?.status || "Active"
  );
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(
    initialUser?.twoFactorEnabled ?? true
  );

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      email,
      phone,
      role,
      department,
      status,
      twoFactorEnabled,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#e8ecf4] bg-white p-6 shadow-2xl">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#f1f4f9] pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#f0f4ff] text-[#162d66]">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#101828]">
                {initialUser ? "Edit Staff Member" : "Invite Admin Staff"}
              </h2>
              <p className="text-xs text-[#64748b]">
                Assign administrative role and team permissions.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#101828]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-3.5 text-xs">
          <div>
            <label className="block font-medium text-[#334155] mb-1">
              Full Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Priya Sundaram"
              className="w-full rounded-xl border border-[#e8ecf4] p-2.5 text-xs text-[#101828] focus:border-[#162d66] focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#334155] mb-1">
                Official Email Address *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="priya.s@restamp.in"
                className="w-full rounded-xl border border-[#e8ecf4] p-2.5 text-xs text-[#101828] focus:border-[#162d66] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-[#334155] mb-1">
                Phone Number *
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-[#e8ecf4] p-2.5 text-xs text-[#101828] focus:border-[#162d66] focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-[#334155] mb-1">
                Department
              </label>
              <input
                type="text"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                placeholder="e.g. Operations / QA"
                className="w-full rounded-xl border border-[#e8ecf4] p-2.5 text-xs text-[#101828] focus:border-[#162d66] focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-medium text-[#334155] mb-1">
                Account Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as AdminUserStatus)}
                className="w-full rounded-xl border border-[#e8ecf4] p-2.5 text-xs text-[#101828] focus:border-[#162d66] focus:outline-none"
              >
                <option value="Active">Active</option>
                <option value="Invited">Invited (Pending login)</option>
                <option value="Suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Role Selection */}
          <div>
            <label className="block font-medium text-[#334155] mb-1.5">
              Admin Role & Permission Level *
            </label>
            <div className="space-y-2">
              {roles.map((r) => {
                const isSelected = role === r.role;
                return (
                  <div
                    key={r.role}
                    onClick={() => setRole(r.role)}
                    className={`cursor-pointer rounded-xl border p-2.5 transition-all ${
                      isSelected
                        ? "border-[#162d66] bg-[#f0f4ff]"
                        : "border-[#e8ecf4] bg-white hover:border-[#cbd5e1]"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-[#101828]">
                        {r.role}
                      </span>
                      <input
                        type="radio"
                        name="adminRole"
                        checked={isSelected}
                        onChange={() => setRole(r.role)}
                        className="text-[#162d66] cursor-pointer"
                      />
                    </div>
                    <p className="mt-0.5 text-[11px] text-[#64748b]">
                      {r.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 2FA Toggle */}
          <div className="flex items-center justify-between rounded-xl border border-[#e8ecf4] p-3 bg-[#f8fafc]">
            <div>
              <div className="font-semibold text-xs text-[#101828]">
                Enforce Two-Factor Authentication (2FA)
              </div>
              <div className="text-[11px] text-[#64748b]">
                Requires TOTP authenticator app code on login
              </div>
            </div>
            <input
              type="checkbox"
              checked={twoFactorEnabled}
              onChange={(e) => setTwoFactorEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-[#cbd5e1] text-[#162d66] cursor-pointer"
            />
          </div>

          {/* Actions */}
          <div className="mt-5 flex items-center justify-end gap-2.5 border-t border-[#f1f4f9] pt-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#e8ecf4] px-4 py-2 text-xs font-semibold text-[#475467] hover:bg-[#f8fafc]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-xl bg-[#162d66] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0f1f47]"
            >
              {initialUser ? "Save Changes" : "Send Staff Invitation"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
