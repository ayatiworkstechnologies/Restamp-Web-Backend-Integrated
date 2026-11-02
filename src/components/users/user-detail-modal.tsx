"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  ShieldCheck,
  ShieldAlert,
  User as UserIcon,
  FileText,
  Building,
  Phone,
  Clock,
  Loader2,
  History,
} from "lucide-react";
import { AdminUser, useUserStore } from "@/context/user-context";
import { usePropertyStore } from "@/context/property-context";
import { useAdminAuth } from "@/context/admin-auth-context";
import { listAdminAuditLogs, type AdminAuditLog, type AdminUserDetail } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { initialsOf, tintOf } from "@/components/users/user-table";

interface UserDetailModalProps {
  user: AdminUser | null;
  isOpen: boolean;
  onClose: () => void;
  onSuspend: (user: AdminUser) => void;
}

const formatDate = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }) : "—";

const PROVIDER_LABEL: Record<string, string> = { phone: "Mobile OTP", google: "Google" };

/**
 * Account detail from GET /admin/users/{id} (full phone shown here only),
 * the user's listings from the loaded admin listings, and admin actions on
 * this account from the audit log (when the role may read it). KYC
 * documents and admin notes have no backend and are shown as unavailable.
 */
export function UserDetailModal({ user, isOpen, onClose, onSuspend }: UserDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "kyc" | "activity" | "audit">("overview");
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [logs, setLogs] = useState<AdminAuditLog[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const { getDetail } = useUserStore();
  const { properties } = usePropertyStore();
  const { can } = useAdminAuth();
  const userId = user?.userId;
  const status = user?.status;
  const canAudit = can("settings.view_audit_logs");

  useEffect(() => {
    if (!isOpen || !userId) return;
    let cancelled = false;
    setDetail(null);
    setError("");
    setLoading(true);
    getDetail(userId)
      .then((d) => {
        if (!cancelled) setDetail(d);
      })
      .catch((e) => {
        if (!cancelled) setError(errorMessage(e, "Could not load this account."));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, userId, status, getDetail]);

  useEffect(() => {
    if (!isOpen || !userId || !canAudit) return;
    let cancelled = false;
    // Admin actions on accounts are logged with entity "user"; keep the ones about this user.
    listAdminAuditLogs({ entity: "user" }, 1, 100)
      .then((res) => {
        if (!cancelled) setLogs(res.items.filter((l) => (l.after?.user_id ?? l.before?.user_id) === userId));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [isOpen, userId, status, canAudit]);

  if (!isOpen || !user) return null;

  const ownerProperties = properties.filter((p) => p.ownerId === user.userId);
  const canSuspend = can("users.suspend") && user.status !== "Inactive";

  const statusColors = {
    Active: "bg-[#e7f8ee] text-[#199864] border-[#b4eed3]",
    "Pending KYC": "bg-[#fff5e3] text-[#bf811a] border-[#fde1ad]",
    Suspended: "bg-[#ffeaeb] text-[#d45561] border-[#fbc9ce]",
    Inactive: "bg-[#f1f4f9] text-[#6e7d94] border-[#dde3ee]",
  };

  const activity = detail?.activity;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
      <div className="relative flex max-h-[92vh] w-full max-w-3xl flex-col rounded-3xl border border-[#e2e8f2] bg-white shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-[#edf1f8] px-6 py-4 bg-[#fbfcfe]">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-black text-[#2854cb]"
              style={{ background: tintOf(user.userId) }}
            >
              {initialsOf(user.name)}
            </div>
            <div className="min-w-0">
              <h2 className="truncate text-base font-extrabold text-[#19273f]">{detail?.display_name || user.name}</h2>
              <div className="flex items-center gap-2 text-xs text-[#8292aa]">
                <span className="font-mono text-[#2854cb]">#{user.id}</span>
                <span>•</span>
                <span>{user.roleLabel}</span>
                {user.adminRole && (
                  <>
                    <span>•</span>
                    <span className="font-semibold text-[#2854cb]">Admin: {user.adminRole.replace(/_/g, " ")}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-bold ${statusColors[user.status]}`}>{user.statusLabel}</span>
            {canSuspend && (
              <button
                type="button"
                onClick={() => onSuspend(user)}
                className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold text-white shadow-sm ${
                  user.status === "Suspended" ? "bg-[#10b981] hover:bg-[#059669]" : "bg-[#ef4444] hover:bg-[#dc2626]"
                }`}
              >
                {user.status === "Suspended" ? <ShieldCheck size={14} /> : <ShieldAlert size={14} />}
                <span>{user.status === "Suspended" ? "Reactivate" : "Suspend"}</span>
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

        <div className="flex overflow-x-auto border-b border-[#eef2f7] bg-white px-6">
          {[
            { id: "overview", label: "Profile", icon: UserIcon },
            { id: "activity", label: "Listings", icon: Building, count: ownerProperties.length },
            { id: "kyc", label: "KYC", icon: FileText },
            { id: "audit", label: "Admin History", icon: History, count: canAudit ? logs.length : undefined },
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

        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {loading && (
            <div className="flex items-center gap-2 text-sm text-[#7d8ca4]">
              <Loader2 size={16} className="animate-spin text-[#2854cb]" /> Loading account…
            </div>
          )}
          {error && (
            <div className="rounded-xl border border-[#fee2e2] bg-[#fef2f2] p-3 text-xs text-[#991b1b]" role="alert">
              {error}
            </div>
          )}

          {activeTab === "overview" && detail && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-[#eef2f7] p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#9aa7bb]">
                    <Phone size={12} /> Mobile
                  </div>
                  <div className="mt-0.5 text-sm font-bold text-[#23334e]">{detail.phone || "Not linked"}</div>
                </div>
                <div className="rounded-xl border border-[#eef2f7] p-3">
                  <div className="text-[10px] font-bold uppercase text-[#9aa7bb]">Sign-in methods</div>
                  <div className="mt-0.5 text-sm font-bold text-[#23334e]">
                    {detail.providers.map((p) => PROVIDER_LABEL[p] || p).join(", ") || "—"}
                  </div>
                </div>
                <div className="rounded-xl border border-[#eef2f7] p-3">
                  <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase text-[#9aa7bb]">
                    <Clock size={12} /> Joined
                  </div>
                  <div className="mt-0.5 text-sm font-bold text-[#23334e]">{formatDate(detail.joined_at)}</div>
                </div>
                <div className="rounded-xl border border-[#eef2f7] p-3">
                  <div className="text-[10px] font-bold uppercase text-[#9aa7bb]">Account status</div>
                  <div className="mt-0.5 text-sm font-bold capitalize text-[#23334e]">{detail.status}</div>
                </div>
              </div>

              {activity && (
                <div>
                  <h3 className="mb-2 text-xs font-extrabold uppercase tracking-wider text-[#8392a8]">Platform activity</h3>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                    {[
                      ["Listings", activity.listings_owned],
                      ["Enquiries sent", activity.enquiries_sent],
                      ["Enquiries received", activity.enquiries_received],
                      ["Visits requested", activity.visits_requested],
                      ["Agent locations", activity.broker_covered_locations],
                    ].map(([label, value]) => (
                      <div key={label as string} className="rounded-xl bg-[#f8fafc] p-3 text-center">
                        <div className="text-lg font-extrabold text-[#1a2942]">{value}</div>
                        <div className="text-[10px] font-semibold text-[#8696ab]">{label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {can("enquiries.view") && (
                <Link
                  href={`/admin-dashboard/enquiries?user=${user.userId}`}
                  className="inline-block text-xs font-bold text-[#2854cb] hover:underline"
                >
                  View this user&apos;s enquiries →
                </Link>
              )}
            </div>
          )}

          {activeTab === "activity" && (
            <div className="space-y-2">
              {ownerProperties.length === 0 ? (
                <p className="text-sm text-[#7d8ca4]">No listings owned by this account.</p>
              ) : (
                ownerProperties.map((p) => (
                  <Link
                    key={p.id}
                    href={`/admin-dashboard/properties?id=${p.id}`}
                    className="flex items-center justify-between rounded-xl border border-[#eef2f7] p-3 text-xs hover:bg-[#f8fafc]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-bold text-[#23334e]">{p.title}</span>
                      <span className="text-[#8696ab]">
                        {p.locality} · {p.priceDisplay}
                      </span>
                    </span>
                    <span className="shrink-0 rounded-full bg-[#f0f3f8] px-2 py-0.5 font-bold text-[#4a5b75]">{p.statusLabel}</span>
                  </Link>
                ))
              )}
            </div>
          )}

          {activeTab === "kyc" && (
            <div className="rounded-2xl border border-dashed border-[#dce3ee] p-8 text-center text-sm text-[#7d8ca4]">
              KYC documents and verification are not available yet. The backend does not collect or store identity documents.
            </div>
          )}

          {activeTab === "audit" && (
            <div className="space-y-2">
              {!canAudit ? (
                <p className="text-sm text-[#7d8ca4]">Your admin role does not include the audit log.</p>
              ) : logs.length === 0 ? (
                <p className="text-sm text-[#7d8ca4]">No admin actions recorded for this account.</p>
              ) : (
                logs.map((l) => (
                  <div key={l.id} className="rounded-xl border border-[#eef2f7] p-3 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-[#23334e]">{l.action === "ADMIN_USER_SUSPENDED" ? "Suspended" : l.action === "ADMIN_USER_REACTIVATED" ? "Reactivated" : l.action}</span>
                      <span className="text-[#93a2b7]">{formatDate(l.created_at)}</span>
                    </div>
                    <p className="mt-1 text-[#5a6a82]">
                      By {l.actor_name || `user #${l.actor_user_id}`}
                      {typeof l.after?.reason === "string" ? ` · ${l.after.reason}` : ""}
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
