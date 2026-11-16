"use client";

import { BackendUnavailable } from "@/components/subscriptions/backend-unavailable";
import { AdminShell } from "@/components/dashboard/admin-shell";

export default function NotificationsPage() {
  return (
    <AdminShell section="Management" title="Notifications">
      <BackendUnavailable
        title="Notifications"
        section="Management"
        neededEndpoints={[
          "POST /admin/notifications — compose and send an announcement/offer/alert to all users, a role or one user",
          "GET /admin/notifications — list sent notifications with audience, status, expiry",
          "POST /admin/notifications/:id/active — pause or resume a sent notification",
          "DELETE /admin/notifications/:id — delete a sent notification",
          "GET/PUT /admin/notification-rules — automatic notification rules (payment received, expiring, listing live, price changed)",
        ]}
        existingCapabilities={[
          "GET /admin/email-deliveries — read-only admin email delivery records (PENDING/PROCESSING/SENT/FAILED)",
          "GET /admin/push-deliveries — read-only admin push delivery records (PENDING/PROCESSING/SENT/FAILED)",
          "GET/PUT /users/me/email — current user's email status and preferences",
          "GET/PUT /users/me/push — current user's push status and preferences",
        ]}
        note={
          "In-app notification composition and rules are read-only until a backend notifications API is implemented. No notifications "
          + "are composed, sent or listed here. The existing /admin/email-deliveries and /admin/push-deliveries endpoints cover "
          + "delivery records only — they are a different system from in-app notifications and cannot send or list in-app messages."
        }
      />
    </AdminShell>
  );
}
