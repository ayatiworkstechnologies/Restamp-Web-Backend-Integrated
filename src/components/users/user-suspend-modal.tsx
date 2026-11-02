"use client";

import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, X, Loader2 } from "lucide-react";
import { AdminUser } from "@/context/user-context";

interface UserSuspendModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  /** POST /admin/users/{id}/suspend; resolves true when accepted. */
  onSuspend: (userId: number, reason: string) => Promise<boolean>;
  /** POST /admin/users/{id}/reactivate. */
  onActivate: (userId: number, reason?: string) => Promise<boolean>;
}

const suspensionReasons = [
  "Fake / fraudulent property listings submitted",
  "Repeated spam inquiries sent to sellers",
  "Unresponsive or abusive communication with prospective buyers",
  "Forged legal documents or municipal approvals",
  "Unlicensed commercial brokerage activity",
  "Other terms of service violation",
];

export function UserSuspendModal({
  user,
  isOpen,
  onClose,
  onSuspend,
  onActivate,
}: UserSuspendModalProps) {
  const [reasonCategory, setReasonCategory] = useState(suspensionReasons[0]);
  const [customDetails, setCustomDetails] = useState("");
  const [saving, setSaving] = useState(false);

  if (!isOpen || !user) return null;

  const isCurrentlySuspended = user.status === "Suspended";

  const handleAction = async () => {
    setSaving(true);
    let ok: boolean;
    if (isCurrentlySuspended) {
      ok = await onActivate(user.userId, customDetails.trim() || undefined);
    } else {
      const finalReason = customDetails.trim() ? `${reasonCategory}: ${customDetails.trim()}` : reasonCategory;
      ok = await onSuspend(user.userId, finalReason.slice(0, 500));
    }
    setSaving(false);
    if (ok) {
      setCustomDetails("");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-md rounded-2xl border border-[#fee2e2] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#fef2f2] pb-4">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-10 w-10 items-center justify-center rounded-xl ${
                isCurrentlySuspended
                  ? "bg-[#ecfdf5] text-[#10b981]"
                  : "bg-[#fee2e2] text-[#ef4444]"
              }`}
            >
              {isCurrentlySuspended ? <ShieldCheck size={22} /> : <AlertTriangle size={22} />}
            </span>
            <div>
              <h2 className="text-base font-extrabold text-[#17253d]">
                {isCurrentlySuspended ? "Restore User Account" : "Suspend User Account"}
              </h2>
              <p className="text-xs text-[#808fa5]">
                Account: <span className="font-semibold text-[#17253d]">{user.name}</span> (#{user.id})
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

        {isCurrentlySuspended ? (
          <div className="mt-4 space-y-3 text-xs text-[#4c5c76]">
            <p>
              This account is suspended. The suspension reason is recorded in the audit log.
            </p>
            <p>Reactivating lets this user sign in and use Restamp again.</p>
            <textarea
              rows={2}
              maxLength={500}
              value={customDetails}
              onChange={(e) => setCustomDetails(e.target.value)}
              placeholder="Reason for reactivating (optional, saved to the audit log)"
              className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] p-2.5 text-xs text-[#20314b] outline-none"
            />
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-[#fed7aa] bg-[#fffaf5] p-3 text-xs text-[#9a3412]">
              <span className="font-bold">What happens:</span> the user is signed out and cannot use Restamp until
              reactivated. Their existing listings are not hidden automatically.
            </div>

            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">
                Suspension Reason Category
              </label>
              <select
                value={reasonCategory}
                onChange={(e) => setReasonCategory(e.target.value)}
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3 py-2 text-xs font-semibold text-[#20314b] outline-none"
              >
                {suspensionReasons.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#344560] mb-1">
                Additional Notes / Case Details (Optional)
              </label>
              <textarea
                rows={2}
                maxLength={400}
                value={customDetails}
                onChange={(e) => setCustomDetails(e.target.value)}
                placeholder="Incident details, reporter ticket number..."
                className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] p-2.5 text-xs text-[#20314b] outline-none"
              />
            </div>
          </div>
        )}

        {/* Buttons */}
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
            onClick={() => void handleAction()}
            disabled={saving}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-sm disabled:opacity-60 transition-all ${
              isCurrentlySuspended
                ? "bg-[#10b981] hover:bg-[#059669]"
                : "bg-[#ef4444] hover:bg-[#dc2626]"
            }`}
          >
            {saving && <Loader2 size={14} className="animate-spin" />}
            {isCurrentlySuspended ? <span>Restore Account</span> : <span>Confirm Suspension</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
