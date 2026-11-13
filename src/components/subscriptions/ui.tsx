"use client";

import React, { useEffect, useState } from "react";
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2, X } from "lucide-react";
import type { PaymentVerification, SubscriberRole, SubscriptionStatus, PlanStatus } from "@/types/subscription";
import { ROLE_LABEL } from "@/types/subscription";
import { useAdminAuth } from "@/context/admin-auth-context";
import { canManageBilling, type Actor } from "@/lib/subscription-store";
import { ConfirmCard } from "@/components/common/confirm-dialog";

export const inr = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

export const fmtDate = (iso?: string | null, fallback = "—") =>
  iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : fallback;

export const fmtDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const limitLabel = (n: number | undefined) => (n === undefined ? "—" : n < 0 ? "Unlimited" : String(n));

/** Current admin as an Actor, plus whether they may change billing data. */
export function useActor(): { actor: Actor | null; canManage: boolean } {
  const { admin } = useAdminAuth();
  const actor = admin ? { name: admin.name, role: admin.role } : null;
  return { actor, canManage: canManageBilling(actor) };
}

const pill = "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-extrabold whitespace-nowrap";

const SUB_STYLES: Record<SubscriptionStatus, string> = {
  active: "bg-[#eaf9f0] text-[#1ca569]",
  expiring: "bg-[#fef3c7] text-[#b45309]",
  expired: "bg-slate-100 text-slate-500",
  cancelled: "bg-slate-100 text-slate-500",
  suspended: "bg-red-50 text-red-600",
};
export function SubscriptionBadge({ status }: { status: SubscriptionStatus }) {
  return <span className={`${pill} ${SUB_STYLES[status]} capitalize`}>{status === "expiring" ? "Expiring soon" : status}</span>;
}

const PAY_STYLES: Record<PaymentVerification, string> = {
  verified: "bg-[#eaf9f0] text-[#1ca569]",
  unverified: "bg-[#fef3c7] text-[#b45309]",
  pending: "bg-sky-50 text-[#087ed9]",
  failed: "bg-red-50 text-red-600",
  refunded: "bg-slate-100 text-slate-500",
};
export function PaymentBadge({ status }: { status: PaymentVerification }) {
  return (
    <span
      className={`${pill} ${PAY_STYLES[status]} capitalize`}
      title={status === "unverified" ? "No gateway confirmation exists for this payment" : undefined}
    >
      {status}
    </span>
  );
}

const PLAN_STYLES: Record<PlanStatus, string> = {
  active: "bg-[#eaf9f0] text-[#1ca569]",
  draft: "bg-sky-50 text-[#087ed9]",
  inactive: "bg-[#fef3c7] text-[#b45309]",
  archived: "bg-slate-100 text-slate-500",
};
export function PlanStatusBadge({ status }: { status: PlanStatus }) {
  return <span className={`${pill} ${PLAN_STYLES[status]} capitalize`}>{status}</span>;
}

const ROLE_STYLES: Record<SubscriberRole, string> = {
  buyer: "bg-[#eff6ff] text-[#2563eb]",
  owner: "bg-[#f5f3ff] text-[#7c3aed]",
  agent: "bg-[#ecfeff] text-[#0e7490]",
};
export function RoleBadge({ role }: { role: SubscriberRole }) {
  return <span className={`${pill} ${ROLE_STYLES[role]}`}>{ROLE_LABEL[role]}</span>;
}

export function SeedTag() {
  return (
    <span className={`${pill} bg-slate-100 text-slate-500`} title="Sample record created by the initial data seed">
      Seed
    </span>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[18px] border border-[#e9edf4] bg-white shadow-[0_3px_18px_#15223d06] ${className}`}>{children}</div>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <Inbox size={28} className="text-[#c4cbd6]" />
      <div className="mt-3 text-sm font-bold text-[#24324b]">{title}</div>
      {hint && <div className="mt-1 max-w-sm text-xs text-[#8896aa]">{hint}</div>}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2 p-4" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-11 animate-pulse rounded-xl bg-[#f3f6fb]" />
      ))}
    </div>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn"; children: React.ReactNode }) {
  const styles = tone === "warn" ? "border-amber-200 bg-amber-50 text-amber-900" : "border-sky-200 bg-sky-50 text-slate-700";
  return (
    <div className={`flex gap-2.5 rounded-2xl border px-4 py-3 text-xs leading-relaxed ${styles}`}>
      <AlertTriangle size={15} className="mt-0.5 shrink-0" />
      <div>{children}</div>
    </div>
  );
}

export const PAGE_SIZE = 10;

export function usePaged<T>(items: T[], resetKey: string) {
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [resetKey]);
  const pages = Math.max(1, Math.ceil(items.length / PAGE_SIZE));
  const current = Math.min(page, pages);
  return { page: current, pages, setPage, slice: items.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE), total: items.length };
}

