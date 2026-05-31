# Dealer #1 Payment Flow
## AutoBentaPH — Step-by-Step Payment Operations

**Purpose:** Operational guide for generating invoices, collecting payment, issuing receipts, and maintaining accurate financial records.

---

## Part 1: When to Generate the First Invoice

**Trigger:** Signed Dealer Agreement received (photo or PDF).

**Timeline:** Generate and send invoice within **2 hours** of receiving the signed agreement. This urgency signals professionalism and keeps the momentum going.

Do not generate an invoice before the agreement is signed. No exceptions.

---

## Part 2: Invoice Template

Create as a PDF. File naming convention: `INV-[DealerName]-[YYYY-MM].pdf`

Example: `INV-ManilaAutoSales-2026-06.pdf`

---

### Invoice Content (exact format to use)

```
=====================================
          A U T O B E N T A P H
=====================================
[YOUR REGISTERED BUSINESS NAME]
[STREET ADDRESS, CITY, ZIP CODE]
TIN: [YOUR 9-DIGIT TIN]-000
Email: [YOUR EMAIL]
Mobile: [YOUR PHONE]
Website: autobentaph.com

OFFICIAL INVOICE
=====================================

Invoice No.:    INV-001-260601
                (format: INV-[seq number]-[YYMMDD])

Date Issued:    [DATE]
Due Date:       [DATE + 5 DAYS for first invoice]
                [1st of following month for recurring]

=====================================
BILL TO:
=====================================
Business Name:  [Dealer Business Name]
Address:        [Dealer Address]
Contact Person: [Dealer Contact Name]
Mobile:         [Dealer Phone]
Email:          [Dealer Email]
TIN (if known): [Dealer TIN]

=====================================
DESCRIPTION                    AMOUNT
=====================================
AutoBentaPH Dealer Subscription
Founding Dealer Plan           ₱3,599.00
Billing Period: [Month Year]
(Rate Locked for Life —
 Founding Dealer Privilege)
-------------------------------------
TOTAL DUE                      ₱3,599.00
=====================================

PAYMENT INSTRUCTIONS:
-------------------------------------
Option 1 — GCash (Preferred):
  GCash Number: [YOUR GCASH NUMBER]
  Account Name: [YOUR NAME]
  Amount: ₱3,599.00

Option 2 — BDO Bank Transfer:
  Account Name: [YOUR NAME / BUSINESS]
  Account Number: [ACCOUNT NUMBER]
  Bank: BDO Unibank
  Branch: [BRANCH NAME]

Option 3 — BPI Bank Transfer:
  Account Name: [YOUR NAME / BUSINESS]
  Account Number: [ACCOUNT NUMBER]
  Bank: Bank of the Philippine Islands
  Branch: [BRANCH NAME]

After payment: Please send the payment
screenshot or confirmation to:
  WhatsApp: [YOUR WHATSAPP]
  Email: [YOUR EMAIL]

Official Receipt will be issued within
3 business days of payment confirmation.
=====================================
Thank you for being an AutoBentaPH
Founding Dealer.
=====================================
```

---

## Part 3: GCash Collection — Step-by-Step

### Step 1: Share your GCash number
Already included in the invoice. Confirm it in the WhatsApp cover message.

**Format to share:**
```
GCash: [YOUR GCASH NUMBER]
Account Name: [YOUR NAME]
Amount: ₱3,599.00
```

### Step 2: When payment screenshot arrives
Check the following:
- [ ] Sender name: matches dealer's name or a name they confirmed is theirs (spouse, business partner — ask if unsure)
- [ ] Amount: exactly ₱3,599.00
- [ ] Date: today or within the last 24 hours
- [ ] Transaction reference number: visible in the screenshot (save this for your records)
- [ ] Status: "Successful" (not "Pending")

### Step 3: Check your GCash balance
Open GCash > Transaction History > confirm the credit appears.

### Step 4: Send immediate WhatsApp confirmation (within 5 minutes)
```
Natanggap! Confirmed ang payment ng ₱3,599 — salamat [First name]! 🙏

I-issue ko ang Official Receipt sa email ninyo within 3 business days.

I-a-activate ko na ang inyong account ngayon at mag-se-schedule tayo ng onboarding call. Kailan kayo available?
```

### Step 5: Log the payment
Open accounting spreadsheet. Log:
- Date received
- Dealer name
- Amount (₱3,599)
- Method (GCash)
- GCash reference number
- Status: Received

### Step 6: Activate the account
- Log into admin panel
- Set dealer account status = Active
- Confirm Founding Dealer tier is set
- Record activation date

### Step 7: Issue Official Receipt
Generate within 3 business days (see Part 5).

---

## Part 4: BDO/BPI Bank Transfer Flow

### Account details (include in invoice)
```
BDO:
  Account Name: [YOUR NAME or BUSINESS NAME]
  Account Number: XXXX-XXXX-XXX (10–12 digits)
  Bank: BDO Unibank, Inc.
  Branch: [Branch Name]

BPI:
  Account Name: [YOUR NAME or BUSINESS NAME]
  Account Number: XXXX-XXXX (10 digits)
  Bank: Bank of the Philippine Islands
  Branch: [Branch Name]
```

