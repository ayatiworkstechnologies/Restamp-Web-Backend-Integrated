# Subscriptions & payments: current state and what's needed

## Current state (read this first)

RESTAMP has **no backend**. Plans, subscriptions, payments, pricing history and
the admin audit log live in the browser's `localStorage`
(`src/lib/subscription-store.ts`), following the same pattern as the existing
users, properties and enquiries data.

What that means:

| Area | Behaviour today |
|---|---|
| Plan prices | Edited in Admin → Subscription Plans and read by `/owner/plans`, `/agent/packages`, `/agent/payment` and `/plans` (buyers). Changes show up **in the same browser** without a deploy. Other visitors' browsers keep their own copy. |
| Checkout | Simulated. No money moves. The payment is stored as `verification: "unverified"`, provider `Simulated checkout (no gateway)`. Free plans are recorded as `verified` with provider `Free plan (no payment)`. |
| Activation | Happens immediately on the simulated checkout, as before. Admin screens show the payment as **Unverified**. Nothing in the UI can mark a payment as paid. |
| Idempotency | `recordCheckout()` is idempotent on `transactionRef`. The agent checkout passes its per-attempt idempotency key, so a double submit returns the original record. |
| Authorization | Admin role checks (`Super Admin`, `Operations Manager`, `Administrator`) run in the browser only. **This is not security.** Anyone can edit `localStorage`. |
| Data isolation | None. All records sit in one browser. |
| Seed data | On first load the store seeds the existing owner tiers and agent packages, three buyer plans (paid ones as **drafts** with placeholder prices), and six sample subscriptions for seed users. Seed rows carry a **Seed** tag in the admin. |

## To make this production-grade

1. **Database.** Create tables matching `src/types/subscription.ts`:
   `subscription_plans`, `user_subscriptions` (with the `snapshot` columns),
   `payments` (unique index on `transactionRef` and on the gateway payment id),
   `pricing_history`, `admin_audit_log`. Seed from `src/lib/subscription-seed.ts`.
2. **Server API.** Replace the `read`/`write` helpers in `subscription-store.ts` with
   route handlers. Every mutation should check the admin session server-side.
   Subscriber endpoints should return only the caller's own records.
3. **Real admin auth.** The current admin login is a fixed demo OTP (`123456`) stored
   in `localStorage`. It needs to move to server-issued sessions.
4. **Payment gateway** (contract in `src/lib/payment-gateway.ts`):
   - `POST /api/checkout`: look up the plan **on the server**, compute
     amount + GST, create a gateway order with `receipt = idempotency key`.
   - `POST /api/payments/webhook`: verify the signature, then in one DB
     transaction: if a payment with this gateway payment id exists, return 200
     (duplicate callback); otherwise insert the payment as `verified` and create
     the subscription from the plan snapshot taken at order time.
   - Reconciliation job: fetch the gateway's payments for the last N days and
     flag any captured payment without a subscription (or the reverse).
   - Credentials needed (server env only, never `NEXT_PUBLIC_`). For Razorpay:
     `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`. Other
     providers have equivalents.
5. **Invoices.** Generate GST invoices (GSTIN, HSN/SAC, invoice numbering) from
   verified payments, or use the gateway's invoicing. Fill `invoiceRef`.
6. **Renewals.** Plans are bought per period today. Nothing auto-renews or
   re-charges. If recurring billing is added, renewals at a changed price need
   advance notice and the subscriber's consent.

## Business rules that need an owner decision

- Final buyer plan prices and whether paid buyer plans should exist at all
  (seeded as drafts).
- Whether Residential and Commercial owner plans should be priced separately.
  They currently share one catalog, as they did before.
- Refund policy and who may issue refunds.
- Whether agent "managed listings (mandates)" should be enforced. It's currently
  display-only because no screen counts agent mandates.
