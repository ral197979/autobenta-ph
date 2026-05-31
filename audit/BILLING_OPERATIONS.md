# Billing Operations Audit
## AutoBentaPH — Billing System Documentation

**Document type:** Audit / Operational Reference
**Scope:** ClosingInvoice model, manual billing process, OR requirements, MRR recognition

---

## 1. ClosingInvoice Model and Status Flow

### Model definition (key fields)

```typescript
interface ClosingInvoice {
  id: string;                          // UUID
  agreementId: string;                 // FK: DealerAgreement
  dealerId: string | null;             // FK: Dealer (null until account activated)
  invoiceNumber: string;               // INV-[seq]-[YYMMDD]
  amount: number;                      // 3599.00 (base) + add-ons
  billingPeriodStart: Date;
  billingPeriodEnd: Date;
  dueDate: Date;
  status: InvoiceStatus;
  paymentMethod: 'gcash' | 'bdo' | 'bpi' | null;
  paymentReference: string | null;     // GCash ref or bank ref
  paidAt: Date | null;
  officialReceiptNumber: string | null; // OR-[seq]-[YYYY]
  officialReceiptIssuedAt: Date | null;
  notes: string | null;
  createdAt: Date;
  updatedAt: Date;
}
```

### Status flow

```
DRAFT
  │
  ▼
SENT ──────────────────────────────────────────────┐
  │                                                 │
  ▼                                                 │
VIEWED (optional — if open tracking is enabled)    │
  │                                                 │
  ▼                                                 │
PAID ◄─────── (Manual confirmation via admin)      │
  │                                                 │
  │  [If not paid by grace period end]              │
  │           ▼                                     │
  │         OVERDUE ──────────────────►  CANCELLED  │
  │           │                          (manual,   │
  │           │                          by admin)  │
  └───────────┘
```

