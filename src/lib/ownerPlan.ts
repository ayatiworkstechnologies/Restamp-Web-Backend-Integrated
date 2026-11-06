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

// Owner plans — 7 tiers (one-time payment)
const ownerTiers: OwnerPlan[] = [
  { id: 'owner-startup', name: 'Startup Plan', price: 499, priceSub1: 'One-time payment · 30 Days', priceSub2: '1 property post', validityDays: 30, listingLimit: 1, features: ['Unlimited Leads', 'City Limit Reach'] },
  { id: 'owner-super', name: 'Super Plan', price: 999, priceSub1: 'One-time payment · 45 Days', priceSub2: '3 property posts', validityDays: 45, listingLimit: 3, features: ['Unlimited Leads', 'City Limit Reach'] },
  { id: 'owner-premium', name: 'Premium Plan', price: 1799, priceSub1: 'One-time payment · 60 Days', priceSub2: '5 property posts', validityDays: 60, listingLimit: 5, features: ['Unlimited Leads', 'City Limit Reach', 'Relationship Manager Assistance'] },
  { id: 'owner-elite', name: 'Elite Plan', price: 2499, priceSub1: 'One-time payment · 90 Days', priceSub2: '20 property posts', validityDays: 90, listingLimit: 20, features: ['Unlimited Leads', 'City Limit Reach', 'Relationship Manager Assistance', 'Social Media Promotion'] },
  { id: 'owner-special', name: 'Special Plan', price: 3499, priceSub1: 'One-time payment · 90 Days', priceSub2: '30 property posts', validityDays: 90, listingLimit: 30, features: ['Unlimited Leads', 'City Limit Reach', 'Relationship Manager Assistance', 'Social Media Promotion'] },
  { id: 'owner-business', name: 'Business Plan', price: 49999, priceSub1: 'One-time payment · 90 Days', priceSub2: '50 property posts', validityDays: 90, listingLimit: 50, features: ['Unlimited Leads', 'City Limit Reach', 'Relationship Manager Assistance', 'Social Media Promotion'] },
  { id: 'owner-unlimited-business', name: 'Unlimited Business Plan', price: 99999, priceSub1: 'One-time payment · 180 Days', priceSub2: 'Unlimited property posts', validityDays: 180, listingLimit: 999, features: ['Unlimited Leads', 'City Limit Reach', 'Relationship Manager Assistance', 'Social Media Promotion'] },
];

export const ownerPlans: Record<'Residential' | 'Commercial', OwnerPlan[]> = {
  Residential: ownerTiers,
  Commercial: ownerTiers,
};

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

export const findPlan = (id: string) =>
  [...ownerPlans.Residential, ...ownerPlans.Commercial].find((p) => p.id === id);

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
    return { sub, paymentId };
  } catch {
    return null;
  }
}
