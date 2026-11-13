"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import { Ban, Building2, CalendarPlus, Eye, Mail, Pencil, Phone, RotateCcw, Search, Trash2, UserPlus, X } from "lucide-react";
import { UserAddModal } from "@/components/users/user-add-modal";
import { UserEditModal } from "@/components/users/user-edit-modal";
import { useUserStore } from "@/context/user-context";
import { usePropertyStore } from "@/context/property-context";
import { useEnquiryStore } from "@/context/enquiry-context";
import {
  auditUserAction,
  extendSubscription,
  grantSubscription,
  normalizePhone,
  relinkSubscriber,
  setSubscriptionAdminStatus,
  useSubscriptionData,
  type Actor,
  type SubscriptionView,
} from "@/lib/subscription-store";
import { linkedProperties, usageFor } from "@/lib/subscription-usage";
import type { User, UserStatus } from "@/types/user";
import type { SubscriberRole, SubscriptionPlan, SubscriptionStatus } from "@/types/subscription";
import { BILLING_LABEL, ROLE_LABEL } from "@/types/subscription";
import {
  Card,
  ConfirmDialog,
  EmptyState,
  Modal,
  Notice,
  Pagination,
  PaymentBadge,
  SeedTag,
  SubscriptionBadge,
  TableSkeleton,
  btnDanger,
  btnPrimary,
  btnSecondary,
  inputCls,
  fmtDate,
  inr,
  limitLabel,
  selectCls,
  useActor,
  usePaged,
} from "@/components/subscriptions/ui";

const btnView = "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 border-[#cfe0fb] bg-[#eef4ff] text-[#1B459B] hover:bg-[#dfeaff]";
const btnEdit = "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 border-[#ddd6fe] bg-[#f5f3ff] text-[#6d28d9] hover:bg-[#ede9fe]";
const btnSuspend = "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 border-[#fde2b5] bg-[#fff7ea] text-[#b45309] hover:bg-[#ffedd0]";
const btnReactivate = "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 border-[#bbf0d2] bg-[#ecfdf3] text-[#047857] hover:bg-[#d7f8e6]";
const btnDelete = "inline-flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-xs font-bold transition-colors disabled:opacity-50 border-[#fecaca] bg-[#fef2f2] text-[#dc2626] hover:bg-[#fee2e2]";

const ACCOUNT_STATUSES: UserStatus[] = ["Active", "Suspended", "Inactive"];
const SUB_STATUSES: SubscriptionStatus[] = ["active", "expiring", "expired", "cancelled", "suspended"];

const ACCOUNT_STYLES: Record<UserStatus, string> = {
  Active: "bg-[#eaf9f0] text-[#1ca569]",
  Suspended: "bg-red-50 text-red-600",
  Inactive: "bg-slate-100 text-slate-500",
};

interface Row {
  user: User;
  subs: SubscriptionView[];
  current?: SubscriptionView;
}

/** Most relevant subscription: a live one first, otherwise the latest. */
function pickCurrent(subs: SubscriptionView[]) {
  return subs.find((s) => s.status === "active" || s.status === "expiring") ?? subs[0];
}

