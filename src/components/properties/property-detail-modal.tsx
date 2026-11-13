"use client";

import React, { useState } from "react";
import {
  X,
  CheckCircle2,
  XCircle,
  FileText,
  ShieldCheck,
  Building,
  User,
  History,
  MapPin,
  Sparkles,
  Download,
  ExternalLink,
  Edit,
  Clock,
  Car,
  Compass,
  CheckSquare,
  Square,
  AlertTriangle,
} from "lucide-react";
import { Property } from "@/types/property";
import { usePropertyStore } from "@/context/property-context";
import { verifyCountdown } from "@/lib/auto-verify";
import { useNow } from "@/lib/use-now";

interface PropertyDetailModalProps {
  property: Property | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit: (property: Property) => void;
}

export function PropertyDetailModal({
  property,
  isOpen,
  onClose,
  onEdit,
}: PropertyDetailModalProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "documents" | "owner" | "checklist" | "audit"
  >("overview");
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);

  const { updateChecklist, toggleFeatured, toggleVerified, showToast, updateProperty } = usePropertyStore();
  const now = useNow(1000);

  if (!isOpen || !property) return null;

  const formatPrice = (price: number) => {
    if (price >= 10000000) {
      return `₹${(price / 10000000).toFixed(2)} Cr`;
    }
    return `₹${(price / 100000).toFixed(0)} Lakhs`;
  };

  const images = property.images && property.images.length > 0
    ? property.images
    : [
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80",
      ];

  const statusColors = {
    Active: "bg-[#e7f8ee] text-[#199864] border-[#b4eed3]",
    Pending: "bg-[#fff5e3] text-[#bf811a] border-[#fde1ad]",
    Rejected: "bg-[#ffeaeb] text-[#d45561] border-[#fbc9ce]",
    Draft: "bg-[#f1f4f9] text-[#6e7d94] border-[#dde3ee]",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-[#e2e8f2] bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#edf1f8] px-6 py-4 bg-[#fbfcfe]">
          <div className="flex items-center gap-3">
            <span className="rounded-xl bg-[#2854cb]/10 px-3 py-1 font-mono text-xs font-black text-[#2854cb]">
              {property.id}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-extrabold text-[#19273f]">
                {property.title}
              </h2>
              <div className="flex items-center gap-2 text-xs text-[#8292aa]">
                <MapPin size={12} className="text-[#a1b0c6]" />
                <span>
                  {property.locality}, {property.city}
                </span>
                <span>•</span>
                <span className="font-semibold text-[#324564]">{property.type}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold ${
                statusColors[property.status]
              }`}
            >
              {property.status}
            </span>

            {property.status === "Pending" && (
              <span className="hidden sm:inline text-xs font-semibold text-[#087ed9]">{verifyCountdown(property.submittedAt, now)}</span>
            )}

            <button
              type="button"
              onClick={() => onEdit(property)}
              className="rounded-xl border border-[#e2e8f2] p-2 text-[#5a6a82] hover:bg-[#f6f8fb] hover:text-[#182740]"
              title="Edit property details"
            >
              <Edit size={16} />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#e2e8f2] p-2 text-[#5a6a82] hover:bg-[#f6f8fb] hover:text-[#182740]"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Rejection notice banner if status is Rejected */}
        {property.status === "Rejected" && (
          <div className="border-b border-[#fee2e2] bg-[#fef2f2] px-6 py-3">
            <div className="flex items-start gap-2.5 text-xs text-[#991b1b]">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#dc2626]" />
              <div>
                <span className="font-bold">
                  Listing Rejected ({property.rejectionCategory || "Compliance"}):
                </span>{" "}
                {property.rejectionReason}
              </div>
            </div>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex overflow-x-auto border-b border-[#eef2f7] bg-white px-6">
          {[
            { id: "overview", label: "Overview & Specs", icon: Building },
            { id: "documents", label: "Legal & RERA", icon: FileText, count: property.documents?.length },
            { id: "owner", label: "Owner", icon: User },
            { id: "checklist", label: "Verification Checklist", icon: ShieldCheck },
            { id: "audit", label: "Audit Log", icon: History, count: property.auditLog?.length },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold transition-all ${
                  isActive
                    ? "border-[#2854cb] text-[#2854cb]"
                    : "border-transparent text-[#7d8ca4] hover:text-[#233550]"
                }`}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className="rounded-full bg-[#f0f3f8] px-1.5 py-0.2 text-[10px] text-[#6d7c92]">
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body / Tab Content (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Image Gallery */}
              <div className="space-y-3">
                <div className="relative h-64 sm:h-80 w-full overflow-hidden rounded-2xl border border-[#e2e8f2] bg-slate-100">
                  <img
                    src={images[selectedImageIndex] || images[0]}
                    alt={property.title}
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1 text-[11px] font-bold text-white backdrop-blur-md">
                    <span>
                      Photo {selectedImageIndex + 1} of {images.length}
                    </span>
                  </div>

                  {/* Badges on image */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    {property.featured && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[#f59e0b] px-2.5 py-1 text-[10px] font-extrabold text-white shadow-md">
                        <Sparkles size={12} /> FEATURED
                      </span>
                    )}
                    {property.verifiedBadge && (
                      <span className="inline-flex items-center gap-1 rounded-lg bg-[#10b981] px-2.5 py-1 text-[10px] font-extrabold text-white shadow-md">
                        <ShieldCheck size={12} /> RESTAMP VERIFIED
                      </span>
                    )}
                  </div>
                </div>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {images.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIndex(idx)}
                        className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                          selectedImageIndex === idx
                            ? "border-[#2854cb] shadow-md ring-2 ring-[#2854cb]/20"
                            : "border-transparent opacity-70 hover:opacity-100"
                        }`}
                      >
                        <img src={img} alt="thumbnail" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Price & Primary Details Card */}
              <div className="grid grid-cols-2 gap-4 rounded-2xl border border-[#e8ecf4] bg-[#f9fbfe] p-5 sm:grid-cols-4">
                <div>
                  <span className="text-[11px] font-bold text-[#8797ae] uppercase">Asking Price</span>
                  <div className="mt-1 text-xl font-extrabold text-[#19273f]">
                    {formatPrice(property.price)}
                  </div>
                  <div className="text-[11px] text-[#8797ae]">
                    ₹{(property.price / (property.carpetAreaSqFt || 1000)).toFixed(0)} / sq.ft
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#8797ae] uppercase">Carpet Area</span>
                  <div className="mt-1 text-xl font-extrabold text-[#19273f]">
                    {property.carpetAreaSqFt} <span className="text-xs font-semibold">sq.ft</span>
                  </div>
                  <div className="text-[11px] text-[#8797ae]">
                    Super: {property.superBuiltUpAreaSqFt || property.carpetAreaSqFt * 1.2} sq.ft
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#8797ae] uppercase">Configuration</span>
                  <div className="mt-1 text-xl font-extrabold text-[#19273f]">
                    {property.bhk > 0 ? `${property.bhk} BHK` : property.type}
                  </div>
                  <div className="text-[11px] text-[#8797ae]">
                    {property.bathrooms} Baths · {property.balconies} Balconies
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#8797ae] uppercase">Possession</span>
                  <div className="mt-1 text-base font-extrabold text-[#19273f]">
                    {property.possessionStatus}
                  </div>
                  <div className="text-[11px] text-[#8797ae]">
                    {property.possessionDate || "Immediate"}
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#263752]">
                  Description
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-[#5c6e88]">
                  {property.description}
                </p>
              </div>

              {/* Detailed Specs Grid */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#263752] mb-3">
                  Property Specifications
                </h3>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 rounded-2xl border border-[#edf1f8] p-4 bg-white">
                  <div>
                    <span className="text-[11px] text-[#8c9cb2]">Furnishing</span>
                    <div className="text-xs font-bold text-[#24354f]">{property.furnishing}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#8c9cb2]">Floor Level</span>
                    <div className="text-xs font-bold text-[#24354f]">{property.floor}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#8c9cb2]">Facing Direction</span>
                    <div className="text-xs font-bold text-[#24354f]">{property.facing}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#8c9cb2]">Reserved Parking</span>
                    <div className="text-xs font-bold text-[#24354f]">{property.parking}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#8c9cb2]">Age of Property</span>
                    <div className="text-xs font-bold text-[#24354f]">{property.ageOfProperty}</div>
                  </div>
                  <div>
                    <span className="text-[11px] text-[#8c9cb2]">Monthly Maintenance</span>
                    <div className="text-xs font-bold text-[#24354f]">
                      ₹{property.maintenanceFeeMonthly || 0} / month
                    </div>
                  </div>
                  <div className="col-span-2 sm:col-span-3 border-t border-[#f0f3f8] pt-2">
                    <span className="text-[11px] text-[#8c9cb2]">Full Address</span>
                    <div className="text-xs font-medium text-[#24354f]">
                      {property.address}, {property.locality}, {property.city},{" "}
                      {property.state} - {property.pincode} ({property.landmark || "N/A"})
                    </div>
                  </div>
                </div>
              </div>

              {/* Amenities */}
              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#263752] mb-3">
                  Amenities & Facilities ({property.amenities?.length || 0})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {property.amenities?.map((amenity) => (
                    <span
                      key={amenity}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-[#e2e8f2] bg-[#f8fafc] px-3 py-1.5 text-xs font-semibold text-[#41536d]"
                    >
                      <CheckCircle2 size={13} className="text-[#10b981]" />
                      {amenity}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "documents" && (
            <div className="space-y-5">
              <div className="flex items-center justify-between rounded-xl border border-[#e8ecf4] bg-[#f8fbfe] p-4">
                <div>
                  <div className="text-xs font-extrabold text-[#22334f]">
                    RERA Registration & Legal Clearance
                  </div>
                  <div className="mt-0.5 text-xs text-[#7f8fa5]">
                    State Regulatory Authority:{" "}
                    <span className="font-semibold text-[#22334f]">
                      {property.reraId || "Application in progress"}
                    </span>
                  </div>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-bold ${
                    property.reraVerified
                      ? "bg-[#ecfdf5] text-[#059669]"
                      : "bg-[#fffbeb] text-[#d97706]"
                  }`}
                >
                  {property.reraVerified ? "RERA Verified" : "Verification Pending"}
                </span>
              </div>

              <div>
                <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#263752] mb-3">
                  Submitted Deeds & Certificates ({property.documents?.length || 0})
                </h3>
                <div className="space-y-3">
                  {property.documents?.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-xl border border-[#e8ecf4] p-4 bg-white transition-all hover:border-[#ccd7ea]"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eef4ff] text-[#2854cb]">
                          <FileText size={20} />
                        </span>
                        <div>
                          <div className="text-xs font-bold text-[#1f2f4a]">{doc.title}</div>
                          <div className="mt-0.5 text-[11px] text-[#8697ae]">
                            {doc.type} · {doc.fileSize} · Uploaded on {doc.uploadedAt}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                            doc.status === "Verified"
                              ? "bg-[#ecfdf5] text-[#059669]"
                              : doc.status === "Rejected"
                              ? "bg-[#fef2f2] text-[#dc2626]"
                              : "bg-[#fffbeb] text-[#d97706]"
                          }`}
                        >
                          {doc.status}
                        </span>
                        <button
                          type="button"
                          onClick={() => showToast(`Opening preview for ${doc.title}...`, "info")}
                          className="rounded-lg border border-[#e2e8f2] p-1.5 text-[#6c7c94] hover:bg-[#f6f8fb] hover:text-[#182740]"
                          title="Preview Document"
                        >
                          <ExternalLink size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => showToast(`Downloaded ${doc.title}`, "success")}
                          className="rounded-lg border border-[#e2e8f2] p-1.5 text-[#6c7c94] hover:bg-[#f6f8fb] hover:text-[#182740]"
                          title="Download Document"
                        >
                          <Download size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "owner" && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-[#e8ecf4] bg-[#fbfcfe] p-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2854cb] text-lg font-black text-white shadow-md">
                    {property.owner.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-extrabold text-[#19273f]">
                        {property.owner.name}
                      </h3>
                    </div>
                    <div className="mt-1 text-xs text-[#8090a7]">
                      {property.owner.accountType} · Member since {property.owner.joinedDate}
                    </div>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3 border-t border-[#edf1f8] pt-4">
                      <div>
                        <span className="text-[11px] text-[#8c9cb2]">Phone Number</span>
                        <div className="text-xs font-bold text-[#21314b]">
                          {property.owner.phone}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#8c9cb2]">Email Address</span>
                        <div className="text-xs font-bold text-[#21314b]">
                          {property.owner.email}
                        </div>
                      </div>
                      <div>
                        <span className="text-[11px] text-[#8c9cb2]">Active Listings</span>
                        <div className="text-xs font-bold text-[#21314b]">
                          {property.owner.totalListings} properties
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === "checklist" && (
            <div className="space-y-4">
              <div className="text-xs text-[#78889f]">
                Admin verification checklist for compliance with real estate regulatory standards.
                Items marked here reflect audit state.
              </div>
              <div className="space-y-2.5 rounded-2xl border border-[#e8ecf4] p-4 bg-white">
                {[
                  {
                    key: "legalDocumentsVerified" as const,
                    label: "Title Deeds & Encumbrance Verified",
                    desc: "30-year non-encumbrance certificate and sale deed authenticity confirmed.",
                  },
                  {
                    key: "pricingValidated" as const,
                    label: "Pricing Validated Against Guideline Value",
                    desc: "Quoted price aligns with local registrar and prevailing market square foot rates.",
                  },
                  {
                    key: "physicalInspectionDone" as const,
                    label: "Physical / Ground Inspection Completed",
                    desc: "Property boundary, road access, and physical condition visually audited.",
                  },
                  {
                    key: "highResolutionPhotos" as const,
                    label: "High Resolution Photos & Media Audited",
                    desc: "Authentic, clear photos with correct orientation and no watermarks.",
                  },
                  {
                    key: "ownerIdentityConfirmed" as const,
                    label: "Owner Aadhaar / PAN Verification Matches",
                    desc: "Name and government identification align directly with registered title deed.",
                  },
                ].map((item) => {
                  const isChecked = !!property.adminChecklist?.[item.key];
                  return (
                    <label
                      key={item.key}
                      className="flex items-start gap-3 rounded-xl border border-[#edf1f8] p-3 hover:bg-[#fafcff] cursor-pointer transition-colors"
                    >
                      <button
                        type="button"
                        onClick={() => updateChecklist(property.id, item.key, !isChecked)}
                        className="mt-0.5 text-[#2854cb]"
                      >
                        {isChecked ? (
                          <CheckSquare size={18} className="text-[#10b981]" />
                        ) : (
                          <Square size={18} className="text-slate-300" />
                        )}
                      </button>
                      <div className="flex-1 text-xs">
                        <span
                          className={`font-bold ${
                            isChecked ? "text-[#1d2d46]" : "text-[#62738b]"
                          }`}
                        >
                          {item.label}
                        </span>
                        <p className="mt-0.5 text-[#8b9cb1]">{item.desc}</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#263752]">
                Action Timeline & History
              </h3>
              <div className="space-y-3">
                {property.auditLog?.map((log, idx) => (
                  <div
                    key={log.id || idx}
                    className="flex items-start gap-3 rounded-xl border border-[#edf1f8] bg-[#fcfdfe] p-3.5"
                  >
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#eef4ff] text-[#2854cb]">
                      <Clock size={15} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1f2e48]">{log.action}</span>
                        <span className="text-[10px] text-[#93a2b7]">{log.timestamp}</span>
                      </div>
                      <div className="mt-0.5 text-[11px] text-[#718299]">
                        by <span className="font-semibold text-[#324564]">{log.actor}</span> (
                        {log.role})
                      </div>
                      {log.notes && (
                        <p className="mt-1 text-xs text-[#52637b] rounded-lg bg-white border border-[#edf1f8] p-2">
                          {log.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex flex-wrap items-center justify-between border-t border-[#edf1f8] px-6 py-4 bg-[#fbfcfe]">
          <div className="flex items-center gap-4 text-xs">
            <button
              type="button"
              onClick={() => toggleFeatured(property.id)}
              className={`flex items-center gap-1.5 font-bold transition-colors ${
                property.featured ? "text-[#f59e0b]" : "text-[#8393aa] hover:text-[#233550]"
              }`}
            >
              <Sparkles size={14} />
              <span>{property.featured ? "Featured on Home" : "Mark as Featured"}</span>
            </button>
            <button
              type="button"
              onClick={() => toggleVerified(property.id)}
              className={`flex items-center gap-1.5 font-bold transition-colors ${
                property.verifiedBadge ? "text-[#10b981]" : "text-[#8393aa] hover:text-[#233550]"
              }`}
            >
              <ShieldCheck size={14} />
              <span>{property.verifiedBadge ? "Verified Badge Active" : "Add Verified Badge"}</span>
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            {property.status === "Active" ? (
              <button
                type="button"
                onClick={() => updateProperty(property.id, { status: "Draft" })}
                className="rounded-xl border border-[#fee2e2] bg-[#fef2f2] px-4 py-2 text-xs font-bold text-[#dc2626] hover:bg-[#fee2e2] transition-colors"
              >
                Unpublish
              </button>
            ) : (
              <button
                type="button"
                onClick={() => updateProperty(property.id, { status: "Active" })}
                className="rounded-xl bg-[#2854cb] px-5 py-2 text-xs font-bold text-white hover:bg-[#1f45ae] transition-colors"
              >
                Publish now
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#dbe2ee] px-4 py-2 text-xs font-semibold text-[#576882] hover:bg-[#f8fafc]"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
