"use client";

import React, { useState } from "react";
import { UserPlus, X } from "lucide-react";
import { User, UserRole, OwnerType, KycStatus } from "@/types/user";

interface UserAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (
    newUser: Omit<
      User,
      "id" | "joinedDate" | "lastActive" | "auditLog" | "adminNotes" | "initials" | "tint"
    >
  ) => void;
}

export function UserAddModal({ isOpen, onClose, onAdd }: UserAddModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("+91 ");
  const [role, setRole] = useState<UserRole>("buyer");
  const [ownerType, setOwnerType] = useState<OwnerType>("Individual Owner");
  const [companyName, setCompanyName] = useState("");
  const [city, setCity] = useState("Chennai");
  const [state, setState] = useState("Tamil Nadu");
  const [kycStatus, setKycStatus] = useState<KycStatus>("Verified");

  // Buyer specific preferences
  const [budgetMin, setBudgetMin] = useState(8000000);
  const [budgetMax, setBudgetMax] = useState(15000000);
  const [preferredLocalities, setPreferredLocalities] = useState("Adyar, Anna Nagar");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newUserData: Omit<
      User,
      "id" | "joinedDate" | "lastActive" | "auditLog" | "adminNotes" | "initials" | "tint"
    > = {
      name,
      email,
      phone,
      role,
      status: kycStatus === "Verified" ? "Active" : "Pending KYC",
      kycStatus,
      city,
      state,
      emailVerified: true,
      phoneVerified: true,
      ownerType: role === "owner" ? ownerType : undefined,
      companyName: role === "owner" && companyName ? companyName : undefined,
      totalListingsCount: 0,
      activeListingsCount: 0,
      buyerPreferences:
        role === "buyer"
          ? {
              budgetMin,
              budgetMax,
              preferredTypes: ["Apartment"],
              preferredLocalities: preferredLocalities.split(",").map((s) => s.trim()),
              preferredBhk: ["2 BHK", "3 BHK"],
              purpose: "Self Use",
              timeline: "1-3 Months",
            }
          : undefined,
      enquiries: [],
      savedPropertyIds: [],
      kycDocuments:
        kycStatus === "Verified"
          ? [
              {
                id: `KYC-NEW-1`,
                type: "Aadhaar Card",
                documentNumber: "XXXX-XXXX-Verified",
                fileUrl: "#",
                fileSize: "1.5 MB",
                status: "Verified",
                submittedAt: "Today",
                verifiedAt: "Today",
                verifiedBy: "Admin",
              },
            ]
          : [],
    };

    onAdd(newUserData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[90vh] w-full max-w-xl flex-col rounded-3xl border border-[#e2e8f2] bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f3f8] px-6 py-4 bg-[#fbfcfe]">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2854cb] text-white shadow-md">
              <UserPlus size={20} strokeWidth={2.5} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-[#17253d]">Onboard New User</h2>
              <p className="text-xs text-[#808fa5]">
                Register a new Buyer or Property Owner directly to RESTAMP
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
            <label className="block text-xs font-bold text-[#344560] mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Ramesh Krishnan"
              className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb] focus:bg-white"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">
                Email Address <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb]"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">User Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as UserRole)}
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-semibold text-[#20314b] outline-none focus:border-[#2854cb]"
              >
                <option value="buyer">Buyer (Looking for Property)</option>
                <option value="owner">Owner / Seller (Listing Property)</option>
              </select>
            </div>

            {role === "owner" ? (
              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">Owner Type</label>
                <select
                  value={ownerType}
                  onChange={(e) => setOwnerType(e.target.value as OwnerType)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-semibold text-[#20314b] outline-none"
                >
                  <option value="Individual Owner">Individual Homeowner</option>
                  <option value="Agent / Broker">Agent</option>
                  <option value="Builder / Developer">Builder / Developer</option>
                </select>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-medium text-[#20314b] outline-none"
                />
              </div>
            )}
          </div>

          {role === "owner" && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">
                  Company / Agency (Optional)
                </label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Apex Realty"
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#344560] mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-medium text-[#20314b] outline-none"
                />
              </div>
            </div>
          )}

          {role === "buyer" && (
            <div className="space-y-3 rounded-2xl border border-[#e8ecf4] bg-[#f9fbfe] p-4">
              <span className="text-xs font-bold text-[#23334e]">Buyer Preferences</span>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-[#7d8ea5] mb-1">Min Budget (₹)</label>
                  <input
                    type="number"
                    step="500000"
                    value={budgetMin}
                    onChange={(e) => setBudgetMin(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-[#dce3ee] bg-white px-3 py-1.5 text-xs font-medium text-[#20314b] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[#7d8ea5] mb-1">Max Budget (₹)</label>
                  <input
                    type="number"
                    step="500000"
                    value={budgetMax}
                    onChange={(e) => setBudgetMax(parseInt(e.target.value) || 0)}
                    className="w-full rounded-xl border border-[#dce3ee] bg-white px-3 py-1.5 text-xs font-medium text-[#20314b] outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[11px] text-[#7d8ea5] mb-1">
                  Preferred Localities (comma separated)
                </label>
                <input
                  type="text"
                  value={preferredLocalities}
                  onChange={(e) => setPreferredLocalities(e.target.value)}
                  className="w-full rounded-xl border border-[#dce3ee] bg-white px-3 py-1.5 text-xs font-medium text-[#20314b] outline-none"
                />
              </div>
            </div>
          )}

          <div className="border-t border-[#f0f3f8] pt-4">
            <label className="block text-xs font-bold text-[#344560] mb-1">Initial KYC Status</label>
            <select
              value={kycStatus}
              onChange={(e) => setKycStatus(e.target.value as KycStatus)}
              className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-semibold text-[#20314b] outline-none"
            >
              <option value="Verified">Verified (Immediate Approval)</option>
              <option value="Pending">Pending Verification (Needs Admin Review)</option>
              <option value="Not Submitted">Not Submitted</option>
            </select>
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
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2854cb] px-5 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1f45ae] transition-all"
            >
              <UserPlus size={15} />
              <span>Create Account</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