**Valid transitions:**
- `draft → sent` (when invoice is emailed/WhatsApp'd)
- `sent → viewed` (optional; if email open tracking is added)
- `sent → paid` or `viewed → paid` (when admin confirms payment received)
- `sent → overdue` (automated — runs daily job, triggers on past due date + 7 days)
- `overdue → paid` (still collectable after overdue — payment clears it)
- `overdue → cancelled` (manual admin action, used for write-offs or account closures)
- `sent → cancelled` or `draft → cancelled` (manual — e.g., dealer churns before paying)

**No reverse transitions:** Once `paid`, status cannot move backward. If a refund is issued, a separate credit note or refund record is created.

---

## 2. Invoice Number Format

```
INV-[seq]-[YYMMDD]
```

- `seq` = 3-digit zero-padded sequential counter (001, 002, ... 999)
- `YYMMDD` = year-month-day of invoice issue date in 2-digit-year format

Examples:
- `INV-001-260601` — first invoice ever, issued June 1, 2026
- `INV-005-261225` — fifth invoice, issued December 25, 2026

The sequence counter is global (not per-dealer) and never resets. Maximum 999 invoices with this format — extend to 4 digits (`INV-0001-`) when approaching 999.

**Official Receipt number format:**
```
OR-[seq]-[YYYY]
```
- Same sequential counter as invoices (for simplicity — one counter for both)
- Year is 4-digit

Example: `OR-001-2026`

---

## 3. Manual Billing Process (Current State)

AutoBentaPH currently operates on **manual billing** — no payment gateway integration.

### GCash collection flow
1. Admin generates invoice (PDF from template)
2. Invoice emailed to dealer + WhatsApp notification
3. Dealer sends GCash payment to founder's personal/business GCash number
4. Dealer screenshots confirmation and sends to founder
5. Founder confirms receipt, logs in spreadsheet
6. Admin panel: PATCH `/api/v1/admin/closing/invoices/:id/paid` with:
   - `paymentMethod: "gcash"`
   - `paymentReference: "[GCash transaction ID]"`
   - `paidAt: [timestamp]`
7. Account activated
8. OR generated and emailed

### Bank transfer collection flow
Steps 1–3 same as GCash.
4. Dealer sends bank transfer confirmation slip or screenshot
5. Founder verifies credit in their BDO/BPI account (1–2 business days for inter-bank)
6. Steps 6–8 same as GCash flow

### Manual billing limitations (known)
- No automated reminders (must be done manually)
- No automatic status changes to OVERDUE (must be triggered manually or by cron)
- No payment link (dealer must initiate the transfer)
- GCash personal number has transfer limits (current GCash Business limit: ₱100,000/day)

---

## 4. Future Automated Billing Options

### Option A: GCash for Business API
- Enables payment request links (dealer clicks link, pays in-app)
- Transaction webhooks (automatic `paid` status updates)
- Requires GCash merchant application + BIR registration
- Timeline estimate: 2–4 weeks to integrate

### Option B: PayMongo (PH payment processor)
- Supports GCash, Maya, credit cards, bank transfer in one integration
- REST API, webhook-based
- Monthly fee or per-transaction (1.5% + ₱15 per GCash transaction)
- Timeline estimate: 1–2 weeks to integrate

### Option C: Stripe (for international or card payments)
- Best if targeting dealers who have BDO/BPI business accounts with Visa/Mastercard
- Requires Stripe Atlas or local entity for PH payouts
- Not recommended as primary — too much friction for GCash-native dealers

**Recommended path:** Integrate PayMongo at 50 MRR (₱179,950/month) — before that point, manual billing is manageable.

---

## 5. Official Receipt Requirement (BIR Compliance)

AutoBentaPH is required to issue Official Receipts for all service payments received.

### Legal basis
Under the National Internal Revenue Code (NIRC) and BIR regulations, all persons engaged in business must issue Official Receipts for services rendered. Failure to issue OR is a BIR violation.

### Requirements
- Must have a BIR Authority to Print (ATP) OR booklet — OR
- Can use CAS (Computerized Accounting System) with BIR-approved OR format
- OR must include: TIN, business name, address, amount, service description, signature

### Current approach
Manual PDF ORs issued within 3 business days of payment. These must be numbered sequentially and retained for BIR audit purposes.

**Note:** Consult an accountant to confirm your specific OR requirements based on your business registration type (sole proprietorship, OPC, etc.).

---

## 6. Revenue Recognition Policy

**Principle:** Revenue is recognized when payment is received, not when the invoice is sent or when the subscription period starts.

| Event | MRR Impact |
|-------|------------|
| Invoice sent | None — not yet revenue |
| Invoice viewed | None |
| Invoice paid (confirmed) | +₱3,599 to MRR |
| Account activated | Confirms MRR (coincides with payment confirmation) |
| Dealer churns | -₱3,599 from MRR in the month payment stops |
| Dealer pauses | -₱3,599 from MRR for pause month |
| Expansion add-on purchased | +₱999 or +₱500 added to MRR |

### MRR calculation
```
MRR = SUM of all active dealer monthly subscription amounts
```

Do not count: sent invoices (unpaid), trial accounts, paused accounts.

---

## 7. First Invoice Checklist

Before sending the very first invoice (Dealer #1):

- [ ] Signed agreement is on file (signed PDF or photo saved)
- [ ] Dealer business name and address confirmed
- [ ] Invoice number sequence initialized (starting at INV-001)
- [ ] Your TIN is included on the invoice
- [ ] Payment method details are correct (GCash number tested, bank details verified)
- [ ] Due date is set correctly (Day 0 + 5 days for first invoice)
- [ ] Invoice saved as PDF: `INV-[DealerName]-[YYYY-MM].pdf`
- [ ] Invoice emailed to dealer's registered email
- [ ] WhatsApp follow-up sent within 30 minutes of email
- [ ] Accounting spreadsheet ready to receive the record

---

*Last updated: 2026-05-31 | AutoBentaPH Billing Audit*
