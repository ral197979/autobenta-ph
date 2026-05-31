# Dealer Closing System — Technical & Operational Audit
## AutoBentaPH

**Document type:** Audit / System Documentation
**Scope:** Backend models, API routes, frontend pages supporting the dealer closing pipeline

---

## 1. What Was Built

### 1.1 Data Models

**Proposal**
Represents a formal pricing proposal sent to a prospective dealer.

Fields:
- `id` — UUID primary key
- `dealerProspectId` — FK to the prospect record
- `proposedRate` — monthly subscription amount (e.g., 3599.00)
- `planName` — "Founding Dealer" or future tier names
- `featuresIncluded` — JSON array of included features
- `validUntil` — expiry date for the proposal
- `status` — enum: `draft | sent | viewed | accepted | expired | rejected`
- `sentAt` — timestamp when proposal was emailed/WhatsApp'd
- `viewedAt` — timestamp when the proposal link was first opened (if tracked)
- `createdAt`, `updatedAt`

**DealerAgreement**
Represents the signed legal agreement between AutoBentaPH and a dealer.

Fields:
- `id` — UUID primary key
- `proposalId` — FK to the originating Proposal
- `dealerName` — legal business name
- `dealerAddress`, `dealerTin`, `dealerContact`
- `foundingDealerRate` — rate locked at signing
- `signedAt` — timestamp of signing
- `signatureMethod` — `wet_signature | digital | photo`
- `signedDocumentUrl` — S3/storage URL of the signed document
- `status` — enum: `pending | signed | active | terminated`
- `auditLog` — JSON array (append-only — see Section 1.4)
- `createdAt`, `updatedAt`

**ClosingInvoice**
Represents a billing invoice generated from a signed agreement.

Fields:
- `id` — UUID primary key
- `agreementId` — FK to the DealerAgreement
- `invoiceNumber` — format: `INV-[seq]-[YYMMDD]` (e.g., `INV-001-260601`)
- `dealerId` — FK to the active Dealer record (populated after activation)
- `amount` — ₱3,599.00 (or modified amount if add-ons present)
- `billingPeriodStart`, `billingPeriodEnd`
- `dueDate`
- `status` — enum: `draft | sent | viewed | paid | overdue | cancelled`
- `paymentMethod` — `gcash | bdo | bpi | null`
- `paymentReference` — GCash or bank transaction reference
- `paidAt` — timestamp of confirmed payment
- `officialReceiptNumber` — format: `OR-[seq]-[YYYY]`
- `officialReceiptIssuedAt`
- `createdAt`, `updatedAt`

---

### 1.2 Backend API Routes

All routes are under `/api/v1/closing/` or `/api/v1/admin/`:

| Method | Route | Description |
|--------|-------|-------------|
| POST | `/api/v1/closing/proposals` | Create a new proposal for a prospect |
| GET | `/api/v1/closing/proposals/:id` | Retrieve proposal details |
| PATCH | `/api/v1/closing/proposals/:id/status` | Update proposal status (sent/viewed/accepted) |
| POST | `/api/v1/closing/agreements` | Create agreement from accepted proposal |
| PATCH | `/api/v1/closing/agreements/:id/sign` | Record agreement signing + append audit log entry |
| POST | `/api/v1/closing/invoices` | Generate invoice from signed agreement |

Admin-only routes (require admin JWT):

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/api/v1/admin/closing/pipeline` | View all prospects and their stage |
| PATCH | `/api/v1/admin/closing/invoices/:id/paid` | Mark invoice as paid (manual confirmation) |
| POST | `/api/v1/admin/closing/invoices/:id/receipt` | Record Official Receipt issuance |

---

### 1.3 Frontend Pages

**`/admin/closing-pipeline`**
The 9-stage Kanban-style view of all active prospects. Each card shows:
- Prospect name and business
- Current stage
- Days in current stage
- Last activity date
- Quick action buttons (Send Proposal, View Agreement, Generate Invoice)

**`/admin/closing-pipeline/:prospectId`**
Individual prospect detail view:
- Full contact and qualification info
- Proposal history (all proposals sent)
- Agreement status and download link
- Invoice history and payment status
- Stage change log with timestamps

---

### 1.4 The 9-Stage Closing Pipeline

Stages are stored as an enum on the `DealerProspect` model:

```
0. IDENTIFIED         — On the list; no contact yet
1. CONTACTED          — First outreach sent; response received
2. QUALIFIED          — Confirmed dealer, has inventory, is open to platform
3. DEMO_BOOKED        — Demo scheduled; time/link confirmed
4. DEMO_COMPLETE      — Demo happened; follow-up sent
5. VERBAL_YES         — Prospect said yes; agreement not yet sent
6. AGREEMENT_SENT     — Agreement sent to prospect
7. AGREEMENT_SIGNED   — Signed agreement received
8. INVOICE_SENT       — Invoice generated and sent
9. PAID_ACTIVE        — Payment confirmed; account activated ← CLOSED
```

Stage transitions are logged with:
- `from_stage`
- `to_stage`
- `changed_by` (admin user ID)
- `changed_at` (timestamp)
- `notes` (optional freetext)

---

### 1.5 How Proposals, Agreements, and Invoices Chain

```
DealerProspect
    └── Proposal (one or more — can re-send with updated terms)
            └── DealerAgreement (created when proposal is accepted)
                    └── ClosingInvoice (generated when agreement is signed)
                            └── Dealer (account created when invoice is paid)
```

The chain is linear: you cannot create an agreement without a proposal, and you cannot create an invoice without a signed agreement.

Foreign key constraints enforce this in the database.

---

### 1.6 Audit Trail on Agreements

The `DealerAgreement.auditLog` field is an append-only JSON array. New entries are inserted via the `/sign` endpoint and any status change endpoint. Entries are never deleted or updated.

**Entry format:**
```json
{
  "timestamp": "2026-06-01T08:30:00Z",
  "action": "signed",
  "performedBy": "dealer_contact_juan_delcruz",
  "method": "photo_whatsapp",
  "notes": "Received signed photo via WhatsApp at 8:30 PHT. Saved to agreements/..."
}
```

**Logged actions:**
- `created` — agreement record created
- `sent` — agreement document sent to dealer
- `viewed` — dealer opened agreement (if tracked)
- `signed` — signature received and confirmed
- `activated` — dealer account activated post-payment
- `amended` — any post-signing changes (rare; requires new record ideally)
- `terminated` — account terminated

---

## 2. Future: E-Signature Integration Hookpoints

The system is designed to accept digital signatures when a provider is integrated. Hookpoints:

**In `DealerAgreement`:**
- `signatureMethod` field already accepts `digital` as a value
- `signedDocumentUrl` can store the digitally-signed PDF URL from DocuSign, Adobe Sign, etc.
- `externalSignatureId` field (nullable) — can store the provider's transaction ID for verification

**In the `/sign` endpoint:**
- Currently processes manual signature confirmation
- When integrating an e-signature provider:
  1. Add a `POST /sign/initiate` route to send the document to the provider
  2. Add a webhook handler `POST /sign/webhook` to receive completion callbacks
  3. Update the audit log automatically on webhook receipt

**Recommended providers for PH market:**
- SignNow or DocuSign (for international dealers)
- Local: eSign.ph (if BIR-compliant digital signature is required)

---

*Last updated: 2026-05-31 | AutoBentaPH Audit*
