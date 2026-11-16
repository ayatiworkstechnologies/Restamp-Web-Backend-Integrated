"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Loader2, Mail } from "lucide-react";
import { useAdminAuth } from "@/context/admin-auth-context";
import { errorMessage } from "@/lib/api/client";
import { listAdminEmailDeliveries, type AdminEmailDelivery, type EmailDeliveryStatus } from "@/lib/api/email";
import { EMAIL_CATEGORY_LABELS, failureLabel } from "@/lib/emailSettings";

const PAGE_SIZE = 50;
const STATUS_FILTERS: { value: EmailDeliveryStatus | ""; label: string }[] = [
  { value: "", label: "All" },
  { value: "PENDING", label: "Pending" },
  { value: "PROCESSING", label: "Sending" },
  { value: "SENT", label: "Sent" },
  { value: "FAILED", label: "Failed" },
];
const STATUS_STYLES: Record<EmailDeliveryStatus, string> = {
  PENDING: "bg-[#fff7e6] text-[#b45309]",
  PROCESSING: "bg-[#f0f4ff] text-[#162d66]",
  SENT: "bg-[#ecfdf3] text-[#067647]",
  FAILED: "bg-[#fef2f2] text-[#b42318]",
};

const formatDateTime = (iso?: string | null) =>
  iso ? new Date(iso).toLocaleString("en-IN", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "—";

/**
 * Email delivery records (GET /admin/email-deliveries), newest first — the
 * same permission as the audit trail. Read-only: status, category, recipient
 * account with a masked address, timestamps, attempts and the failure kind.
 * The backend never returns email bodies, codes or provider credentials.
 */
export function EmailDeliveriesView() {
  const { can } = useAdminAuth();
  const allowed = can("settings.view_audit_logs");
  const [filter, setFilter] = useState<EmailDeliveryStatus | "">("");
  const [items, setItems] = useState<AdminEmailDelivery[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const seq = useRef(0);

  const load = useCallback(
    async (nextPage: number) => {
      const mine = ++seq.current;
      if (nextPage === 1) setLoading(true);
      else setLoadingMore(true);
      setError("");
      try {
        const res = await listAdminEmailDeliveries(filter ? { status: filter } : {}, nextPage, PAGE_SIZE);
        if (seq.current !== mine) return;
        setItems((prev) => {
          const merged = nextPage === 1 ? res.items : [...prev, ...res.items];
          const seen = new Set<number>();
          return merged.filter((row) => (seen.has(row.id) ? false : (seen.add(row.id), true)));
        });
        setTotal(res.total);
        setPage(nextPage);
      } catch (e) {
        if (seq.current !== mine) return;
        setError(errorMessage(e, "Could not load email deliveries."));
      } finally {
        if (seq.current === mine) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    },
    [filter],
  );

  useEffect(() => {
    if (allowed) load(1);
  }, [allowed, load]);

  if (!allowed) {
    return (
      <div className="rounded-2xl border border-[#e8ecf4] bg-white p-8 text-center text-sm text-[#94a3b8]">
        Your admin role does not include email delivery records.
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#e8ecf4] bg-white shadow-sm overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#f1f4f9] px-5 py-4">
        <div className="flex items-center gap-2">
          <Mail className="h-4 w-4 text-[#162d66]" />
          <h3 className="text-sm font-bold text-[#101828]">Email Deliveries</h3>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              onClick={() => setFilter(f.value)}
              className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
                filter === f.value ? "bg-[#162d66] text-white" : "text-[#64748b] hover:bg-[#f8fafc]"
              }`}
            >
              {f.label}
            </button>
          ))}
          <span className="ml-2 text-xs text-[#64748b]">{total} emails</span>
        </div>
      </div>
      {error && (
        <div className="border-b border-[#fee2e2] bg-[#fef2f2] px-5 py-3 text-xs text-[#991b1b]" role="alert">
          {error}{" "}
          <button type="button" onClick={() => load(1)} className="font-bold underline">
            Try again
          </button>
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full min-w-[860px] text-left text-xs">
          <thead className="bg-[#f8fafc] text-[11px] font-bold uppercase tracking-wider text-[#64748b]">
            <tr>
              <th className="px-5 py-3">Created</th>
              <th className="px-3 py-3">Recipient</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Status</th>
              <th className="px-3 py-3">Attempts</th>
              <th className="px-3 py-3">Sent</th>
              <th className="px-3 py-3">Failure</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#f1f4f9]">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#94a3b8]">Loading…</td>
              </tr>
            ) : items.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-[#94a3b8]">
                  {error ? "—" : "No email deliveries recorded yet."}
                </td>
              </tr>
            ) : (
              items.map((row) => (
                <tr key={row.id} className="hover:bg-[#fcfdfe]">
                  <td className="whitespace-nowrap px-5 py-3 text-[#64748b]">{formatDateTime(row.created_at)}</td>
                  <td className="whitespace-nowrap px-3 py-3 font-semibold text-[#101828]">
                    {row.recipient || "—"} <span className="font-normal text-[#94a3b8]">user #{row.user_id}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-[#475467]">
                    {EMAIL_CATEGORY_LABELS[row.category] || row.category}
                    <span className="block text-[10px] text-[#94a3b8]">{row.template}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span className={`rounded-full px-2 py-0.5 font-semibold ${STATUS_STYLES[row.status]}`}>{row.status}</span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 text-[#475467]">{row.attempts}</td>
                  <td className="whitespace-nowrap px-3 py-3 text-[#64748b]">{formatDateTime(row.sent_at)}</td>
                  <td className="px-3 py-3 text-[#475467]">
                    {row.status === "SENT" ? "—" : failureLabel(row.failure)}
                    {row.status === "PENDING" && row.next_attempt_at && (
                      <span className="block text-[10px] text-[#94a3b8]">next try {formatDateTime(row.next_attempt_at)}</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {items.length < total && !loading && (
        <div className="border-t border-[#f1f4f9] p-3 text-center">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => load(page + 1)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#162d66] hover:underline disabled:opacity-60"
          >
            {loadingMore && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Load older emails
          </button>
        </div>
      )}
    </div>
  );
}
