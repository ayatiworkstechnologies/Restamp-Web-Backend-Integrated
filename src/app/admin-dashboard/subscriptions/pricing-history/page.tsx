"use client";

import { BackendUnavailable } from "@/components/subscriptions/backend-unavailable";
import { AdminShell } from "@/components/dashboard/admin-shell";

export default function PricingHistoryPage() {
  return (
    <AdminShell section="Subscription Management" title="Pricing History">
      <BackendUnavailable
        title="Pricing History"
        section="Subscription Management"
        neededEndpoints={[
          "GET /admin/subscription-plans/:id/pricing-history — price-change history for a plan (old → new price, changed by, when)",
          "GET /admin/audit-logs?entity=subscription — admin actions on subscriptions (create, edit, publish, suspend, cancel)",
        ]}
        existingCapabilities={[
          "GET /admin/audit-logs?entity=user — existing admin audit log for user suspensions/reactivations",
        ]}
        note={
          "Plan price-change history is read-only until a backend pricing-history API is implemented. No plan versions, price diffs "
          + "or admin audit entries for subscription actions are displayed. The existing /admin/audit-logs endpoint covers user "
          + "account actions only, not subscription or plan changes."
        }
      />
    </AdminShell>
  );
}
