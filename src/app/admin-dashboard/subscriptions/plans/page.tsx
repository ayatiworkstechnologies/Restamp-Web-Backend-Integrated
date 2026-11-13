"use client";

import { toast } from "@/lib/notify";
import React, { useMemo, useState } from "react";
import { Archive, Eye, EyeOff, MonitorSmartphone, Pause, Pencil, Play, Plus, Star, Trash2, RotateCcw } from "lucide-react";
import { AdminShell } from "@/components/dashboard/admin-shell";
import { PlanEditor, PlanPreviewCard, emptyDraft, toDraft } from "@/components/subscriptions/plan-editor";
import OwnerAssistancePlans from "@/components/owner/OwnerAssistancePlans";
import { toOwnerPlan } from "@/lib/ownerPlan";
import {
  Card,
  ConfirmDialog,
  EmptyState,
  Modal,
  Notice,
  PlanStatusBadge,
  TableSkeleton,
  btnPrimary,
  btnSecondary,
  fmtDate,
  inr,
  limitLabel,
  useActor,
} from "@/components/subscriptions/ui";
import { deletePlan, planIsReferenced, setPlanStatus, useSubscriptionData, type PlanDraft } from "@/lib/subscription-store";
import { BILLING_LABEL, ROLE_FEATURES, ROLE_LABEL, type PlanStatus, type SubscriberRole, type SubscriptionPlan } from "@/types/subscription";

const ROLES: SubscriberRole[] = ["buyer", "owner", "agent"];
const PUBLIC_PATH: Record<SubscriberRole, string> = { buyer: "/plans", owner: "/owner/plans", agent: "/agent/packages" };
const rolePlansPublic = (plans: SubscriptionPlan[], role: SubscriberRole) =>
  plans.filter((p) => p.role === role && p.status === "active" && p.visible);

type PendingAction = { plan: SubscriptionPlan; kind: "status"; to: PlanStatus } | { plan: SubscriptionPlan; kind: "delete" };

