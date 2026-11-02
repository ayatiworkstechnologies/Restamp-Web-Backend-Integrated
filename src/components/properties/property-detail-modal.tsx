"use client";

import React, { useEffect, useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  FileText,
  Building,
  User,
  History,
  MapPin,
  AlertTriangle,
  ImageOff,
  Loader2,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { AdminProperty, usePropertyStore } from "@/context/property-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import type { AdminListingDetail } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { cleanImageUrl, CONSTRUCTION_LABELS, DEAL_LABELS, typeLabel } from "@/lib/api/mappers";

interface PropertyDetailModalProps {
  property: AdminProperty | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (property: AdminProperty) => void;
  onReject: (property: AdminProperty) => void;
}

const formatDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

const ACTOR_LABEL: Record<string, string> = { admin: "Admin", owner: "Owner", auto: "Automatic check" };

/**
 * Full listing review from GET /admin/listings/{id}: the owner's listing
 * card, the owner reference and the verification history. Facts the backend
 * does not hold (documents, RERA, KYC, inspection checklist) are shown as
 * not available instead of being filled in.
 */
export function PropertyDetailModal({ property, isOpen, onClose, onApprove, onReject }: PropertyDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "owner" | "audit">("overview");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [detail, setDetail] = useState<AdminListingDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { getDetail } = usePropertyStore();
  const { can } = useAdminAuth();
  const listingId = property?.listingId;
  const status = property?.status;

  useEffect(() => {
    if (!isOpen || !listingId) return;
    let cancelled = false;
    setDetail(null);
    setError("");
    setLoading(true);
    setSelectedImageIndex(0);
    getDetail(listingId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e, "Could not load this listing."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // Re-load after a decision changes the row's status.
  }, [isOpen, listingId, status, getDetail]);

  if (!isOpen || !property) return null;

  const l = detail?.listing;
  const images = l
    ? [l.cover_image_url, ...(l.gallery || [])].map((u) => cleanImageUrl(u)).filter((u, i, a) => u && a.indexOf(u) === i)
    : property.image
    ? [property.image]
    : [];
  const lastRejection = [...(detail?.verification_history || [])].reverse().find((v) => v.action === "rejected");

  const statusColors = {
    Active: "bg-[#e7f8ee] text-[#199864] border-[#b4eed3]",
    Pending: "bg-[#fff5e3] text-[#bf811a] border-[#fde1ad]",
    Rejected: "bg-[#ffeaeb] text-[#d45561] border-[#fbc9ce]",
    Draft: "bg-[#f1f4f9] text-[#6e7d94] border-[#dde3ee]",
  };

  const specs: [string, string | number | null | undefined][] = l
    ? [
        ["Listing type", DEAL_LABELS[l.transaction_type] || l.transaction_type],
        ["Property type", typeLabel(l.property_type)],
        ["Construction", l.construction_status ? CONSTRUCTION_LABELS[l.construction_status] : null],
        ["Bedrooms", l.bedrooms],
        ["Bathrooms", l.bathrooms],
        ["Balconies", l.balconies],
        ["Area", l.area_value != null ? `${l.area_value} ${l.area_unit || "sqft"}` : null],
        ["Super built-up", l.super_built_up_area != null ? `${l.super_built_up_area} sqft` : null],
        ["Floor", l.floor_on ? `${l.floor_on}${l.total_floors ? ` of ${l.total_floors}` : ""}` : null],
        ["Furnishing", l.furnishing],
        ["Facing", l.facing],
        ["Age", l.property_age_band],
        ["Enquiries", l.enquiry_count],
        ["Visits", l.visit_count],
        ["Calls", l.call_count],
      ]
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-[#e2e8f2] bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#edf1f8] px-6 py-4 bg-[#fbfcfe]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="rounded-xl bg-[#2854cb]/10 px-3 py-1 font-mono text-xs font-black text-[#2854cb]">#{property.id}</span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-extrabold text-[#19273f]">{property.title}</h2>
              <div className="flex items-center gap-2 text-xs text-[#8292aa]">
                <MapPin size={12} className="text-[#a1b0c6]" />
                <span>
                  {property.locality}, {property.city} {property.pincode}
                </span>
                <span>•</span>
                <span className="font-semibold text-[#324564]">{property.typeLabel}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColors[property.status]}`}>{property.statusLabel}</span>
            {property.status === "Pending" && can("properties.approve") && (
              <button
                type="button"
                onClick={() => onApprove(property)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-[#10b981] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#059669] transition-all"
              >
                <CheckCircle2 size={14} />
                <span>Verify</span>
              </button>
            )}
            {property.status === "Pending" && can("properties.reject") && (
              <button
                type="button"
                onClick={() => onReject(property)}
                className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-[#ef4444] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#dc2626] transition-all"
              >
                <XCircle size={14} />
                <span>Reject</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="rounded-xl border border-[#e2e8f2] p-2 text-[#5a6a82] hover:bg-[#f6f8fb] hover:text-[#182740]"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {property.status === "Rejected" && lastRejection && (
          <div className="border-b border-[#fee2e2] bg-[#fef2f2] px-6 py-3">
            <div className="flex items-start gap-2.5 text-xs text-[#991b1b]">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#dc2626]" />
              <div>
                <span className="font-bold">Rejected{lastRejection.category ? ` (${lastRejection.category})` : ""}:</span>{" "}
                {lastRejection.reason || "No reason recorded."}
              </div>
            </div>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex overflow-x-auto border-b border-[#eef2f7] bg-white px-6">
          {[
            { id: "overview", label: "Overview & Specs", icon: Building },
            { id: "documents", label: "Legal & RERA", icon: FileText },
            { id: "owner", label: "Owner", icon: User },
            { id: "audit", label: "Review History", icon: History, count: detail?.verification_history.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold transition-all ${
                  isActive ? "border-[#2854cb] text-[#2854cb]" : "border-transparent text-[#7d8ca4] hover:text-[#233550]"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="rounded-full bg-[#f0f3f8] px-1.5 py-0.2 text-[10px] text-[#6d7c92]">{tab.count}</span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-[#7d8ca4]">
              <Loader2 size={16} className="animate-spin text-[#2854cb]" /> Loading listing…
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-[#fee2e2] bg-[#fef2f2] p-3 text-xs text-[#991b1b]" role="alert">
              {error}
            </div>
          )}

          {activeTab === "overview" && (
            <div className="space-y-6">
              <div className="space-y-2">
                <div className="relative h-64 sm:h-80 overflow-hidden rounded-2xl bg-slate-100">
                  {images.length ? (
                    <img src={images[selectedImageIndex] || images[0]} alt={property.title} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[#93a2b8]">
                      <ImageOff size={28} />
                      <span className="text-xs font-semibold">No photos uploaded</span>
                    </div>
                  )}
                </div>
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, idx) => (
                      <button
                        key={img}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 ${
                          selectedImageIndex === idx ? "border-[#2854cb]" : "border-transparent"
                        }`}
                      >
                        <img src={img} alt={`Photo ${idx + 1}`} className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-2xl border border-[#e8edf5] bg-[#fbfcfe] p-4">
                <div className="text-[11px] font-bold uppercase text-[#94a3b8]">Price</div>
                <div className="text-xl font-extrabold text-[#17253d]">{l?.price_display || property.priceDisplay}</div>
                <div className="mt-1 text-xs text-[#7d8ca4]">
                  Submitted {formatDateTime(l?.submitted_at || property.submittedAt)}
                </div>
              </div>

              {l && (
                <>
                  <div>
                    <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#8392a8]">Description</h3>
                    <p className="whitespace-pre-line text-sm text-[#4a5b75]">{l.description || "No description provided."}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {specs
                      .filter(([, v]) => v !== null && v !== undefined && v !== "")
                      .map(([label, value]) => (
                        <div key={label} className="rounded-xl border border-[#eef2f7] bg-white p-3">
                          <div className="text-[10px] font-bold uppercase text-[#9aa7bb]">{label}</div>
                          <div className="mt-0.5 text-sm font-bold text-[#23334e]">{value}</div>
                        </div>
                      ))}
                  </div>

                  {l.amenities && l.amenities.length > 0 && (
                    <div>
                      <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#8392a8]">Amenities</h3>
                      <div className="flex flex-wrap gap-1.5">
                        {l.amenities.map((a) => (
                          <span key={a} className="rounded-full bg-[#eef4ff] px-2.5 py-1 text-[11px] font-semibold text-[#2854cb]">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {property.status === "Active" && (
                    <Link
                      href={`/properties/${property.listingId}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2854cb] hover:underline"
                    >
                      <ExternalLink size={13} /> View the public listing
                    </Link>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "documents" && (
            <div className="rounded-2xl border border-dashed border-[#dce3ee] p-8 text-center text-sm text-[#7d8ca4]">
              Ownership documents, RERA details and document checks are not available yet. Owners cannot upload documents and
              the backend does not store them.
            </div>
          )}

          {activeTab === "owner" && (
            <div className="space-y-3">
              <div className="rounded-2xl border border-[#e8edf5] p-4">
                <div className="text-sm font-extrabold text-[#17253d]">{detail?.owner.display_name || property.ownerName}</div>
                <div className="mt-1 text-xs text-[#7d8ca4]">User #{detail?.owner.user_id ?? property.ownerId}</div>
                {detail?.owner.status && (
                  <div className="mt-2 inline-block rounded-full bg-[#f0f3f8] px-2.5 py-0.5 text-[11px] font-bold capitalize text-[#4a5b75]">
                    Account {detail.owner.status}
                  </div>
                )}
              </div>
              {can("users.view") && (
                <Link
                  href={`/admin-dashboard/users?id=${detail?.owner.user_id ?? property.ownerId}`}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#2854cb] hover:underline"
                >
                  <User size={13} /> Open owner in User Management
                </Link>
              )}
              <p className="text-xs text-[#9aa7bb]">Owner KYC is not available yet.</p>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="space-y-2">
              {(detail?.verification_history || []).length === 0 ? (
                <p className="text-sm text-[#7d8ca4]">{detail ? "No review events yet." : ""}</p>
              ) : (
                [...(detail?.verification_history || [])].reverse().map((v) => (
                  <div key={`${v.attempt_no}-${v.triggered_at}`} className="rounded-xl border border-[#eef2f7] p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold capitalize text-[#23334e]">
                        {v.action || "event"} · {ACTOR_LABEL[v.actor || ""] || v.actor || "unknown"}
                      </span>
                      <span className="text-[#93a2b7]">{formatDateTime(v.triggered_at)}</span>
                    </div>
                    {(v.reason || v.category) && (
                      <p className="mt-1 text-[#5a6a82]">
                        {v.category ? `${v.category}: ` : ""}
                        {v.reason}
                      </p>
                    )}
                    <p className="mt-0.5 text-[10px] text-[#a0acbe]">
                      Attempt {v.attempt_no} · result {v.result}
                      {v.triggered_by_user_id ? ` · by user #${v.triggered_by_user_id}` : ""}
                    </p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
