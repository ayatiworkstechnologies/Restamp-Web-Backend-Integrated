/**
 * Initial catalog loaded into the subscription store the first time it runs
 * in a browser (the equivalent of a database seed migration). After that,
 * admins own all prices through Admin → Subscription Plans; no page reads
 * prices from this file.
 *
 * Owner and Agent entries reproduce the plans that were previously hard-coded
 * in ownerPlan.ts / agentPlan.ts, so existing ids and prices are preserved.
 * Paid Buyer plans are new and start as DRAFTS with placeholder prices; they
 * are not sold until an admin reviews and publishes them.
 */

import type { PaymentRecord, SubscriptionPlan, UserSubscription } from "@/types/subscription";

type SeedPlan = Omit<SubscriptionPlan, "createdAt" | "updatedAt" | "updatedBy">;

const base = { currency: "INR" as const, version: 1, visible: true, recommended: false };

const ownerTiers: [string, string, number, number | null, number, string[]][] = [
  ["owner-startup", "Startup Plan", 499, 30, 1, ["Unlimited Leads", "City Limit Reach"]],
  ["owner-super", "Super Plan", 999, 45, 3, ["Unlimited Leads", "City Limit Reach"]],
  ["owner-premium", "Premium Plan", 1799, 60, 5, ["Unlimited Leads", "City Limit Reach", "Relationship Manager Assistance"]],
  ["owner-elite", "Elite Plan", 2499, 90, 20, ["Unlimited Leads", "City Limit Reach", "Relationship Manager Assistance", "Social Media Promotion"]],
  ["owner-special", "Special Plan", 3499, 90, 30, ["Unlimited Leads", "City Limit Reach", "Relationship Manager Assistance", "Social Media Promotion"]],
  ["owner-business", "Business Plan", 49999, 90, 50, ["Unlimited Leads", "City Limit Reach", "Relationship Manager Assistance", "Social Media Promotion"]],
  ["owner-unlimited-business", "Unlimited Business Plan", 99999, 180, -1, ["Unlimited Leads", "City Limit Reach", "Relationship Manager Assistance", "Social Media Promotion"]],
];

export const SEED_PLANS: SeedPlan[] = [
  ...ownerTiers.map(([id, name, price, validityDays, listingLimit, features], i) => ({
    ...base,
    id,
    role: "owner" as const,
    name,
    description: listingLimit === -1 ? "Unlimited property posts" : `${listingLimit} property post${listingLimit === 1 ? "" : "s"}`,
    price,
    billingCycle: "one_time" as const,
    validityDays,
    status: "active" as const,
    limits: { listingLimit },
    features,
    sortOrder: i,
  })),
  {
    ...base,
    id: "loc-5",
    role: "agent",
    name: "5 Micro-Markets",
    badge: "Starter Hub",
    description: "Ideal for neighborhood specialists & boutique agents",
    price: 2999,
    billingCycle: "quarterly",
    validityDays: 90,
    status: "active",
    limits: { locationLimit: 5, listingLimit: 10 },
    features: [
      "Coverage across 5 chosen high-intent micro-markets",
      "Post up to 10 active exclusive mandates",
      "Direct buyer WhatsApp & push lead notifications",
      "Verified RERA Agent badge on all listings",
      "Standard search ranking in your 5 zones",
      "Retain 100% of your buyer & seller brokerage",
    ],
    sortOrder: 0,
  },
  {
    ...base,
    id: "loc-10",
    role: "agent",
    name: "10 Micro-Markets",
    badge: "Growth Agent",
    description: "Best for active full-time agents & mid-size teams",
    price: 4999,
    billingCycle: "quarterly",
    validityDays: 90,
    status: "active",
    recommended: true,
    limits: { locationLimit: 10, listingLimit: 25 },
    features: [
      "Coverage across 10 prime micro-markets",
      "Post up to 25 active prime mandates",
      "Instant buyer phone unmasking & WhatsApp CRM sync",
      "Top 10% search placement in your 10 zones",
      "Access to Restamp Co-Broking Syndicate (50:50 splits)",
      "Quarterly deal closing analytics & price movement insights",
    ],
    sortOrder: 1,
  },
  {
    ...base,
    id: "loc-15",
    role: "agent",
    name: "15 Micro-Markets",
    badge: "Enterprise Syndicate",
    description: "Full metro-wide dominance for top-producing agencies",
    price: 7999,
    billingCycle: "quarterly",
    validityDays: 90,
    status: "active",
    limits: { locationLimit: 15, listingLimit: 50 },
    features: [
      "City-wide dominance across 15 prime micro-markets",
      "Post up to 50 active high-value mandates",
      "Exclusive developer pre-launch mandate rights",
      "Dedicated Key Account Manager & fast RERA compliance desk",
      "Pre-approved mortgage assistance desk for your buyers",
      "Priority showcase in weekly Restamp HNI Buyer Digest",
    ],
    sortOrder: 2,
  },
  {
    ...base,
    id: "buyer-free",
    role: "buyer",
    name: "Free",
    description: "Browse and shortlist properties at no cost",
    price: 0,
    billingCycle: "monthly",
    validityDays: null,
    status: "active",
    limits: { savedPropertyLimit: 10 },
    features: ["Shortlist up to 10 properties"],
    sortOrder: 0,
  },
  {
    ...base,
    id: "buyer-plus",
    role: "buyer",
    name: "Buyer Plus",
    description: "Placeholder price: review before publishing",
    price: 299,
    billingCycle: "monthly",
    validityDays: 30,
    status: "draft",
    recommended: true,
    limits: { savedPropertyLimit: 50 },
    features: ["Shortlist up to 50 properties"],
    sortOrder: 1,
  },
  {
    ...base,
    id: "buyer-pro",
    role: "buyer",
    name: "Buyer Pro",
    description: "Placeholder price: review before publishing",
    price: 799,
    billingCycle: "quarterly",
    validityDays: 90,
    status: "draft",
    limits: { savedPropertyLimit: -1 },
    features: ["Unlimited shortlist"],
    sortOrder: 2,
  },
];

