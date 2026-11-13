"use client";

/**
 * Subscription store: the single source of truth for plans, subscriptions,
 * payments, pricing history and the admin audit log.
 *
 * Persistence follows the existing RESTAMP pattern (browser localStorage), so
 * data is per-browser and NOT secure. Every function here is written as the
 * future API boundary: swap the read/write helpers for fetch() calls to a
 * backend and the UI keeps working. See PAYMENTS.md.
 */

import { useEffect, useState } from "react";
import type {
  AuditEntry,
  PaymentRecord,
  PlanStatus,
  PricingHistoryEntry,
  SubscriberRole,
  SubscriptionPlan,
  SubscriptionStatus,
  UserSubscription,
} from "@/types/subscription";
import { BILLING_LABEL } from "@/types/subscription";
import { SEED_PLANS, buildSeedSubscriptions } from "@/lib/subscription-seed";

const KEYS = {
  plans: "restamp_sub_plans_v1",
  subs: "restamp_sub_subscriptions_v1",
  payments: "restamp_sub_payments_v1",
  history: "restamp_sub_pricing_history_v1",
  audit: "restamp_sub_audit_v1",
  seeded: "restamp_sub_seeded_v1",
} as const;

export const SUBSCRIPTION_EVENT = "restamp-subscriptions-change";
export const EXPIRING_WINDOW_DAYS = 7;

/* ------------------------------------------------------------------ */
/* Authorization                                                       */
/* ------------------------------------------------------------------ */

export interface Actor {
  name: string;
  role: string;
}

/** Admin roles allowed to change plans, prices, subscriptions and account status. */
export const BILLING_ADMIN_ROLES = ["Super Admin", "Operations Manager", "Administrator"];

export function canManageBilling(actor: Actor | null | undefined): boolean {
  return !!actor && BILLING_ADMIN_ROLES.includes(actor.role);
}

function assertBillingAdmin(actor: Actor) {
  if (!canManageBilling(actor)) {
    throw new Error(`${actor?.role || "This account"} is not permitted to manage subscriptions.`);
  }
}

/* ------------------------------------------------------------------ */
/* Persistence helpers                                                 */
/* ------------------------------------------------------------------ */

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function emit() {
  window.dispatchEvent(new Event(SUBSCRIPTION_EVENT));
}

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function normalizePhone(phone: string) {
  return (phone || "").replace(/\D/g, "").slice(-10);
}

function ensureSeeded() {
  if (typeof window === "undefined") return;
  if (localStorage.getItem(KEYS.seeded)) return;
  try {
    const now = new Date().toISOString();
    const plans = SEED_PLANS.map((p) => ({ ...p, createdAt: now, updatedAt: now, updatedBy: "System seed" }));
    const { subs, payments } = buildSeedSubscriptions(plans);
    write(KEYS.plans, plans);
    write(KEYS.subs, subs);
    write(KEYS.payments, payments);
    write(KEYS.history, []);
    write(KEYS.audit, []);
    localStorage.setItem(KEYS.seeded, now);
  } catch (e) {
    console.error("Failed to seed subscription store", e);
  }
}

function addAudit(actor: Actor, action: string, target: string, details: string) {
  const audit = read<AuditEntry[]>(KEYS.audit, []);
  audit.unshift({ id: uid("AUD"), at: new Date().toISOString(), actor: actor.name, actorRole: actor.role, action, target, details });
  write(KEYS.audit, audit.slice(0, 1000));
}

/* ------------------------------------------------------------------ */
/* Plans                                                               */
/* ------------------------------------------------------------------ */