export function RoleDirectory({ role }: { role: SubscriberRole }) {
  const { users, suspendUser, activateUser, addUser, updateUser, deleteUser } = useUserStore();
  const { properties } = usePropertyStore();
  const { enquiries } = useEnquiryStore();
  const { ready, subscriptions, plans } = useSubscriptionData();
  const { actor, canManage } = useActor();

  const [search, setSearch] = useState("");
  const [accountStatus, setAccountStatus] = useState<"all" | UserStatus>("all");
  const [planFilter, setPlanFilter] = useState("all");
  const [subStatus, setSubStatus] = useState<"all" | SubscriptionStatus>("all");
  const [detail, setDetail] = useState<User | null>(null);
  const [statusTarget, setStatusTarget] = useState<User | null>(null);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [bulk, setBulk] = useState<"suspend" | "reactivate" | "delete" | null>(null);

  const rows: Row[] = useMemo(() => {
    return users
      .filter((u) => u.role === role)
      .map((user) => {
        const subs = subscriptions.filter((s) => s.role === role && normalizePhone(s.subscriberPhone) === normalizePhone(user.phone));
        return { user, subs, current: pickCurrent(subs) };
      });
  }, [users, subscriptions, role]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter(({ user, current }) => {
      if (accountStatus !== "all" && user.status !== accountStatus) return false;
      if (planFilter === "none" && current) return false;
      if (planFilter !== "all" && planFilter !== "none" && current?.planId !== planFilter) return false;
      if (subStatus !== "all" && current?.status !== subStatus) return false;
      if (q) {
        const hay = [user.name, user.email, user.id, user.phone, user.companyName ?? ""].join(" ").toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [rows, search, accountStatus, planFilter, subStatus]);

  const paged = usePaged(filtered, `${search}|${accountStatus}|${planFilter}|${subStatus}`);
  const rolePlans = plans.filter((p) => p.role === role);
  const kpis = {
    total: rows.length,
    live: rows.filter((r) => r.current && (r.current.status === "active" || r.current.status === "expiring")).length,
    expiring: rows.filter((r) => r.current?.status === "expiring").length,
    suspended: rows.filter((r) => r.user.status === "Suspended").length,
  };
  const label = ROLE_LABEL[role];
  const hasFilters = search || accountStatus !== "all" || planFilter !== "all" || subStatus !== "all";

  const changeStatus = (user: User, reason: string) => {
    if (!actor || !canManage) throw new Error("Your admin role cannot change account status.");
    if (user.status === "Suspended") {
      activateUser(user.id);
      auditUserAction(actor, "Account reactivated", `${user.id} (${user.name})`, reason);
    } else {
      suspendUser(user.id, reason);
      auditUserAction(actor, "Account suspended", `${user.id} (${user.name})`, reason);
    }
  };

  const requireManage = () => {
    if (!actor || !canManage) throw new Error("Your admin role cannot manage users.");
    return actor;
  };

  const saveEdit = (user: User, updates: Partial<User>) => {
    const a = requireManage();
    const phoneChanged = updates.phone !== undefined && normalizePhone(updates.phone) !== normalizePhone(user.phone);
    const nameChanged = updates.name !== undefined && updates.name !== user.name;
    if (phoneChanged || nameChanged) {
      relinkSubscriber({ role: user.role, phone: user.phone }, { phone: updates.phone ?? user.phone, name: updates.name ?? user.name }, a);
    }
    updateUser(user.id, updates);
    const changed = Object.keys(updates).filter((k) => JSON.stringify((updates as Record<string, unknown>)[k]) !== JSON.stringify((user as unknown as Record<string, unknown>)[k]));
    auditUserAction(a, "Account edited", `${user.id} (${user.name})`, changed.length ? `Changed: ${changed.join(", ")}` : "No field changes");
  };

  const removeUser = (user: User, reason: string) => {
    const a = requireManage();
    deleteUser(user.id);
    auditUserAction(a, "Account deleted", `${user.id} (${user.name})`, reason);
    setSelected((s) => s.filter((id) => id !== user.id));
    if (detail?.id === user.id) setDetail(null);
  };

  const runBulk = (reason: string) => {
    const a = requireManage();
    const targets = rows.filter((r) => selected.includes(r.user.id)).map((r) => r.user);
    for (const u of targets) {
      if (bulk === "delete") deleteUser(u.id);
      else if (bulk === "suspend" && u.status !== "Suspended") suspendUser(u.id, reason);
      else if (bulk === "reactivate" && u.status === "Suspended") activateUser(u.id);
    }
    auditUserAction(a, `Bulk ${bulk}`, `${targets.length} ${label.toLowerCase()}(s)`, `${targets.map((u) => u.id).join(", ")}. Reason: ${reason}`);
    setSelected([]);
  };

  const pageIds = paged.slice.map((r) => r.user.id);
  const allOnPage = pageIds.length > 0 && pageIds.every((id) => selected.includes(id));
  const toggleAll = () => setSelected((s) => (allOnPage ? s.filter((id) => !pageIds.includes(id)) : [...new Set([...s, ...pageIds])]));
  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const detailRow = detail ? rows.find((r) => r.user.id === detail.id) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-xs text-[#8896aa]">
          {canManage
            ? `Full control: add, edit, suspend, delete ${label.toLowerCase()}s and manage their plans. Every action is recorded in the audit log.`
            : "Read-only: changing accounts requires a Super Admin or Operations Manager."}
        </p>
        {canManage && (
          <button type="button" className={btnPrimary} onClick={() => setAdding(true)}>
            <UserPlus size={14} /> Add {label.toLowerCase()}
          </button>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          [`Total ${label}s`, kpis.total],
          ["With live plan", kpis.live],
          ["Expiring in 7 days", kpis.expiring],
          ["Suspended accounts", kpis.suspended],
        ].map(([k, v]) => (
          <Card key={k as string} className="p-4">
            <div className="text-[12px] font-semibold text-[#8896aa]">{k}</div>
            <div className="mt-1 text-[26px] font-extrabold tracking-[-0.04em] text-[#16233d]">{ready ? v : "—"}</div>
          </Card>
        ))}
      </div>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-3 border-b border-[#f1f4f9] p-4">
          <div className="relative min-w-[220px] flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9da9bc]" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Search ${label.toLowerCase()}s by name, email, phone or ID`}
              className="w-full rounded-xl border border-[#e2e8f2] bg-[#fbfcfe] py-2 pl-9 pr-3 text-xs font-medium text-[#22324d] outline-none placeholder:text-[#a1adc0] focus:border-[#087ed9] focus:bg-white"
            />
          </div>
          <select aria-label="Plan" value={planFilter} onChange={(e) => setPlanFilter(e.target.value)} className={selectCls}>
            <option value="all">All plans</option>
            <option value="none">No plan</option>
            {rolePlans.map((p) => (
              <option key={p.id} value={p.id}>{p.name}{p.status === "archived" ? " (archived)" : ""}</option>
            ))}
          </select>
          <select aria-label="Subscription status" value={subStatus} onChange={(e) => setSubStatus(e.target.value as typeof subStatus)} className={selectCls}>
            <option value="all">Any subscription</option>
            {SUB_STATUSES.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
          </select>
          <select aria-label="Account status" value={accountStatus} onChange={(e) => setAccountStatus(e.target.value as typeof accountStatus)} className={selectCls}>
            <option value="all">Any account status</option>
            {ACCOUNT_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          {hasFilters && (
            <button
              type="button"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#087ed9]"
              onClick={() => { setSearch(""); setAccountStatus("all"); setPlanFilter("all"); setSubStatus("all"); }}
            >
              <X size={13} /> Clear
            </button>
          )}
        </div>

        {canManage && selected.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 border-b border-[#f1f4f9] bg-[#f5f9ff] px-4 py-2.5 text-xs">
            <span className="font-bold text-[#24324b]">{selected.length} selected</span>
            <button type="button" className={btnSuspend} onClick={() => setBulk("suspend")}><Ban size={13} /> Suspend</button>
            <button type="button" className={btnReactivate} onClick={() => setBulk("reactivate")}><RotateCcw size={13} /> Reactivate</button>
            <button type="button" className={btnDelete} onClick={() => setBulk("delete")}><Trash2 size={13} /> Delete</button>
            <button type="button" className="ml-auto font-bold text-[#087ed9]" onClick={() => setSelected([])}>Clear selection</button>
          </div>
        )}

        {!ready ? (
          <TableSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState title={hasFilters ? `No ${label.toLowerCase()}s match these filters` : `No ${label.toLowerCase()}s yet`} hint={hasFilters ? "Try clearing a filter." : undefined} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-xs">
              <thead className="bg-[#fafbfe] text-[10px] font-extrabold uppercase tracking-wider text-[#94a1b5]">
                <tr>
                  {canManage && (
                    <th className="w-10 pl-4 py-3">
                      <input type="checkbox" aria-label="Select all on page" checked={allOnPage} onChange={toggleAll} />
                    </th>
                  )}
                  <th className="px-4 py-3">{label}</th>
                  <th className="px-3 py-3">Account</th>
                  <th className="px-3 py-3">Plan</th>
                  <th className="px-3 py-3">Activated</th>
                  <th className="px-3 py-3">Expires</th>
                  <th className="px-3 py-3">Usage</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f4f9]">
                {paged.slice.map(({ user, current }) => (
                  <tr key={user.id} className={selected.includes(user.id) ? "bg-[#f5f9ff]" : "hover:bg-[#fafcff]"}>
                    {canManage && (
                      <td className="pl-4 py-3">
                        <input type="checkbox" aria-label={`Select ${user.name}`} checked={selected.includes(user.id)} onChange={() => toggle(user.id)} />
                      </td>
                    )}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span className="font-bold text-[#1f2e48]">{user.name}</span>
                        <span className="rounded-md bg-[#eef3fc] px-1.5 py-0.5 font-mono text-[10px] font-semibold text-[#1B459B]">{user.id}</span>
                      </div>
                      <div className="mt-1.5 space-y-1 text-[11px] text-[#6b7b93]">
                        <div className="flex min-w-0 items-center gap-1.5"><Mail size={12} className="shrink-0 text-[#9aa7bb]" /><span className="truncate">{user.email}</span></div>
                        <div className="flex items-center gap-1.5"><Phone size={12} className="shrink-0 text-[#9aa7bb]" /><span className="whitespace-nowrap">{user.phone}</span></div>
                        {user.companyName && <div className="flex min-w-0 items-center gap-1.5"><Building2 size={12} className="shrink-0 text-[#9aa7bb]" /><span className="truncate">{user.companyName}</span></div>}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-extrabold ${ACCOUNT_STYLES[user.status]}`}>{user.status}</span>
                    </td>
                    <td className="px-3 py-3">
                      {current ? (
                        <div className="space-y-1">
                          <div className="font-semibold text-[#24324b]">{current.snapshot.name}</div>
                          <div className="flex items-center gap-1"><SubscriptionBadge status={current.status} />{current.source === "seed" && <SeedTag />}</div>
                        </div>
                      ) : (
                        <span className="text-[#a1adbd]">No plan</span>
                      )}
                    </td>
                    <td className="px-3 py-3 text-[#4b5b74]">{fmtDate(current?.activatedAt)}</td>
                    <td className="px-3 py-3 text-[#4b5b74]">{current ? fmtDate(current.expiresAt, "No expiry") : "—"}</td>
                    <td className="px-3 py-3 text-[#4b5b74]">
                      {current
                        ? usageFor(current, users, properties).map((u) => (
                            <div key={u.key}>{u.label}: <span className="font-bold text-[#24324b]">{u.used}</span> / {limitLabel(u.limit)}</div>
                          ))
                        : "—"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-1.5">
                        <button type="button" className={btnView} onClick={() => setDetail(user)} aria-label={`View ${user.name}`}>
                          <Eye size={13} /> View
                        </button>
                        {canManage && (
                          <button type="button" className={btnEdit} onClick={() => setEditTarget(user)} aria-label={`Edit ${user.name}`}>
                            <Pencil size={13} /> Edit
                          </button>
                        )}
                        {canManage && (
                          <button
                            type="button"
                            className={user.status === "Suspended" ? btnReactivate : btnSuspend}
                            onClick={() => setStatusTarget(user)}
                            aria-label={user.status === "Suspended" ? `Reactivate ${user.name}` : `Suspend ${user.name}`}
                          >
                            {user.status === "Suspended" ? <><RotateCcw size={13} /> Reactivate</> : <><Ban size={13} /> Suspend</>}
                          </button>
                        )}
                        {canManage && (
                          <button type="button" className={btnDelete} onClick={() => setDeleteTarget(user)} aria-label={`Delete ${user.name}`}>
                            <Trash2 size={13} className="text-red-500" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <Pagination {...paged} />
      </Card>

      {detailRow && (
        <RoleDetail
          row={detailRow}
          onClose={() => setDetail(null)}
          properties={properties}
          enquiries={enquiries}
          users={users}
          plans={rolePlans}
          actor={canManage ? actor : null}
          onEdit={() => setEditTarget(detailRow.user)}
          onStatus={() => setStatusTarget(detailRow.user)}
          onDelete={() => setDeleteTarget(detailRow.user)}
        />
      )}

      <UserAddModal
        isOpen={adding}
        defaultRole={role}
        onClose={() => setAdding(false)}
        onAdd={(u) => {
          const a = requireManage();
          const id = addUser(u);
          auditUserAction(a, "Account created", `${id} (${u.name})`, `New ${u.role} added by admin`);
        }}
      />

      <UserEditModal
        user={editTarget}
        isOpen={!!editTarget}
        onClose={() => setEditTarget(null)}
        onSave={(_id, updates) => {
          if (editTarget) saveEdit(editTarget, updates);
        }}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title={`Delete ${deleteTarget?.name}?`}
        body="The account is permanently removed from the directory. Its subscription and payment records are kept for accounting and the audit log."
        confirmLabel="Delete account"
        danger
        requireReason
        onConfirm={(reason) => {
          if (deleteTarget) removeUser(deleteTarget, reason);
        }}
      />

      <ConfirmDialog
        open={!!bulk}
        onClose={() => setBulk(null)}
        title={`${bulk === "delete" ? "Delete" : bulk === "suspend" ? "Suspend" : "Reactivate"} ${selected.length} ${label.toLowerCase()}${selected.length === 1 ? "" : "s"}?`}
        body={
          bulk === "delete"
            ? "Accounts are permanently removed. Subscription and payment records are kept."
            : bulk === "suspend"
              ? "Selected accounts are blocked. Already-suspended accounts are skipped."
              : "Suspended accounts among the selection return to Active."
        }
        confirmLabel={bulk === "delete" ? "Delete all" : bulk === "suspend" ? "Suspend all" : "Reactivate all"}
        danger={bulk !== "reactivate"}
        requireReason
        onConfirm={runBulk}
      />

      <ConfirmDialog
        open={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        title={statusTarget?.status === "Suspended" ? `Reactivate ${statusTarget?.name}?` : `Suspend ${statusTarget?.name}?`}
        body={
          statusTarget?.status === "Suspended"
            ? "The account returns to Active and can sign in again."
            : "The account is blocked from the platform. Subscription and payment records are not changed."
        }
        confirmLabel={statusTarget?.status === "Suspended" ? "Reactivate" : "Suspend account"}
        danger={statusTarget?.status !== "Suspended"}
        requireReason
        onConfirm={(reason) => {
          if (statusTarget) changeStatus(statusTarget, reason);
        }}
      />
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a9b3c5]">{title}</h3>
      {children}
    </section>
  );
}

function Field({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] text-[#8896aa]">{k}</dt>
      <dd className="font-semibold text-[#24324b]">{v}</dd>
    </div>
  );
}

function RoleDetail({
  row,
  onClose,
  properties,
  enquiries,
  users,
  plans,
  actor,
  onEdit,
  onStatus,
  onDelete,
}: {
  row: Row;
  onClose: () => void;
  properties: ReturnType<typeof usePropertyStore>["properties"];
  enquiries: ReturnType<typeof useEnquiryStore>["enquiries"];
  users: User[];
  plans: SubscriptionPlan[];
  /** Present only when the admin may manage accounts and billing. */
  actor: Actor | null;
  onEdit: () => void;
  onStatus: () => void;
  onDelete: () => void;
}) {
  const { user, subs, current } = row;
  const [subAction, setSubAction] = useState<"assign" | "extend" | "cancel" | "restore" | null>(null);
  const phone = normalizePhone(user.phone);
  const linked = user.role === "buyer" ? [] : linkedProperties(user, properties);
  const leads = enquiries.filter((e) => normalizePhone(e.property.ownerPhone) === phone);
  const buyerEnquiries = enquiries.filter((e) => normalizePhone(e.buyer.phone) === phone);
  const count = (s: string) => linked.filter((p) => p.status === s).length;

  return (
    <Modal open onClose={onClose} title={`${user.name} · ${user.id}`} wide>
      <div className="space-y-6 text-xs">
        {actor && (
          <div className="flex flex-wrap gap-1.5 rounded-2xl bg-[#f5f9ff] p-2.5">
            <button type="button" className={btnEdit} onClick={onEdit}><Pencil size={13} /> Edit account</button>
            <button type="button" className={user.status === "Suspended" ? btnReactivate : btnSuspend} onClick={onStatus}>
              {user.status === "Suspended" ? <><RotateCcw size={13} /> Reactivate</> : <><Ban size={13} /> Suspend</>}
            </button>
            <button type="button" className={btnSecondary} onClick={() => setSubAction("assign")}><CalendarPlus size={13} /> {current ? "Change plan" : "Assign plan"}</button>
            {current?.expiresAt && (current.status === "active" || current.status === "expiring" || current.status === "expired") && (
              <button type="button" className={btnSecondary} onClick={() => setSubAction("extend")}><CalendarPlus size={13} /> Extend</button>
            )}
            {current && (current.status === "active" || current.status === "expiring") && (
              <button type="button" className={btnSecondary} onClick={() => setSubAction("cancel")}><X size={13} className="text-red-500" /> Cancel plan</button>
            )}
            {current && (current.status === "cancelled" || current.status === "suspended") && (
              <button type="button" className={btnSecondary} onClick={() => setSubAction("restore")}><RotateCcw size={13} /> Restore plan</button>
            )}
            <button type="button" className={`${btnDelete} ml-auto`} onClick={onDelete}><Trash2 size={13} /> Delete</button>
          </div>
        )}

        <Section title="Profile">
          <dl className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <Field k="Email" v={user.email} />
            <Field k="Phone" v={user.phone} />
            <Field k="City" v={`${user.city}, ${user.state}`} />
            <Field k="Joined" v={user.joinedDate} />
            <Field k="Account status" v={user.status} />
            {user.role !== "buyer" && <Field k="Type" v={user.ownerType ?? "—"} />}
            {user.companyName && <Field k="Company" v={user.companyName} />}
            {user.role === "agent" && <Field k="RERA registration" v={user.reraRegistrationNumber ?? "Not provided"} />}
          </dl>
          {user.suspensionReason && <Notice tone="warn">Suspended: {user.suspensionReason}</Notice>}
        </Section>

        <Section title="Current subscription">
          {current ? (
            <div className="rounded-2xl border border-[#eef1f6] p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-sm font-extrabold text-[#1f2e48]">{current.snapshot.name}</span>
                <SubscriptionBadge status={current.status} />
                {current.payment && <PaymentBadge status={current.payment.verification} />}
                {current.source === "seed" && <SeedTag />}
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Field k="Plan price at purchase" v={inr(current.snapshot.price)} />
                <Field k="Amount paid" v={inr(current.amountPaid)} />
                <Field k="Billing" v={BILLING_LABEL[current.snapshot.billingCycle]} />
                <Field k="Plan version" v={`v${current.snapshot.version}`} />
                <Field k="Activated" v={fmtDate(current.activatedAt)} />
                <Field k="Expires" v={fmtDate(current.expiresAt, "No expiry")} />
              </dl>
              <div className="mt-4 space-y-2">
                {usageFor(current, users, properties).map((u) => {
                  const pct = u.limit === undefined || u.limit < 0 ? 0 : Math.min(100, Math.round((u.used / Math.max(1, u.limit)) * 100));
                  return (
                    <div key={u.key}>
                      <div className="flex justify-between text-[11px]"><span>{u.label}</span><span className="font-bold">{u.used} / {limitLabel(u.limit)}</span></div>
                      <div className="mt-1 h-1.5 rounded-full bg-[#eef1f6]"><div className={`h-1.5 rounded-full ${pct >= 100 ? "bg-red-500" : "bg-[#087ed9]"}`} style={{ width: `${u.limit !== undefined && u.limit < 0 ? 100 : pct}%`, opacity: u.limit !== undefined && u.limit < 0 ? 0.25 : 1 }} /></div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <p className="text-[#8896aa]">No subscription on record.</p>
          )}
        </Section>

        {user.role === "buyer" && (
          <>
            <Section title={`Saved properties (${user.savedPropertyIds?.length ?? 0})`}>
              {user.savedPropertyIds?.length ? (
                <ul className="flex flex-wrap gap-1.5">{user.savedPropertyIds.map((id) => <li key={id} className="rounded-lg bg-[#f3f6fb] px-2 py-1 font-semibold">{id}</li>)}</ul>
              ) : <p className="text-[#8896aa]">None.</p>}
            </Section>
            <Section title={`Enquiries (${(user.enquiries?.length ?? 0) + buyerEnquiries.length})`}>
              {[...(user.enquiries ?? []).map((e) => ({ id: e.id, title: e.propertyTitle, status: e.status, date: e.date })),
                ...buyerEnquiries.map((e) => ({ id: e.id, title: e.property.title, status: e.status, date: fmtDate(e.createdAt) }))].map((e) => (
                <div key={e.id} className="flex justify-between rounded-xl bg-[#fafbfe] px-3 py-2"><span className="font-semibold">{e.title}</span><span className="text-[#8896aa]">{e.status} · {e.date}</span></div>
              ))}
              {!user.enquiries?.length && !buyerEnquiries.length && <p className="text-[#8896aa]">None.</p>}
            </Section>
          </>
        )}

        {user.role !== "buyer" && (
          <Section title={`${user.role === "agent" ? "Managed" : "Linked"} properties (${linked.length})`}>
            <div className="flex flex-wrap gap-2">
              {(["Active", "Pending", "Rejected", "Draft"] as const).map((s) => (
                <span key={s} className="rounded-lg bg-[#f3f6fb] px-2 py-1 font-semibold">{s}: {count(s)}</span>
              ))}
            </div>
            {linked.map((p) => (
              <Link key={p.id} href={`/admin-dashboard/properties?id=${p.id}`} className="flex justify-between rounded-xl bg-[#fafbfe] px-3 py-2 hover:bg-sky-50">
                <span className="font-semibold">{p.id} · {p.title}</span>
                <span className={p.status === "Rejected" ? "text-red-600" : p.status === "Pending" ? "text-[#b45309]" : "text-[#8896aa]"}>{p.status}</span>
              </Link>
            ))}
          </Section>
        )}

        {user.role !== "buyer" && (
          <Section title={`Leads / enquiries received (${leads.length})`}>
            {leads.length ? leads.slice(0, 8).map((e) => (
              <div key={e.id} className="flex justify-between rounded-xl bg-[#fafbfe] px-3 py-2"><span className="font-semibold">{e.buyer.name} → {e.property.title}</span><span className="text-[#8896aa]">{e.status}</span></div>
            )) : <p className="text-[#8896aa]">None.</p>}
          </Section>
        )}

        <Section title={`Subscription & payment history (${subs.length})`}>
          {subs.length ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left">
                <thead className="text-[10px] uppercase text-[#94a1b5]"><tr><th className="py-1.5">Plan</th><th>Activated</th><th>Expires</th><th>Paid</th><th>Status</th><th>Payment</th></tr></thead>
                <tbody className="divide-y divide-[#f1f4f9]">
                  {subs.map((s) => (
                    <tr key={s.id}>
                      <td className="py-2 font-semibold">{s.snapshot.name}</td>
                      <td>{fmtDate(s.activatedAt)}</td>
                      <td>{fmtDate(s.expiresAt, "No expiry")}</td>
                      <td>{inr(s.amountPaid)}</td>
                      <td><SubscriptionBadge status={s.status} /></td>
                      <td>{s.payment ? <PaymentBadge status={s.payment.verification} /> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : <p className="text-[#8896aa]">No history.</p>}
          <p className="text-[11px] text-[#8896aa]">Payment records are read-only. They can only change through a verified gateway event.</p>
        </Section>
      </div>
      {actor && subAction === "assign" && (
        <AssignPlanDialog user={user} current={current} plans={plans} actor={actor} onClose={() => setSubAction(null)} />
      )}
      {actor && subAction === "extend" && current && (
        <ExtendDialog sub={current} actor={actor} onClose={() => setSubAction(null)} />
      )}
      {actor && current && (subAction === "cancel" || subAction === "restore") && (
        <ConfirmDialog
          open
          onClose={() => setSubAction(null)}
          title={subAction === "cancel" ? `Cancel ${current.snapshot.name}?` : `Restore ${current.snapshot.name}?`}
          body={
            subAction === "cancel"
              ? "Plan access ends now. No refund is issued here. Refunds go through the payment provider."
              : "The plan returns to its normal status based on its expiry date."
          }
          confirmLabel={subAction === "cancel" ? "Cancel plan" : "Restore plan"}
          danger={subAction === "cancel"}
          requireReason
          onConfirm={(reason) => setSubscriptionAdminStatus(current.id, subAction === "cancel" ? "cancelled" : null, reason, actor)}
        />
      )}
    </Modal>
  );
}

function AssignPlanDialog({
  user,
  current,
  plans,
  actor,
  onClose,
}: {
  user: User;
  current?: SubscriptionView;
  plans: SubscriptionPlan[];
  actor: Actor;
  onClose: () => void;
}) {
  const options = plans.filter((p) => p.status !== "archived");
  const [planId, setPlanId] = useState(options[0]?.id ?? "");
  const plan = options.find((p) => p.id === planId);
  const [days, setDays] = useState<string>(plan?.validityDays ? String(plan.validityDays) : "");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const pick = (id: string) => {
    setPlanId(id);
    const p = options.find((x) => x.id === id);
    setDays(p?.validityDays ? String(p.validityDays) : "");
  };

  const submit = () => {
    try {
      grantSubscription(
        { role: user.role, planId, subscriberName: user.name, subscriberPhone: user.phone, validityDays: days.trim() === "" ? null : Number(days), reason },
        actor,
      );
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not assign the plan.");
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`${current ? "Change" : "Assign"} plan for ${user.name}`}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose}>Cancel</button>
          <button type="button" className={btnPrimary} onClick={submit} disabled={!planId}>Assign plan</button>
        </>
      }
    >
      <div className="space-y-3 text-xs">
        {options.length === 0 ? (
          <p className="text-[#8896aa]">No {user.role} plans exist. Create one in Subscription Plans first.</p>
        ) : (
          <>
            <label className="block">
              <span className="mb-1 block font-bold text-[#344560]">Plan</span>
              <select className={`${selectCls} w-full`} value={planId} onChange={(e) => pick(e.target.value)}>
                {options.map((p) => (
                  <option key={p.id} value={p.id}>{p.name} · {p.price === 0 ? "Free" : inr(p.price)}{p.status !== "active" ? ` (${p.status})` : ""}</option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="mb-1 block font-bold text-[#344560]">Validity (days)</span>
              <input className={inputCls} type="number" min={1} value={days} placeholder="Leave empty for no expiry" onChange={(e) => setDays(e.target.value)} />
            </label>
            <label className="block">
              <span className="mb-1 block font-bold text-[#344560]">Reason</span>
              <textarea rows={2} className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Offline payment received, goodwill extension" />
            </label>
            <Notice>
              Recorded as a <strong>₹0 admin grant</strong>, not a paid purchase, so revenue stays accurate.
              {current ? ` It replaces ${current.snapshot.name}.` : ""}
            </Notice>
          </>
        )}
        {error && <p className="font-semibold text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}

function ExtendDialog({ sub, actor, onClose }: { sub: SubscriptionView; actor: Actor; onClose: () => void }) {
  const [days, setDays] = useState("30");
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const n = Number(days);
  const base = Math.max(Date.now(), sub.expiresAt ? new Date(sub.expiresAt).getTime() : Date.now());
  const preview = Number.isInteger(n) && n > 0 ? fmtDate(new Date(base + n * 864e5).toISOString()) : "—";
  const submit = () => {
    try {
      extendSubscription(sub.id, n, reason, actor);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not extend.");
    }
  };
  return (
    <Modal
      open
      onClose={onClose}
      title={`Extend ${sub.snapshot.name}`}
      footer={
        <>
          <button type="button" className={btnSecondary} onClick={onClose}>Cancel</button>
          <button type="button" className={btnPrimary} onClick={submit}>Extend</button>
        </>
      }
    >
      <div className="space-y-3 text-xs">
        <label className="block">
          <span className="mb-1 block font-bold text-[#344560]">Add days</span>
          <input className={inputCls} type="number" min={1} value={days} onChange={(e) => setDays(e.target.value)} />
        </label>
        <p className="text-[#4b5b74]">Expiry: <span className="font-semibold">{fmtDate(sub.expiresAt)}</span> → <span className="font-bold text-[#16233d]">{preview}</span></p>
        <label className="block">
          <span className="mb-1 block font-bold text-[#344560]">Reason</span>
          <textarea rows={2} className={inputCls} value={reason} onChange={(e) => setReason(e.target.value)} />
        </label>
        {error && <p className="font-semibold text-red-600">{error}</p>}
      </div>
    </Modal>
  );
}
