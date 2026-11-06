"use client";

import React, { useState } from "react";
import { CheckCircle2, XCircle, Eye, Clock, ImageOff, Loader2 } from "lucide-react";
import { PropertyStatus } from "@/types/property";
import { AdminProperty, usePropertyStore } from "@/context/property-context";
import { useAdminAuth } from "@/context/admin-auth-context";

interface PropertyTableProps {
  properties: AdminProperty[];
  onInspect: (property: AdminProperty) => void;
  onApprove: (property: AdminProperty) => void;
  onReject: (property: AdminProperty) => void;
}

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "—";

export function PropertyTable({ properties, onInspect, onApprove, onReject }: PropertyTableProps) {
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [batching, setBatching] = useState(false);
  const { batchApprove } = usePropertyStore();
  const { can } = useAdminAuth();
  const canApprove = can("properties.approve");
  const canReject = can("properties.reject");

  // Only pending listings can be decided, so only they are selectable.
  const selectable = properties.filter((p) => p.status === "Pending");

  const handleSelectAll = () => {
    setSelectedIds(selectedIds.length === selectable.length ? [] : selectable.map((p) => p.listingId));
  };

  const handleToggleSelect = (id: number) => {
    setSelectedIds(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  };

  const handleBatchApprove = async () => {
    if (selectedIds.length === 0 || batching) return;
    if (!confirm(`Verify ${selectedIds.length} pending listing(s)? They become visible to buyers.`)) return;
    setBatching(true);
    try {
      await batchApprove(selectedIds);
      setSelectedIds([]);
    } finally {
      setBatching(false);
    }
  };

  const statusPills: Record<PropertyStatus, { bg: string; text: string; dot: string }> = {
    Active: { bg: "bg-[#e7f8ee]", text: "text-[#199864]", dot: "bg-[#21b879]" },
    Pending: { bg: "bg-[#fff5e3]", text: "text-[#bf811a]", dot: "bg-[#eca42d]" },
    Rejected: { bg: "bg-[#ffeaeb]", text: "text-[#d45561]", dot: "bg-[#e66a74]" },
    Draft: { bg: "bg-[#f1f4f9]", text: "text-[#62738b]", dot: "bg-[#94a3b8]" },
  };

  return (
    <div className="relative rounded-2xl border border-[#e8ecf4] bg-white shadow-sm overflow-hidden">
      <div className="table-scroll overflow-x-auto">
        <table className="w-full min-w-[950px] border-collapse text-left">
          <thead className="border-b border-[#edf1f8] bg-[#f9fafc] text-[10px] font-extrabold uppercase tracking-[0.09em] text-[#8e9cb0]">
            <tr>
              <th className="w-10 px-4 py-3.5 text-center">
                {canApprove && (
                  <input
                    type="checkbox"
                    aria-label="Select all pending listings"
                    disabled={selectable.length === 0}
                    checked={selectable.length > 0 && selectedIds.length === selectable.length}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-[#2854cb]"
                  />
                )}
              </th>
              <th className="px-4 py-3.5">Property Listing</th>
              <th className="px-3 py-3.5">Owner</th>
              <th className="px-3 py-3.5">Price</th>
              <th className="px-3 py-3.5">Deal / Type</th>
              <th className="px-3 py-3.5">Status</th>
              <th className="px-3 py-3.5">Submitted</th>
              <th className="px-4 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f0f3f8]">
            {properties.length > 0 ? (
              properties.map((property) => {
                const isSelected = selectedIds.includes(property.listingId);
                const pill = statusPills[property.status];
                const isPending = property.status === "Pending";

                return (
                  <tr
                    key={property.id}
                    className={`transition-colors hover:bg-[#fbfcfe] ${isSelected ? "bg-[#f4f7fe]" : ""}`}
                  >
                    <td className="px-4 py-4 text-center">
                      {canApprove && isPending && (
                        <input
                          type="checkbox"
                          aria-label={`Select listing ${property.id}`}
                          checked={isSelected}
                          onChange={() => handleToggleSelect(property.listingId)}
                          className="rounded border-gray-300 text-[#2854cb]"
                        />
                      )}
                    </td>

                    <td className="px-4 py-4">
                      <div className="flex items-start gap-3">
                        <div
                          onClick={() => onInspect(property)}
                          className="relative h-12 w-14 shrink-0 overflow-hidden rounded-xl border border-[#e2e8f2] bg-slate-100 cursor-pointer group"
                        >
                          {property.image ? (
                            <img
                              src={property.image}
                              alt={property.title}
                              className="h-full w-full object-cover transition-transform group-hover:scale-110"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center bg-[#eef4ff] text-[#93a2b8]">
                              <ImageOff size={16} />
                            </div>
                          )}
                        </div>

                        <div className="min-w-0">
                          <span
                            onClick={() => onInspect(property)}
                            className="cursor-pointer truncate text-xs font-extrabold text-[#1a2b45] hover:text-[#2854cb] transition-colors"
                          >
                            {property.title}
                          </span>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-[#8697ae]">
                            <span className="font-mono font-semibold text-[#2854cb]">#{property.id}</span>
                            <span>•</span>
                            <span>
                              {property.locality}, {property.city} {property.pincode}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="whitespace-nowrap px-3 py-4">
                      <div className="text-xs font-bold text-[#23334e]">{property.ownerName}</div>
                      <div className="mt-0.5 text-[11px] text-[#7d8ea5]">User #{property.ownerId}</div>
                    </td>

                    <td className="whitespace-nowrap px-3 py-4">
                      <div className="text-xs font-extrabold text-[#1b2b44]">{property.priceDisplay}</div>
                    </td>

                    <td className="whitespace-nowrap px-3 py-4">
                      <div className="text-xs font-bold text-[#23334e]">{property.dealLabel}</div>
                      <div className="mt-0.5 text-[11px] text-[#7d8ea5]">{property.typeLabel}</div>
                    </td>

                    <td className="whitespace-nowrap px-3 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold before:h-1.5 before:w-1.5 before:rounded-full ${pill.bg} ${pill.text} before:${pill.dot}`}
                      >
                        {property.statusLabel}
                      </span>
                    </td>

                    <td className="whitespace-nowrap px-3 py-4 text-xs text-[#8091a7]">
                      <div>{formatDate(property.submittedAt)}</div>
                      {isPending && (
                        <div className="mt-0.5 flex items-center gap-1 text-[10px] text-[#d97706] font-semibold">
                          <Clock size={11} /> Waiting review
                        </div>
                      )}
                    </td>

                    <td className="whitespace-nowrap px-4 py-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {isPending && canApprove && (
                          <button
                            type="button"
                            onClick={() => onApprove(property)}
                            className="rounded-lg bg-[#10b981]/10 p-1.5 text-[#10b981] hover:bg-[#10b981] hover:text-white transition-colors"
                            title="Verify listing"
                            aria-label="Verify listing"
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        )}
                        {isPending && canReject && (
                          <button
                            type="button"
                            onClick={() => onReject(property)}
                            className="rounded-lg bg-[#ef4444]/10 p-1.5 text-[#ef4444] hover:bg-[#ef4444] hover:text-white transition-colors"
                            title="Reject listing"
                            aria-label="Reject listing"
                          >
                            <XCircle size={16} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onInspect(property)}
                          className="inline-flex items-center gap-1 rounded-xl border border-[#dce3ef] bg-white px-2.5 py-1.5 text-xs font-bold text-[#445672] shadow-sm hover:bg-[#f6f9fc] hover:text-[#2854cb] transition-colors"
                        >
                          <Eye size={13} />
                          <span>Review</span>
                        </button>
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

      {selectedIds.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-40 animate-fade-in flex items-center gap-3 rounded-2xl border border-[#2854cb]/30 bg-[#17253d] px-5 py-3 text-white shadow-2xl backdrop-blur-md">
          <span className="text-xs font-bold text-[#b4cbfa]">{selectedIds.length} pending listings selected</span>
          <div className="h-4 w-px bg-white/20" />
          <button
            type="button"
            onClick={() => void handleBatchApprove()}
            disabled={batching}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#10b981] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#059669] disabled:opacity-60 transition-all"
          >
            {batching ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
            <span>Verify Selected</span>
          </button>
          <span className="text-[11px] text-slate-400">Rejections need a reason, so reject listings one at a time.</span>
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
