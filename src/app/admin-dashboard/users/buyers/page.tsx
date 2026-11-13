"use client";

import { AdminShell } from "@/components/dashboard/admin-shell";
import { RoleDirectory } from "@/components/users/role-directory";

export default function BuyersPage() {
  return (
    <AdminShell section="User Management" title="Buyers">
      <RoleDirectory role="buyer" />
    </AdminShell>
  );
}
