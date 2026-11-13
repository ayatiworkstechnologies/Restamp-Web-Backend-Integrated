"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { useParams, useSearchParams } from "next/navigation";
import { FileDown, Loader2, Printer } from "lucide-react";
import { useSubscriptionData } from "@/lib/subscription-store";
import { toast } from "@/lib/notify";
import { SELLER, VERIFICATION_TEXT, buildInvoice, downloadInvoicePdf, invoiceHeadline, invoicePeriod } from "@/lib/invoice";
import { ROLE_LABEL } from "@/types/subscription";

const money = (n: number) => `₹${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function InvoiceView() {
  const { id } = useParams<{ id: string }>();
  const search = useSearchParams();
  const { ready, payments, subscriptions } = useSubscriptionData();
  const [busy, setBusy] = useState(false);
  const printed = useRef(false);

  const inv = useMemo(() => {
    const ref = decodeURIComponent(id);
    const p = payments.find((x) => x.id === ref || x.transactionRef === ref);
    if (!p) return null;
    return buildInvoice(p, subscriptions.find((s) => s.id === p.subscriptionId));
  }, [id, payments, subscriptions]);

  useEffect(() => {
    if (inv && search.get("print") === "1" && !printed.current) {
      printed.current = true;
      setTimeout(() => window.print(), 300);
    }
  }, [inv, search]);

  if (!ready) return <div className="p-10 text-center text-sm text-slate-500">Loading invoice…</div>;
  if (!inv) return <div className="p-10 text-center text-sm text-slate-500">Invoice not found.</div>;

  const p = inv.payment;
  const period = invoicePeriod(inv.subscription);
  const taxable = p.baseAmount - p.discount;
  const totals: [string, string, boolean][] = [
    ["Subtotal", money(p.baseAmount), false],
    ...(p.discount ? ([["Discount", `− ${money(p.discount)}`, false]] as [string, string, boolean][]) : []),
    ["Total excluding tax", money(taxable), false],
    [`CGST (9% on ${money(taxable)})`, money(inv.cgst), false],
    [`SGST (9% on ${money(taxable)})`, money(inv.sgst), false],
    ["Total", money(inv.total), false],
    [p.verification === "verified" ? "Amount paid" : "Amount due", money(inv.total), true],
  ];
  const pdf = async () => {
    setBusy(true);
    try {
      await downloadInvoicePdf(inv);
      toast.success(`Invoice ${inv.number} downloaded`);
    } catch {
      toast.error("Could not generate the invoice PDF. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-200 px-4 py-8 print:bg-white print:p-0">
      <style>{`@media print { @page { size: A4; margin: 14mm; } }`}</style>
      <div className="mx-auto mb-4 flex max-w-[794px] flex-wrap justify-end gap-2 print:hidden">
        <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-xl bg-[#334155] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#1e293b]">
          <Printer size={14} /> Print
        </button>
        <button type="button" onClick={pdf} disabled={busy} className="inline-flex items-center gap-1.5 rounded-xl bg-[#dc2626] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#b91c1c] disabled:opacity-60">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />} Download PDF
        </button>
      </div>

      <article className="mx-auto flex min-h-[1123px] max-w-[794px] flex-col bg-white p-8 text-[13px] leading-relaxed text-neutral-900 shadow-sm sm:p-14 print:min-h-0 print:max-w-none print:p-0 print:shadow-none">
        <header className="flex items-start justify-between gap-6">
          <h1 className="text-3xl font-bold tracking-tight">Invoice</h1>
          <Image src="/restamp-logo.svg" alt="Restamp" width={168} height={45} className="h-11 w-auto" />
        </header>

        <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-0.5">
          <dt className="font-semibold">Invoice number</dt><dd>{inv.number}</dd>
          <dt className="font-semibold">Date of issue</dt><dd>{inv.date}</dd>
          <dt className="font-semibold">Transaction ID</dt><dd className="break-all">{p.transactionRef || "—"}</dd>
          <dt className="font-semibold">GSTIN</dt><dd>{SELLER.gstin || "Not configured"}</dd>
        </dl>

        <section className="mt-8 grid gap-6 sm:grid-cols-[2fr_3fr]">
          <div>
            <div className="mb-1.5 font-semibold">{SELLER.legalName}</div>
            <div>{SELLER.address}</div>
            <div>{SELLER.email}</div>
          </div>
          <div>
            <div className="mb-1.5 font-semibold">Bill to</div>
            <div>{p.subscriberName}</div>
            {p.subscriberPhone && <div>{p.subscriberPhone}</div>}
            <div>{ROLE_LABEL[p.role]} account</div>
          </div>
        </section>

        <section className="mt-9">
          <h2 className="text-xl font-bold">{invoiceHeadline(inv, money)}</h2>
          <div className={p.verification === "verified" ? "mt-1 text-emerald-700" : "mt-1 text-amber-700"}>{VERIFICATION_TEXT[p.verification]}</div>
        </section>

        <div className="mt-9 overflow-x-auto">
          <table className="w-full min-w-[480px] text-left">
            <thead>
              <tr className="border-b border-neutral-900 text-xs">
                <th className="pb-2 font-normal">Description</th>
                <th className="pb-2 text-right font-normal">Qty</th>
                <th className="pb-2 text-right font-normal">Unit price</th>
                <th className="pb-2 text-right font-normal">Tax</th>
                <th className="pb-2 text-right font-normal">Amount</th>
              </tr>
            </thead>
            <tbody>
              {inv.lines.map((l, i) => (
                <tr key={l.label} className="align-top">
                  <td className="pt-3">
                    {l.label}
                    {i === 0 && period && <div>{period}</div>}
                  </td>
                  <td className="pt-3 text-right">{i === 0 ? 1 : ""}</td>
                  <td className="pt-3 text-right">{i === 0 ? money(l.amount) : ""}</td>
                  <td className="pt-3 text-right">{i === 0 ? "18%" : ""}</td>
                  <td className="pt-3 text-right">{l.amount < 0 ? `− ${money(-l.amount)}` : money(l.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <dl className="ml-auto mt-8 w-full sm:w-1/2">
          {totals.map(([k, v, bold]) => (
            <div key={k} className={`flex justify-between gap-4 border-t border-neutral-200 py-1 ${bold ? "font-bold" : ""}`}>
              <dt>{k}</dt><dd>{v}</dd>
            </div>
          ))}
        </dl>

        <section className="mt-10">
          <div>Payment method: {p.method || "—"}</div>
          <div>Provider: {p.provider || "—"}</div>
          <div>{SELLER.gstin ? "Tax Invoice" : "Not a valid GST tax invoice (seller GSTIN not configured)"}</div>
        </section>

        <footer className="mt-auto flex justify-between gap-4 border-t border-neutral-200 pt-5 text-[11px] print:fixed print:inset-x-0 print:bottom-0">
          <span>{inv.number} · {invoiceHeadline(inv, money)}</span>
          <span className="shrink-0">Page 1 of 1</span>
        </footer>
      </article>
    </main>
  );
}

export default function InvoicePage() {
  return (
    <Suspense fallback={<div className="p-10 text-center text-sm text-slate-500">Loading invoice…</div>}>
      <InvoiceView />
    </Suspense>
  );
}
