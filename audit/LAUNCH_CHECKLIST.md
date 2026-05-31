# AutoBentaPH — Pre-Launch Verification Checklist

**Complete every item before the first paying dealer goes live. Binary: done or not done. No "partial."**

Last updated: [FILL IN date]
Completed by: [FILL IN name]

---

## Legal & Compliance

- [ ] **Dealer Service Agreement drafted.** Must cover at minimum: subscription fee and payment terms (due 1st of month, 7-day grace period, suspend on non-payment), data ownership (dealer owns their listings and lead data; AutoBentaPH holds a limited license to display), cancellation terms (30-day written notice, no refunds on partial months), liability cap (max liability = 3 months of subscription paid), and governing law (Republic of the Philippines). Have a Philippine lawyer review before first dealer signs.
- [ ] **Privacy Policy live at `/privacy`.** Must cover: what personal data is collected (name, email, phone, vehicle photos), how it is used, who it is shared with, retention period, and how users can request deletion. Must reference RA 10173 (Data Privacy Act of the Philippines).
- [ ] **Terms of Service live at `/terms`.** Must cover: acceptable use, prohibited listings (stolen vehicles, flooded vehicles not disclosed, salvage not disclosed), DMCA/IP policy, dispute resolution, and account termination conditions.
- [ ] **Cookie Policy linked from footer.** Must disclose analytics cookies (Google Analytics or equivalent), functional cookies (session), and give users a way to opt out of non-essential cookies. Required for any user in the EU; recommended for all users.
- [ ] **BSP/DTI registration checked.** Confirm whether subscription billing to dealers (B2B SaaS) requires any DTI or BSP registration in the Philippines. As of 2025, B2B SaaS subscription collection via GCash or bank transfer by a registered Philippine sole proprietorship or corporation does not require a separate BSP license — but confirm this with a local accountant before first invoice.
- [ ] **Data Privacy Act (RA 10173) compliance reviewed.** Confirm: (1) Personal Information Controller registration with the National Privacy Commission if you process personal data of 1,000+ individuals — threshold review needed. (2) Data processing agreement with any third-party processors (e.g., hosting provider, email service). (3) Breach notification procedure documented (72-hour rule).
- [ ] **BIR registration / official receipts.** Confirm you can issue an official receipt or sales invoice to dealers (required for their own BIR compliance). BIR-printed OR or an accredited e-OR system must be in place before first invoice.

---

## Technical Go-Live

Run these checks on the production environment, not local.

- [ ] `DATABASE_URL` set in production environment variables (points to production Postgres, not a dev database).
- [ ] `FRONTEND_URL` set to production domain (e.g., `https://autobentaph.com`). Used in email links and CORS headers.
- [ ] `JWT_SECRET` set to a cryptographically random string, minimum 64 characters. Run `openssl rand -base64 64` to generate. Do not reuse the dev value.
- [ ] `V8ATLAS_WEBHOOK_SECRET` set in environment (if V8Atlas sync is enabled for any dealer). Confirm the webhook endpoint validates the signature before processing.
- [ ] Backup script tested end-to-end: run `scripts/verify-backup.sh` and confirm exit code 0. Verify a backup file was written to the expected location. Verify the backup can be restored (spot-check one table).
- [ ] Health endpoint returns 200: run `curl https://[your-domain]/api/health | jq .status` and confirm `"ok"` or equivalent. If it returns 500, stop — do not go live.
- [ ] Demo seed run on production: `node backend/prisma/seedDemo.js`. Verify seed data is visible at demo@autobentaph.com login. Do not run seed on a database that already has real dealer data.
- [ ] Admin account created: set `role = 'admin'` directly in the `users` table for your account. Confirm `/admin/founding-dealers` and `/admin/growth` load without error using that account.
- [ ] SSL certificate valid and auto-renewing. Run `curl -I https://[your-domain]` and confirm `HTTP/2 200`. Check certificate expiry: `echo | openssl s_client -connect [your-domain]:443 2>/dev/null | openssl x509 -noout -dates`.
- [ ] Error monitoring active (Sentry or equivalent). Trigger a test error and confirm it appears in the dashboard.
- [ ] Rate limiting verified on public endpoints (`/book-demo`, `/api/auth/login`, `/api/listings`). Confirm repeated requests from the same IP are throttled.

---

## Demo Environment

The demo environment is your primary sales tool. Every prospective dealer who books a demo will see this. It must be perfect.

- [ ] Demo dealer login working: sign in at `demo@autobentaph.com` with demo password. Confirm the dealer dashboard loads with inventory, CRM, and analytics visible.
- [ ] 50 listings visible in browse (`/listings` or equivalent public page). Listings should show photos, price, mileage, and dealer name. At least 10 listings should have "Featured" status.
- [ ] CRM shows sample leads in all 8 stages. Use the seed data. Confirm moving a card between stages saves correctly.
- [ ] Analytics dashboard loading with demo data. No blank charts or loading spinners. Key metrics visible: listing views, leads generated, average response time.
- [ ] Featured listings visible on homepage with photos and prices. Confirm at least 3 featured listings are showing.
- [ ] Demo dealer account has at least 2 recent "sold" listings (for the sales pitch showing inventory turnover).
- [ ] Lead notifications working: submit a test inquiry from the public listing page and confirm the dealer receives it in their CRM.

---

## Sales Readiness

