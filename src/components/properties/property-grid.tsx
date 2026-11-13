"use client";

import React from "react";
import {
  CheckCircle2,
  XCircle,
  Eye,
  ShieldCheck,
  Sparkles,
  MapPin,
  Clock,
  MoreVertical,
} from "lucide-react";
import { verifyCountdown } from "@/lib/auto-verify";
import { useNow } from "@/lib/use-now";
import { Property, PropertyStatus } from "@/types/property";

interface PropertyGridProps {
  properties: Property[];
  onInspect: (property: Property) => void;
  onEdit: (property: Property) => void;
}

export function PropertyGrid({
  properties,
  onInspect,
  onEdit,
}: PropertyGridProps) {
  const now = useNow(1000);
  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(price / 100000).toFixed(0)} Lakhs`;
  };

  const statusPills: Record<PropertyStatus, { bg: string; text: string }> = {
    Active: { bg: "bg-[#e7f8ee] text-[#199864]", text: "Active" },
    Pending: { bg: "bg-[#fff5e3] text-[#bf811a]", text: "Pending Review" },
    Rejected: { bg: "bg-[#ffeaeb] text-[#d45561]", text: "Rejected" },
    Draft: { bg: "bg-[#f1f4f9] text-[#62738b]", text: "Draft" },
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
        const image =
          property.images?.[0] ||
          "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80";
        const pill = statusPills[property.status];

        return (
          <div
            key={property.id}
            className="group relative flex flex-col rounded-2xl border border-[#e8ecf4] bg-white shadow-sm transition-all hover:border-[#ccd7ea] hover:shadow-md overflow-hidden"
          >
            {/* Top Image Banner */}
            <div className="relative h-48 w-full bg-slate-100 overflow-hidden">
              <img
                src={image}
                alt={property.title}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30" />

              {/* Status Pill on Image */}
              <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
                <span
                  className={`rounded-full px-2.5 py-1 text-[10px] font-extrabold shadow-sm ${pill.bg}`}
                >
                  {pill.text}
                </span>
                {property.featured && (
                  <span className="flex items-center gap-1 rounded-full bg-[#f59e0b] px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                    <Sparkles size={10} /> FEATURED
                  </span>
                )}
              </div>

              {/* Verified Badge */}
              {property.verifiedBadge && (
                <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-[#10b981] px-2 py-0.5 text-[10px] font-extrabold text-white shadow-sm">
                  <ShieldCheck size={11} /> VERIFIED
                </div>
              )}

              {/* ID and City at bottom of image */}
              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white">
                <span className="font-mono text-xs font-bold text-white/90">{property.id}</span>
                <span className="flex items-center gap-1 text-[11px] font-medium text-white/90">
                  <MapPin size={12} /> {property.locality}, {property.city}
                </span>
              </div>
            </div>

            {/* Card Content */}
            <div className="flex-1 p-4 flex flex-col justify-between">
              <div>
                <h3
                  onClick={() => onInspect(property)}
                  className="cursor-pointer text-sm font-extrabold text-[#192842] hover:text-[#2854cb] line-clamp-1 transition-colors"
                >
                  {property.title}
                </h3>
                <div className="mt-1 text-xs text-[#8192a8]">
                  {property.type} {property.bhk > 0 ? `· ${property.bhk} BHK` : ""} ·{" "}
                  {property.carpetAreaSqFt} sq.ft
                </div>

                {/* Price */}
                <div className="mt-3 flex items-baseline justify-between border-b border-[#f1f4f9] pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[#94a3b8]">Price</span>
                    <div className="text-base font-extrabold text-[#1a2b44]">
                      {formatPrice(property.price)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase text-[#94a3b8]">Rate</span>
                    <div className="text-xs font-semibold text-[#576982]">
                      ₹{(property.price / (property.carpetAreaSqFt || 1000)).toFixed(0)}/sq.ft
                    </div>
                  </div>
                </div>

                {/* Owner details */}
                <div className="mt-3 flex items-center justify-between text-xs text-[#62738b]">
                  <div className="flex items-center gap-1.5 truncate">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#eef4ff] text-[10px] font-bold text-[#2854cb]">
                      {property.owner.name.slice(0, 1)}
                    </div>
                    <span className="truncate font-semibold text-[#30415a]">
                      {property.owner.name}
                    </span>
                  </div>
                  <span className="text-[10px] text-[#93a2b7]">{property.submittedAt}</span>
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="mt-4 flex items-center gap-2 border-t border-[#f1f4f9] pt-3">
                {property.status === "Pending" && (
                  <span className="text-[10px] font-semibold text-[#087ed9]">{verifyCountdown(property.submittedAt, now)}</span>
                )}
                <button
                  type="button"
                  onClick={() => onInspect(property)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#2854cb] py-1.5 text-xs font-bold text-white hover:bg-[#1f45ae] transition-all"
                >
                  <Eye size={13} />
                  <span>View & Review</span>
                </button>

                <button
                  type="button"
                  onClick={() => onInspect(property)}
                  className="rounded-xl border border-[#e2e8f2] p-1.5 text-[#5e7089] hover:bg-[#f6f8fb]"
                  title="Inspect Details"
                >
                  <Eye size={15} />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