export default function SubscriptionPlansPage() {
  const { ready, plans, subscriptions } = useSubscriptionData();
  const { actor, canManage } = useActor();
  const [role, setRole] = useState<SubscriberRole>("owner");
  const [showArchived, setShowArchived] = useState(false);
  const [editor, setEditor] = useState<{ initial: PlanDraft; original?: SubscriptionPlan } | null>(null);
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [previewPlan, setPreviewPlan] = useState<SubscriptionPlan | null>(null);
  const [previewPage, setPreviewPage] = useState(false);
  const publicPlans = rolePlansPublic(plans, role);

  const rolePlans = useMemo(() => plans.filter((p) => p.role === role), [plans, role]);
  const visiblePlans = rolePlans.filter((p) => showArchived || p.status !== "archived");
  const liveCount = (id: string) => subscriptions.filter((s) => s.planId === id && (s.status === "active" || s.status === "expiring")).length;
  const counts = Object.fromEntries(ROLES.map((r) => [r, plans.filter((p) => p.role === r && p.status !== "archived").length])) as Record<SubscriberRole, number>;

  const done = (msg: string) => {
    toast.success(msg);
  };

  const runPending = (reason: string) => {
    if (!pending || !actor) return;
    void reason;
    if (pending.kind === "delete") {
      deletePlan(pending.plan.id, actor);
      done(`Deleted draft "${pending.plan.name}".`);
    } else {
      setPlanStatus(pending.plan.id, pending.to, actor);
      done(`"${pending.plan.name}" is now ${pending.to}.`);
    }
  };

  const actionCopy = (a: PendingAction) => {
    if (a.kind === "delete") return { title: `Delete draft "${a.plan.name}"?`, body: "This draft was never sold. It will be removed permanently.", label: "Delete draft", danger: true };
    const n = liveCount(a.plan.id);
    const keep = n ? ` ${n} live subscriber${n === 1 ? "" : "s"} keep their current terms until expiry.` : "";
    switch (a.to) {
      case "active":
        return { title: `Publish "${a.plan.name}"?`, body: `It becomes purchasable at ${inr(a.plan.price)}${a.plan.visible ? " and appears on the public pricing page immediately" : " (hidden from the pricing page)"}.`, label: "Publish", danger: false };
      case "inactive":
        return { title: `Pause "${a.plan.name}"?`, body: `New customers can no longer buy it.${keep}`, label: "Pause plan", danger: false };
      case "archived":
        return { title: `Archive "${a.plan.name}"?`, body: `The plan is retired and kept for history. It can't be sold.${keep}`, label: "Archive", danger: true };
      default:
        return { title: `Move "${a.plan.name}" to ${a.to}?`, body: keep, label: "Confirm", danger: false };
    }
  };

  return (
    <AdminShell
      section="Subscription Management"
      title="Subscription Plans"
      actions={
        canManage && (
          <button type="button" className={btnPrimary} onClick={() => setEditor({ initial: emptyDraft(role, rolePlans.length) })}>
            <Plus size={14} /> <span className="hidden sm:inline">New {ROLE_LABEL[role]} plan</span><span className="sm:hidden">New</span>
          </button>
        )
      }
    >
      {!canManage && <Notice tone="warn">You can view plans. Changing plans and prices requires a Super Admin or Operations Manager.</Notice>}

      <Card className="p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div role="tablist" aria-label="Role" className="grid grid-cols-3 gap-1 rounded-2xl bg-[#f3f6fb] p-1 sm:w-[420px]">
            {ROLES.map((r) => (
              <button
                key={r}
                role="tab"
                type="button"
                aria-selected={role === r}
                onClick={() => setRole(r)}
                className={`rounded-xl px-3 py-2 text-xs font-bold transition ${role === r ? "bg-white text-[#087ed9] shadow-sm" : "text-[#6f7e95] hover:text-[#24324b]"}`}
              >
                {ROLE_LABEL[r]} <span className="ml-1 text-[10px] text-[#a1adbd]">{ready ? counts[r] : ""}</span>
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
          <button type="button" className={btnSecondary} onClick={() => setPreviewPage(true)}>
            <MonitorSmartphone size={14} /> Preview pricing page
          </button>
          <label className="flex items-center gap-2 text-xs font-semibold text-[#6f7e95]">
            <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} /> Show archived
          </label>
          </div>
        </div>
        <p className="mt-3 text-[11px] text-[#8896aa]">
          Configurable limits for {ROLE_LABEL[role].toLowerCase()}s: {ROLE_FEATURES[role].map((f) => `${f.label}${f.enforced ? "" : " (display only)"}`).join(", ")}.
          Prices exclude 18% GST, which is added at checkout.
        </p>
      </Card>

      {!ready ? (
        <Card><TableSkeleton rows={4} /></Card>
      ) : visiblePlans.length === 0 ? (
        <Card><EmptyState title={`No ${ROLE_LABEL[role].toLowerCase()} plans`} hint={canManage ? "Create the first plan with the New plan button." : undefined} /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {visiblePlans.map((p) => {
            const live = liveCount(p.id);
            const referenced = planIsReferenced(p.id);
            return (
              <Card key={p.id} className={`flex flex-col p-5 ${p.status === "archived" ? "opacity-70" : ""}`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h2 className="truncate text-sm font-extrabold text-[#1f2e48]">{p.name}</h2>
                      {p.recommended && <Star size={13} className="shrink-0 fill-amber-400 text-amber-400" aria-label="Recommended" />}
                    </div>
                    <div className="truncate text-[11px] text-[#8896aa]">{p.description || "No description"}</div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {!p.visible && <EyeOff size={13} className="text-[#a1adbd]" aria-label="Hidden from pricing page" />}
                    <PlanStatusBadge status={p.status} />
                  </div>
                </div>
                <div className="mt-3 text-[26px] font-extrabold tracking-[-0.04em] text-[#16233d]">
                  {p.price === 0 ? "Free" : inr(p.price)}
                  <span className="ml-1 text-[11px] font-semibold tracking-normal text-[#8896aa]">{BILLING_LABEL[p.billingCycle]}</span>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 text-[11px]">
                  <dt className="text-[#8896aa]">Validity</dt>
                  <dd className="font-semibold text-[#24324b]">{p.validityDays ? `${p.validityDays} days` : p.role === "owner" ? "Until deal closed" : "No expiry"}</dd>
                  {ROLE_FEATURES[p.role].map((f) => (
                    <React.Fragment key={f.key}>
                      <dt className="text-[#8896aa]">{f.label}</dt>
                      <dd className="font-semibold text-[#24324b]">{limitLabel(p.limits[f.key])}</dd>
                    </React.Fragment>
                  ))}
                  <dt className="text-[#8896aa]">Live subscribers</dt>
                  <dd className="font-semibold text-[#24324b]">{live}</dd>
                  <dt className="text-[#8896aa]">Version</dt>
                  <dd className="font-semibold text-[#24324b]">v{p.version} · {fmtDate(p.updatedAt)} · {p.updatedBy}</dd>
                </dl>
                <div className="mt-auto flex flex-wrap gap-1.5 pt-4">
                  <button type="button" className={btnSecondary} onClick={() => setPreviewPlan(p)} aria-label={`Preview ${p.name}`}>
                    <Eye size={13} /> Preview
                  </button>
                  <button type="button" className={btnSecondary} onClick={() => setEditor({ initial: toDraft(p), original: p })}>
                    {canManage ? <><Pencil size={13} /> Edit</> : <><Eye size={13} /> Details</>}
                  </button>
                  {canManage && (p.status === "draft" || p.status === "inactive") && (
                    <button type="button" className={btnSecondary} onClick={() => setPending({ plan: p, kind: "status", to: "active" })}><Play size={13} /> Publish</button>
                  )}
                  {canManage && p.status === "active" && (
                    <button type="button" className={btnSecondary} onClick={() => setPending({ plan: p, kind: "status", to: "inactive" })}><Pause size={13} /> Pause</button>
                  )}
                  {canManage && p.status !== "archived" && p.status !== "draft" && (
                    <button type="button" className={btnSecondary} onClick={() => setPending({ plan: p, kind: "status", to: "archived" })}><Archive size={13} /> Archive</button>
                  )}
                  {canManage && p.status === "archived" && (
                    <button type="button" className={btnSecondary} onClick={() => setPending({ plan: p, kind: "status", to: "inactive" })}><RotateCcw size={13} /> Restore</button>
                  )}
                  {canManage && p.status === "draft" && !referenced && (
                    <button type="button" className={btnSecondary} onClick={() => setPending({ plan: p, kind: "delete" })}><Trash2 size={13} className="text-red-500" /> Delete</button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {previewPlan && (
        <Modal open onClose={() => setPreviewPlan(null)} title={`Preview: ${previewPlan.name}`} wide={previewPlan.role === "owner"}>
          {previewPlan.role === "owner" ? (
            <div className="overflow-hidden rounded-3xl">
              <div className="mx-auto max-w-md">
                <OwnerAssistancePlans plans={[toOwnerPlan(previewPlan)]} preview showHeader={false} />
              </div>
            </div>
          ) : (
            <PlanPreviewCard plan={previewPlan} />
          )}
          <p className="mt-3 text-[11px] text-[#8896aa]">
            {previewPlan.status === "active" && previewPlan.visible
              ? `Live on ${PUBLIC_PATH[previewPlan.role]} for new customers.`
              : `Not shown to customers (status: ${previewPlan.status}${previewPlan.visible ? "" : ", hidden"}).`}
          </p>
        </Modal>
      )}

      {previewPage && (
        <Modal open wide xwide={role === "owner"} onClose={() => setPreviewPage(false)} title={role === "owner" ? "Website preview: Owner Assistance Plans" : `${ROLE_LABEL[role]} pricing page preview`}
          footer={<a href={role === "owner" ? "/owner" : PUBLIC_PATH[role]} target="_blank" rel="noreferrer" className={btnSecondary}>Open live page ↗</a>}>
          {role === "owner" ? (
            <>
              <p className="border-b border-[#eef1f6] px-5 py-3 text-xs text-[#8896aa]">
                Exactly what visitors see in the Assistance Plans section on /owner: {publicPlans.length} plan{publicPlans.length === 1 ? "" : "s"} on sale. Buttons are disabled in preview.
              </p>
              <OwnerAssistancePlans plans={publicPlans.map(toOwnerPlan)} preview />
            </>
          ) : (<>
          <p className="mb-4 text-xs text-[#8896aa]">
            {publicPlans.length} plan{publicPlans.length === 1 ? "" : "s"} shown to new customers on {PUBLIC_PATH[role]}. Drafts, paused, hidden and archived plans are excluded.
          </p>
          {publicPlans.length === 0 ? (
            <EmptyState title="No plans on sale" hint="Publish a plan to show it to customers." />
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {publicPlans.map((p) => <PlanPreviewCard key={p.id} plan={p} />)}
            </div>
          )}
          </>)}
        </Modal>
      )}

      {editor && (
        <PlanEditor
          open
          initial={editor.initial}
          original={editor.original}
          activeSubscribers={editor.original ? liveCount(editor.original.id) : 0}
          onClose={() => setEditor(null)}
          onSaved={(plan) => {
            setEditor(null);
            done(editor.original ? `Saved "${plan.name}" (v${plan.version}).` : `Created "${plan.name}".`);
          }}
        />
      )}

      {pending && (() => {
        const c = actionCopy(pending);
        return (
          <ConfirmDialog open onClose={() => setPending(null)} title={c.title} body={c.body} confirmLabel={c.label} danger={c.danger} onConfirm={runPending} />
        );
      })()}
    </AdminShell>
  );
}
