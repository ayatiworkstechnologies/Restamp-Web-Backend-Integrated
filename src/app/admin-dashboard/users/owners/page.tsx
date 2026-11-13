"use client";

import { AdminShell } from "@/components/dashboard/admin-shell";
import { RoleDirectory } from "@/components/users/role-directory";

export default function OwnersPage() {
  return (
    <AdminShell section="User Management" title="Owners">
      <RoleDirectory role="owner" />
    </AdminShell>
  );
}
