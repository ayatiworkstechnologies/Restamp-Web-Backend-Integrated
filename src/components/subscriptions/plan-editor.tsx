"use client";

import React, { useEffect, useMemo, useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import type { BillingCycle, PlanLimits, PlanStatus, SubscriberRole, SubscriptionPlan } from "@/types/subscription";
import { BILLING_LABEL, ROLE_FEATURES, ROLE_LABEL } from "@/types/subscription";
import { diffPlan, savePlan, validatePlan, type PlanDraft } from "@/lib/subscription-store";
import OwnerAssistancePlans from "@/components/owner/OwnerAssistancePlans";
import { toOwnerPlan } from "@/lib/ownerPlan";
import { Modal, Notice, btnPrimary, btnSecondary, inputCls, inr, limitLabel, selectCls, useActor } from "@/components/subscriptions/ui";

const CYCLES: BillingCycle[] = ["monthly", "quarterly", "yearly", "one_time"];
const DEFAULT_VALIDITY: Record<BillingCycle, number> = { monthly: 30, quarterly: 90, yearly: 365, one_time: 30 };

export function emptyDraft(role: SubscriberRole, sortOrder: number): PlanDraft {
  const limits: PlanLimits = {};
  for (const f of ROLE_FEATURES[role]) limits[f.key] = 0;
  return {
    role,
    name: "",
    description: "",
    badge: "",
    price: 0,
    currency: "INR",
    billingCycle: "monthly",
    validityDays: 30,
    status: "draft",
    visible: true,
    recommended: false,
    limits,
    features: [],
    sortOrder,
  };
}

export function toDraft(p: SubscriptionPlan): PlanDraft {
  const { version, createdAt, updatedAt, updatedBy, ...rest } = p;
  void version; void createdAt; void updatedAt; void updatedBy;
  return { ...rest, limits: { ...p.limits }, features: [...p.features] };
}

function Label({ children, error, hint }: { children: React.ReactNode; error?: string; hint?: string }) {
  return (
    <span className="mb-1 block">
      <span className="text-xs font-bold text-[#344560]">{children}</span>
      {hint && <span className="ml-1.5 text-[10px] text-[#94a1b5]">{hint}</span>}
      {error && <span className="block text-[11px] font-semibold text-red-600">{error}</span>}
    </span>
  );
}

function Toggle({ checked, onChange, label, hint }: { checked: boolean; onChange: (v: boolean) => void; label: string; hint?: string }) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-[#cdd6e4] text-white transition peer-checked:border-[#087ed9] peer-checked:bg-[#087ed9] peer-focus-visible:ring-2 peer-focus-visible:ring-[#087ed9]/40">
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      <span>
        <span className="block text-xs font-semibold text-[#24324b]">{label}</span>
        {hint && <span className="block text-[11px] text-[#8896aa]">{hint}</span>}
      </span>
    </label>
  );
}

/**
 * Create / edit a plan. Two steps: edit → preview (shows diff, price change and
 * impact on existing subscribers) → publish.
 */
