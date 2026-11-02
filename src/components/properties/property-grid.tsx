"use client";

import React from "react";
import { CheckCircle2, XCircle, Eye, MapPin, ImageOff } from "lucide-react";
import { PropertyStatus } from "@/types/property";
import { AdminProperty } from "@/context/property-context";
import { useAdminAuth } from "@/context/admin-auth-context";

interface PropertyGridProps {
  properties: AdminProperty[];
  onInspect: (property: AdminProperty) => void;
  onApprove: (property: AdminProperty) => void;
  onReject: (property: AdminProperty) => void;
}

const formatDate = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "";

export function PropertyGrid({ properties, onInspect, onApprove, onReject }: PropertyGridProps) {
  const { can } = useAdminAuth();
  const statusPills: Record<PropertyStatus, string> = {
    Active: "bg-[#e7f8ee] text-[#199864]",
    Pending: "bg-[#fff5e3] text-[#bf811a]",
    Rejected: "bg-[#ffeaeb] text-[#d45561]",
    Draft: "bg-[#f1f4f9] text-[#62738b]",
  };

  if (properties.length === 0) {
    return (
      <div className="rounded-2xl border border-[#e8ecf4] bg-white py-16 text-center text-sm text-[#93a2b7]">
        No properties found matching your criteria.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
      {properties.map((property) => {
        const isPending = property.status === "Pending";
        return (
          <div
            key={property.id}
            className="group relative flex flex-col rounded-2xl border border-[#e8ecf4] bg-white shadow-sm transition-all hover:border-[#ccd7ea] hover:shadow-md overflow-hidden"
          >
            <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
              {property.image ? (
                <img
                  src={property.image}
                  alt={property.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full flex-col items-center justify-center gap-1 text-[#93a2b8]">
                  <ImageOff size={24} />
                  <span className="text-[11px] font-semibold">No photo</span>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

              <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-sm ${statusPills[property.status]}`}>
                  {property.statusLabel}
                </span>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                <span className="font-mono text-xs font-bold text-white/90">#{property.id}</span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-white/90">
                  <MapPin size={12} /> {property.locality}, {property.city}
                </span>
              </div>
            </div>

            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <h3
                  onClick={() => onInspect(property)}
                  className="cursor-pointer text-sm font-extrabold text-[#192842] hover:text-[#2854cb] line-clamp-1 transition-colors"
                >
                  {property.title}
                </h3>
                <div className="mt-1 text-xs text-[#8192a8]">
                  {property.typeLabel} · {property.dealLabel}
                </div>

                <div className="mt-3 border-b border-[#f1f4f9] pb-3">
                  <span className="text-[10px] font-bold uppercase text-[#94a3b8]">Price</span>
                  <div className="text-base font-extrabold text-[#1a2b44]">{property.priceDisplay}</div>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs text-[#62738b]">
                  <div className="flex items-center gap-1.5 truncate">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eef4ff] text-[10px] font-bold text-[#2854cb]">
                      {property.ownerName.slice(0, 1)}
                    </div>
                    <span className="truncate font-semibold text-[#30415a]">{property.ownerName}</span>
                  </div>
                  <span className="text-[10px] text-[#93a2b7]">{formatDate(property.submittedAt)}</span>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 border-t border-[#f1f4f9] pt-3">
                {isPending && can("properties.approve") && (
                  <button
                    type="button"
                    onClick={() => onApprove(property)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-[#10b981] py-1.5 text-xs font-bold text-white hover:bg-[#059669] transition-all shadow-sm"
                  >
                    <CheckCircle2 size={13} />
                    <span>Verify</span>
                  </button>
                )}
                {isPending && can("properties.reject") && (
                  <button
                    type="button"
                    onClick={() => onReject(property)}
                    className="flex-1 inline-flex items-center justify-center gap-1 rounded-xl bg-[#ef4444] py-1.5 text-xs font-bold text-white hover:bg-[#dc2626] transition-all shadow-sm"
                  >
                    <XCircle size={13} />
                    <span>Reject</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onInspect(property)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2854cb] py-1.5 text-xs font-bold text-white hover:bg-[#1f45ae] transition-all"
                >
                  <Eye size={13} />
                  <span>View & Review</span>
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
