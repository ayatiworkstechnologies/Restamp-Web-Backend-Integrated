"use client";

import React from "react";
import Link from "next/link";
import { ExternalLink, Building, User, MessageSquare } from "lucide-react";
import { EnquiryStatus } from "@/types/enquiry";
import { AdminEnquiryItem } from "@/context/enquiry-context";

interface EnquiryTableProps {
  enquiries: AdminEnquiryItem[];
  onInspect: (enquiry: AdminEnquiryItem) => void;
}

const statusPills: Record<EnquiryStatus, { bg: string; text: string; dot: string }> = {
  Active: { bg: "bg-[#fff5e3]", text: "text-[#bf811a]", dot: "bg-[#eca42d]" },
  Addressed: { bg: "bg-[#e7f8ee]", text: "text-[#199864]", dot: "bg-[#21b879]" },
  Archived: { bg: "bg-[#f1f4f9]", text: "text-[#62738b]", dot: "bg-[#94a3b8]" },
};

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—";

/** Read-only list: enquiry status is managed by the owner, not by admins. */
export function EnquiryTable({ enquiries, onInspect }: EnquiryTableProps) {
  return (
    <div className="overflow-hidden rounded-2xl border border-[#e8ecf4] bg-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-left border-collapse">
          <thead>
            <tr className="border-b border-[#f1f4f9] bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
              <th className="py-3.5 pl-4 px-3">Lead ID & Date</th>
              <th className="py-3.5 px-3">Buyer</th>
              <th className="py-3.5 px-3">Target Property</th>
              <th className="py-3.5 px-3">Property Owner</th>
              <th className="py-3.5 px-3">Latest Message</th>
              <th className="py-3.5 px-3">Status</th>
              <th className="py-3.5 pr-4 pl-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f4f9] text-xs">
            {enquiries.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-[#94a3b8]">
                  No buyer enquiries found matching the criteria.
                </td>
              </tr>
            ) : (
              enquiries.map((enquiry) => {
                const statusStyle = statusPills[enquiry.status];
                return (
                  <tr key={enquiry.id} className="transition-colors hover:bg-[#fcfdfe]">
                    <td className="py-3.5 pl-4 px-3 font-medium">
                      <div className="font-mono text-xs font-bold text-[#162d66]">#{enquiry.id}</div>
                      <div className="text-[11px] text-[#94a3b8]">{formatDate(enquiry.createdAt)}</div>
                    </td>

                    <td className="py-3.5 px-3 max-w-[180px]">
                      <div className="font-semibold text-[#101828] truncate">{enquiry.buyerName}</div>
                      <div className="text-[11px] text-[#94a3b8]">User #{enquiry.buyerId}</div>
                    </td>

                    <td className="py-3.5 px-3 max-w-[220px]">
                      <Link
                        href={`/admin-dashboard/properties?id=${enquiry.listingId}`}
                        className="font-medium text-[#101828] hover:text-[#162d66] hover:underline line-clamp-1 inline-flex items-center gap-1"
                        title="Open property details"
                      >
                        <Building className="h-3 w-3 text-[#94a3b8] shrink-0" />
                        <span className="truncate">{enquiry.listingTitle}</span>
                        <ExternalLink className="h-2.5 w-2.5 text-[#94a3b8] shrink-0" />
                      </Link>
                      <div className="text-[11px] text-[#94a3b8] mt-0.5">Listing #{enquiry.listingId}</div>
                    </td>

                    <td className="py-3.5 px-3 max-w-[180px]">
                      <div className="flex items-center gap-1 font-medium text-[#101828]">
                        <User className="h-3 w-3 text-[#94a3b8]" />
                        <span className="truncate">{enquiry.ownerName}</span>
                      </div>
                      <div className="text-[11px] text-[#94a3b8]">User #{enquiry.ownerId}</div>
                    </td>

                    <td className="py-3.5 px-3 max-w-[260px]">
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#f0f4ff] px-2 py-0.5 text-[11px] font-medium text-[#162d66]">
                        <MessageSquare className="h-3 w-3" /> {enquiry.messageCount} message{enquiry.messageCount === 1 ? "" : "s"}
                      </span>
                      {enquiry.lastMessage && <p className="mt-1 text-xs text-[#475467] line-clamp-2">&ldquo;{enquiry.lastMessage}&rdquo;</p>}
                    </td>

                    <td className="py-3.5 px-3">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyle.bg} ${statusStyle.text}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                        {enquiry.statusLabel}
                      </span>
                      {enquiry.closingReason && <div className="mt-0.5 text-[10px] text-[#94a3b8]">{enquiry.closingReason}</div>}
                    </td>

                    <td className="py-3.5 pr-4 pl-3 text-right">
                      <button
                        type="button"
                        onClick={() => onInspect(enquiry)}
                        className="rounded-lg border border-[#e8ecf4] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#162d66] shadow-sm hover:bg-[#f0f4ff] transition-colors"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