export function Pagination({ page, pages, total, setPage }: { page: number; pages: number; total: number; setPage: (n: number) => void }) {
  if (total === 0) return null;
  const from = (page - 1) * PAGE_SIZE + 1;
  const to = Math.min(total, page * PAGE_SIZE);
  return (
    <div className="flex items-center justify-between border-t border-[#f1f4f9] px-4 py-3 text-xs text-[#8090a6]">
      <span>
        <span className="font-bold text-[#23334d]">{from}–{to}</span> of <span className="font-bold text-[#23334d]">{total}</span>
      </span>
      <div className="flex items-center gap-1">
        <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage(page - 1)} className="rounded-lg border border-[#e2e8f2] p-1.5 disabled:opacity-40">
          <ChevronLeft size={14} />
        </button>
        <span className="px-2 font-semibold">{page} / {pages}</span>
        <button type="button" aria-label="Next page" disabled={page >= pages} onClick={() => setPage(page + 1)} className="rounded-lg border border-[#e2e8f2] p-1.5 disabled:opacity-40">
          <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}

export const inputCls =
  "w-full rounded-xl border border-[#e2e8f2] bg-[#fbfcfe] px-3 py-2 text-xs font-medium text-[#22324d] outline-none transition placeholder:text-[#a1adc0] focus:border-[#087ed9] focus:bg-white";
export const selectCls =
  "rounded-xl border border-[#e2e8f2] bg-[#fbfcfe] px-3 py-2 text-xs font-semibold text-[#22324d] outline-none focus:border-[#087ed9]";
export const btnPrimary =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#087ed9] px-4 py-2 text-xs font-bold text-white shadow-sm shadow-[#087ed9]/25 transition hover:bg-[#066db9] disabled:cursor-not-allowed disabled:opacity-50";
export const btnSecondary =
  "inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#e2e8f2] bg-white px-4 py-2 text-xs font-bold text-[#34445f] transition hover:bg-[#f5f8fd] disabled:cursor-not-allowed disabled:opacity-50";
/** Print actions: solid dark grey. */
export const btnPrint =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#334155] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#1e293b] disabled:cursor-not-allowed disabled:opacity-50";
/** PDF download actions: solid red (the usual PDF colour). */
export const btnPdf =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#dc2626] px-3 py-1.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#b91c1c] disabled:cursor-not-allowed disabled:opacity-50";
export const btnDanger =
  "inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-600 px-4 py-2 text-xs font-bold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50";

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  wide,
  xwide,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  wide?: boolean;
  /** Full-width preview of a website section. */
  xwide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/40 p-0 backdrop-blur-xs sm:items-center sm:p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className={`flex max-h-[92vh] w-full flex-col rounded-t-3xl bg-white shadow-2xl sm:rounded-3xl ${xwide ? "sm:max-w-6xl" : wide ? "sm:max-w-3xl" : "sm:max-w-lg"}`}
      >
        <div className="flex items-center justify-between border-b border-[#eef1f6] px-5 py-4">
          <h2 className="text-sm font-extrabold text-[#1f2e48]">{title}</h2>
          <button type="button" aria-label="Close" onClick={onClose} className="rounded-lg p-1 text-slate-400 hover:bg-slate-100">
            <X size={18} />
          </button>
        </div>
        <div className={`flex-1 overflow-y-auto ${xwide ? "p-0" : "px-5 py-4"}`}>{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-[#eef1f6] px-5 py-3">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * Confirmation for financially significant / destructive actions.
 * Optionally requires a reason, which is written to the audit log.
 */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel,
  danger,
  requireReason,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel: string;
  danger?: boolean;
  requireReason?: boolean;
  onConfirm: (reason: string) => void | Promise<void>;
  onClose: () => void;
}) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    if (open) {
      setReason("");
      setError("");
    }
  }, [open]);
  const submit = async () => {
    if (requireReason && !reason.trim()) {
      setError("Please enter a reason. It is saved to the audit log.");
      return;
    }
    setBusy(true);
    try {
      await onConfirm(reason.trim());
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <ConfirmCard
      open={open}
      title={title}
      body={body}
      confirmLabel={confirmLabel}
      tone={danger ? "danger" : "default"}
      busy={busy}
      onConfirm={submit}
      onCancel={onClose}
    >
      {(requireReason || error) && (
        <div className="space-y-2 text-xs text-[#4b5b74]">
          {requireReason && (
            <label className="block">
              <span className="mb-1 block font-bold text-[#344560]">Reason</span>
              <textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} className={inputCls} />
            </label>
          )}
          {error && <p className="font-semibold text-red-600">{error}</p>}
        </div>
      )}
    </ConfirmCard>
  );
}
