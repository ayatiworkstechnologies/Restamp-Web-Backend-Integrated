"use client";

import React, { useState } from "react";
import {
  CheckCircle2,
  XCircle,
  Eye,
  MoreVertical,
  ShieldCheck,
  Sparkles,
  Edit,
  Trash2,
  Download,
  CheckSquare,
  Square,
  FileCheck2,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { Property, PropertyStatus } from "@/types/property";
import { usePropertyStore } from "@/context/property-context";

interface PropertyTableProps {
  properties: Property[];
  onInspect: (property: Property) => void;
  onApprove: (property: Property) => void;
  onReject: (property: Property) => void;
  onEdit: (property: Property) => void;
}

export function PropertyTable({
  properties,
  onInspect,
  onApprove,
  onReject,
  onEdit,
}: PropertyTableProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  const {
    batchApprove,
    batchReject,
    toggleFeatured,
    toggleVerified,
    deleteProperty,
    showToast,
  } = usePropertyStore();

  const handleSelectAll = () => {
    if (selectedIds.length === properties.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(properties.map((p) => p.id));
    }
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleBatchApprove = () => {
    if (selectedIds.length === 0) return;
    batchApprove(selectedIds);
    setSelectedIds([]);
  };

  const handleBatchReject = () => {
    if (selectedIds.length === 0) return;
    batchReject(
      selectedIds,
      "Administrative bulk rejection due to incomplete verification.",
      "Compliance"
    );
    setSelectedIds([]);
  };

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(price / 100000).toFixed(0)} Lakhs`;
  };

  const statusPills: Record<PropertyStatus, { bg: string; text: string; dot: string }> = {
    Active: { bg: "bg-[#e7f8ee]", text: "text-[#199864]", dot: "bg-[#21b879]" },
    Pending: { bg: "bg-[#fff5e3]", text: "text-[#bf811a]", dot: "bg-[#eca42d]" },
    Rejected: { bg: "bg-[#ffeaeb]", text: "text-[#d45561]", dot: "bg-[#e66a74]" },
    Draft: { bg: "bg-[#f1f4f9]", text: "text-[#62738b]", dot: "bg-[#94a3b8]" },
  };

  return (
    <div className="relative rounded-2xl border border-[#e8ecf4] bg-white shadow-sm overflow-hidden">
      {/* Table Container */}
      <div className="table-scroll overflow-x-auto">
        <table className="w-full min-w-[950px] border-collapse text-left">
          <thead className="border-b border-[#edf1f8] bg-[#f9fafc] text-[10px] font-extrabold uppercase tracking-[0.09em] text-[#8e9cb0]">
            <tr>
              <th className="w-10 px-4 py-3.5 text-center">
                <input
                  type="checkbox"
                  checked={properties.length > 0 && selectedIds.length === properties.length}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-[#2854cb]"
                />
              </th>
              <th className="px-4 py-3.5">Property Listing</th>
              <th className="px-3 py-3.5">Owner / Contact</th>
              <th className="px-3 py-3.5">Price & Area</th>
              <th className="px-3 py-3.5">Legal / RERA</th>
              <th className="px-3 py-3.5">Status</th>
              <th className="px-3 py-3.5">Submitted</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f3f8]">
            {properties.length > 0 ? (
              properties.map((property) => {
                const isSelected = selectedIds.includes(property.id);
                const pill = statusPills[property.status];
                const image = property.images?.[0];

                return (
                  <tr
                    key={property.id}
                    className={`transition-colors hover:bg-[#fbfcfe] ${
                      isSelected ? "bg-[#f4f7fe]" : ""
                    }`}
                  >
                    {/* Checkbox */}
                    <td className="px-4 py-4 text-center">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(property.id)}
                        className="rounded border-gray-300 text-[#2854cb]"
                      />
                    </td>

                    {/* Property Details */}
                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div
                          onClick={() => onInspect(property)}
                          className="relative h-12 w-14 shrink-0 overflow-hidden rounded-xl border border-[#e2e8f2] bg-slate-100 cursor-pointer group"
                        >
                          {image ? (
                            <img
                              src={image}
                              alt={property.title}
                              className="h-full w-full object-cover transition-transform group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#eef4ff] text-xs font-black text-[#2854cb]">
                              {property.initials}
                            </div>
                          )}
                          {property.featured && (
                            <span className="absolute top-0.5 right-0.5 rounded-full bg-[#f59e0b] p-0.5 text-white">
                              <Sparkles size={8} />
                            </span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span
                              onClick={() => onInspect(property)}
                              className="cursor-pointer truncate text-xs font-extrabold text-[#1a2b45] hover:text-[#2854cb] transition-colors"
                            >
                              {property.title}
                            </span>
                            {property.verifiedBadge && (
                              <ShieldCheck size={14} className="shrink-0 text-[#10b981]" />
                            )}
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#8697ae]">
                            <span className="font-mono font-semibold text-[#2854cb]">
                              {property.id}
                            </span>
                            <span>•</span>
                            <span>
                              {property.locality}, {property.city}
                            </span>
                          </div>
                          <div className="mt-0.5 text-[10px] text-[#9ba8bc]">
                            {property.type} {property.bhk > 0 ? `· ${property.bhk} BHK` : ""} ·{" "}
                            {property.furnishing}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Owner Details */}
                    <td className="whitespace-nowrap px-3 py-4">
                      <div className="text-xs font-bold text-[#23334e]">{property.owner.name}</div>
                      <div className="mt-0.5 text-[11px] text-[#7d8ea5]">
                        {property.owner.phone}
                      </div>
                      <div className="mt-0.5">
                        {property.owner.isKycVerified ? (
                          <span className="inline-flex items-center gap-1 rounded bg-[#ecfdf5] px-1.5 py-0.2 text-[9px] font-extrabold text-[#059669]">
                            <ShieldCheck size={10} /> KYC VERIFIED
                          </span>
                        ) : (
                          <span className="rounded bg-[#fffbeb] px-1.5 py-0.2 text-[9px] font-bold text-[#b45309]">
                            KYC PENDING
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Price & Area */}
                    <td className="whitespace-nowrap px-3 py-4">
                      <div className="text-xs font-extrabold text-[#1b2b44]">
                        {formatPrice(property.price)}
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#8596ac]">
                        {property.carpetAreaSqFt} sq.ft
                      </div>
                      <div className="mt-0.5 text-[10px] text-[#a0aebf]">
                        ₹{(property.price / (property.carpetAreaSqFt || 1000)).toFixed(0)} / sq.ft
                      </div>
                    </td>

                    {/* Legal / RERA */}
                    <td className="whitespace-nowrap px-3 py-4">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            property.reraVerified
                              ? "bg-[#ecfdf5] text-[#059669]"
                              : "bg-[#fffbeb] text-[#b45309]"
                          }`}
                        >
                          {property.reraVerified ? "RERA Verified" : "Pending RERA"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-[#8797ad]">
                        <FileCheck2 size={12} className="text-[#3b82f6]" />
                        <span>{property.documents?.length || 0} deeds uploaded</span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="whitespace-nowrap px-3 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold before:h-1.5 before:w-1.5 before:rounded-full ${pill.bg} ${pill.text} before:${pill.dot}`}
                      >
                        {property.status}
                      </span>
                    </td>

                    {/* Submitted Date */}
                    <td className="whitespace-nowrap px-3 py-4 text-xs text-[#8091a7]">
                      <div>{property.submittedAt}</div>
                      {property.status === "Pending" && (
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#d97706] font-semibold">
                          <Clock size={11} /> Waiting approval
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Quick Approve & Reject for Pending status */}
                        {property.status === "Pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => onApprove(property)}
                              className="rounded-lg bg-[#10b981]/10 p-1.5 text-[#10b981] hover:bg-[#10b981] hover:text-white transition-colors"
                              title="Approve Listing"
                            >
                              <CheckCircle2 size={16} />
                            </button>
                            <button
                              type="button"
                              onClick={() => onReject(property)}
                              className="rounded-lg bg-[#ef4444]/10 p-1.5 text-[#ef4444] hover:bg-[#ef4444] hover:text-white transition-colors"
                              title="Reject Listing"
                            >
                              <XCircle size={16} />
                            </button>
                          </>
                        )}

                        {/* View / Review Details */}
                        <button
                          type="button"
                          onClick={() => onInspect(property)}
                          className="inline-flex items-center gap-1 rounded-xl border border-[#dce3ef] bg-white px-2.5 py-1.5 text-xs font-bold text-[#445672] shadow-sm hover:bg-[#f6f9fc] hover:text-[#2854cb] transition-colors"
                        >
                          <Eye size={13} />
                          <span>Review</span>
                        </button>

                        {/* Menu dropdown trigger */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() =>
                              setActiveMenuId(activeMenuId === property.id ? null : property.id)
                            }
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <MoreVertical size={16} />
                          </button>

                          {activeMenuId === property.id && (
                            <div className="absolute right-0 top-8 z-30 w-44 rounded-xl border border-[#e4ebf5] bg-white py-1.5 shadow-xl text-left">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onInspect(property);
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#384962] hover:bg-[#f6f8fb]"
                              >
                                <Eye size={14} /> Inspect All Docs
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  onEdit(property);
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#384962] hover:bg-[#f6f8fb]"
                              >
                                <Edit size={14} /> Edit Listing Details
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  toggleFeatured(property.id);
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#384962] hover:bg-[#f6f8fb]"
                              >
                                <Sparkles size={14} className="text-[#f59e0b]" />
                                {property.featured ? "Remove Featured" : "Mark Featured"}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  toggleVerified(property.id);
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-medium text-[#384962] hover:bg-[#f6f8fb]"
                              >
                                <ShieldCheck size={14} className="text-[#10b981]" />
                                {property.verifiedBadge ? "Remove Verified" : "Add Verified"}
                              </button>
                              <div className="my-1 border-t border-[#f0f3f8]" />
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveMenuId(null);
                                  if (confirm(`Are you sure you want to delete ${property.id}?`)) {
                                    deleteProperty(property.id);
                                  }
                                }}
                                className="flex w-full items-center gap-2 px-3.5 py-2 text-xs font-semibold text-[#dc2626] hover:bg-[#fef2f2]"
                              >
                                <Trash2 size={14} /> Delete Listing
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="py-16 text-center text-sm text-[#93a2b7]">
                  No properties found matching your filter criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Floating Batch Actions Bar when items selected */}
      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-fade-in flex items-center gap-3 rounded-2xl border border-[#2854cb]/30 bg-[#17253d] px-5 py-3 text-white shadow-2xl backdrop-blur-md">
          <span className="text-xs font-bold text-[#b4cbfa]">
            {selectedIds.length} properties selected
          </span>
          <div className="h-4 w-px bg-white/20" />
          <button
            type="button"
            onClick={handleBatchApprove}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#10b981] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#059669] transition-all"
          >
            <CheckCircle2 size={14} />
            <span>Approve Selected</span>
          </button>
          <button
            type="button"
            onClick={handleBatchReject}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#ef4444] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#dc2626] transition-all"
          >
            <XCircle size={14} />
            <span>Reject Selected</span>
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds([])}
            className="rounded-xl px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:text-white"
          >
            Deselect
          </button>
        </div>
      )}
    </div>
  );
}
