"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon,
  FileText,
  Building,
  MessageSquare,
  History,
  Phone,
  Mail,
  MapPin,
  Clock,
  Edit,
  Send,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
} from "lucide-react";
import { User } from "@/types/user";
import { useUserStore } from "@/context/user-context";
import { usePropertyStore } from "@/context/property-context";

interface UserDetailModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onSuspend: (user: User) => void;
  onEdit: (user: User) => void;
}

export function UserDetailModal({
  user,
  isOpen,
  onClose,
  onSuspend,
  onEdit,
}: UserDetailModalProps) {
  const [activeTab, setActiveTab] = useState<
    "overview" | "activity" | "notes" | "audit"
  >("overview");
  const [newNote, setNewNote] = useState("");

  const { addAdminNote } = useUserStore();
  const { properties } = usePropertyStore();

  if (!isOpen || !user) return null;

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNote.trim()) return;
    addAdminNote(user.id, newNote.trim(), "RESTAMP Admin");
    setNewNote("");
  };

  const statusColors = {
    Active: "bg-[#e7f8ee] text-[#199864] border-[#b4eed3]",
    Suspended: "bg-[#ffeaeb] text-[#d45561] border-[#fbc9ce]",
    Inactive: "bg-[#f1f4f9] text-[#6e7d94] border-[#dde3ee]",
  };

  // Find properties belonging to this owner
  const ownerProperties = properties.filter((p) =>
    user.listedPropertyIds?.includes(p.id) || p.owner?.name.toLowerCase() === user.name.toLowerCase()
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col rounded-3xl border border-[#e2e8f2] bg-white shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#edf1f8] px-6 py-4 bg-[#fbfcfe]">
          <div className="flex items-center gap-3">
            <div
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-base font-black text-[#2854cb] shadow-sm"
              style={{ background: user.tint }}
            >
              {user.initials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="truncate text-base font-extrabold text-[#19273f]">
                  {user.name}
                </h2>
                <span className="font-mono text-xs font-bold text-[#8697ae]">{user.id}</span>
                <span
                  className={`rounded-full px-2.5 py-0.5 text-[10px] font-extrabold capitalize ${
                    user.role !== "buyer" ? "bg-[#f5f3ff] text-[#7c3aed]" : "bg-[#eff6ff] text-[#2563eb]"
                  }`}
                >
                  {user.role}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#8292aa]">
                <MapPin size={12} className="text-[#a1b0c6]" />
                <span>{user.city}, {user.state}</span>
                <span>•</span>
                <span>Joined {user.joinedDate}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`rounded-full border px-3 py-1 text-xs font-bold ${
                statusColors[user.status]
              }`}
            >
              {user.status}
            </span>

            <button
              type="button"
              onClick={() => onEdit(user)}
              className="rounded-xl border border-[#e2e8f2] p-2 text-[#5a6a82] hover:bg-[#f6f8fb] hover:text-[#182740]"
              title="Edit User Profile"
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

        {/* Suspension Banner */}
        {user.status === "Suspended" && (
          <div className="border-b border-[#fee2e2] bg-[#fef2f2] px-6 py-3">
            <div className="flex items-start gap-2.5 text-xs text-[#991b1b]">
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-[#dc2626]" />
              <div>
                <span className="font-bold">Account Suspended:</span>{" "}
                {user.suspensionReason || "Administrative hold applied."}
              </div>
            </div>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex overflow-x-auto border-b border-[#eef2f7] bg-white px-6">
          {[
            { id: "overview", label: "Profile Overview", icon: UserIcon },
            {
              id: "activity",
              label: user.role !== "buyer" ? "Listed Properties" : "Enquiries & Tours",
              icon: user.role !== "buyer" ? Building : MessageSquare,
              count: user.role !== "buyer" ? ownerProperties.length : user.enquiries?.length,
            },
            { id: "notes", label: "Admin Notes", icon: FileText, count: user.adminNotes?.length },
            { id: "audit", label: "Audit Log", icon: History, count: user.auditLog?.length },
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

        {/* Scrollable Tab Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === "overview" && (
            <div className="space-y-6">
              {/* Contact Information Card */}
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 rounded-2xl border border-[#e8ecf4] bg-[#fbfcfe] p-5">
                <div>
                  <span className="text-[11px] font-bold text-[#8697ae] uppercase">Email</span>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#1f2e48]">
                    <Mail size={13} className="text-[#3b82f6]" />
                    <span>{user.email}</span>
                  </div>
                  <div className="mt-1">
                    {user.emailVerified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#10b981]">
                        <CheckCircle2 size={11} /> Verified
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#f59e0b]">Unverified</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#8697ae] uppercase">Phone</span>
                  <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-[#1f2e48]">
                    <Phone size={13} className="text-[#3b82f6]" />
                    <span>{user.phone}</span>
                  </div>
                  <div className="mt-1">
                    {user.phoneVerified ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-[#10b981]">
                        <CheckCircle2 size={11} /> OTP Verified
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#f59e0b]">Unverified</span>
                    )}
                  </div>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-[#8697ae] uppercase">Activity</span>
                  <div className="mt-1 text-[10px] text-[#8697ae]">
                    Last active: {user.lastActive}
                  </div>
                </div>
              </div>

              {/* Specific to Owner */}
              {user.role !== "buyer" && (
                <div className="rounded-2xl border border-[#edf1f8] p-5 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#263752]">
                    Seller / Listing Profile
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <span className="text-[11px] text-[#8c9cb2]">Account Type</span>
                      <div className="text-xs font-bold text-[#20314b]">
                        {user.ownerType || "Individual Homeowner"}
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#8c9cb2]">Agency / Developer</span>
                      <div className="text-xs font-bold text-[#20314b]">
                        {user.companyName || "Direct Owner"}
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#8c9cb2]">RERA Registration</span>
                      <div className="text-xs font-bold text-[#20314b]">
                        {user.reraRegistrationNumber || "N/A"}
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#8c9cb2]">Marketplace Listings</span>
                      <div className="text-xs font-bold text-[#20314b]">
                        {ownerProperties.length} properties
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Specific to Buyer */}
              {user.role === "buyer" && user.buyerPreferences && (
                <div className="rounded-2xl border border-[#edf1f8] p-5 space-y-4">
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#263752]">
                    Buyer Property Preferences
                  </h3>
                  <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                    <div>
                      <span className="text-[11px] text-[#8c9cb2]">Budget Range</span>
                      <div className="text-xs font-bold text-[#20314b]">
                        ₹{(user.buyerPreferences.budgetMin / 100000).toFixed(0)}L - ₹
                        {(user.buyerPreferences.budgetMax / 100000).toFixed(0)}L
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#8c9cb2]">Purchase Purpose</span>
                      <div className="text-xs font-bold text-[#20314b]">
                        {user.buyerPreferences.purpose}
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#8c9cb2]">Timeline</span>
                      <div className="text-xs font-bold text-[#20314b]">
                        {user.buyerPreferences.timeline}
                      </div>
                    </div>
                    <div>
                      <span className="text-[11px] text-[#8c9cb2]">Preferred BHK</span>
                      <div className="text-xs font-bold text-[#20314b]">
                        {user.buyerPreferences.preferredBhk.join(", ")}
                      </div>
                    </div>
                    <div className="col-span-2 sm:col-span-4 border-t border-[#f0f3f8] pt-3">
                      <span className="text-[11px] text-[#8c9cb2]">Target Localities</span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {user.buyerPreferences.preferredLocalities.map((loc) => (
                          <span
                            key={loc}
                            className="rounded-lg border border-[#e2e8f2] bg-[#f8fafc] px-2.5 py-1 text-xs font-semibold text-[#324564]"
                          >
                            {loc}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-4">
              {user.role !== "buyer" ? (
                <>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#263752]">
                    Listed Properties ({ownerProperties.length})
                  </h3>
                  {ownerProperties.length > 0 ? (
                    <div className="space-y-3">
                      {ownerProperties.map((prop) => (
                        <div
                          key={prop.id}
                          className="flex items-center justify-between rounded-xl border border-[#e8ecf4] p-4 bg-white"
                        >
                          <div className="flex items-center gap-3">
                            {prop.images?.[0] ? (
                              <img
                                src={prop.images[0]}
                                alt={prop.title}
                                className="h-12 w-14 rounded-lg object-cover"
                              />
                            ) : (
                              <div className="flex h-12 w-14 items-center justify-center rounded-lg bg-[#eef4ff] text-xs font-black text-[#2854cb]">
                                {prop.initials}
                              </div>
                            )}
                            <div>
                              <div className="text-xs font-bold text-[#1f2e48]">{prop.title}</div>
                              <div className="mt-0.5 text-[11px] text-[#8596ac]">
                                {prop.locality}, {prop.city} · {prop.type} · ₹
                                {(prop.price / 100000).toFixed(0)}L
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-3">
                            <span
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                                prop.status === "Active"
                                  ? "bg-[#e7f8ee] text-[#199864]"
                                  : prop.status === "Pending"
                                  ? "bg-[#fff5e3] text-[#bf811a]"
                                  : "bg-[#ffeaeb] text-[#d45561]"
                              }`}
                            >
                              {prop.status}
                            </span>
                            <Link
                              href={`/admin-dashboard/properties?id=${prop.id}`}
                              className="rounded-lg border border-[#e2e8f2] px-2.5 py-1 text-xs font-bold text-[#2854cb] hover:bg-[#eff4ff]"
                            >
                              Review Property
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#f0f3f8] bg-[#fafbfc] p-8 text-center text-xs text-[#8c9cb2]">
                      No properties listed yet.
                    </div>
                  )}
                </>
              ) : (
                <>
                  <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#263752]">
                    Property Inquiries & Tour Requests ({user.enquiries?.length || 0})
                  </h3>
                  {user.enquiries && user.enquiries.length > 0 ? (
                    <div className="space-y-3">
                      {user.enquiries.map((enq) => (
                        <div
                          key={enq.id}
                          className="rounded-xl border border-[#e8ecf4] p-4 bg-white space-y-2"
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="font-mono text-[10px] text-[#2854cb] font-bold">
                                {enq.propertyId}
                              </span>
                              <div className="text-xs font-bold text-[#1f2e48]">
                                {enq.propertyTitle}
                              </div>
                              <div className="text-[11px] text-[#8090a6]">
                                {enq.locality} · ₹{(enq.price / 100000).toFixed(0)}L
                              </div>
                            </div>
                            <span className="rounded-full bg-[#eef4ff] px-2.5 py-0.5 text-[10px] font-bold text-[#2854cb]">
                              {enq.type}
                            </span>
                          </div>
                          <p className="rounded-lg bg-[#f9fafc] p-2.5 text-xs text-[#4b5b75]">
                            &ldquo;{enq.message}&rdquo;
                          </p>
                          <div className="flex items-center justify-between text-[11px] text-[#93a2b7] pt-1">
                            <span>Status: {enq.status}</span>
                            <span>{enq.date}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-[#f0f3f8] bg-[#fafbfc] p-8 text-center text-xs text-[#8c9cb2]">
                      No inquiries or tours submitted yet.
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "notes" && (
            <div className="space-y-4">
              <form onSubmit={handleAddNote} className="space-y-2">
                <label className="block text-xs font-bold text-[#344560]">
                  Add Internal Note (Admin only)
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    placeholder="Enter private admin remark, call notes, or fraud alert..."
                    className="flex-1 rounded-xl border border-[#dce3ee] bg-[#fafbfd] px-3.5 py-2 text-xs font-medium text-[#20314b] outline-none focus:border-[#2854cb] focus:bg-white"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 rounded-xl bg-[#2854cb] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1f45ae]"
                  >
                    <Send size={13} />
                    <span>Post</span>
                  </button>
                </div>
              </form>

              <div className="space-y-3 pt-3">
                {user.adminNotes && user.adminNotes.length > 0 ? (
                  user.adminNotes.map((note) => (
                    <div
                      key={note.id}
                      className="rounded-xl border border-[#e8ecf4] bg-[#fbfcfe] p-3.5 space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-[#2854cb]">{note.adminName}</span>
                        <span className="text-[#9aa7bb]">{note.timestamp}</span>
                      </div>
                      <p className="text-xs text-[#3f5068] leading-relaxed">{note.content}</p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-[#f0f3f8] bg-[#fafbfc] p-6 text-center text-xs text-[#8c9cb2]">
                    No internal notes added yet.
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "audit" && (
            <div className="space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#263752]">
                Account Audit Trail
              </h3>
              <div className="space-y-3">
                {user.auditLog && user.auditLog.length > 0 ? (
                  user.auditLog.map((log) => (
                    <div
                      key={log.id}
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
                          by <span className="font-semibold text-[#324564]">{log.actor}</span>
                        </div>
                        {log.details && (
                          <p className="mt-1 text-xs text-[#52637b] rounded-lg bg-white border border-[#edf1f8] p-2">
                            {log.details}
                          </p>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-xl border border-[#f0f3f8] bg-[#fafbfc] p-6 text-center text-xs text-[#8c9cb2]">
                    No audit records available.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#edf1f8] px-6 py-4 bg-[#fbfcfe]">
          <button
            type="button"
            onClick={() => onSuspend(user)}
            className={`text-xs font-bold transition-colors ${
              user.status === "Suspended"
                ? "text-[#10b981] hover:underline"
                : "text-[#dc2626] hover:underline"
            }`}
          >
            {user.status === "Suspended" ? "Restore Account" : "Suspend Account"}
          </button>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => onEdit(user)}
              className="rounded-xl border border-[#dbe2ee] px-4 py-2 text-xs font-semibold text-[#576882] hover:bg-[#f8fafc]"
            >
              Edit Profile
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl bg-[#2854cb] px-5 py-2 text-xs font-bold text-white hover:bg-[#1f45ae] transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
