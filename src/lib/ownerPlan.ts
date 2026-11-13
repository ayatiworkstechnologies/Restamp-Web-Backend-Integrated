import { useMemo } from 'react';
import type { SubscriptionPlan } from '@/types/subscription';
import { BILLING_LABEL } from '@/types/subscription';
import { getPlan as getStorePlan, recordCheckout, usePublicPlans } from '@/lib/subscription-store';
import { getProfile } from '@/lib/profile';
import { getOwnerListings } from '@/lib/ownerListings';

export type OwnerPlan = {
  id: string;
  name: string;
  highlight?: string;
  price: number;
  priceSub1: string;
  priceSub2: string;
  validityDays: number | null; // null = until deal closed
  listingLimit: number;
  popular?: boolean;
  features: string[];
};

// Owner plans are managed in Admin → Subscription Plans and read from the
// subscription store. Prices are never hard-coded here.

/** Legacy screens treat 999 as "unlimited". */
const legacyLimit = (n: number | undefined) => (n === undefined || n < 0 ? 999 : n);

export function toOwnerPlan(p: SubscriptionPlan): OwnerPlan {
  const limit = legacyLimit(p.limits.listingLimit);
  return {
    id: p.id,
    name: p.name,
    highlight: p.badge,
    price: p.price,
    priceSub1: `${BILLING_LABEL[p.billingCycle]} payment · ${p.validityDays ? `${p.validityDays} Days` : 'Until deal closed'}`,
    priceSub2: limit >= 999 ? 'Unlimited property posts' : `${limit} property post${limit === 1 ? '' : 's'}`,
    validityDays: p.validityDays,
    listingLimit: limit,
    popular: p.recommended,
    features: p.features,
  };
}

const EMPTY_CATALOG: Record<'Residential' | 'Commercial', OwnerPlan[]> = { Residential: [], Commercial: [] };

/** Admin-managed owner plans. Residential and Commercial share one catalog. Empty while loading. */
export function useOwnerPlans(): Record<'Residential' | 'Commercial', OwnerPlan[]> {
  const plans = usePublicPlans('owner');
  return useMemo(() => {
    if (!plans) return EMPTY_CATALOG;
    const list = plans.map(toOwnerPlan);
    return { Residential: list, Commercial: list };
  }, [plans]);
}

export const GST_RATE = 0.18;
export const PROMO_CODES: Record<string, number> = { RESTAMP: 300, OWNER10: 300, PROMO: 300 };

export type Payment = {
  id: string;
  planId: string;
  planName: string;
  amount: number;
  discount: number;
  gst: number;
  total: number;
  promoCode?: string;
  method: string; // e.g. "UPI · name@okhdfc" or "Card · •••• 4242"
  paidAt: string;
};

export type OwnerSubscription = {
  planId: string;
  planName: string;
  listingLimit: number;
  startedAt: string;
  expiresAt: string | null;
  paymentId?: string;
};

const SUB_KEY = 'restamp_owner_subscription';
const PAYMENTS_KEY = 'restamp_owner_payments';

export const findPlan = (id: string) => {
  const p = getStorePlan(id);
  return p ? toOwnerPlan(p) : undefined;
};

export function priceBreakdown(plan: OwnerPlan, discount: number) {
  const afterDiscount = Math.max(0, plan.price - discount);
  const gst = Math.round(afterDiscount * GST_RATE);
  return { amount: plan.price, discount: plan.price - afterDiscount, gst, total: afterDiscount + gst };
}

export function getSubscription(): OwnerSubscription | null {
  try {
    const raw = localStorage.getItem(SUB_KEY);
    return raw ? (JSON.parse(raw) as OwnerSubscription) : null;
  } catch {
    return null;
  }
}

export function getPayments(): Payment[] {
  try {
    const raw = localStorage.getItem(PAYMENTS_KEY);
    return raw ? (JSON.parse(raw) as Payment[]) : [];
  } catch {
    return [];
  }
}

export function activatePlan(plan: OwnerPlan, payment?: Omit<Payment, 'id' | 'paidAt' | 'planId' | 'planName'>) {
  const now = new Date();
  let paymentId: string | undefined;
  try {
    if (payment) {
      paymentId = `PAY${now.getTime()}`;
      const record: Payment = { ...payment, id: paymentId, planId: plan.id, planName: plan.name, paidAt: now.toISOString() };
      localStorage.setItem(PAYMENTS_KEY, JSON.stringify([record, ...getPayments()]));
    }
    const sub: OwnerSubscription = {
      planId: plan.id,
      planName: plan.name,
      listingLimit: plan.listingLimit,
      startedAt: now.toISOString(),
      expiresAt: plan.validityDays ? new Date(now.getTime() + plan.validityDays * 864e5).toISOString() : null,
      paymentId,
    };
    localStorage.setItem(SUB_KEY, JSON.stringify(sub));
    const me = getProfile();
    recordCheckout({
      role: 'owner',
      planId: plan.id,
      subscriberName: me?.name || 'Owner',
      subscriberPhone: me?.mobile || '',
      baseAmount: payment?.amount ?? plan.price,
      discount: payment?.discount ?? 0,
      gst: payment?.gst ?? 0,
      total: payment?.total ?? 0,
      method: payment?.method ?? 'Free plan',
      transactionRef: paymentId ?? `FREE-${now.getTime()}`,
      usage: { listingsUsed: getOwnerListings().length },
    });
    return { sub, paymentId };
  } catch {
    return null;
  }
}
