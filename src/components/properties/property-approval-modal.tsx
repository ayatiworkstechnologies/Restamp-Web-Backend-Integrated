"use client";

import React, { useState } from "react";
import { CheckCircle2, X, ShieldCheck, Sparkles } from "lucide-react";
import { Property } from "@/types/property";

interface PropertyApprovalModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    id: string,
    notes?: string,
    makeFeatured?: boolean,
    makeVerified?: boolean
  ) => void;
}

export function PropertyApprovalModal({
  property,
  isOpen,
  onClose,
  onConfirm,
}: PropertyApprovalModalProps) {
  const [notes, setNotes] = useState("");
  const [makeFeatured, setMakeFeatured] = useState(false);
  const [makeVerified, setMakeVerified] = useState(true);

  if (!isOpen || !property) return null;

  const handleApprove = () => {
    onConfirm(property.id, notes, makeFeatured, makeVerified);
    onClose();
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(price / 100000).toFixed(0)} Lakhs`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-2xl border border-[#e2e8f2] bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#f0f3f8] pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#ecfdf5] text-[#10b981]">
              <CheckCircle2 size={22} />
            </span>
            <div>
              <h2 className="text-base font-extrabold text-[#17253d]">Approve Property Listing</h2>
              <p className="text-xs text-[#808fa5]">
                Promote <span className="font-semibold text-[#17253d]">{property.id}</span> to Active status
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

        {/* Property Summary Box */}
        <div className="mt-4 rounded-xl border border-[#eaf0fa] bg-[#f8fbff] p-4">
          <div className="flex items-start gap-3">
            {property.images?.[0] ? (
              <img
                src={property.images[0]}
                alt={property.title}
                className="h-14 w-14 rounded-lg object-cover border border-[#dce5f5]"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-[#e3ecfc] text-xs font-bold text-[#2854cb]">
                {property.initials || "PR"}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-extrabold text-[#1f2e48]">{property.title}</div>
              <div className="mt-0.5 text-xs text-[#7d8da4]">
                {property.locality}, {property.city} · {property.type}
              </div>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-xs font-bold text-[#1f2e48]">{formatPrice(property.price)}</span>
                <span className="text-[11px] text-[#93a2b8]">· Submitted by {property.owner.name}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Options */}
        <div className="mt-4 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-[#e6ecf6] p-3 hover:bg-[#fafcff]">
            <input
              type="checkbox"
              checked={makeVerified}
              onChange={(e) => setMakeVerified(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2854cb]"
            />
            <div className="text-xs">
              <span className="font-bold text-[#23334e] flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-[#10b981]" /> Attach &quot;RESTAMP Verified&quot; Badge
              </span>
              <p className="mt-0.5 text-[#8696ab]">
                Confirms title deeds and legal checks have been audited by admin.
              </p>
            </div>
          </label>

          <label className="flex items-start gap-3 cursor-pointer rounded-xl border border-[#e6ecf6] p-3 hover:bg-[#fafcff]">
            <input
              type="checkbox"
              checked={makeFeatured}
              onChange={(e) => setMakeFeatured(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-[#2854cb]"
            />
            <div className="text-xs">
              <span className="font-bold text-[#23334e] flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#f59e0b]" /> Feature on Marketplace Homepage
              </span>
              <p className="mt-0.5 text-[#8696ab]">
                Gives this property premium placement in search results and carousel.
              </p>
            </div>
          </label>

          <div>
            <label className="block text-xs font-bold text-[#344560] mb-1">
              Internal Approval Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Legal papers verified, clear title deed confirmed on 28 Oct..."
              className="w-full rounded-xl border border-[#dce3ee] bg-[#fafbfd] p-2.5 text-xs text-[#20314b] outline-none transition-all placeholder:text-[#a0acbe] focus:border-[#2854cb] focus:bg-white"
            />
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
            onClick={handleApprove}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#10b981] px-4 py-2 text-xs font-bold text-white shadow-[0_4px_12px_#10b98135] hover:bg-[#059669] transition-all"
          >
            <CheckCircle2 size={15} />
            <span>Approve & Publish Listing</span>
          </button>
        </div>
      </div>
    </div>
  );
}
