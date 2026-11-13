"use client";

import { AdminShell } from "@/components/dashboard/admin-shell";
import { RoleDirectory } from "@/components/users/role-directory";

export default function AgentsPage() {
  return (
    <AdminShell section="User Management" title="Agents">
      <RoleDirectory role="agent" />
    </AdminShell>
  );
}
