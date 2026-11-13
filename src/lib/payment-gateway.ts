/**
 * Payment gateway contract. NOT IMPLEMENTED: no provider is configured.
 *
 * Checkouts today call recordCheckout() in subscription-store.ts, which
 * activates the plan and stores the payment as "unverified". When a gateway
 * is added, the flow becomes (see PAYMENTS.md):
 *
 *   client  → POST /api/checkout            → server creates gateway order (amount from DB plan, never from client)
 *   client  → gateway hosted checkout
 *   gateway → POST /api/payments/webhook     → server verifies signature with the webhook secret,
 *                                              then applyVerifiedPayment() exactly once per gateway payment id
 *
 * Secrets must only exist server-side (env vars without NEXT_PUBLIC_).
 */

import type { SubscriberRole } from "@/types/subscription";

export interface CreateOrderInput {
  planId: string;
  role: SubscriberRole;
  subscriberId: string;
  /** Server-computed from the plan record. Never trust a client-sent amount. */
  amountPaise: number;
  currency: "INR";
  /** Our idempotency key; the gateway echoes it back on the webhook. */
  receipt: string;
}

export interface GatewayOrder {
  orderId: string;
  amountPaise: number;
  currency: "INR";
  /** Public key id the browser needs to open the hosted checkout. */
  publicKey: string;
}

export interface VerifiedPaymentEvent {
  provider: string;
  orderId: string;
  paymentId: string;
  receipt: string;
  amountPaise: number;
  status: "captured" | "failed" | "refunded";
  method?: string;
}

export interface PaymentGateway {
  name: string;
  createOrder(input: CreateOrderInput): Promise<GatewayOrder>;
  /** Verifies the raw webhook body against the signature header. Throws if invalid. */
  verifyWebhook(rawBody: string, signature: string): VerifiedPaymentEvent;
}

/** Returns the configured gateway, or null. Always null until a provider is integrated. */
export function getConfiguredGateway(): PaymentGateway | null {
  return null;
}
