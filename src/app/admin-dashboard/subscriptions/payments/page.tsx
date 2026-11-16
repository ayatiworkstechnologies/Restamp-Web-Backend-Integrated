"use client";

import { BackendUnavailable } from "@/components/subscriptions/backend-unavailable";
import { AdminShell } from "@/components/dashboard/admin-shell";

export default function PaymentsPage() {
  return (
    <AdminShell section="Subscription Management" title="Payments & Invoices">
      <BackendUnavailable
        title="Payments & Invoices"
        section="Subscription Management"
        neededEndpoints={[
          "GET /admin/payments — admin-wide list of all payments/transactions across subscribers (not just current user)",
          "GET /admin/payments/:id — payment detail and invoice",
          "GET /admin/payments/:id/invoice — downloadable invoice PDF for any payment",
        ]}
        existingCapabilities={[
          "GET /payments/config — Razorpay configuration for checkout (user-scoped)",
          "POST /payments/checkout — create a checkout order (user-scoped)",
          "POST /payments/verify — verify a payment (user-scoped)",
          "GET /payments/history — current user's payment history (user-scoped)",
          "GET /payments/:id/invoice — current user's invoice (user-scoped)",
        ]}
        note={
          "Admin-wide payment listing is read-only until a backend /admin/payments API is implemented. Per-user payment endpoints "
          + "already exist under /payments/* (checkout, verify, history, invoice) but they return only the signed-in user's data — "
          + "they cannot populate an admin payments dashboard. No payment records, invoices or revenue figures are displayed here."
        }
      />
    </AdminShell>
  );
}