export function getPlans(): SubscriptionPlan[] {
  ensureSeeded();
  return read<SubscriptionPlan[]>(KEYS.plans, []).sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getPlan(id: string) {
  return getPlans().find((p) => p.id === id);
}

/** Plans a new customer can buy right now. */
export function getPublicPlans(role: SubscriberRole) {
  return getPlans().filter((p) => p.role === role && p.status === "active" && p.visible);
}

export type PlanDraft = Omit<SubscriptionPlan, "id" | "version" | "createdAt" | "updatedAt" | "updatedBy"> & { id?: string };

export function validatePlan(d: PlanDraft): Record<string, string> {
  const e: Record<string, string> = {};
  if (!d.name.trim()) e.name = "Plan name is required.";
  else if (d.name.trim().length > 60) e.name = "Keep the name under 60 characters.";
  if (!Number.isFinite(d.price) || d.price < 0) e.price = "Price must be 0 or more.";
  else if (!Number.isInteger(d.price)) e.price = "Use whole rupees.";
  else if (d.price > 10_000_000) e.price = "Price looks too large.";
  if (d.validityDays !== null && (!Number.isInteger(d.validityDays) || d.validityDays < 1 || d.validityDays > 3650))
    e.validityDays = "Validity must be 1–3650 days.";
  for (const [k, v] of Object.entries(d.limits)) {
    if (v === undefined) continue;
    if (!Number.isInteger(v) || (v < 0 && v !== -1)) e[`limits.${k}`] = "Use a whole number, or -1 for unlimited.";
  }
  const dup = getPlans().find(
    (p) => p.role === d.role && p.id !== d.id && p.status !== "archived" && p.name.trim().toLowerCase() === d.name.trim().toLowerCase(),
  );
  if (dup) e.name = `A ${d.role} plan named "${dup.name}" already exists.`;
  return e;
}

function fmtVal(field: string, v: unknown): string {
  if (v === null || v === undefined) return field === "validityDays" ? "Until deal closed" : "—";
  if (field === "price" && typeof v === "number") return `₹${v.toLocaleString("en-IN")}`;
  if (field === "billingCycle") return BILLING_LABEL[v as keyof typeof BILLING_LABEL] ?? String(v);
  if (Array.isArray(v)) return v.join(" · ");
  if (typeof v === "object") return JSON.stringify(v);
  return String(v);
}

/** Field-level diff between the stored plan and a draft (used for confirmation and history). */
export function diffPlan(before: SubscriptionPlan | undefined, after: PlanDraft) {
  const fields: (keyof PlanDraft)[] = [
    "name", "description", "badge", "price", "billingCycle", "validityDays", "status", "visible", "recommended", "features",
  ];
  const changes: { field: string; from: string; to: string }[] = [];
  for (const f of fields) {
    const a = before ? (before as unknown as Record<string, unknown>)[f] : undefined;
    const b = (after as unknown as Record<string, unknown>)[f];
    if (JSON.stringify(a ?? null) !== JSON.stringify(b ?? null)) changes.push({ field: f, from: fmtVal(f, a), to: fmtVal(f, b) });
  }
  const keys = new Set([...Object.keys(before?.limits ?? {}), ...Object.keys(after.limits)]);
  for (const k of keys) {
    const a = (before?.limits as Record<string, number | undefined>)?.[k];
    const b = (after.limits as Record<string, number | undefined>)[k];
    if ((a ?? null) !== (b ?? null)) changes.push({ field: `limits.${k}`, from: fmtVal(k, a), to: fmtVal(k, b) });
  }
  return changes;
}

/**
 * Create or update a plan. Records pricing history and an audit entry.
 * Existing subscriptions keep their purchase-time snapshot, so a change here
 * only affects future purchases.
 */
export function savePlan(draft: PlanDraft, actor: Actor): SubscriptionPlan {
  assertBillingAdmin(actor);
  const errors = validatePlan(draft);
  if (Object.keys(errors).length) throw new Error(Object.values(errors)[0]);

  const plans = getPlans();
  const now = new Date().toISOString();
  const existing = draft.id ? plans.find((p) => p.id === draft.id) : undefined;
  const changes = diffPlan(existing, draft);
  if (existing && changes.length === 0) return existing;

  const plan: SubscriptionPlan = {
    ...(existing ?? {}),
    ...draft,
    name: draft.name.trim(),
    description: draft.description.trim(),
    features: draft.features.map((f) => f.trim()).filter(Boolean),
    id: existing?.id ?? uid(`PLN-${draft.role.toUpperCase()}`),
    version: (existing?.version ?? 0) + 1,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
    updatedBy: actor.name,
  } as SubscriptionPlan;

  // Only one recommended plan per role.
  const next = plans
    .filter((p) => p.id !== plan.id)
    .map((p) => (plan.recommended && p.role === plan.role && p.recommended ? { ...p, recommended: false } : p));
  next.push(plan);
  write(KEYS.plans, next);

  const history = read<PricingHistoryEntry[]>(KEYS.history, []);
  history.unshift({
    id: uid("PRH"),
    planId: plan.id,
    planName: plan.name,
    role: plan.role,
    changedBy: actor.name,
    changedAt: now,
    oldPrice: existing ? existing.price : null,
    newPrice: plan.price,
    changes,
    fromVersion: existing?.version ?? null,
    toVersion: plan.version,
  });
  write(KEYS.history, history);

  addAudit(
    actor,
    existing ? "Plan updated" : "Plan created",
    `${plan.id} (${plan.name})`,
    existing ? changes.map((c) => `${c.field}: ${c.from} → ${c.to}`).join("; ") : `Created ${plan.role} plan at ₹${plan.price}`,
  );
  emit();
  return plan;
}

export function setPlanStatus(id: string, status: PlanStatus, actor: Actor) {
  const plan = getPlan(id);
  if (!plan) throw new Error("Plan not found.");
  const { id: _id, version, createdAt, updatedAt, updatedBy, ...rest } = plan;
  void _id; void version; void createdAt; void updatedAt; void updatedBy;
  return savePlan({ ...rest, id, status, recommended: status === "active" ? plan.recommended : false }, actor);
}

export function planIsReferenced(id: string) {
  return read<UserSubscription[]>(KEYS.subs, []).some((s) => s.planId === id);
}

/** Hard delete is only allowed for drafts nobody ever bought. Everything else must be archived. */
export function deletePlan(id: string, actor: Actor) {
  assertBillingAdmin(actor);
  const plan = getPlan(id);
  if (!plan) throw new Error("Plan not found.");
  if (planIsReferenced(id)) throw new Error("This plan has subscriptions. Archive it instead.");
  if (plan.status !== "draft") throw new Error("Only draft plans can be deleted. Archive published plans.");
  write(KEYS.plans, getPlans().filter((p) => p.id !== id));
  addAudit(actor, "Plan deleted", `${id} (${plan.name})`, "Unused draft removed");
  emit();
}

/* ------------------------------------------------------------------ */
/* Subscriptions                                                       */
/* ------------------------------------------------------------------ */

export function computeStatus(s: UserSubscription, now = Date.now()): SubscriptionStatus {
  if (s.adminStatus) return s.adminStatus;
  if (s.expiresAt) {
    const exp = new Date(s.expiresAt).getTime();
    if (exp < now) return "expired";
    if (exp - now < EXPIRING_WINDOW_DAYS * 864e5) return "expiring";
  }
  return "active";
}

export type SubscriptionView = UserSubscription & { status: SubscriptionStatus; payment?: PaymentRecord };

export function getSubscriptions(): SubscriptionView[] {
  ensureSeeded();
  const payments = read<PaymentRecord[]>(KEYS.payments, []);
  return read<UserSubscription[]>(KEYS.subs, [])
    .map((s) => ({ ...s, status: computeStatus(s), payment: payments.find((p) => p.id === s.paymentId) }))
    .sort((a, b) => b.activatedAt.localeCompare(a.activatedAt));
}

export function getSubscriptionsFor(role: SubscriberRole, phone: string) {
  const n = normalizePhone(phone);
  return getSubscriptions().filter((s) => s.role === role && normalizePhone(s.subscriberPhone) === n);
}

export function getCurrentSubscription(role: SubscriberRole, phone: string) {
  return getSubscriptionsFor(role, phone).find((s) => s.status === "active" || s.status === "expiring");
}

export function setSubscriptionAdminStatus(
  id: string,
  status: "cancelled" | "suspended" | null,
  reason: string,
  actor: Actor,
) {
  assertBillingAdmin(actor);
  if (!reason.trim()) throw new Error("A reason is required.");
  const subs = read<UserSubscription[]>(KEYS.subs, []);
  const s = subs.find((x) => x.id === id);
  if (!s) throw new Error("Subscription not found.");
  const before = s.adminStatus ?? "none";
  if (status) s.adminStatus = status;
  else delete s.adminStatus;
  write(KEYS.subs, subs);
  addAudit(actor, status ? `Subscription ${status}` : "Subscription restored", `${id} (${s.subscriberName})`, `${before} → ${status ?? "none"}. Reason: ${reason.trim()}`);
  emit();
}

/**
 * Admin assigns a plan without payment (complimentary / offline deal).
 * Recorded with a ₹0 payment, provider "Admin grant", so revenue and
 * payment verification stay truthful. Supersedes the user's current plan.
 */
export function grantSubscription(
  input: { role: SubscriberRole; planId: string; subscriberName: string; subscriberPhone: string; validityDays?: number | null; reason: string },
  actor: Actor,
) {
  assertBillingAdmin(actor);
  if (!input.reason.trim()) throw new Error("A reason is required.");
  if (!normalizePhone(input.subscriberPhone)) throw new Error("This user has no phone number to link the plan to.");
  const plan = getPlan(input.planId);
  if (!plan || plan.role !== input.role) throw new Error("Choose a plan for this role.");
  if (plan.status === "archived") throw new Error("Archived plans can't be assigned.");
  const days = input.validityDays === undefined ? plan.validityDays : input.validityDays;
  if (days !== null && (!Number.isInteger(days) || days < 1 || days > 3650)) throw new Error("Validity must be 1–3650 days.");

  const subs = read<UserSubscription[]>(KEYS.subs, []);
  const payments = read<PaymentRecord[]>(KEYS.payments, []);
  const now = new Date();
  for (const s of subs) {
    if (s.role === input.role && normalizePhone(s.subscriberPhone) === normalizePhone(input.subscriberPhone) && !s.adminStatus && computeStatus(s) !== "expired") {
      s.adminStatus = "cancelled";
    }
  }
  const subId = uid("SUB");
  const payment: PaymentRecord = {
    id: uid("PAY"),
    transactionRef: uid("GRANT"),
    subscriptionId: subId,
    role: input.role,
    subscriberName: input.subscriberName,
    subscriberPhone: input.subscriberPhone,
    planId: plan.id,
    planName: plan.name,
    baseAmount: 0,
    discount: 0,
    gst: 0,
    total: 0,
    currency: "INR",
    method: `Granted by ${actor.name}`,
    provider: "Admin grant (no payment)",
    verification: "verified",
    createdAt: now.toISOString(),
    source: "checkout",
  };
  subs.unshift({
    id: subId,
    role: input.role,
    subscriberName: input.subscriberName,
    subscriberPhone: input.subscriberPhone,
    planId: plan.id,
    snapshot: { name: plan.name, price: plan.price, billingCycle: plan.billingCycle, validityDays: days, limits: { ...plan.limits }, version: plan.version },
    amountPaid: 0,
    currency: "INR",
    activatedAt: now.toISOString(),
    expiresAt: days ? new Date(now.getTime() + days * 864e5).toISOString() : null,
    paymentId: payment.id,
    usage: {},
    source: "checkout",
  });
  write(KEYS.subs, subs);
  write(KEYS.payments, [payment, ...payments]);
  addAudit(actor, "Plan granted", `${subId} (${input.subscriberName})`, `${plan.name}, ${days ? `${days} days` : "no expiry"}, ₹0. Reason: ${input.reason.trim()}`);
  emit();
}

/** Moves the expiry date by `days` (from the later of now and the current expiry). */
export function extendSubscription(id: string, days: number, reason: string, actor: Actor) {
  assertBillingAdmin(actor);
  if (!Number.isInteger(days) || days < 1 || days > 3650) throw new Error("Extension must be 1–3650 days.");
  if (!reason.trim()) throw new Error("A reason is required.");
  const subs = read<UserSubscription[]>(KEYS.subs, []);
  const s = subs.find((x) => x.id === id);
  if (!s) throw new Error("Subscription not found.");
  if (!s.expiresAt) throw new Error("This subscription has no expiry.");
  const before = s.expiresAt;
  const base = Math.max(Date.now(), new Date(s.expiresAt).getTime());
  s.expiresAt = new Date(base + days * 864e5).toISOString();
  write(KEYS.subs, subs);
  addAudit(actor, "Subscription extended", `${id} (${s.subscriberName})`, `+${days} days: ${before.slice(0, 10)} → ${s.expiresAt.slice(0, 10)}. Reason: ${reason.trim()}`);
  emit();
}

/**
 * Keeps subscriptions attached when an admin changes a user's phone or name.
 * Role changes don't move subscriptions: plans are role-specific, so the old
 * role's records stay as history.
 */
export function relinkSubscriber(
  from: { role: SubscriberRole; phone: string },
  to: { phone: string; name: string },
  actor: Actor,
) {
  const subs = read<UserSubscription[]>(KEYS.subs, []);
  const payments = read<PaymentRecord[]>(KEYS.payments, []);
  const match = (r: SubscriberRole, ph: string) => r === from.role && normalizePhone(ph) === normalizePhone(from.phone);
  let n = 0;
  for (const s of subs) if (match(s.role, s.subscriberPhone)) { s.subscriberPhone = to.phone; s.subscriberName = to.name; n++; }
  for (const p of payments) if (match(p.role, p.subscriberPhone)) { p.subscriberPhone = to.phone; p.subscriberName = to.name; }
  if (!n) return;
  write(KEYS.subs, subs);
  write(KEYS.payments, payments);
  addAudit(actor, "Subscriber relinked", to.name, `${n} subscription(s) linked to ${to.phone}`);
  emit();
}

/* ------------------------------------------------------------------ */
/* Checkout                                                            */
/* ------------------------------------------------------------------ */

export interface CheckoutInput {
  role: SubscriberRole;
  planId: string;
  subscriberName: string;
  subscriberPhone: string;
  baseAmount: number;
  discount: number;
  gst: number;
  total: number;
  method: string;
  /** Idempotency key. With a gateway this is the gateway order id. */
  transactionRef: string;
  usage?: UserSubscription["usage"];
}

/**
 * Records a checkout and activates the subscription with a snapshot of the
 * plan's current terms. Idempotent on transactionRef: a repeated call returns
 * the original records instead of creating a duplicate subscription.
 *
 * No payment gateway is integrated, so the payment is stored as
 * verification "unverified" with provider "Simulated checkout". It is never
 * marked verified. Gateway-verified activation is described in PAYMENTS.md.
 */
export function recordCheckout(input: CheckoutInput): { subscription: UserSubscription; payment: PaymentRecord; duplicate: boolean } {
  ensureSeeded();
  const payments = read<PaymentRecord[]>(KEYS.payments, []);
  const subs = read<UserSubscription[]>(KEYS.subs, []);
  const prior = payments.find((p) => p.transactionRef === input.transactionRef);
  if (prior) {
    const sub = subs.find((s) => s.id === prior.subscriptionId)!;
    return { subscription: sub, payment: prior, duplicate: true };
  }
  const plan = getPlan(input.planId);
  if (!plan) throw new Error("Plan not found.");
  if (plan.status !== "active") throw new Error("This plan is no longer available.");

  const now = new Date();
  const subId = uid("SUB");
  const payment: PaymentRecord = {
    id: uid("PAY"),
    transactionRef: input.transactionRef,
    subscriptionId: subId,
    role: input.role,
    subscriberName: input.subscriberName || "Unnamed user",
    subscriberPhone: input.subscriberPhone,
    planId: plan.id,
    planName: plan.name,
    baseAmount: input.baseAmount,
    discount: input.discount,
    gst: input.gst,
    total: input.total,
    currency: "INR",
    method: input.method,
    provider: input.total === 0 ? "Free plan (no payment)" : "Simulated checkout (no gateway)",
    verification: input.total === 0 ? "verified" : "unverified",
    createdAt: now.toISOString(),
    source: "checkout",
  };
  const subscription: UserSubscription = {
    id: subId,
    role: input.role,
    subscriberName: payment.subscriberName,
    subscriberPhone: input.subscriberPhone,
    planId: plan.id,
    snapshot: {
      name: plan.name,
      price: plan.price,
      billingCycle: plan.billingCycle,
      validityDays: plan.validityDays,
      limits: { ...plan.limits },
      version: plan.version,
    },
    amountPaid: input.total,
    currency: "INR",
    activatedAt: now.toISOString(),
    expiresAt: plan.validityDays ? new Date(now.getTime() + plan.validityDays * 864e5).toISOString() : null,
    paymentId: payment.id,
    usage: input.usage ?? {},
    source: "checkout",
  };
  // A new purchase supersedes the subscriber's previous active plan for the same role.
  for (const s of subs) {
    if (s.role === input.role && normalizePhone(s.subscriberPhone) === normalizePhone(input.subscriberPhone) && !s.adminStatus && computeStatus(s) !== "expired") {
      s.adminStatus = "cancelled";
    }
  }
  write(KEYS.payments, [payment, ...payments]);
  write(KEYS.subs, [subscription, ...subs]);
  emit();
  return { subscription, payment, duplicate: false };
}

export function updateUsage(role: SubscriberRole, phone: string, usage: UserSubscription["usage"]) {
  const current = getCurrentSubscription(role, phone);
  if (!current) return;
  const subs = read<UserSubscription[]>(KEYS.subs, []);
  const s = subs.find((x) => x.id === current.id);
  if (!s) return;
  s.usage = { ...s.usage, ...usage };
  write(KEYS.subs, subs);
  emit();
}

/** Effective limit for a buyer: current plan, else the active free plan, else unlimited (-1). */
export function getBuyerSavedLimit(phone: string | undefined): { limit: number; planName: string } {
  const sub = phone ? getCurrentSubscription("buyer", phone) : undefined;
  if (sub) return { limit: sub.snapshot.limits.savedPropertyLimit ?? -1, planName: sub.snapshot.name };
  const free = getPublicPlans("buyer").find((p) => p.price === 0);
  if (free) return { limit: free.limits.savedPropertyLimit ?? -1, planName: free.name };
  return { limit: -1, planName: "No plan" };
}

/* ------------------------------------------------------------------ */
/* Reads for admin                                                     */
/* ------------------------------------------------------------------ */

export function getPayments() {
  ensureSeeded();
  return read<PaymentRecord[]>(KEYS.payments, []).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}
export function getPricingHistory() {
  ensureSeeded();
  return read<PricingHistoryEntry[]>(KEYS.history, []);
}
export function getAuditLog() {
  ensureSeeded();
  return read<AuditEntry[]>(KEYS.audit, []);
}

/** Records an admin action on a user account in the shared audit log. */
export function auditUserAction(actor: Actor, action: string, target: string, details: string) {
  addAudit(actor, action, target, details);
  emit();
}

/* ------------------------------------------------------------------ */
/* React hook                                                          */
/* ------------------------------------------------------------------ */

export interface SubscriptionSnapshot {
  ready: boolean;
  plans: SubscriptionPlan[];
  subscriptions: SubscriptionView[];
  payments: PaymentRecord[];
  history: PricingHistoryEntry[];
  audit: AuditEntry[];
}

const EMPTY: SubscriptionSnapshot = { ready: false, plans: [], subscriptions: [], payments: [], history: [], audit: [] };

/** Live view of the store; re-reads on changes in this tab and other tabs. */
export function useSubscriptionData(): SubscriptionSnapshot {
  const [data, setData] = useState<SubscriptionSnapshot>(EMPTY);
  useEffect(() => {
    const sync = () =>
      setData({
        ready: true,
        plans: getPlans(),
        subscriptions: getSubscriptions(),
        payments: getPayments(),
        history: getPricingHistory(),
        audit: getAuditLog(),
      });
    sync();
    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key.startsWith("restamp_sub_")) sync();
    };
    window.addEventListener(SUBSCRIPTION_EVENT, sync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SUBSCRIPTION_EVENT, sync);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return data;
}

/** Public pricing pages: active + visible plans for one role. `null` while loading. */
export function usePublicPlans(role: SubscriberRole): SubscriptionPlan[] | null {
  const { ready, plans } = useSubscriptionData();
  if (!ready) return null;
  return plans.filter((p) => p.role === role && p.status === "active" && p.visible);
}
