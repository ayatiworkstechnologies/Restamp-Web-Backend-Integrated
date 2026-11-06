"use client";

import React, { useState } from "react";
import { AlertTriangle, XCircle, X, Loader2 } from "lucide-react";
import { AdminProperty } from "@/context/property-context";

interface PropertyRejectModalProps {
  property: AdminProperty | null;
  isOpen: boolean;
  onClose: () => void;
  /** POST /admin/listings/{id}/reject; resolves true when the backend accepted it. */
  onConfirm: (id: number, reason: string, category: string) => Promise<boolean>;
}

const rejectionCategories = [
  "Incomplete / Fraudulent Documentation",
  "Pricing Unrealistic or Misleading",
  "Low Quality / Inappropriate Photographs",
  "Duplicate or Misclassified Listing",
  "Zoning / Land Classification Mismatch",
  "Failed Owner KYC Verification",
  "Other Compliance Issue",
];

export function PropertyRejectModal({
  property,
  isOpen,
  onClose,
  onConfirm,
}: PropertyRejectModalProps) {
  const [category, setCategory] = useState(rejectionCategories[0]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen || !property) return null;

  const handleReject = async () => {
    if (!reason.trim()) {
      setError("Please provide a rejection reason.");
      return;
    }
    setError("");
    setSaving(true);
    const ok = await onConfirm(property.listingId, reason.trim().slice(0, 500), category);
    setSaving(false);
    if (ok) {
      setReason("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#fee2e2] bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#fef2f2] pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#fee2e2] text-[#ef4444]">
              <XCircle size={22} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-[#991b1b]">Reject Property Listing</h2>
              <p className="text-xs text-[#808fa5]">
                Reject listing <span className="font-semibold text-[#17253d]">#{property.id}</span> with a reason
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

        {/* Warning Banner */}
        <div className="mt-4 flex items-start gap-3 rounded-xl border border-[#fed7aa] bg-[#fffaf5] p-3 text-xs text-[#9a3412]">
          <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#ea580c]" />
          <div>
            <span className="font-bold">What happens:</span> the listing stays hidden from buyers and{' '}
            <span className="font-semibold">{property.ownerName}</span> sees it as Rejected in their dashboard, where they can
            resubmit it. Your reason is kept in the review history and audit log; owners are not notified and cannot see it yet.
          </div>
        </div>

        {/* Property Info */}
        <div className="mt-3 rounded-xl border border-[#f0f3f8] bg-[#fafbfe] p-3 text-xs text-[#4b5b75]">
          <span className="font-bold text-[#1f2e48]">{property.title}</span> · {property.locality}, {property.city}
        </div>

        {/* Form Fields */}
        <div className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-bold text-[#344560] mb-1">
              Rejection Category <span className="text-red-500">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-semibold text-[#20314b] outline-none transition-all focus:border-[#ef4444] focus:bg-white"
            >
              {rejectionCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#344560] mb-1">
              Detailed Owner Feedback / Reason <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. The uploaded parent sale deed is missing pages 3-4 and the stamp duty seal is not visible. Please upload the clear original registered deed scan."
              className={`w-full rounded-xl border p-2.5 text-xs text-[#20314b] outline-none transition-all placeholder:text-[#a0acbe] focus:bg-white ${
                error
                  ? "border-[#ef4444] bg-[#fef2f2]"
                  : "border-[#dce3ee] bg-[#fafbfd] focus:border-[#ef4444]"
              }`}
            />
            {error && <p className="mt-1 text-[11px] font-semibold text-[#ef4444]">{error}</p>}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5 border-t border-[#f0f3f8] pt-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#dbe2ee] px-4 py-2 text-xs font-semibold text-[#576882] hover:bg-[#f8fafc]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleReject()}
            disabled={saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#ef4444] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_12px_#ef444435] hover:bg-[#dc2626] disabled:opacity-60 transition-all"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <XCircle size={15} />}
            <span>Confirm Rejection</span>
          </button>
        </div>
      </div>
    </div>
  );
}
