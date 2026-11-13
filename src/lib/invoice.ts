"use client";

import type { PaymentRecord, UserSubscription } from "@/types/subscription";
import { BILLING_LABEL, ROLE_LABEL } from "@/types/subscription";

/**
 * Seller details printed on invoices. GSTIN/address are not configured yet:
 * fill these in before using invoices as GST tax invoices.
 */
export const SELLER = {
  name: "RESTAMP",
  legalName: "RESTAMP Real Estate Marketplace",
  address: "Chennai, Tamil Nadu, India",
  email: "support@restamp.in",
  gstin: "", // e.g. "33ABCDE1234F1Z5". Empty = not configured.
};

/** Stable invoice number derived from the payment (same every time it's printed). */
export function invoiceNumber(p: PaymentRecord) {
  if (p.invoiceRef) return p.invoiceRef;
  const d = new Date(p.createdAt);
  const ym = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}`;
  const tail = p.id.replace(/[^A-Z0-9]/gi, "").slice(-6).toUpperCase();
  return `RST-INV-${ym}-${tail}`;
}

export const VERIFICATION_TEXT: Record<PaymentRecord["verification"], string> = {
  verified: "Paid (verified)",
  unverified: "Payment not verified by a payment gateway",
  pending: "Payment pending",
  failed: "Payment failed",
  refunded: "Refunded",
};

export interface InvoiceData {
  number: string;
  date: string;
  payment: PaymentRecord;
  subscription?: UserSubscription;
  lines: { label: string; amount: number }[];
  cgst: number;
  sgst: number;
  total: number;
}

export function buildInvoice(p: PaymentRecord, sub?: UserSubscription): InvoiceData {
  const lines = [{ label: `${p.planName} (${ROLE_LABEL[p.role]} plan)`, amount: p.baseAmount }];
  if (p.discount) lines.push({ label: "Discount", amount: -p.discount });
  const cgst = Math.round(p.gst / 2);
  return {
    number: invoiceNumber(p),
    date: new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }),
    payment: p,
    subscription: sub,
    lines,
    cgst,
    sgst: p.gst - cgst,
    total: p.total,
  };
}


type RGB = [number, number, number];
const INK: RGB = [17, 17, 17];
const MUTED: RGB = [90, 90, 90];
const HAIRLINE: RGB = [225, 225, 225];
const BRAND: RGB = [27, 69, 155];

/** Shared wording so the print page and the PDF say exactly the same thing. */
export function invoiceHeadline(inv: InvoiceData, money: (n: number) => string) {
  const p = inv.payment;
  const amt = money(inv.total);
  switch (p.verification) {
    case "verified":
      return `${amt} paid on ${inv.date}`;
    case "refunded":
      return `${amt} refunded`;
    case "failed":
      return `${amt} payment failed`;
    default:
      return `${amt} due ${inv.date}`;
  }
}

export function invoicePeriod(sub?: UserSubscription) {
  if (!sub) return "";
  const d = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "No expiry");
  return `${d(sub.activatedAt)} – ${d(sub.expiresAt)}`;
}

const LOGO_SRC = "/restamp-logo.svg";

/**
 * jsPDF cannot embed SVG, so the wordmark is rasterised to a PNG first
 * (3x so it stays crisp when the PDF is zoomed or printed).
 */
async function loadLogoPng(): Promise<{ data: string; ratio: number } | null> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = reject;
      i.src = LOGO_SRC;
    });
    const w = img.naturalWidth || 372;
    const h = img.naturalHeight || 100;
    const scale = 3;
    const canvas = document.createElement("canvas");
    canvas.width = w * scale;
    canvas.height = h * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return { data: canvas.toDataURL("image/png"), ratio: h / w };
  } catch {
    return null;
  }
}

/**
 * Generates and downloads a real A4 PDF file. The layout mirrors the printed
 * invoice page (src/app/invoice/[id]/page.tsx) so both look the same.
 */
export async function downloadInvoicePdf(inv: InvoiceData) {
  const [{ jsPDF }, logo] = await Promise.all([import("jspdf"), loadLogoPng()]);
  const doc = new jsPDF({ unit: "pt", format: "a4", compress: true });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 42;
  const R = W - M;
  const p = inv.payment;
  const s = inv.subscription;
  const money = (n: number) => `Rs. ${n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const font = (style: "normal" | "bold", size: number, color: RGB = INK) =>
    doc.setFont("helvetica", style).setFontSize(size).setTextColor(...color);
  const hr = (x1: number, x2: number, yy: number, color: RGB = HAIRLINE, w = 0.6) =>
    doc.setDrawColor(...color).setLineWidth(w).line(x1, yy, x2, yy);

  // Title + logo
  let y = 62;
  font("bold", 24);
  doc.text("Invoice", M, y);
  if (logo) {
    const lw = 130;
    doc.addImage(logo.data, "PNG", R - lw, 40, lw, lw * logo.ratio, undefined, "FAST");
  } else {
    font("bold", 18, BRAND);
    doc.text(SELLER.name, R, y, { align: "right" });
  }

  // Meta table
  y += 34;
  const meta: [string, string][] = [
    ["Invoice number", inv.number],
    ["Date of issue", inv.date],
    ["Transaction ID", p.transactionRef || "-"],
    ["GSTIN", SELLER.gstin || "Not configured"],
  ];
  for (const [k, v] of meta) {
    font("bold", 10.5);
    doc.text(k, M, y);
    font("normal", 10.5);
    doc.text(v, M + 104, y);
    y += 18;
  }

  // From / Bill to
  y += 22;
  const col2 = M + (R - M) * 0.4;
  font("bold", 10.5);
  doc.text(SELLER.legalName, M, y);
  doc.text("Bill to", col2, y);
  font("normal", 10.5);
  const lh = { lineHeightFactor: 1.55 };
  doc.text([SELLER.address, SELLER.email], M, y + 20, lh);
  const billTo = [p.subscriberName, p.subscriberPhone || "", `${ROLE_LABEL[p.role]} account`].filter(Boolean);
  doc.text(billTo, col2, y + 20, lh);
  y += 20 + billTo.length * 16 + 26;

  // Headline amount
  font("bold", 17);
  doc.text(invoiceHeadline(inv, money), M, y);
  y += 18;
  font("normal", 10.5, p.verification === "verified" ? [21, 128, 61] : [180, 83, 9]);
  doc.text(VERIFICATION_TEXT[p.verification], M, y);
  y += 36;

  // Line items
  const cQty = R - 230, cUnit = R - 150, cTax = R - 80;
  font("normal", 9.5);
  doc.text("Description", M, y);
  doc.text("Qty", cQty, y, { align: "right" });
  doc.text("Unit price", cUnit, y, { align: "right" });
  doc.text("Tax", cTax, y, { align: "right" });
  doc.text("Amount", R, y, { align: "right" });
  y += 8;
  hr(M, R, y, INK, 1);
  y += 18;
  const period = invoicePeriod(s);
  inv.lines.forEach((l, i) => {
    font("normal", 10.5);
    doc.text(l.label, M, y);
    if (i === 0) {
      doc.text("1", cQty, y, { align: "right" });
      doc.text(money(l.amount), cUnit, y, { align: "right" });
      doc.text("18%", cTax, y, { align: "right" });
    }
    doc.text(l.amount < 0 ? `- ${money(-l.amount)}` : money(l.amount), R, y, { align: "right" });
    if (i === 0 && period) {
      doc.text(period, M, y + 16);
      y += 16;
    }
    y += 22;
  });

  // Totals
  y += 12;
  const tx = M + (R - M) / 2;
  const taxable = p.baseAmount - p.discount;
  const rows: [string, string, boolean][] = [
    ["Subtotal", money(p.baseAmount), false],
    ...(p.discount ? ([["Discount", `- ${money(p.discount)}`, false]] as [string, string, boolean][]) : []),
    ["Total excluding tax", money(taxable), false],
    [`CGST (9% on ${money(taxable)})`, money(inv.cgst), false],
    [`SGST (9% on ${money(taxable)})`, money(inv.sgst), false],
    ["Total", money(inv.total), false],
    [p.verification === "verified" ? "Amount paid" : "Amount due", money(inv.total), true],
  ];
  for (const [k, v, bold] of rows) {
    hr(tx, R, y);
    y += 15;
    font(bold ? "bold" : "normal", 10.5);
    doc.text(k, tx, y);
    doc.text(v, R, y, { align: "right" });
    y += 6;
  }

  // Payment + notes
  y += 40;
  font("normal", 10.5);
  doc.text([`Payment method: ${p.method || "-"}`, `Provider: ${p.provider || "-"}`, SELLER.gstin ? "Tax Invoice" : "Not a valid GST tax invoice (seller GSTIN not configured)"], M, y, lh);

  // Footer
  const fy = H - 46;
  hr(M, R, fy - 18);
  font("normal", 8.5);
  doc.text(`${inv.number} · ${invoiceHeadline(inv, money)}`, M, fy);
  doc.text("Page 1 of 1", R, fy, { align: "right" });

  doc.save(`${inv.number}.pdf`);
}
