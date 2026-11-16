/**
 * RESTAMP online payments API (/payments/*).
 *
 * The backend decides everything money-related: the amount comes from the
 * plan the server holds, the checkout signature is verified server-side, and
 * a subscription is activated only after that verification (or a signed
 * webhook) — never by this page's response alone. This module only relays
 * what Razorpay's checkout produced (order id, payment id, signature) and
 * reads back history/invoices.
 *
 * With the provider unconfigured the backend answers 503 to every payment
 * call: the UI shows that plainly and offers no payment.
 */
import { apiGet, apiPost } from './client';

export type PaymentProviderConfig = {
  provider: 'razorpay' | 'none';
  razorpay_key_id: string | null;
};

export type PlanSummary = {
  kind: 'buyer' | 'agent';
  code: string;
  name: string;
  price_paise: number;
  duration_days: number | null;
  locality_limit?: number;
};

export type CheckoutOut = {
  payment_id: number;
  provider: 'razorpay';
  razorpay_key_id: string;
  razorpay_order_id: string;
  amount_paise: number;
  currency: string;
  plan: PlanSummary;
  unmatched_localities?: string[];
  unavailable_localities?: string[];
};

export type VerifyOut = {
  status: 'SUCCESS';
  activated: boolean;
  payment_id: number;
  plan_code?: string;
  plan_name?: string;
  transaction_id?: string | null;
  amount_paise?: number;
};

export type PaymentRecord = {
  payment_id: number;
  provider: string;
  status: 'INITIATED' | 'SUCCESS' | 'FAILED';
  amount_paise: number;
  currency: string;
  plan_code: string | null;
  plan_name: string | null;
  provider_payment_id: string | null;
  provider_order_id: string | null;
  created_at: string | null;
  paid_at: string | null;
};

export type InvoiceOut = {
  invoice_number: string;
  issued_at: string;
  seller: { name: string; support: string | null };
  buyer: { user_id: number; name: string | null; email: string | null };
  plan: { code: string | null; name: string | null; description: string | null };
  payment: { provider: string; provider_payment_id: string | null; provider_order_id: string | null; paid_at: string | null };
  amount_paise: number;
  currency: string;
  note: string;
};

export const getPaymentConfig = () => apiGet<PaymentProviderConfig>('/payments/config');
export const createCheckout = (kind: 'buyer' | 'agent', code: string, localities?: string[]) =>
  apiPost<CheckoutOut>('/payments/checkout', localities ? { kind, code, localities } : { kind, code });
export const verifyPayment = (
  razorpay_order_id: string,
  razorpay_payment_id: string,
  razorpay_signature: string
) => apiPost<VerifyOut>('/payments/verify', { razorpay_order_id, razorpay_payment_id, razorpay_signature });
export const getPaymentHistory = async (): Promise<PaymentRecord[]> =>
  (await apiGet<{ items: PaymentRecord[] }>('/payments/history')).items;
export const getInvoice = (paymentId: number) => apiGet<InvoiceOut>(`/payments/${paymentId}/invoice`);

/** "₹1,499.00" from paise (the backend's amounts are always in paise). */
export function formatPaise(amount: number | null | undefined): string {
  const rupees = (amount ?? 0) / 100;
  return `₹${rupees.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// --- Razorpay checkout.js (loaded once, only when the provider is live) ------

type RazorpayCheckout = new (options: Record<string, unknown>) => { open: () => void };

declare global {
  interface Window {
    Razorpay?: RazorpayCheckout;
  }
}

const RAZORPAY_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js';

let razorpayLoad: Promise<boolean> | null = null;

/** Load Razorpay's hosted checkout script once. Resolves true when the
 * global is ready; false when it could not be loaded (offline or blocked),
 * so the caller can show an honest error instead of a broken modal. */
export function loadRazorpay(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Razorpay) return Promise.resolve(true);
  if (!razorpayLoad) {
    razorpayLoad = new Promise<boolean>((resolve) => {
      const script = document.createElement('script');
      script.src = RAZORPAY_SCRIPT;
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.head.appendChild(script);
    });
  }
  return razorpayLoad;
}

export type RazorpaySuccess = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

/** Open Razorpay's checkout modal for a created order and resolve with the
 * signature payload the handler relays to POST /payments/verify. Rejects
 * with Error('dismissed') when the payer closes the modal. */
export function openRazorpayCheckout(options: {
  keyId: string;
  orderId: string;
  amountPaise: number;
  currency: string;
  name: string;
  description?: string;
  prefillName?: string | null;
}): Promise<RazorpaySuccess> {
  return new Promise((resolve, reject) => {
    if (!window.Razorpay) {
      reject(new Error('unavailable'));
      return;
    }
    const checkout = new window.Razorpay({
      key: options.keyId,
      order_id: options.orderId,
      amount: options.amountPaise,
      currency: options.currency,
      name: options.name,
      description: options.description,
      prefill: options.prefillName ? { name: options.prefillName } : undefined,
      theme: { color: '#087ed9' },
      modal: { ondismiss: () => reject(new Error('dismissed')) },
      handler: (response: RazorpaySuccess) => {
        if (response && response.razorpay_order_id && response.razorpay_payment_id && response.razorpay_signature) {
          resolve(response);
        } else {
          reject(new Error('invalid_response'));
        }
      },
    });
    checkout.open();
  });
}
