"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Eye,
  MoreVertical,
  Phone,
  Mail,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  ExternalLink,
  Clock,
  Archive,
  Building,
  User,
} from "lucide-react";
import { Enquiry, EnquiryStatus } from "@/types/enquiry";
import { useEnquiryStore } from "@/context/enquiry-context";

interface EnquiryTableProps {
  enquiries: Enquiry[];
  onInspect: (enquiry: Enquiry) => void;
}

const statusPills: Record<EnquiryStatus, { bg: string; text: string; dot: string }> = {
  Active: { bg: "bg-[#fff5e3]", text: "text-[#bf811a]", dot: "bg-[#eca42d]" },
  Addressed: { bg: "bg-[#e7f8ee]", text: "text-[#199864]", dot: "bg-[#21b879]" },
  Archived: { bg: "bg-[#f1f4f9]", text: "text-[#62738b]", dot: "bg-[#94a3b8]" },
};

export function EnquiryTable({ enquiries, onInspect }: EnquiryTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const { batchUpdateStatus, deleteEnquiry, updateEnquiryStatus } = useEnquiryStore();

  const handleSelectAll = () => {
    if (selectedIds.length === enquiries.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(enquiries.map((e) => e.id));
    }
  };

  const handleSelectOne = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
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
    <div className="space-y-3">
      {/* Batch Actions Bar */}
      {selectedIds.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#d0e0ff] bg-[#f0f4ff] p-3 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#162d66] text-xs font-bold text-white">
              {selectedIds.length}
            </span>
            <span className="text-xs font-semibold text-[#162d66]">
              inquiries selected
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                batchUpdateStatus(selectedIds, "Active");
                setSelectedIds([]);
              }}
              className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-medium text-[#d97706] shadow-sm hover:bg-[#fffbf0] transition-colors"
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Mark as Active</span>
            </button>

            <button
              type="button"
              onClick={() => {
                batchUpdateStatus(selectedIds, "Addressed");
                setSelectedIds([]);
              }}
              className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-medium text-[#059669] shadow-sm hover:bg-[#ecfdf5] transition-colors"
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              <span>Mark as Addressed</span>
            </button>

            <button
              type="button"
              onClick={() => {
                batchUpdateStatus(selectedIds, "Archived");
                setSelectedIds([]);
              }}
              className="inline-flex items-center gap-1 rounded-xl bg-white px-3 py-1.5 text-xs font-medium text-[#475467] shadow-sm hover:bg-[#f8fafc] transition-colors"
            >
              <Archive className="h-3.5 w-3.5" />
              <span>Archive</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds([])}
              className="rounded-xl px-2.5 py-1.5 text-xs text-[#64748b] hover:text-[#101828]"
            >
              Deselect All
            </button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="overflow-hidden rounded-2xl border border-[#e8ecf4] bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#f1f4f9] bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
                <th className="py-3.5 pl-4 pr-2 w-10">
                  <input
                    type="checkbox"
                    checked={
                      enquiries.length > 0 &&
                      selectedIds.length === enquiries.length
                    }
                    onChange={handleSelectAll}
                    aria-label="Select all enquiries"
                    className="h-4 w-4 rounded border-[#cbd5e1] text-[#162d66] cursor-pointer"
                  />
                </th>
                <th className="py-3.5 px-3">Lead ID & Date</th>
                <th className="py-3.5 px-3">Buyer Details</th>
                <th className="py-3.5 px-3">Target Property</th>
                <th className="py-3.5 px-3">Property Owner</th>
                <th className="py-3.5 px-3">Inquiry Type & Message</th>
                <th className="py-3.5 px-3">Status</th>
                <th className="py-3.5 pr-4 pl-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#f1f4f9] text-xs">
              {enquiries.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-[#94a3b8]">
                    No buyer enquiries found matching the criteria.
                  </td>
                </tr>
              ) : (
                enquiries.map((enquiry) => {
                  const isSelected = selectedIds.includes(enquiry.id);
                  const statusStyle = statusPills[enquiry.status];

                  return (
                    <tr
                      key={enquiry.id}
                      className={`transition-colors hover:bg-[#fcfdfe] ${
                        isSelected ? "bg-[#f8faff]" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3.5 pl-4 pr-2">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(enquiry.id)}
                          aria-label={`Select enquiry ${enquiry.id}`}
                          className="h-4 w-4 rounded border-[#cbd5e1] text-[#162d66] cursor-pointer"
                        />
                      </td>

                      {/* Lead ID & Date */}
                      <td className="py-3.5 px-3 font-medium">
                        <div className="font-mono text-xs font-bold text-[#162d66]">
                          {enquiry.id}
                        </div>
                        <div className="text-[11px] text-[#94a3b8]">
                          {new Date(enquiry.createdAt).toLocaleDateString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <span className="mt-0.5 inline-block rounded bg-[#f1f5f9] px-1.5 py-0.2 text-[10px] text-[#64748b]">
                          {enquiry.channel}
                        </span>
                      </td>

                      {/* Buyer Details */}
                      <td className="py-3.5 px-3 max-w-[200px]">
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-[#101828]">
                            {enquiry.buyer.name}
                          </span>
                          {enquiry.buyer.isKycVerified && (
                            <span
                              title="KYC Verified Buyer"
                              className="inline-flex text-[#10b981]"
                            >
                              <ShieldCheck className="h-3.5 w-3.5" />
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-[#64748b]">
                          <a
                            href={`tel:${enquiry.buyer.phone}`}
                            className="inline-flex items-center gap-1 hover:text-[#162d66] hover:underline"
                            title={`Call buyer at ${enquiry.buyer.phone}`}
                          >
                            <Phone className="h-3 w-3 text-[#94a3b8]" />
                            <span>{enquiry.buyer.phone}</span>
                          </a>
                        </div>
                        <div className="text-[11px] text-[#94a3b8] truncate">
                          {enquiry.buyer.email} · {enquiry.buyer.city}
                        </div>
                      </td>

                      {/* Target Property */}
                      <td className="py-3.5 px-3 max-w-[220px]">
                        <Link
                          href={`/admin-dashboard/properties?id=${enquiry.property.id}`}
                          className="font-medium text-[#101828] hover:text-[#162d66] hover:underline line-clamp-1 inline-flex items-center gap-1"
                          title="Open property details"
                        >
                          <Building className="h-3 w-3 text-[#94a3b8] shrink-0" />
                          <span className="truncate">{enquiry.property.title}</span>
                          <ExternalLink className="h-2.5 w-2.5 text-[#94a3b8] shrink-0" />
                        </Link>
                        <div className="text-[11px] text-[#64748b] flex items-center justify-between mt-0.5">
                          <span>{enquiry.property.location}</span>
                          <span className="font-semibold text-[#162d66]">
                            {formatPrice(enquiry.property.price)}
                          </span>
                        </div>
                      </td>

                      {/* Property Owner */}
                      <td className="py-3.5 px-3 max-w-[180px]">
                        <div className="flex items-center gap-1 font-medium text-[#101828]">
                          <User className="h-3 w-3 text-[#94a3b8]" />
                          <span>{enquiry.property.ownerName}</span>
                        </div>
                        <div className="text-[11px] text-[#64748b] flex items-center gap-1.5 mt-0.5">
                          <a
                            href={`tel:${enquiry.property.ownerPhone}`}
                            className="hover:text-[#162d66] hover:underline inline-flex items-center gap-1"
                            title={`Call owner at ${enquiry.property.ownerPhone}`}
                          >
                            <Phone className="h-2.5 w-2.5 text-[#94a3b8]" />
                            <span>{enquiry.property.ownerPhone}</span>
                          </a>
                        </div>
                      </td>

                      {/* Inquiry Type & Message */}
                      <td className="py-3.5 px-3 max-w-[240px]">
                        <span className="inline-block rounded-md bg-[#f0f4ff] px-2 py-0.5 text-[11px] font-medium text-[#162d66]">
                          {enquiry.type}
                        </span>
                        <p className="mt-1 text-xs text-[#475467] line-clamp-2">
                          "{enquiry.message}"
                        </p>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-3">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${statusStyle.bg} ${statusStyle.text}`}
                        >
                          <span className={`h-1.5 w-1.5 rounded-full ${statusStyle.dot}`} />
                          {enquiry.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 pr-4 pl-3 text-right">
                        <div className="relative inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onInspect(enquiry)}
                            className="rounded-lg border border-[#e8ecf4] bg-white px-2.5 py-1.5 text-xs font-semibold text-[#162d66] shadow-sm hover:bg-[#f0f4ff] transition-colors"
                          >
                            View
                          </button>

                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveMenuId(
                                  activeMenuId === enquiry.id ? null : enquiry.id
                                )
                              }
                              className="rounded-lg p-1.5 text-[#94a3b8] hover:bg-[#f1f5f9] hover:text-[#334155]"
                              aria-label="Enquiry options"
                            >
                              <MoreVertical className="h-4 w-4" />
                            </button>

                            {activeMenuId === enquiry.id && (
                              <div
                                onClick={(e) => e.stopPropagation()}
                                className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-[#e8ecf4] bg-white p-1.5 shadow-xl text-left"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    onInspect(enquiry);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[#334155] hover:bg-[#f1f5f9]"
                                >
                                  <Eye className="h-3.5 w-3.5" />
                                  <span>Full Lead Details</span>
                                </button>

                                <div className="my-1 border-t border-[#f1f4f9]" />
                                <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-[#94a3b8]">
                                  Set Status
                                </div>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    updateEnquiryStatus(enquiry.id, "Active");
                                  }}
                                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                                    enquiry.status === "Active"
                                      ? "text-[#d97706] font-semibold bg-[#fffbf0]"
                                      : "text-[#334155] hover:bg-[#f1f5f9]"
                                  }`}
                                >
                                  <span>Active</span>
                                  {enquiry.status === "Active" && (
                                    <CheckCircle2 className="h-3 w-3 text-[#d97706]" />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    updateEnquiryStatus(enquiry.id, "Addressed");
                                  }}
                                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                                    enquiry.status === "Addressed"
                                      ? "text-[#059669] font-semibold bg-[#ecfdf5]"
                                      : "text-[#334155] hover:bg-[#f1f5f9]"
                                  }`}
                                >
                                  <span>Addressed</span>
                                  {enquiry.status === "Addressed" && (
                                    <CheckCircle2 className="h-3 w-3 text-[#059669]" />
                                  )}
                                </button>

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    updateEnquiryStatus(enquiry.id, "Archived");
                                  }}
                                  className={`flex w-full items-center justify-between rounded-lg px-2.5 py-1.5 text-xs ${
                                    enquiry.status === "Archived"
                                      ? "text-[#64748b] font-semibold bg-[#f8fafc]"
                                      : "text-[#334155] hover:bg-[#f1f5f9]"
                                  }`}
                                >
                                  <span>Archived</span>
                                  {enquiry.status === "Archived" && (
                                    <CheckCircle2 className="h-3 w-3 text-[#64748b]" />
                                  )}
                                </button>

                                <div className="my-1 border-t border-[#f1f4f9]" />

                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveMenuId(null);
                                    deleteEnquiry(enquiry.id);
                                  }}
                                  className="flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs text-[#ef4444] hover:bg-[#fef2f2]"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                  <span>Delete Record</span>
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
