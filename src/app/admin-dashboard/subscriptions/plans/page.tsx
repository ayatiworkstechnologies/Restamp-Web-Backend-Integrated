"use client";

import { BackendUnavailable } from "@/components/subscriptions/backend-unavailable";
import { AdminShell } from "@/components/dashboard/admin-shell";

export default function SubscriptionPlansPage() {
  return (
    <AdminShell section="Subscription Management" title="Subscription Plans">
      <BackendUnavailable
        title="Subscription Plans"
        section="Subscription Management"
        neededEndpoints={[
          "GET /admin/subscription-plans — list all plans (draft, active, inactive, archived) for buyer/owner/agent",
          "POST /admin/subscription-plans — create a new plan",
          "PUT /admin/subscription-plans/:id — edit plan name, price, limits, status, visibility",
          "DELETE /admin/subscription-plans/:id — archive or delete a draft plan",
          "POST /admin/subscription-plans/:id/status — publish, pause or archive a plan",
        ]}
        existingCapabilities={[]}
        note={
          "Plan management is read-only until a backend subscription-plans API is implemented. No plans, prices or limits are shown — "
          + "this avoids displaying simulated plan data that could be mistaken for real purchasable plans."
        }
      />
    </AdminShell>
  );
}