### Confirming receipt
1. Dealer sends: bank transfer confirmation screenshot OR deposit slip photo
2. Check your online banking: BDO/BPI app > Transaction History > confirm ₱3,599 credit
3. If funds appear without dealer sending confirmation: "May natanggap kaming transfer na ₱3,599 — kayo ba ito? I-send ang reference para ma-match ko sa records."
4. Note: inter-bank transfers (GCash to BDO, BDO to BPI) can take 1 business day. Do not activate account until funds are confirmed in your account.

### Reconciliation
- Cross-reference: every bank credit should match an invoice in your spreadsheet
- Flag any unmatched credits immediately

---

## Part 5: Official Receipt Issuance

### When to issue
Within 3 business days of confirmed payment.

### OR content (exact fields required)

```
=====================================
        OFFICIAL RECEIPT
=====================================
Receipt No.:    OR-001-2026
                (format: OR-[seq]-[YYYY])
Date:           [Issue Date]

Received From:  [Dealer Business Name]
Address:        [Dealer Address]
TIN:            [Dealer TIN, if provided]

Amount:         ₱3,599.00
In Words:       Three Thousand Five Hundred
                Ninety-Nine Pesos Only (₱3,599.00)

For:            AutoBentaPH Dealer Subscription
                Founding Dealer Plan
                Billing Period: [Month Year]

Payment Method: [GCash / BDO Transfer / BPI Transfer]
Reference No.:  [Transaction reference number]

=====================================
[YOUR SIGNATURE BLOCK / STAMP]
[YOUR NAME], Authorized Signatory
[YOUR BUSINESS NAME]
[YOUR ADDRESS]
TIN: [YOUR TIN]
=====================================
This receipt is valid even without
a BIR Authority to Print logo if
issued under a registered OR booklet.
=====================================
```

### OR file naming
`OR-[DealerName]-[YYYY-MM].pdf`
Example: `OR-ManilaAutoSales-2026-06.pdf`

### How to deliver
**Email first:**
Subject: Official Receipt — AutoBentaPH Subscription — [Month Year]
Attach the PDF.

**WhatsApp notification after email:**
```
[First name], i-send ko na ang Official Receipt sa email ninyo. Kumpleto na ang records para sa [month] subscription. Salamat! 🙏
```

---

## Part 6: Invoice File Organization

### Folder structure
```
/billing/
  /invoices/
    INV-[DealerName]-[YYYY-MM].pdf
  /receipts/
    OR-[DealerName]-[YYYY-MM].pdf
  /signed-agreements/
    [DealerName]-Agreement-Signed-[YYYY-MM-DD].pdf
  /payment-screenshots/
    [DealerName]-GCash-[YYYY-MM-DD].jpg
```

---

## Part 7: Accounting Spreadsheet — Column Format

Maintain one spreadsheet (`billing/BILLING_LEDGER.xlsx`) with one row per payment:

| Column | Description | Example |
|--------|-------------|---------|
| Date Received | Date payment confirmed | 2026-06-01 |
| Invoice No. | Invoice reference | INV-001-260601 |
| Dealer Name | Business name | Manila Auto Sales |
| Dealer Contact | Person's name | Juan dela Cruz |
| Billing Month | Month of service | June 2026 |
| Amount | ₱ received | 3,599 |
| Payment Method | GCash / BDO / BPI | GCash |
| Reference No. | Transaction ID | GCash-XXXXXXXX |
| OR Number | Official Receipt # | OR-001-2026 |
| OR Date Issued | When OR was sent | 2026-06-02 |
| Account Activated | Yes/No | Yes |
| Notes | Anything unusual | |

---

## Part 8: Monthly Reconciliation Checklist

Run on the **5th of each month** (covering the prior month).

- [ ] Every invoice from the prior month has a matching payment record
- [ ] Every payment has a matching Official Receipt on file and sent
- [ ] All GCash reference numbers logged
- [ ] All bank transfer references logged
- [ ] No outstanding invoices older than 30 days without escalation documented
- [ ] Billing spreadsheet totals match actual GCash/bank deposits
- [ ] Any refunds or credits logged separately
- [ ] MRR updated: total active paying dealers × ₱3,599
- [ ] File all documents in correct folders

### MRR tracking formula
```
Current MRR = Number of active paying dealers × ₱3,599

Target MRR milestones:
  1 dealer:  ₱3,599/mo
  2 dealers: ₱7,198/mo
  3 dealers: ₱10,797/mo
  4 dealers: ₱14,396/mo
  5 dealers: ₱17,995/mo ← Founding Dealer target
```

---

## Part 9: Invoice Number Sequence

Maintain a running counter for invoice numbers. Never reuse a number.

Format: `INV-[3-digit sequence]-[YYMMDD of issue date]`

Examples:
- First invoice ever: `INV-001-260601`
- Second invoice (same day, different dealer): `INV-002-260601`
- Third invoice (next month): `INV-003-260701`

OR numbers use the same sequence but prefixed with `OR-`:
- `OR-001-2026` (year only, since ORs are annual documents)

---

*Last updated: 2026-05-31 | AutoBentaPH Payment Operations*
