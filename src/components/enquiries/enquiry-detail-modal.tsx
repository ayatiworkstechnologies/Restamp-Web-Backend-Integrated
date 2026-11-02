"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { X, Building, User, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import { EnquiryStatus } from "@/types/enquiry";
import { AdminEnquiryItem, useEnquiryStore } from "@/context/enquiry-context";
import type { AdminEnquiryDetail } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { useAdminAuth } from "@/context/admin-auth-context";

interface EnquiryDetailModalProps {
  enquiry: AdminEnquiryItem | null;
  isOpen: boolean;
  onClose: () => void;
}

const formatDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

const STATUS_LABELS: Record<EnquiryStatus, string> = { Active: "New", Addressed: "Owner responded", Archived: "Closed" };

/**
 * Read-only enquiry thread (GET /admin/enquiries/{id}). The status is set by
 * the owner's lead workflow, so the switcher only shows where it stands.
 * Admin notes on enquiries are not supported by the backend.
 */
export function EnquiryDetailModal({ enquiry, isOpen, onClose }: EnquiryDetailModalProps) {
  const { getDetail } = useEnquiryStore();
  const { can } = useAdminAuth();
  const [detail, setDetail] = useState<AdminEnquiryDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const enquiryId = enquiry?.enquiryId;

  useEffect(() => {
    if (!isOpen || !enquiryId) return;
    let cancelled = false;
    setDetail(null);
    setError("");
    setLoading(true);
    getDetail(enquiryId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e, "Could not load this enquiry."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, enquiryId, getDetail]);

  if (!isOpen || !enquiry) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border border-[#e8ecf4] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#f1f4f9] pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-bold text-[#162d66] bg-[#f0f4ff] px-2 py-0.5 rounded-md">#{enquiry.id}</span>
              <span className="text-xs text-[#94a3b8]">{formatDateTime(enquiry.createdAt)}</span>
            </div>
            <h2 className="mt-1 text-lg font-bold text-[#101828]">Buyer enquiry</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl p-1.5 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#101828]"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f8fafc] border border-[#e8ecf4] p-3">
          <div className="text-xs font-semibold text-[#64748b]">Lead status (set by the owner):</div>
          <div className="flex items-center gap-1.5">
            {(["Active", "Addressed", "Archived"] as EnquiryStatus[]).map((st) => {
              const isActive = enquiry.status === st;
              return (
                <span
                  key={st}
                  className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold ${
                    isActive
                      ? st === "Active"
                        ? "bg-[#d97706] text-white shadow-sm"
                        : st === "Addressed"
                        ? "bg-[#059669] text-white shadow-sm"
                        : "bg-[#64748b] text-white shadow-sm"
                      : "bg-white text-[#94a3b8] border border-[#e8ecf4]"
                  }`}
                >
                  {isActive && <CheckCircle2 className="h-3.5 w-3.5" />}
                  <span>{STATUS_LABELS[st]}</span>
                </span>
              );
            })}
          </div>
        </div>
        {enquiry.closingReason && <p className="mt-2 text-xs text-[#64748b]">Closing outcome: {enquiry.closingReason}</p>}

        <div className="mt-4 space-y-4">
          <div className="rounded-2xl border border-[#e8ecf4] bg-[#fffbf0] p-4">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#b45309]">Conversation</span>
            {loading && (
              <div className="mt-2 flex items-center gap-2 text-xs text-[#94a3b8]">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading messages…
              </div>
            )}
            {error && <p className="mt-2 text-xs text-[#b91c1c]" role="alert">{error}</p>}
            <div className="mt-2 space-y-2">
              {detail?.messages.length === 0 && <p className="text-xs text-[#94a3b8]">No messages.</p>}
              {detail?.messages.map((m, i) => (
                <div
                  key={m.id ?? i}
                  className={`rounded-xl px-3 py-2 text-sm ${m.sender === "OWNER" ? "bg-[#ecfdf5] text-[#065f46]" : "bg-white text-[#101828] border border-[#f1f4f9]"}`}
                >
                  <p className="whitespace-pre-line">{m.body}</p>
                  <p className="mt-1 text-[10px] text-[#94a3b8]">
                    {m.sender === "OWNER" ? enquiry.ownerName : enquiry.buyerName} · {formatDateTime(m.created_at)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-[#e8ecf4] p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">Buyer</span>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#101828]">
                <User className="h-4 w-4 text-[#94a3b8]" /> {enquiry.buyerName}
              </div>
              {can("users.view") && (
                <Link href={`/admin-dashboard/users?id=${enquiry.buyerId}`} className="mt-1 inline-block text-xs font-semibold text-[#162d66] hover:underline">
                  Open user #{enquiry.buyerId}
                </Link>
              )}
            </div>
            <div className="rounded-2xl border border-[#e8ecf4] p-4">
              <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748b]">Property Owner</span>
              <div className="mt-1 flex items-center gap-1.5 text-sm font-semibold text-[#101828]">
                <User className="h-4 w-4 text-[#94a3b8]" /> {enquiry.ownerName}
              </div>
              {can("users.view") && (
                <Link href={`/admin-dashboard/users?id=${enquiry.ownerId}`} className="mt-1 inline-block text-xs font-semibold text-[#162d66] hover:underline">
                  Open user #{enquiry.ownerId}
                </Link>
              )}
            </div>
          </div>

          <Link
            href={`/admin-dashboard/properties?id=${enquiry.listingId}`}
            className="flex items-center justify-between rounded-2xl border border-[#e8ecf4] p-4 hover:bg-[#f8fafc]"
          >
            <span className="flex items-center gap-2 text-sm font-semibold text-[#101828]">
              <Building className="h-4 w-4 text-[#94a3b8]" /> {enquiry.listingTitle}
            </span>
            <ExternalLink className="h-3.5 w-3.5 text-[#94a3b8]" />
          </Link>

          <div className="rounded-2xl border border-dashed border-[#e8ecf4] p-4 text-xs text-[#94a3b8]">
            Admin remarks on enquiries are not available yet. Owners&apos; private lead notes are never shown here.
          </div>
        </div>
      </div>
    </div>
  );
}
