"use client";

import { confirmDialog } from "@/components/common/confirm-dialog";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  X,
  Phone,
  Mail,
  MapPin,
  Building,
  User,
  ExternalLink,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Clock,
  Archive,
  Save,
} from "lucide-react";
import { Enquiry, EnquiryStatus } from "@/types/enquiry";
import { useEnquiryStore } from "@/context/enquiry-context";

interface EnquiryDetailModalProps {
  enquiry: Enquiry | null;
  isOpen: boolean;
  onClose: () => void;
}

export function EnquiryDetailModal({
  enquiry,
  isOpen,
  onClose,
}: EnquiryDetailModalProps) {
  const { updateEnquiryStatus, updateAdminNotes, deleteEnquiry } =
    useEnquiryStore();

  const [notes, setNotes] = useState(enquiry?.adminNotes || "");

  useEffect(() => {
    if (enquiry) {
      setNotes(enquiry.adminNotes || "");
    }
  }, [enquiry]);

  if (!isOpen || !enquiry) return null;

  const handleSaveNotes = () => {
    updateAdminNotes(enquiry.id, notes);
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    }
    if (price >= 100000) {
      return `₹${(price / 100000).toFixed(2)} L`;
    }
    return `₹${price.toLocaleString("en-IN")}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#e8ecf4] bg-white p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#f1f4f9] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#162d66] bg-[#f0f4ff] px-2 py-0.5 rounded-md">
                {enquiry.id}
              </span>
              <span className="rounded-full bg-[#f1f5f9] px-2.5 py-0.5 text-xs text-[#64748b]">
                {enquiry.channel}
              </span>
              <span className="text-xs text-[#94a3b8]">
                {new Date(enquiry.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-[#101828]">
              {enquiry.type}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#101828]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Quick Switcher */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f8fafc] border border-[#e8ecf4] p-3">
          <div className="text-xs font-semibold text-[#64748b]">
            Lead Status:
          </div>
          <div className="flex items-center gap-1.5">
            {(["Active", "Addressed", "Archived"] as EnquiryStatus[]).map(
              (st) => {
                const isActive = enquiry.status === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => updateEnquiryStatus(enquiry.id, st)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold transition-all ${
                      isActive
                        ? st === "Active"
                          ? "bg-[#d97706] text-white shadow-sm"
                          : st === "Addressed"
                          ? "bg-[#059669] text-white shadow-sm"
                          : "bg-[#64748b] text-white shadow-sm"
                        : "bg-white text-[#475467] border border-[#e8ecf4] hover:bg-[#f1f5f9]"
                    }`}
                  >
                    {isActive && <CheckCircle2 className="h-3.5 w-3.5" />}
                    <span>{st}</span>
                  </button>
                );
              }
            )}
          </div>
        </div>

        <div className="mt-4 space-y-4">
          {/* Buyer's Message */}
          <div className="rounded-2xl border border-[#e8ecf4] bg-[#fffbf0] p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#b45309]">
              Buyer Inquiry Message
            </span>
            <p className="mt-1.5 text-sm text-[#101828] leading-relaxed italic">
              "{enquiry.message}"
            </p>
          </div>

          {/* Grid: Buyer Details & Property Owner */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Buyer Card */}
            <div className="rounded-2xl border border-[#e8ecf4] bg-white p-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                  Buyer Information
                </span>
              </div>

              <div className="mt-2.5">
                <div className="font-semibold text-sm text-[#101828]">
                  {enquiry.buyer.name}
                </div>
                <div className="text-xs text-[#64748b]">
                  {enquiry.buyer.city}
                </div>
              </div>

              <div className="mt-3 space-y-1.5 pt-2.5 border-t border-[#f1f4f9] text-xs">
                <a
                  href={`tel:${enquiry.buyer.phone}`}
                  className="flex items-center gap-2 text-[#162d66] hover:underline"
                >
                  <Phone className="h-3.5 w-3.5 text-[#94a3b8]" />
                  <span>{enquiry.buyer.phone}</span>
                </a>
                <a
                  href={`mailto:${enquiry.buyer.email}`}
                  className="flex items-center gap-2 text-[#64748b] hover:text-[#162d66] hover:underline"
                >
                  <Mail className="h-3.5 w-3.5 text-[#94a3b8]" />
                  <span>{enquiry.buyer.email}</span>
                </a>
              </div>
            </div>

            {/* Owner Card */}
            <div className="rounded-2xl border border-[#e8ecf4] bg-white p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                Property Owner / Seller
              </span>

              <div className="mt-2.5">
                <div className="font-semibold text-sm text-[#101828]">
                  {enquiry.property.ownerName}
                </div>
                <div className="text-xs text-[#64748b]">Listing Owner</div>
              </div>

              <div className="mt-3 space-y-1.5 pt-2.5 border-t border-[#f1f4f9] text-xs">
                <a
                  href={`tel:${enquiry.property.ownerPhone}`}
                  className="flex items-center gap-2 text-[#162d66] hover:underline"
                >
                  <Phone className="h-3.5 w-3.5 text-[#94a3b8]" />
                  <span>{enquiry.property.ownerPhone}</span>
                </a>
                {enquiry.property.ownerEmail && (
                  <a
                    href={`mailto:${enquiry.property.ownerEmail}`}
                    className="flex items-center gap-2 text-[#64748b] hover:text-[#162d66] hover:underline"
                  >
                    <Mail className="h-3.5 w-3.5 text-[#94a3b8]" />
                    <span>{enquiry.property.ownerEmail}</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Target Property Card */}
          <div className="rounded-2xl border border-[#e8ecf4] bg-[#f8fafc] p-4">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                Target Property
              </span>
              <span className="font-mono text-xs text-[#94a3b8]">
                {enquiry.property.id}
              </span>
            </div>

            <div className="mt-2 flex items-start justify-between gap-4">
              <div>
                <Link
                  href={`/admin-dashboard/properties?id=${enquiry.property.id}`}
                  className="font-bold text-sm text-[#101828] hover:text-[#162d66] hover:underline inline-flex items-center gap-1.5"
                >
                  <Building className="h-4 w-4 text-[#162d66]" />
                  <span>{enquiry.property.title}</span>
                  <ExternalLink className="h-3 w-3 text-[#94a3b8]" />
                </Link>
                <div className="mt-1 flex items-center gap-1.5 text-xs text-[#64748b]">
                  <MapPin className="h-3 w-3 text-[#94a3b8]" />
                  <span>{enquiry.property.location}</span>
                  <span>•</span>
                  <span>{enquiry.property.type}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-base font-extrabold text-[#162d66]">
                  {formatPrice(enquiry.property.price)}
                </div>
                <div className="text-[10px] text-[#94a3b8]">Asking Price</div>
              </div>
            </div>
          </div>

          {/* Admin Remarks / Notes */}
          <div className="rounded-2xl border border-[#e8ecf4] bg-white p-4 space-y-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              Internal Admin Remarks
            </span>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes about this inquiry..."
              className="w-full rounded-xl border border-[#e8ecf4] p-2.5 text-xs text-[#101828] placeholder-[#94a3b8] focus:border-[#162d66] focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleSaveNotes}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#162d66] px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-[#0f1f47] transition-colors"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Remarks</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex items-center justify-between border-t border-[#f1f4f9] pt-4">
          <button
            type="button"
            onClick={async () => {
              if (!(await confirmDialog({ title: "Delete enquiry", body: `Are you sure you want to delete enquiry ${enquiry.id}? This action cannot be undone.` }))) return;
              deleteEnquiry(enquiry.id);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium text-[#ef4444] hover:bg-[#fef2f2] transition-colors"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>Delete Enquiry</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#e8ecf4] bg-white px-4 py-2 text-xs font-semibold text-[#475467] hover:bg-[#f8fafc] transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
