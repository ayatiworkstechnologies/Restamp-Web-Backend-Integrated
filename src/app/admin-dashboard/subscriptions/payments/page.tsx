"use client";

import React, { useMemo, useState } from "react";
import { FileDown, Loader2, Printer, Search, X } from "lucide-react";
import { toast } from "@/lib/notify";
import { buildInvoice, downloadInvoicePdf, invoiceNumber } from "@/lib/invoice";
import type { PaymentRecord } from "@/types/subscription";
import { AdminShell } from "@/components/dashboard/admin-shell";
import {
  Card,
  EmptyState,
  Notice,
  Pagination,
  PaymentBadge,
  RoleBadge,
  SeedTag,
  TableSkeleton,
  btnPdf,
  btnPrint,
  fmtDateTime,
  inr,
  selectCls,
  usePaged,
} from "@/components/subscriptions/ui";
import { useSubscriptionData } from "@/lib/subscription-store";
import { ROLE_LABEL, type PaymentVerification, type SubscriberRole } from "@/types/subscription";

const VERIFICATIONS: PaymentVerification[] = ["verified", "unverified", "pending", "failed", "refunded"];

export default function PaymentsPage() {
  const { ready, payments, subscriptions } = useSubscriptionData();
  const [pdfBusy, setPdfBusy] = useState<string | null>(null);
  const downloadPdf = async (p: PaymentRecord) => {
    setPdfBusy(p.id);
    try {
      const inv = buildInvoice(p, subscriptions.find((s) => s.id === p.subscriptionId));
      await downloadInvoicePdf(inv);
      toast.success(`Invoice ${inv.number} downloaded`);
    } catch {
      toast.error("Could not generate the invoice PDF. Please try again.");
    } finally {
      setPdfBusy(null);
    }
  };
  const [role, setRole] = useState<"all" | SubscriberRole>("all");
  const [ver, setVer] = useState<"all" | PaymentVerification>("all");
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    return payments.filter((p) => {
      if (role !== "all" && p.role !== role) return false;
      if (ver !== "all" && p.verification !== ver) return false;
      if (s && !`${invoiceNumber(p)} ${p.transactionRef} ${p.id} ${p.subscriberName} ${p.subscriberPhone} ${p.planName}`.toLowerCase().includes(s)) return false;
      return true;
    });
  }, [payments, role, ver, q]);
  const paged = usePaged(filtered, `${role}|${ver}|${q}`);
  const verifiedRevenue = payments.filter((p) => p.verification === "verified").reduce((a, p) => a + p.total, 0);
  const unverifiedAmount = payments.filter((p) => p.verification === "unverified").reduce((a, p) => a + p.total, 0);
  const hasFilters = role !== "all" || ver !== "all" || q;

  return (
    <AdminShell section="Subscription Management" title="Payments & Invoices">
      <Notice tone="warn">
        <strong>No payment gateway is connected.</strong> Checkouts are currently simulated, so payments are recorded as <em>unverified</em>, and seed rows are sample
        data. Nothing on this page can mark a payment as paid. Only a signed gateway webhook can (see PAYMENTS.md). Every payment has an invoice you can print or
        download as PDF; it shows the payment&apos;s real status. Add the seller GSTIN in <code>src/lib/invoice.ts</code> before using them as GST tax invoices.
      </Notice>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          ["Transactions", String(payments.length)],
          ["Verified revenue (incl. GST)", inr(verifiedRevenue)],
          ["Unverified amount", inr(unverifiedAmount)],
        ].map(([k, v]) => (
          <Card key={k} className="p-4">
            <div className="text-[12px] font-semibold text-[#8896aa]">{k}</div>
            <div className="mt-1 text-[24px] font-extrabold tracking-[-0.04em] text-[#16233d]">{ready ? v : "—"}</div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#f1f4f9] p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9da9bc]" />
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search invoice no, transaction ID, subscriber or plan" className="w-full rounded-xl border border-[#e2e8f2] bg-[#fbfcfe] py-2 pl-9 pr-3 text-xs outline-none focus:border-[#087ed9]" />
          </div>
          <select aria-label="Role" className={selectCls} value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
            <option value="all">All roles</option>
            {(["buyer", "owner", "agent"] as const).map((r) => <option key={r} value={r}>{ROLE_LABEL[r]}</option>)}
          </select>
          <select aria-label="Verification" className={selectCls} value={ver} onChange={(e) => setVer(e.target.value as typeof ver)}>
            <option value="all">Any verification</option>
            {VERIFICATIONS.map((v) => <option key={v} value={v}>{v}</option>)}
          </select>
          {hasFilters && (
            <button type="button" className="inline-flex items-center gap-1 text-xs font-bold text-[#087ed9]" onClick={() => { setRole("all"); setVer("all"); setQ(""); }}>
              <X size={13} /> Clear
            </button>
          )}
        </div>
        {!ready ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState title="No payments" hint={hasFilters ? "Try clearing a filter." : "Payments appear here after a checkout."} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] text-left text-xs">
              <thead className="bg-[#fafbfe] text-[10px] font-extrabold uppercase tracking-wider text-[#94a1b5]">
                <tr>
                  <th className="px-4 py-3">Transaction ID</th>
                  <th className="px-3 py-3">Subscriber</th>
                  <th className="px-3 py-3">Plan</th>
                  <th className="px-3 py-3 text-right">Amount</th>
                  <th className="px-3 py-3">Date</th>
                  <th className="px-3 py-3">Provider / method</th>
                  <th className="px-3 py-3">Verification</th>
                  <th className="px-4 py-3">Invoice</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f4f9]">
                {paged.slice.map((p) => (
                  <tr key={p.id} className="hover:bg-[#fafcff]">
                    <td className="px-4 py-3 font-mono text-[11px] text-[#24324b]">{p.transactionRef}{p.source === "seed" && <span className="ml-1.5"><SeedTag /></span>}</td>
                    <td className="px-3 py-3">
                      <div className="font-bold text-[#1f2e48]">{p.subscriberName}</div>
                      <div className="mt-0.5"><RoleBadge role={p.role} /></div>
                    </td>
                    <td className="px-3 py-3 font-semibold">{p.planName}</td>
                    <td className="px-3 py-3 text-right">
                      <div className="font-bold text-[#16233d]">{inr(p.total)}</div>
                      <div className="text-[10px] text-[#8090a6]">{inr(p.baseAmount)}{p.discount ? ` − ${inr(p.discount)}` : ""} + GST {inr(p.gst)}</div>
                    </td>
                    <td className="px-3 py-3">{fmtDateTime(p.createdAt)}</td>
                    <td className="px-3 py-3">
                      <div className="font-semibold">{p.provider}</div>
                      <div className="text-[11px] text-[#8090a6]">{p.method}</div>
                    </td>
                    <td className="px-3 py-3"><PaymentBadge status={p.verification} /></td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-[11px] text-[#24324b]">{invoiceNumber(p)}</div>
                      <div className="mt-1.5 flex gap-1.5">
                        <a
                          href={`/invoice/${encodeURIComponent(p.id)}?print=1`}
                          target="_blank"
                          rel="noreferrer"
                          className={btnPrint}
                          aria-label={`Print invoice ${invoiceNumber(p)}`}
                        >
                          <Printer size={13} /> Print
                        </a>
                        <button
                          type="button"
                          className={btnPdf}
                          disabled={pdfBusy === p.id}
                          onClick={() => downloadPdf(p)}
                          aria-label={`Download PDF ${invoiceNumber(p)}`}
                        >
                          {pdfBusy === p.id ? <Loader2 size={13} className="animate-spin" /> : <FileDown size={13} />} Download PDF
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination {...paged} />
      </Card>
    </AdminShell>
  );
}
