# Billing Integration Plan

**Document:** BILLING_INTEGRATION_PLAN
**Version:** 1.0
**Date:** 2026-05-31
**Status:** Production

---

## Billing Architecture

Business logic in AutoBentaPH never references Stripe, GCash, Maya, or any payment processor directly. All payment operations go through a `PaymentProcessor` abstraction layer. The specific processor is selected at runtime based on the `processor` field on `PaymentRecord`.

This design allows:
- Adding a new processor (e.g., UnionBank) without touching business logic.
- Running multiple processors simultaneously for different dealer segments.
- Swapping processors in a specific market without a code change in invoice or subscription logic.

---

## PaymentProcessor Interface

```typescript
interface PaymentProcessor {
  // Create a hosted checkout session; returns a redirect URL for the dealer
  createCheckout(invoice: Invoice): Promise<{ checkoutUrl: string; sessionRef: string }>

  // Verify and parse an inbound webhook payload from this processor
  handleWebhook(rawBody: Buffer, headers: Record<string, string>): Promise<PaymentWebhookEvent>
}

type PaymentWebhookEvent = {
  type: 'payment_succeeded' | 'payment_failed' | 'refund_issued'
  invoiceId: string
  processorRef: string
  amount: number
}
```

Each processor (`StripeProcessor`, `GCashProcessor`, `MayaProcessor`, `BankTransferProcessor`, `ManualProcessor`) implements this interface. The registry maps the `processor` field value to its implementation class.

---

## Invoice Model

```prisma
model Invoice {
  id            String    // CUID
  dealerId      String
  invoiceNumber String    @unique   // Format: INV-{YYYYMMDD}-{dealerId.slice(0,6).toUpperCase()}
  amount        Decimal
  currency      String    // "PHP"
  status        String    // pending | paid | failed | refunded | void
  plan          String    // free | verified | pro | enterprise
  billingCycle  String    // monthly | annual
  periodStart   DateTime
  periodEnd     DateTime
  dueAt         DateTime
  paidAt        DateTime?
  payments      PaymentRecord[]
}
```

### Invoice number format

```
INV-20260531-A3F9C2
     ↑ date    ↑ first 6 chars of dealerId, uppercased
```

Uniqueness is enforced at the database level via `@unique`. The format is human-readable for support queries and official receipt generation.

---

## Invoice Lifecycle

```
pending
  → paid      (payment succeeded)
  → failed    (payment attempt failed; see grace period)
  → void      (admin cancelled before payment)
  → refunded  (paid invoice subsequently refunded)
```

An invoice can have multiple `PaymentRecord` entries — one per payment attempt. Only one `PaymentRecord` per invoice will have `status=succeeded` in normal operation.

---

## PaymentRecord Model

```prisma
model PaymentRecord {
  id           String    // CUID
  invoiceId    String
  dealerId     String
  amount       Decimal
  processor    String    // stripe | gcash | maya | bank_transfer | manual
  processorRef String?   // Processor's transaction ID / reference number
  status       String    // pending | succeeded | failed | refunded
  createdAt    DateTime
}
```

Multiple `PaymentRecord` rows per invoice are expected in failed-then-retried scenarios. The invoice transitions to `paid` only when a `PaymentRecord(status=succeeded)` is written. A `PaymentRecord(status=failed)` does not block subsequent attempts.

---

## GCash Integration

GCash payments use the redirect flow via PayMongo's GCash source type (or GCash Direct API when available for enterprise volume).

**Checkout flow:**

```
1. Dealer clicks "Pay with GCash"
2. AutoBentaPH calls GCashProcessor.createCheckout(invoice)
3. GCash processor creates a PayMongo Source object with type=gcash
4. Returns redirect URL → dealer is sent to GCash app/browser
5. Dealer authorizes payment in GCash
6. PayMongo sends webhook to POST /api/webhooks/payments/gcash
7. GCashProcessor.handleWebhook() verifies signature, parses event
8. If payment.paid event: update Invoice.status=paid, Invoice.paidAt=now
9. Create PaymentRecord(type=succeeded, processorRef=paymongo_source_id)
```

**Webhook endpoint:** `POST /api/webhooks/payments/gcash`

PayMongo webhook signature verification uses HMAC-SHA256 with the PayMongo webhook secret. Unverified webhooks return HTTP 401.

---

## Maya (PayMaya) Integration

Maya uses the same PayMongo infrastructure. PayMongo supports Maya as a source type alongside GCash.

**Checkout flow:** identical to GCash except `type=paymaya` in the PayMongo Source object.

**Webhook endpoint:** `POST /api/webhooks/payments/maya`

Both GCash and Maya webhooks can share a single PayMongo webhook endpoint (`POST /api/webhooks/payments/paymongo`) if PayMongo is used as the unified gateway. The `MayaProcessor` and `GCashProcessor` can be thin wrappers over a shared `PayMongoProcessor` base class.

---

## Bank Transfer

Bank transfer supports dealers who cannot or prefer not to use digital wallets. Reconciliation is manual.

**Flow:**