- [ ] `/for-dealers` page live and loading. No broken images, no placeholder text.
- [ ] `/for-dealers/founding` page live. Shows: ₱3,599/mo price, 5-slot progress bar, founding badge description, and a CTA to `/book-demo`.
- [ ] `/book-demo` page live and bookings routing to CRM. Submit a test booking using a real email address. Confirm the booking appears in `/admin/founding-dealers` within 60 seconds. Confirm the confirmation email is received.
- [ ] `/admin/founding-dealers` accessible with admin login. All 8 Kanban stages visible. Cards draggable between stages.
- [ ] `/admin/growth` accessible with admin login. Shows: dealer count progress bar (0/5), current MRR (₱0), conversion funnel, and goals checklist.
- [ ] First 10 prospects added to `/admin/founding-dealers` (from `sales/TARGET_DEALERS.csv`). Cards have: dealer name, location, phone, priority level, and first contact date.
- [ ] All 8 email/WhatsApp templates personalized: open each file in `sales/templates/`, replace every `[PLACEHOLDER]` with your actual name, company name, phone number, and domain. Send each template to yourself as a test. No placeholders should remain.
- [ ] ROI calculator tested with sample inputs. Input: 20 listings, 5 leads/month, ₱50,000 average margin. Verify the output makes sense and the UI renders correctly on mobile.
- [ ] Founding Dealer offer confirmed: ₱3,599/mo, 5 slots, locks in for life, founding badge, 4-hr SLA. Verify this matches the copy on `/for-dealers/founding`.

---

## Payment & Billing

Manual billing is acceptable for the first 5 dealers. Automate in Sprint 2.

- [ ] Manual payment process documented and practiced: (1) Invoice sent via email on the 25th of the preceding month, (2) payment collected via GCash to [your number] or BDO/BPI bank transfer to [your account], (3) admin marks invoice as paid in `/admin/billing` or equivalent, (4) official receipt issued within 3 business days.
- [ ] First invoice template ready. Must include: AutoBentaPH business name and address, dealer name and address, invoice number, billing period (e.g., July 1–31, 2026), line item (AutoBentaPH Founding Dealer Plan — ₱3,599), total amount due, due date, and GCash/bank transfer details.
- [ ] Official receipt template ready (or BIR-accredited e-OR system active). Confirm you can issue a valid OR before first payment is collected.
- [ ] Billing cycle documented and communicated to dealers: invoices sent on the 25th, due on the 1st, 7-day grace period, account suspended on the 8th if unpaid.
- [ ] Refund policy defined: [Recommended: no refunds for partial months; if cancelled before the 25th of any month, service continues through end of that billing period with no further charge.]

---

## Support

- [ ] Support email active and monitored: `support@[yourdomain].com`. Send a test email and confirm it arrives in your inbox. Set auto-reply: "We've received your message and will respond within 4 hours (Mon–Sat, 8am–6pm PHT)."
- [ ] Demo booking email active: `demos@[yourdomain].com` or equivalent. Confirm demo booking confirmations route through this address.
- [ ] WhatsApp Business number active. Profile photo, business name, and description set. Confirm you can receive and send messages from the business number.
- [ ] Response time commitment communicated in writing to Founding Dealers: 4-hour response time for support requests, Mon–Sat, 8am–6pm PHT. This is your SLA — do not offer it unless you can keep it.
- [ ] Escalation path documented: if a dealer reports a revenue-blocking bug, what is the exact process? (Recommended: WhatsApp the founder directly + log a GitHub issue with "P0" label + respond to dealer within 1 hour with status update.)

---

## Onboarding

These must work before the first dealer account is created.

- [ ] Admin can create a new dealer account via `/admin/dealers` (or equivalent admin panel). Test: create a test dealer account, confirm it receives a welcome email with login credentials.
- [ ] Onboarding wizard tested: log in as the test dealer, complete `/dealer/onboarding` from start to finish. Confirm all steps save correctly. Confirm the completion state is visible in the admin panel.
- [ ] CSV import tested with sample data. Use a sample CSV with 10 rows (make, model, year, price, mileage, photos). Confirm all 10 listings appear in the dealer's inventory with correct data. Test edge cases: a row with a missing photo, a row with a price of ₱0.
- [ ] DealerSuccessPlan workflow confirmed: after a new dealer is created, confirm you can create a `DealerSuccessPlan` record via `/admin/success-plans` with Day 0, Day 3, Day 7, Day 14, and Day 30 milestones.
- [ ] `DEALER_ONBOARDING_PLAYBOOK.md` reviewed and ready. Know the Day 0 checklist by heart — you will run it for every new dealer within 24 hours of their first payment.
- [ ] Founding Dealer badge visible on onboarded dealer's public profile page. Confirm it renders correctly and is not just a placeholder.

---

## Final Sign-Off

Complete this section only after all items above are checked.

| Section | All items complete? | Verified by | Date |
|---|---|---|---|
| Legal & Compliance | [ ] Yes / [ ] No — [note exceptions] | [Name] | [Date] |
| Technical Go-Live | [ ] Yes / [ ] No — [note exceptions] | [Name] | [Date] |
| Demo Environment | [ ] Yes / [ ] No — [note exceptions] | [Name] | [Date] |
| Sales Readiness | [ ] Yes / [ ] No — [note exceptions] | [Name] | [Date] |
| Payment & Billing | [ ] Yes / [ ] No — [note exceptions] | [Name] | [Date] |
| Support | [ ] Yes / [ ] No — [note exceptions] | [Name] | [Date] |
| Onboarding | [ ] Yes / [ ] No — [note exceptions] | [Name] | [Date] |

**Launch authorized:** [ ] Yes — all sections complete
**Launch blocked by:** [List any incomplete items that must be resolved before first dealer goes live]
