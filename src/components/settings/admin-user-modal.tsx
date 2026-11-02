"use client";

import React, { useState } from "react";
import { X, Search, Loader2, UserPlus } from "lucide-react";
import { listAdminUsers, type AdminUserRow, type AssignableRole } from "@/lib/api/admin";
import { errorMessage } from "@/lib/api/client";
import { useSettingsStore } from "@/context/settings-context";
import { ASSIGNABLE_ROLES } from "@/components/settings/admin-users-table";

interface AdminUserModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Grant admin access to an EXISTING account (POST /admin/staff). There are
 * no email invitations: the person must have signed in to Restamp once with
 * their mobile number; find them by name, phone digits or user id.
 */
export function AdminUserModal({ isOpen, onClose }: AdminUserModalProps) {
  const { grantStaff } = useSettingsStore();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminUserRow[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [picked, setPicked] = useState<AdminUserRow | null>(null);
  const [role, setRole] = useState<AssignableRole>("SUPPORT_SPECIALIST");
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const close = () => {
    setQuery("");
    setResults(null);
    setPicked(null);
    setError("");
    onClose();
  };

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setSearching(true);
    setError("");
    setPicked(null);
    try {
      const res = await listAdminUsers({ q: query.trim(), is_admin: false, status: "active" }, 1, 10);
      setResults(res.items);
    } catch (err) {
      setError(errorMessage(err, "Could not search users."));
    } finally {
      setSearching(false);
    }
  };

  const grant = async () => {
    if (!picked) return;
    setSaving(true);
    const ok = await grantStaff(picked.user_id, role);
    setSaving(false);
    if (ok) close();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-lg rounded-3xl border border-[#e8ecf4] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#f1f4f9] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#101828]">Grant admin access</h2>
            <p className="text-xs text-[#64748b]">The person must already have a Restamp account (they sign in with their mobile number).</p>
          </div>
          <button type="button" onClick={close} aria-label="Close" className="rounded-xl p-1.5 text-[#94a3b8] hover:bg-[#f1f5f9]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={search} className="mt-4 flex gap-2">
          <div className="flex flex-1 items-center gap-2 rounded-xl border border-[#e8ecf4] px-3">
            <Search className="h-4 w-4 text-[#94a3b8]" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Name, phone digits or user id"
              className="w-full py-2.5 text-sm outline-none"
            />
          </div>
          <button type="submit" disabled={searching} className="rounded-xl bg-[#162d66] px-4 text-xs font-bold text-white disabled:opacity-60">
            {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : "Search"}
          </button>
        </form>

        {error && <p className="mt-2 text-xs text-[#dc2626]" role="alert">{error}</p>}

        {results && (
          <div className="mt-3 max-h-56 space-y-1.5 overflow-y-auto">
            {results.length === 0 && <p className="text-xs text-[#94a3b8]">No active, non-admin accounts match.</p>}
            {results.map((u) => (
              <button
                key={u.user_id}
                type="button"
                onClick={() => setPicked(u)}
                className={`flex w-full items-center justify-between rounded-xl border px-3 py-2 text-left text-xs ${
                  picked?.user_id === u.user_id ? "border-[#162d66] bg-[#f0f4ff]" : "border-[#e8ecf4] hover:bg-[#f8fafc]"
                }`}
              >
                <span>
                  <span className="font-semibold text-[#101828]">{u.display_name || "Restamp user"}</span>
                  <span className="ml-2 text-[#94a3b8]">#{u.user_id}</span>
                </span>
                <span className="text-[#64748b]">{u.phone_last4 ? `••••${u.phone_last4}` : ""}</span>
              </button>
            ))}
          </div>
        )}

        <div className="mt-4">
          <label className="block text-xs font-bold text-[#344054] mb-1">Admin role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as AssignableRole)}
            className="w-full rounded-xl border border-[#e8ecf4] bg-white px-3 py-2 text-sm"
          >
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r.code} value={r.code}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div className="mt-6 flex justify-end gap-2.5 border-t border-[#f1f4f9] pt-4">
          <button type="button" onClick={close} className="rounded-xl border border-[#e8ecf4] px-4 py-2 text-xs font-semibold text-[#475467]">
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void grant()}
            disabled={!picked || saving}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#162d66] px-4 py-2 text-xs font-bold text-white disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
            Grant access
          </button>
        </div>
      </div>
    </div>
  );
}
