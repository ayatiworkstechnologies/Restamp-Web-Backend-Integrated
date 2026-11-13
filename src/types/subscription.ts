/**
 * Subscription domain model shared by the Admin console and the public
 * Buyer / Owner / Agent checkout screens.
 *
 * NOTE: RESTAMP currently has no backend. These records are persisted in the
 * browser (see src/lib/subscription-store.ts). The shapes are designed so they
 * can map 1:1 onto database tables when a backend is introduced.
 */

export type SubscriberRole = "buyer" | "owner" | "agent";

export type BillingCycle = "one_time" | "monthly" | "quarterly" | "yearly";

/** draft = never sold; active = purchasable; inactive = temporarily hidden; archived = retired, kept for history. */
export type PlanStatus = "draft" | "active" | "inactive" | "archived";

/**
 * Role-specific entitlements. Only keys listed in ROLE_FEATURES for a role
 * are editable for that role.
 */
export interface PlanLimits {
  /** Owner: properties that can be posted. Agent: active mandates. -1 = unlimited. */
  listingLimit?: number;
  /** Agent: micro-markets (locations) covered. */
  locationLimit?: number;
  /** Buyer: maximum saved/shortlisted properties. -1 = unlimited. */
  savedPropertyLimit?: number;
}

export interface SubscriptionPlan {
  id: string;
  role: SubscriberRole;
  name: string;
  description: string;
  /** Badge shown on public cards, e.g. "Growth Agent". */
  badge?: string;
  /** Base price in the smallest display unit (whole rupees). GST is added at checkout. */
  price: number;
  currency: "INR";
  billingCycle: BillingCycle;
  /** null = valid until the deal closes (legacy owner behaviour). */
  validityDays: number | null;
  status: PlanStatus;
  /** Visible on public pricing pages (only applies when status is active). */
  visible: boolean;
  recommended: boolean;
  limits: PlanLimits;
  /** Marketing bullet list shown on public cards. */
  features: string[];
  sortOrder: number;
  version: number;
  createdAt: string;
  updatedAt: string;
  updatedBy: string;
}

export type SubscriptionStatus = "active" | "expiring" | "expired" | "cancelled" | "suspended";

/**
 * Payment verification status. Only a server-verified gateway event may set
 * "verified". Nothing in the current codebase can do that, see PAYMENTS.md.
 */
export type PaymentVerification = "verified" | "unverified" | "pending" | "failed" | "refunded";

export interface PlanSnapshot {
  name: string;
  price: number;
  billingCycle: BillingCycle;
  validityDays: number | null;
  limits: PlanLimits;
  version: number;
}

export interface UserSubscription {
  id: string;
  role: SubscriberRole;
  subscriberName: string;
  /** Mobile number: the identifier the public site uses for accounts. */
  subscriberPhone: string;
  planId: string;
  /** Terms agreed at purchase. Never rewritten by later price changes. */
  snapshot: PlanSnapshot;
  amountPaid: number;
  currency: "INR";
  activatedAt: string;
  expiresAt: string | null;
  /** Admin override status; computed status also considers expiry. */
  adminStatus?: "cancelled" | "suspended";
  paymentId?: string;
  usage: { listingsUsed?: number; enquiriesUsed?: number; savedUsed?: number; locationsUsed?: number };
  source: "checkout" | "seed";
}

export interface PaymentRecord {
  id: string;
  /** Gateway order/payment id. Idempotency key for activation. */
  transactionRef: string;
  subscriptionId?: string;
  role: SubscriberRole;
  subscriberName: string;
  subscriberPhone: string;
  planId: string;
  planName: string;
  baseAmount: number;
  discount: number;
  gst: number;
  total: number;
  currency: "INR";
  method: string;
  provider: string;
  verification: PaymentVerification;
  invoiceRef?: string;
  createdAt: string;
  verifiedAt?: string;
  source: "checkout" | "seed";
}

export interface PricingHistoryEntry {
  id: string;
  planId: string;
  planName: string;
  role: SubscriberRole;
  changedBy: string;
  changedAt: string;
  oldPrice: number | null;
  newPrice: number;
  /** Field-level diff of everything else that changed. */
  changes: { field: string; from: string; to: string }[];
  fromVersion: number | null;
  toVersion: number;
}

export interface AuditEntry {
  id: string;
  at: string;
  actor: string;
  actorRole: string;
  action: string;
  target: string;
  details: string;
}

export const ROLE_LABEL: Record<SubscriberRole, string> = {
  buyer: "Buyer",
  owner: "Owner",
  agent: "Agent",
};

export const BILLING_LABEL: Record<BillingCycle, string> = {
  one_time: "One-time",
  monthly: "Monthly",
  quarterly: "Quarterly",
  yearly: "Yearly",
};

/**
 * Entitlements admins can configure per role. `enforced` = the app actually
 * blocks usage above the limit; non-enforced limits are shown to the
 * subscriber but nothing gates them yet, and the editor labels them so.
 * Benefits (contact/lead access, analytics, RM) are not configurable because
 * no screen in the app gates on them; describe them in `features` copy only
 * once they work.
 */
export const ROLE_FEATURES: Record<
  SubscriberRole,
  { key: keyof PlanLimits; label: string; enforced: boolean; note: string }[]
> = {
  buyer: [
    { key: "savedPropertyLimit", label: "Saved property limit", enforced: true, note: "Shortlist blocks saves above this number" },
  ],
  owner: [
    { key: "listingLimit", label: "Maximum property listings", enforced: true, note: "Add Property is blocked once reached" },
  ],
  agent: [
    { key: "locationLimit", label: "Micro-markets covered", enforced: true, note: "Location picker caps selection at checkout" },
    { key: "listingLimit", label: "Managed listings (mandates)", enforced: false, note: "Displayed to agents; not yet enforced" },
  ],
};