```
1. Dealer selects "Bank Transfer"
2. AutoBentaPH displays bank account details (BDO / BPI / UnionBank) + invoice number as reference
3. Invoice.status remains pending
4. Dealer makes the transfer at their bank; submits reference number in app
5. AutoBentaPH records the submitted reference: PaymentRecord(status=pending, processorRef=submitted_ref)
6. Admin receives notification: "Bank transfer submitted for Invoice INV-20260531-A3F9C2"
7. Admin verifies in bank portal, marks invoice paid via admin dashboard
8. Admin action calls: Invoice.status=paid, PaymentRecord.status=succeeded
```

**BankTransferProcessor.createCheckout()** returns a static payload (bank details + formatted payment instructions) rather than a redirect URL.

**BankTransferProcessor.handleWebhook()** is not used — bank transfers have no real-time webhook. Admin confirmation is the terminal event.

---

## Stripe Integration

Stripe serves international dealers or high-value enterprise accounts paying in USD/PHP via card.

**Checkout flow:**

```
1. StripeProcessor.createCheckout(invoice) calls Stripe Checkout Sessions API
2. Returns Stripe-hosted checkout URL
3. Dealer completes card payment on Stripe page
4. Stripe sends webhook to POST /api/webhooks/payments/stripe
5. StripeProcessor.handleWebhook() verifies Stripe-Signature header
6. On checkout.session.completed: update Invoice, create PaymentRecord
```

**Webhook endpoint:** `POST /api/webhooks/payments/stripe`

Stripe webhook signature is verified via `stripe.webhooks.constructEvent(rawBody, sig, endpointSecret)`. Unverified requests return HTTP 400.

---

## Failed Payment Handling

When a payment attempt fails (`PaymentRecord(status=failed)`):

1. Invoice remains in `status=failed`.
2. Dealer receives in-app notification and email: "Payment failed for Invoice {invoiceNumber}."
3. A 7-day grace period begins. Dealer's plan and features remain active during grace.
4. At day 3: "Suspension warning — payment due in 4 days."
5. At day 7: if still unpaid, plan reverts to Free. Active features (featured listings, automation rules) are suspended.
6. Dealer can retry payment at any time during or after the grace period. Successful retry reinstates the plan immediately.

The grace period is tracked via `Invoice.dueAt`. A cron job checks `Invoice WHERE status=failed AND dueAt < now - 7 days` daily.

---

## Refund Process

```
1. Admin triggers refund from admin billing dashboard
2. If original payment was via processor: refund is initiated via processor API
   (Stripe: refunds.create; PayMongo: POST /refunds)
3. PaymentRecord created: { type=refunded, amount, processorRef=refund_id }
4. Invoice.status = 'refunded'
5. Feature/subscription that was activated by this invoice is reversed:
   - FeaturedListing: status=cancelled
   - Subscription: plan reverts to Free, subscriptionExpiresAt=now
6. DealerActivity logged: { type=lead_updated, description="Invoice refunded: INV-..." }
```

Partial refunds are not supported in v1. All refunds are full-invoice refunds.

---

## Subscription Renewal

A cron job runs on the 1st of each month (or on the dealer's billing anniversary for monthly plans):

```
1. Find all Dealer WHERE subscriptionExpiresAt <= tomorrow AND plan != 'free'
2. For each: create Invoice(status=pending, periodStart=today, periodEnd=today+30d)
3. Attempt payment using dealer's last successful processor
4. On success: Invoice.status=paid, extend subscriptionExpiresAt by 30d (or 365d for annual)
5. On failure: begin grace period flow
```

Annual plan renewals create a single invoice for the full annual amount.

---

## Philippines Tax Considerations

### VAT (12%)

B2B subscription sales in the Philippines are subject to 12% VAT. Invoice amounts are exclusive of VAT by default. The `Invoice` model stores the base amount; VAT is calculated and displayed at checkout.

```
amountExcludingVat = invoice.amount
vat = amountExcludingVat × 0.12
totalDue = amountExcludingVat + vat
```

VAT-registered dealers can submit their TIN for VAT invoice issuance. TIN is stored on `Dealer.taxIdNumber`.

### Official Receipt (OR)

BIR regulations require an Official Receipt for every transaction. OR generation is handled by an OR numbering sequence maintained in the database (`OfficialReceiptSequence` table, auto-incrementing). ORs are generated as PDFs and attached to the paid invoice record.

OR fields required:
- OR number (sequential)
- Date of transaction
- Dealer business name and TIN
- Description of service
- Amount (ex-VAT), VAT amount, total
- AutoBentaPH registered business name, TIN, address

---

## Admin Billing Operations

All admin billing actions are available at `/admin/billing`.

| Operation         | Action                                                               |
|-------------------|----------------------------------------------------------------------|
| Create invoice    | Manually create an invoice for a dealer (custom amount/plan)         |
| Mark paid         | Set Invoice.status=paid; required for bank transfer reconciliation   |
| Void invoice      | Set Invoice.status=void; no payment collected                        |
| Issue refund      | Trigger refund flow (processor + status update)                      |
| Export CSV        | Export all invoices for a date range as CSV (for accounting)         |

Admin actions create a `DealerActivity` record tagged with the admin user's ID as `actorId`, ensuring all manual billing changes are auditable.
