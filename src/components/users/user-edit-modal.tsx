"use client";

import React, { useState, useEffect } from "react";
import { Edit, Save, X } from "lucide-react";
import { User, UserRole, UserStatus, KycStatus, OwnerType } from "@/types/user";

interface UserEditModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (userId: string, updates: Partial<User>) => void;
}

export function UserEditModal({ user, isOpen, onClose, onSave }: UserEditModalProps) {
  const [formData, setFormData] = useState<Partial<User>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        ownerType: user.ownerType,
        companyName: user.companyName,
        city: user.city,
        state: user.state,
        status: user.status,
        kycStatus: user.kycStatus,
      });
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(user.id, formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-2xl border border-[#e2e8f2] bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f3f8] px-6 py-4">
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef4ff] text-[#2854cb]">
              <Edit size={18} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-[#17253d]">Edit User Profile</h2>
              <p className="text-xs text-[#808fa5]">
                Updating account <span className="font-semibold text-[#17253d]">{user.id}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#344560] mb-1">Full Name</label>
            <input
              type="text"
              required
              value={formData.name || ""}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">Email Address</label>
              <input
                type="email"
                required
                value={formData.email || ""}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb] focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">Phone Number</label>
              <input
                type="text"
                required
                value={formData.phone || ""}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb] focus:bg-white"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">Primary Role</label>
              <select
                value={formData.role || "buyer"}
                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-semibold text-[#20314b] outline-none focus:border-[#2854cb]"
              >
                <option value="buyer">Buyer</option>
                <option value="owner">Owner / Seller</option>
              </select>
            </div>

            {formData.role === "owner" ? (
              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">Owner Type</label>
                <select
                  value={formData.ownerType || "Individual Owner"}
                  onChange={(e) =>
                    setFormData({ ...formData, ownerType: e.target.value as OwnerType })
                  }
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-semibold text-[#20314b] outline-none focus:border-[#2854cb]"
                >
                  <option value="Individual Owner">Individual Owner</option>
                  <option value="Agent / Broker">Agent</option>
                  <option value="Builder / Developer">Builder / Developer</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">City</label>
                <input
                  type="text"
                  value={formData.city || ""}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none"
                />
              </div>
            )}
          </div>

          {formData.role === "owner" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">
                  Company / Agency Name (Optional)
                </label>
                <input
                  type="text"
                  value={formData.companyName || ""}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">City</label>
                <input
                  type="text"
                  value={formData.city || ""}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none"
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 border-t border-[#f0f3f8] pt-4">
            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">Account Status</label>
              <select
                value={formData.status || "Active"}
                onChange={(e) =>
                  setFormData({ ...formData, status: e.target.value as UserStatus })
                }
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-semibold text-[#20314b] outline-none"
              >
                <option value="Active">Active</option>
                <option value="Pending KYC">Pending KYC</option>
                <option value="Suspended">Suspended</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">KYC Status</label>
              <select
                value={formData.kycStatus || "Not Submitted"}
                onChange={(e) =>
                  setFormData({ ...formData, kycStatus: e.target.value as KycStatus })
                }
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-semibold text-[#20314b] outline-none"
              >
                <option value="Verified">Verified</option>
                <option value="Pending">Pending</option>
                <option value="Rejected">Rejected</option>
                <option value="Not Submitted">Not Submitted</option>
              </select>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-2.5 border-t border-[#f0f3f8] pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#dbe2ee] px-4 py-2 text-xs font-semibold text-[#576882] hover:bg-[#f8fafc]"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2854cb] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1f45ae] transition-all"
            >
              <Save size={15} />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
