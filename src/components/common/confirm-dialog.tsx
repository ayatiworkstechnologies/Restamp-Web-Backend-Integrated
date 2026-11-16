"use client";

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, HelpCircle, Loader2 } from "lucide-react";

export type ConfirmTone = "danger" | "default";

export interface ConfirmCardProps {
  open: boolean;
  title: string;
  body?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
  busy?: boolean;
  /** Extra content between the message and the buttons (e.g. a reason field). */
  children?: React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Centered confirmation popup used site-wide for delete / destructive actions:
 * ringed icon, title, short message, then Cancel + action buttons side by side.
 */
export function ConfirmCard({
  open,
  title,
  body,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  tone = "danger",
  busy,
  children,
  onConfirm,
  onCancel,
}: ConfirmCardProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    cancelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !busy) onCancel();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, busy, onCancel]);

  if (!open || !mounted) return null;
  const danger = tone === "danger";
  const Icon = danger ? AlertCircle : HelpCircle;

  return createPortal(
    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/45 backdrop-blur-[2px]" onClick={() => !busy && onCancel()} aria-hidden />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        className="relative w-full max-w-[420px] rounded-[22px] bg-white px-6 pb-6 pt-7 text-center shadow-[0_24px_60px_rgba(15,23,42,0.25)] sm:px-8"
      >
        <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full ${danger ? "bg-red-50" : "bg-[#eef3fc]"}`}>
          <div className={`flex h-11 w-11 items-center justify-center rounded-full ${danger ? "bg-red-100 text-red-500" : "bg-[#dbe6fb] text-[#1B459B]"}`}>
            <Icon size={24} strokeWidth={2} />
          </div>
        </div>
        <h2 id="confirm-title" className="mt-4 text-[20px] font-bold text-slate-900">{title}</h2>
        {body && <div className="mx-auto mt-1.5 max-w-[320px] text-[14px] leading-relaxed text-slate-500">{body}</div>}
        {children && <div className="mt-4 text-left">{children}</div>}
        <div className="mt-7 grid grid-cols-2 gap-3">
          <button
            ref={cancelRef}
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="h-12 rounded-xl bg-slate-100 text-[15px] font-semibold text-slate-600 transition-colors hover:bg-slate-200 disabled:opacity-60"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`inline-flex h-12 items-center justify-center gap-2 rounded-xl text-[15px] font-semibold text-white transition-colors disabled:opacity-70 ${
              danger ? "bg-[#e05252] hover:bg-[#cc3f3f]" : "bg-[#1B459B] hover:bg-[#153a85]"
            }`}
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}

/* ---------- Imperative API: `if (await confirmDialog({...})) doDelete()` ---------- */

type Request = Omit<ConfirmCardProps, "open" | "onConfirm" | "onCancel" | "busy" | "children"> & {
  resolve: (ok: boolean) => void;
};
let push: ((r: Request) => void) | null = null;

export function confirmDialog(opts: Omit<Request, "resolve">): Promise<boolean> {
  return new Promise((resolve) => {
    if (!push) {
      // Host not mounted (should not happen): fall back to the browser dialog.
      resolve(window.confirm(opts.title));
      return;
    }
    push({ ...opts, resolve });
  });
}

/** Mount once in the root layout. */
export function ConfirmDialogHost() {
  const [req, setReq] = useState<Request | null>(null);
  useEffect(() => {
    push = (r) => setReq(r);
    return () => {
      push = null;
    };
  }, []);
  const close = (ok: boolean) => {
    req?.resolve(ok);
    setReq(null);
  };
  return (
    <ConfirmCard
      open={!!req}
      title={req?.title ?? ""}
      body={req?.body}
      confirmLabel={req?.confirmLabel}
      cancelLabel={req?.cancelLabel}
      tone={req?.tone}
      onConfirm={() => close(true)}
      onCancel={() => close(false)}
    />
  );
}