export function PlanEditor({
  open,
  initial,
  original,
  activeSubscribers,
  onClose,
  onSaved,
}: {
  open: boolean;
  initial: PlanDraft;
  original?: SubscriptionPlan;
  activeSubscribers: number;
  onClose: () => void;
  onSaved: (plan: SubscriptionPlan) => void;
}) {
  const { actor, canManage } = useActor();
  const [d, setD] = useState<PlanDraft>(initial);
  const [step, setStep] = useState<"edit" | "preview">("edit");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saveError, setSaveError] = useState("");
  const [featuresText, setFeaturesText] = useState(initial.features.join("\n"));

  useEffect(() => {
    if (open) {
      setD(initial);
      setFeaturesText(initial.features.join("\n"));
      setStep("edit");
      setErrors({});
      setSaveError("");
    }
  }, [open, initial]);

  const draft = useMemo(() => ({ ...d, features: featuresText.split("\n").map((f) => f.trim()).filter(Boolean) }), [d, featuresText]);
  const changes = useMemo(() => diffPlan(original, draft), [original, draft]);
  const priceChanged = !!original && original.price !== draft.price;
  const set = <K extends keyof PlanDraft>(k: K, v: PlanDraft[K]) => setD((x) => ({ ...x, [k]: v }));
  const setLimit = (k: keyof PlanLimits, v: number) => setD((x) => ({ ...x, limits: { ...x.limits, [k]: v } }));

  const toPreview = () => {
    const e = validatePlan(draft);
    setErrors(e);
    if (Object.keys(e).length === 0) setStep("preview");
  };

  const publish = () => {
    if (!actor) return;
    try {
      onSaved(savePlan(draft, actor));
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : "Could not save plan.");
    }
  };

  const title = `${original ? "Edit" : "New"} ${ROLE_LABEL[d.role]} plan${step === "preview" ? ": preview" : ""}`;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      wide
      footer={
        step === "edit" ? (
          <>
            <button type="button" className={btnSecondary} onClick={onClose}>Cancel</button>
            <button type="button" className={btnPrimary} onClick={toPreview} disabled={!canManage}>
              Preview configuration <ArrowRight size={14} />
            </button>
          </>
        ) : (
          <>
            <button type="button" className={btnSecondary} onClick={() => setStep("edit")}>Back to edit</button>
            <button type="button" className={btnPrimary} onClick={publish} disabled={!canManage || (!!original && changes.length === 0)}>
              {original ? "Confirm & publish changes" : "Create plan"}
            </button>
          </>
        )
      }
    >
      {!canManage && <div className="mb-4"><Notice tone="warn">Your admin role ({actor?.role}) can view plans but cannot change them.</Notice></div>}

      {step === "edit" ? (
        <fieldset disabled={!canManage} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label>
            <Label error={errors.name}>Plan name</Label>
            <input className={inputCls} value={d.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Standard" />
          </label>
          <label>
            <Label error={errors.price} hint="Before GST">Price (₹)</Label>
            <input className={inputCls} type="number" min={0} step={1} inputMode="numeric" value={Number.isNaN(d.price) ? "" : d.price} onChange={(e) => set("price", e.target.value === "" ? NaN : Number(e.target.value))} />
          </label>
          <label>
            <Label>Billing cycle</Label>
            <select
              className={`${selectCls} w-full`}
              value={d.billingCycle}
              onChange={(e) => {
                const c = e.target.value as BillingCycle;
                setD((x) => ({ ...x, billingCycle: c, validityDays: x.validityDays === null ? null : DEFAULT_VALIDITY[c] }));
              }}
            >
              {CYCLES.map((c) => <option key={c} value={c}>{BILLING_LABEL[c]}</option>)}
            </select>
          </label>
          <label>
            <Label error={errors.validityDays}>Validity (days)</Label>
            <input
              className={inputCls}
              type="number"
              min={1}
              disabled={d.validityDays === null}
              value={d.validityDays ?? ""}
              placeholder={d.validityDays === null ? (d.role === "owner" ? "Until deal closed" : "No expiry") : ""}
              onChange={(e) => set("validityDays", e.target.value === "" ? NaN : Number(e.target.value))}
            />
            <span className="mt-1.5 block">
              <Toggle
                checked={d.validityDays === null}
                onChange={(v) => set("validityDays", v ? null : DEFAULT_VALIDITY[d.billingCycle])}
                label={d.role === "owner" ? "Valid until deal closed" : "No expiry"}
              />
            </span>
          </label>
          <label className="sm:col-span-2">
            <Label>Description</Label>
            <input className={inputCls} value={d.description} onChange={(e) => set("description", e.target.value)} placeholder="One line shown under the plan name" />
          </label>
          {d.role === "agent" && (
            <label>
              <Label hint="optional">Badge</Label>
              <input className={inputCls} value={d.badge ?? ""} onChange={(e) => set("badge", e.target.value)} placeholder="e.g. Growth Agent" />
            </label>
          )}

          <div className="space-y-3 sm:col-span-2">
            <div className="text-xs font-bold text-[#344560]">Plan limits</div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {ROLE_FEATURES[d.role].map((f) => {
                const v = d.limits[f.key];
                const unlimited = v !== undefined && v < 0;
                return (
                  <div key={f.key} className="rounded-xl border border-[#eef1f6] p-3">
                    <Label error={errors[`limits.${f.key}`]} hint={f.enforced ? undefined : "display only"}>{f.label}</Label>
                    <input
                      className={inputCls}
                      type="number"
                      min={0}
                      disabled={unlimited}
                      value={unlimited ? "" : v ?? ""}
                      placeholder={unlimited ? "Unlimited" : ""}
                      onChange={(e) => setLimit(f.key, e.target.value === "" ? NaN : Number(e.target.value))}
                    />
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <Toggle checked={unlimited} onChange={(on) => setLimit(f.key, on ? -1 : 0)} label="Unlimited" />
                    </div>
                    <p className={`mt-1.5 text-[10px] ${f.enforced ? "text-[#8896aa]" : "text-[#b45309]"}`}>{f.note}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <label className="sm:col-span-2">
            <Label hint="one per line · marketing copy shown on the pricing card">Plan features</Label>
            <textarea className={inputCls} rows={4} value={featuresText} onChange={(e) => setFeaturesText(e.target.value)} />
            <span className="mt-1 block text-[10px] text-[#b45309]">Only list benefits that already work in the app. These lines are not enforced.</span>
          </label>

          <div className="grid grid-cols-1 gap-3 sm:col-span-2 sm:grid-cols-3">
            <label>
              <Label>Status</Label>
              <select className={`${selectCls} w-full`} value={d.status} onChange={(e) => set("status", e.target.value as PlanStatus)}>
                <option value="draft">Draft (not sold)</option>
                <option value="active">Active (on sale)</option>
                <option value="inactive">Inactive (paused)</option>
                {original && <option value="archived">Archived (retired)</option>}
              </select>
            </label>
            <div className="pt-6"><Toggle checked={d.visible} onChange={(v) => set("visible", v)} label="Visible on pricing page" /></div>
            <div className="pt-6"><Toggle checked={d.recommended} onChange={(v) => set("recommended", v)} label="Mark as recommended" hint="Replaces the current one" /></div>
          </div>
        </fieldset>
      ) : (
        <div className="space-y-5 text-xs">
          {priceChanged && (
            <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-[#fde68a] bg-[#fffbeb] p-4">
              <span className="font-bold text-[#92400e]">Price change</span>
              <span className="text-base font-extrabold text-slate-500 line-through">{inr(original!.price)}</span>
              <ArrowRight size={16} className="text-[#92400e]" />
              <span className="text-base font-extrabold text-[#16233d]">{inr(draft.price)}</span>
              <span className="text-[#92400e]">
                ({draft.price > original!.price ? "+" : ""}{Math.round(((draft.price - original!.price) / Math.max(1, original!.price)) * 100)}%)
              </span>
            </div>
          )}

          {original && (
            <Notice>
              {activeSubscribers > 0
                ? `${activeSubscribers} live subscription${activeSubscribers === 1 ? "" : "s"} on this plan ${activeSubscribers === 1 ? "keeps" : "keep"} the price and limits they bought. Changes apply to new purchases only.`
                : "No live subscriptions on this plan. Changes apply to new purchases."}{" "}
              Recurring renewals aren't implemented, so nobody is re-charged at the new price.
            </Notice>
          )}

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <div className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a9b3c5]">{draft.role === "owner" ? "Website preview (/owner)" : "Pricing card preview"}</div>
              {draft.role === "owner" ? (
                <div className="overflow-hidden rounded-3xl">
                  <OwnerAssistancePlans plans={[toOwnerPlan(draft as SubscriptionPlan)]} preview showHeader={false} />
                </div>
              ) : (
                <PlanPreviewCard plan={draft} />
              )}
              <p className="mt-2 text-[11px] text-[#8896aa]">
                {draft.status === "active" && draft.visible ? "Will be shown to new customers immediately." : `Not shown publicly (status: ${draft.status}${draft.visible ? "" : ", hidden"}).`}
              </p>
            </div>
            <div>
              <div className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#a9b3c5]">{original ? `Changes (${changes.length})` : "Configuration"}</div>
              {original && changes.length === 0 ? (
                <p className="text-[#8896aa]">No changes to publish.</p>
              ) : (
                <table className="w-full text-left">
                  <tbody className="divide-y divide-[#f1f4f9]">
                    {changes.map((c) => (
                      <tr key={c.field}>
                        <td className="py-1.5 pr-2 font-semibold text-[#344560]">{c.field}</td>
                        {original && <td className="py-1.5 pr-2 text-slate-400 line-through">{c.from}</td>}
                        <td className="py-1.5 font-semibold text-[#16233d]">{c.to}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
          {saveError && <p className="font-semibold text-red-600">{saveError}</p>}
        </div>
      )}
    </Modal>
  );
}

/** Pricing card as customers see it. Shared by the editor preview and the plans page. */
export function PlanPreviewCard({ plan }: { plan: Pick<PlanDraft, "role" | "name" | "badge" | "description" | "price" | "billingCycle" | "validityDays" | "recommended" | "limits" | "features"> }) {
  return (
    <div className={`flex h-full flex-col rounded-3xl border bg-white p-5 text-xs ${plan.recommended ? "border-[#087ed9] ring-1 ring-[#087ed9]" : "border-slate-200"}`}>
      {plan.recommended && <span className="mb-2 self-start rounded-full bg-[#087ed9] px-2.5 py-0.5 text-[10px] font-bold uppercase text-white">Recommended</span>}
      <div className="text-base font-bold text-slate-900">{plan.name || "Untitled plan"}</div>
      {plan.badge && <div className="text-[11px] font-semibold text-[#087ed9]">{plan.badge}</div>}
      <div className="mt-1 text-slate-500">{plan.description}</div>
      <div className="mt-3 text-2xl font-extrabold text-slate-900">
        {plan.price === 0 ? "Free" : inr(plan.price)}
        {plan.price > 0 && <span className="block whitespace-nowrap text-xs font-medium text-slate-500">+ GST · {BILLING_LABEL[plan.billingCycle]}</span>}
      </div>
      <div className="mt-1 text-slate-500">{plan.validityDays ? `${plan.validityDays} days validity` : plan.role === "owner" ? "Until deal closed" : "No expiry"}</div>
      <ul className="mt-3 space-y-1.5">
        {ROLE_FEATURES[plan.role].map((f) => (
          <li key={f.key} className="flex gap-1.5"><Check size={14} className="mt-0.5 shrink-0 text-[#087ed9]" />{f.label}: {limitLabel(plan.limits[f.key])}</li>
        ))}
        {plan.features.map((f) => <li key={f} className="flex gap-1.5"><Check size={14} className="mt-0.5 shrink-0 text-[#087ed9]" />{f}</li>)}
      </ul>
    </div>
  );
}