/**
 * Sample subscriptions for the seed users in users-data.ts so the admin
 * screens have something to show. They are flagged source "seed" and their
 * payments are "unverified" with provider "Seed data"; the UI labels both.
 */
export function buildSeedSubscriptions(plans: SubscriptionPlan[]) {
  const day = 864e5;
  const now = Date.now();
  const rows: [string, string, string, string, number, number, UserSubscription["usage"]][] = [
    // id suffix, name, phone, planId, startedDaysAgo, discount, usage
    ["0941", "Arun Kumar", "+91 98401 23456", "owner-super", 12, 0, {}],
    ["0812", "Priya S", "+91 94440 98765", "owner-startup", 40, 0, {}],
    ["0995", "Siddharth Malhotra", "+91 98200 88990", "owner-business", 25, 0, {}],
    ["0518", "Karthik P", "+91 98840 77889", "owner-premium", 56, 300, {}],
    ["0734", "Dinesh Ramesh", "+91 97909 11223", "loc-10", 14, 500, { locationsUsed: 10 }],
    ["0104", "Vikram Rathore", "+91 91760 11999", "loc-5", 120, 0, { locationsUsed: 5 }],
  ];
  const subs: UserSubscription[] = [];
  const payments: PaymentRecord[] = [];
  for (const [suffix, name, phone, planId, ago, discount, usage] of rows) {
    const plan = plans.find((p) => p.id === planId)!;
    const role = plan.role;
    const start = now - ago * day;
    const after = plan.price - discount;
    const gst = Math.round(after * 0.18);
    const subId = `SUB-SEED-${suffix}`;
    const payId = `PAY-SEED-${suffix}`;
    payments.push({
      id: payId,
      transactionRef: `SEED-TXN-${suffix}`,
      subscriptionId: subId,
      role,
      subscriberName: name,
      subscriberPhone: phone,
      planId,
      planName: plan.name,
      baseAmount: plan.price,
      discount,
      gst,
      total: after + gst,
      currency: "INR",
      method: "—",
      provider: "Seed data",
      verification: "unverified",
      createdAt: new Date(start).toISOString(),
      source: "seed",
    });
    subs.push({
      id: subId,
      role,
      subscriberName: name,
      subscriberPhone: phone,
      planId,
      snapshot: {
        name: plan.name,
        price: plan.price,
        billingCycle: plan.billingCycle,
        validityDays: plan.validityDays,
        limits: { ...plan.limits },
        version: plan.version,
      },
      amountPaid: after + gst,
      currency: "INR",
      activatedAt: new Date(start).toISOString(),
      expiresAt: plan.validityDays ? new Date(start + plan.validityDays * day).toISOString() : null,
      paymentId: payId,
      usage,
      source: "seed",
    });
  }
  return { subs, payments };
}
