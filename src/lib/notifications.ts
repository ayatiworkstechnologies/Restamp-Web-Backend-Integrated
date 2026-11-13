"use client";

/**
 * Notifications, fully controlled by admins.
 *
 * - Admin notifications: composed in Admin → Notifications and sent to all
 *   users, one role, or one user (by phone).
 * - Automatic notifications: derived from live data when a user's inbox is
 *   read, each behind an on/off rule admins control. Turning a rule off hides
 *   it immediately.
 *
 * Stored in localStorage like the rest of the app (per browser).
 */

import { useEffect, useState } from "react";
import type { SubscriberRole } from "@/types/subscription";
import { ROLE_LABEL } from "@/types/subscription";
import {
  auditUserAction,
  getPayments,
  getPricingHistory,
  getSubscriptionsFor,
  normalizePhone,
  SUBSCRIPTION_EVENT,
  type Actor,
} from "@/lib/subscription-store";
import { getOwnerListings } from "@/lib/ownerListings";
import { invoiceNumber } from "@/lib/invoice";

export type Audience = "all" | SubscriberRole | "user";
export type NotificationKind = "announcement" | "offer" | "alert";

export interface AdminNotification {
  id: string;
  title: string;
  message: string;
  kind: NotificationKind;
  audience: Audience;
  /** Only for audience "user". */
  targetPhone?: string;
  targetName?: string;
  link?: string;
  createdAt: string;
  createdBy: string;
  expiresAt?: string | null;
  active: boolean;
}

export type RuleKey = "paymentReceived" | "subscriptionExpiring" | "listingLive" | "planPriceChanged";

export interface NotificationRules {
  paymentReceived: boolean;
  subscriptionExpiring: boolean;
  expiringDays: number;
  listingLive: boolean;
  planPriceChanged: boolean;
}

export const RULE_INFO: Record<RuleKey, { label: string; desc: string; who: string }> = {
  paymentReceived: { label: "Payment received / invoice ready", desc: "After a checkout, with a link to the invoice.", who: "Buyers, owners, agents" },
  subscriptionExpiring: { label: "Subscription expiring", desc: "Reminder before the plan ends.", who: "Buyers, owners, agents" },
  listingLive: { label: "Listing went live", desc: "When a submitted listing finishes automatic verification.", who: "Owners" },
  planPriceChanged: { label: "Plan price changed", desc: "When an admin changes the price of a plan for the user's role (last 30 days).", who: "Users of that role" },
};

export const DEFAULT_RULES: NotificationRules = {
  paymentReceived: true,
  subscriptionExpiring: true,
  expiringDays: 7,
  listingLive: true,
  planPriceChanged: false,
};

const KEYS = { list: "restamp_notifications_v1", rules: "restamp_notification_rules_v1", read: "restamp_notifications_read_v1" };
export const NOTIFICATION_EVENT = "restamp-notifications-change";

function read<T>(k: string, f: T): T {
  if (typeof window === "undefined") return f;
  try {
    const raw = localStorage.getItem(k);
    return raw ? (JSON.parse(raw) as T) : f;
  } catch {
    return f;
  }
}
function write(k: string, v: unknown) {
  localStorage.setItem(k, JSON.stringify(v));
  window.dispatchEvent(new Event(NOTIFICATION_EVENT));
}

export const getAdminNotifications = () => read<AdminNotification[]>(KEYS.list, []);
export const getRules = (): NotificationRules => ({ ...DEFAULT_RULES, ...read<Partial<NotificationRules>>(KEYS.rules, {}) });

export const isLive = (n: AdminNotification, now = Date.now()) => n.active && (!n.expiresAt || new Date(n.expiresAt).getTime() > now);

export function audienceLabel(n: Pick<AdminNotification, "audience" | "targetName" | "targetPhone">) {
  if (n.audience === "all") return "All users";
  if (n.audience === "user") return `${n.targetName || "User"} (${n.targetPhone})`;
  return `All ${ROLE_LABEL[n.audience].toLowerCase()}s`;
}

