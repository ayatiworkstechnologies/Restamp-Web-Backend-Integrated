"use client";

import { BackendUnavailable } from "@/components/subscriptions/backend-unavailable";
import { AdminShell } from "@/components/dashboard/admin-shell";

export default function ActiveSubscriptionsPage() {
  return (
    <AdminShell section="Subscription Management" title="Active Subscriptions">
      <BackendUnavailable
        title="Active Subscriptions"
        section="Subscription Management"
        neededEndpoints={[
          "GET /admin/subscriptions — list all active/expiring/expired/cancelled subscriptions with subscriber, plan and payment details",
          "GET /admin/subscriptions/:id — subscription detail with usage and payment history",
          "POST /admin/subscriptions/:id/suspend — suspend a subscription (admin override)",
          "POST /admin/subscriptions/:id/reactivate — reactivate a suspended subscription",
          "POST /admin/subscriptions/:id/cancel — cancel a subscription (no refund from here)",
        ]}
        existingCapabilities={[]}
        note={
          "Subscription lifecycle management is read-only until a backend subscriptions API is implemented. No subscriber records, "
          + "plan assignments or payment statuses are shown — this avoids displaying simulated subscription data."
        }
      />
    </AdminShell>
  );
}