export function sendNotification(
  input: Omit<AdminNotification, "id" | "createdAt" | "createdBy" | "active">,
  actor: Actor,
) {
  if (!input.title.trim()) throw new Error("Title is required.");
  if (!input.message.trim()) throw new Error("Message is required.");
  if (input.title.length > 80) throw new Error("Keep the title under 80 characters.");
  if (input.audience === "user" && !normalizePhone(input.targetPhone || "")) throw new Error("Choose a user to send to.");
  if (input.link && !input.link.startsWith("/")) throw new Error("Link must be a page on this site, starting with /.");
  const n: AdminNotification = {
    ...input,
    title: input.title.trim(),
    message: input.message.trim(),
    id: `NTF-${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    createdBy: actor.name,
    active: true,
  };
  write(KEYS.list, [n, ...getAdminNotifications()]);
  auditUserAction(actor, "Notification sent", n.id, `"${n.title}" → ${audienceLabel(n)}`);
  return n;
}

export function setNotificationActive(id: string, active: boolean, actor: Actor) {
  const list = getAdminNotifications();
  const n = list.find((x) => x.id === id);
  if (!n) return;
  n.active = active;
  write(KEYS.list, list);
  auditUserAction(actor, active ? "Notification resumed" : "Notification paused", id, n.title);
}

export function deleteNotification(id: string, actor: Actor) {
  const list = getAdminNotifications();
  const n = list.find((x) => x.id === id);
  write(KEYS.list, list.filter((x) => x.id !== id));
  if (n) auditUserAction(actor, "Notification deleted", id, n.title);
}

export function saveRules(rules: NotificationRules, actor: Actor) {
  if (!Number.isInteger(rules.expiringDays) || rules.expiringDays < 1 || rules.expiringDays > 60) throw new Error("Reminder days must be 1–60.");
  const before = getRules();
  write(KEYS.rules, rules);
  const changes = (Object.keys(rules) as (keyof NotificationRules)[])
    .filter((k) => before[k] !== rules[k])
    .map((k) => `${k}: ${before[k]} → ${rules[k]}`);
  if (changes.length) auditUserAction(actor, "Notification rules changed", "Automatic notifications", changes.join("; "));
}

/* ------------------------------------------------------------------ */
/* User inbox                                                          */
/* ------------------------------------------------------------------ */

export interface InboxItem {
  id: string;
  title: string;
  message: string;
  kind: NotificationKind | "system";
  link?: string;
  at: string;
}

export function getInbox(user: { role: SubscriberRole; mobile: string }): InboxItem[] {
  const phone = normalizePhone(user.mobile);
  const rules = getRules();
  const now = Date.now();
  const items: InboxItem[] = [];

  for (const n of getAdminNotifications()) {
    if (!isLive(n, now)) continue;
    const match =
      n.audience === "all" || n.audience === user.role || (n.audience === "user" && normalizePhone(n.targetPhone || "") === phone);
    if (match) items.push({ id: n.id, title: n.title, message: n.message, kind: n.kind, link: n.link, at: n.createdAt });
  }

  if (rules.paymentReceived) {
    for (const p of getPayments()) {
      if (p.role !== user.role || normalizePhone(p.subscriberPhone) !== phone || p.source === "seed") continue;
      items.push({
        id: `auto-pay-${p.id}`,
        title: p.total === 0 ? `${p.planName} activated` : "Payment received",
        message: `${p.planName}${p.total ? ` · ₹${p.total.toLocaleString("en-IN")}` : ""}. Invoice ${invoiceNumber(p)} is ready.`,
        kind: "system",
        link: `/invoice/${encodeURIComponent(p.id)}`,
        at: p.createdAt,
      });
    }
  }

  if (rules.subscriptionExpiring) {
    for (const s of getSubscriptionsFor(user.role, user.mobile)) {
      if (!s.expiresAt || s.adminStatus) continue;
      const left = new Date(s.expiresAt).getTime() - now;
      if (left > 0 && left <= rules.expiringDays * 864e5) {
        const days = Math.ceil(left / 864e5);
        items.push({
          id: `auto-exp-${s.id}`,
          title: "Your plan is expiring soon",
          message: `${s.snapshot.name} ends in ${days} day${days === 1 ? "" : "s"}.`,
          kind: "alert",
          link: user.role === "owner" ? "/owner/plans" : user.role === "agent" ? "/agent/packages" : "/plans",
          at: new Date(new Date(s.expiresAt).getTime() - rules.expiringDays * 864e5).toISOString(),
        });
      }
    }
  }

  if (rules.listingLive && user.role === "owner") {
    for (const l of getOwnerListings()) {
      if (l.status !== "Live") continue;
      items.push({
        id: `auto-live-${l.id}`,
        title: "Your listing is live",
        message: `${l.bhk ? `${l.bhk} ` : ""}${l.propertyType || "Property"} is now visible to buyers.`,
        kind: "system",
        link: "/owner/dashboard/properties",
        at: new Date(new Date(l.updatedAt).getTime() + 5 * 60000).toISOString(),
      });
    }
  }

  if (rules.planPriceChanged) {
    for (const h of getPricingHistory()) {
      if (h.role !== user.role || h.oldPrice === null || h.oldPrice === h.newPrice) continue;
      if (now - new Date(h.changedAt).getTime() > 30 * 864e5) continue;
      items.push({
        id: `auto-price-${h.id}`,
        title: `${h.planName} price updated`,
        message: `Now ₹${h.newPrice.toLocaleString("en-IN")} (was ₹${h.oldPrice.toLocaleString("en-IN")}) for new purchases. Your current plan is unchanged.`,
        kind: "announcement",
        link: user.role === "owner" ? "/owner/plans" : user.role === "agent" ? "/agent/packages" : "/plans",
        at: h.changedAt,
      });
    }
  }

  return items.filter((i) => new Date(i.at).getTime() <= now).sort((a, b) => b.at.localeCompare(a.at));
}

export const getReadIds = () => new Set(read<string[]>(KEYS.read, []));
export function markRead(ids: string[]) {
  const set = getReadIds();
  ids.forEach((i) => set.add(i));
  write(KEYS.read, [...set].slice(-500));
}

/** Re-renders on any notification, subscription or storage change. */
export function useNotificationTick() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const bump = () => setTick((t) => t + 1);
    const evs = [NOTIFICATION_EVENT, SUBSCRIPTION_EVENT, "storage", "profile-change"];
    evs.forEach((e) => window.addEventListener(e, bump));
    const t = setInterval(bump, 30000);
    return () => {
      evs.forEach((e) => window.removeEventListener(e, bump));
      clearInterval(t);
    };
  }, []);
  return tick;
}
