import { useEffect } from 'react';

const Section = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="text-xl font-semibold text-on-surface mb-4">{title}</h2>
    <div className="space-y-3 text-on-surface leading-relaxed">{children}</div>
  </section>
);

export default function DealerAgreement() {
  useEffect(() => {
    document.title = 'Dealer Service Agreement — AutoBentaPH';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-on-surface mb-2">Dealer Service Agreement</h1>
          <p className="text-sm text-on-surface-variant">Effective date: June 1, 2026 &nbsp;·&nbsp; Last updated: June 1, 2026</p>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 mb-10">
          <p className="text-sm text-blue-800 font-medium mb-1">Important — Please read before signing up</p>
          <p className="text-sm text-blue-700">
            This Dealer Service Agreement ("Agreement") is a binding contract between you (the "Dealer") and AutoBentaPH
            ("AutoBentaPH," "we," or "us"). It governs your subscription to the AutoBentaPH dealer platform. By completing
            dealer registration and activating your subscription, you accept all terms of this Agreement. If you do not agree,
            do not complete registration.
          </p>
        </div>

        <Section title="1. Parties">
          <p><strong>AutoBentaPH</strong> — the operator of the AutoBentaPH used-car marketplace and dealer SaaS platform, a registered business in the Philippines.</p>
          <p><strong>Dealer</strong> — the business or individual identified during dealer registration, including all authorized users operating under the Dealer's account.</p>
        </Section>

        <Section title="2. Services Provided">
          <p>AutoBentaPH will provide the Dealer with access to the AutoBentaPH dealer platform, which includes:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Unlimited vehicle listing slots (subject to plan limits).</li>
            <li>Lead CRM with 8-stage pipeline management, activity tracking, and automation rules.</li>
            <li>Analytics dashboard (listing views, lead conversion, response time metrics).</li>
            <li>V8Atlas trust score display and verification badge on all dealer listings.</li>
            <li>Featured listing placement (if purchased as an add-on).</li>
            <li>Dealer public profile page on AutoBentaPH.</li>
            <li>Customer support via email and WhatsApp (Mon–Sat, 8:00 AM–6:00 PM PHT), with a 4-hour initial response SLA for Founding Dealers.</li>
          </ul>
          <p>AutoBentaPH reserves the right to modify, enhance, or discontinue specific features with 30 days' written notice to active Dealers. Discontinuation of a core feature (vehicle listing or CRM) entitles the Dealer to terminate this Agreement with a pro-rated refund of prepaid fees.</p>
        </Section>

        <Section title="3. Subscription Fees and Payment Terms">
          <p><strong>Founding Dealer Plan:</strong> ₱3,599 per month (Philippine Pesos, inclusive of applicable taxes). This rate is locked in for the lifetime of the Dealer's account, provided the account remains in good standing. If the Dealer's account lapses due to non-payment, the locked rate is forfeited and the then-current standard rate applies upon reinstatement.</p>
          <p><strong>Billing cycle:</strong> Invoices are issued on the 25th of each month for the following calendar month. Payment is due on the 1st of the billing month.</p>
          <p><strong>Grace period:</strong> There is a 7-day grace period after the payment due date. If payment is not received by the 8th of the month, the Dealer's account will be suspended. Listings will be hidden from the public marketplace until payment is received. Leads and CRM data are preserved during suspension.</p>
          <p><strong>Accepted payment methods:</strong> GCash transfer to the AutoBentaPH registered GCash number, BDO or BPI bank transfer to the AutoBentaPH bank account. Payment details are provided on the invoice.</p>
          <p><strong>Official receipts:</strong> AutoBentaPH will issue an official receipt or BIR-compliant sales invoice within 3 business days of confirmed payment. Receipts are sent to the Dealer's registered email address.</p>
          <p><strong>Price changes:</strong> AutoBentaPH may adjust prices for new subscriptions at any time. Locked-rate Founding Dealers are exempt from price increases as long as the account remains in continuous good standing.</p>
        </Section>

        <Section title="4. Data Ownership">
          <p><strong>Dealer owns their data.</strong> All vehicle listings, lead records, CRM data, and customer contact information entered by the Dealer ("Dealer Data") remain the exclusive property of the Dealer. AutoBentaPH does not claim ownership of Dealer Data.</p>
          <p><strong>Limited license to AutoBentaPH:</strong> By listing a vehicle on the AutoBentaPH platform, the Dealer grants AutoBentaPH a non-exclusive, royalty-free license to display the listing (including photos, description, and price) on the AutoBentaPH marketplace, in marketing materials, and in advertising that promotes AutoBentaPH to buyers. This license expires when the listing is removed or the Dealer's account is terminated.</p>
          <p><strong>Data portability:</strong> Upon request, AutoBentaPH will provide the Dealer with an export of their listings and CRM data in CSV format within 5 business days. Exports are available at any time during an active subscription and within 30 days after termination.</p>
          <p><strong>Data after termination:</strong> Upon account termination, AutoBentaPH will delete Dealer Data from active systems within 30 days, subject to retention obligations under Philippine law and our Privacy Policy. Backup copies may persist for up to 30 additional days before permanent deletion.</p>
        </Section>

        <Section title="5. Cancellation">
          <p><strong>By the Dealer:</strong> The Dealer may cancel this Agreement at any time by providing 30 days' written notice to <a href="mailto:support@autobentaph.com" className="text-blue-600 hover:underline">support@autobentaph.com</a> with the subject line "Cancellation Request." Email notice is sufficient; no phone call is required.</p>
          <p><strong>No refunds on partial months:</strong> If the Dealer cancels during a paid billing period, the Service will continue through the end of that period with no further charges. No refund is issued for the unused portion of a paid month.</p>
          <p><strong>By AutoBentaPH for cause:</strong> AutoBentaPH may terminate this Agreement immediately, without refund, if the Dealer: (a) posts prohibited listings as defined in the AutoBentaPH Terms of Service; (b) engages in fraud, misrepresentation, or illegal activity; (c) repeatedly violates platform policies after written warning; or (d) fails to pay subscription fees within the grace period and remains in default for 30 days.</p>
          <p><strong>By AutoBentaPH without cause:</strong> AutoBentaPH may terminate this Agreement without cause by providing 60 days' written notice. In this case, AutoBentaPH will provide a pro-rated refund of any prepaid fees covering the period after the effective termination date.</p>
        </Section>

        <Section title="6. Dealer Obligations">
          <p>The Dealer agrees to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Maintain accurate and up-to-date vehicle listings, including current availability, price, and condition.</li>
            <li>Respond to buyer inquiries within 24 hours during business days.</li>
            <li>Disclose all material defects, flood damage, salvage history, and outstanding chattel mortgages in vehicle listings.</li>
            <li>Comply with all applicable Philippine laws, including LTO regulations, Consumer Act provisions, and data privacy requirements under RA 10173.</li>
            <li>Not use the platform to list vehicles on behalf of third parties without written authorization from AutoBentaPH.</li>
            <li>Keep account credentials secure and notify AutoBentaPH immediately of any unauthorized access.</li>
          </ul>
        </Section>

        <Section title="7. Liability Cap">
          <p>TO THE MAXIMUM EXTENT PERMITTED BY PHILIPPINE LAW, AUTOBENTAPH'S TOTAL LIABILITY TO THE DEALER FOR ANY CLAIM ARISING UNDER THIS AGREEMENT SHALL NOT EXCEED THREE (3) MONTHS OF SUBSCRIPTION FEES PAID BY THE DEALER IN THE 3 MONTHS PRECEDING THE CLAIM.</p>
          <p>AutoBentaPH is not liable for: (a) loss of profits, revenue, or goodwill; (b) loss of leads or business opportunities; (c) damage to the Dealer's reputation; or (d) any indirect, consequential, or punitive damages, even if AutoBentaPH has been advised of the possibility of such damages.</p>
          <p>AutoBentaPH's liability for platform downtime is limited to a service credit equal to 1 day of subscription fee for each 24-hour period of unplanned downtime exceeding 1 hour in a calendar month, applied to the next invoice. AutoBentaPH does not guarantee any specific uptime percentage.</p>
        </Section>

        <Section title="8. Confidentiality">
          <p>Each party agrees to keep confidential any non-public business information received from the other party in connection with this Agreement ("Confidential Information"). Confidential Information does not include information that is publicly available, independently developed, or lawfully received from a third party.</p>
          <p>AutoBentaPH will not disclose the Dealer's business performance data (listing views, lead counts, conversion rates) to any third party without the Dealer's consent, except in anonymized, aggregated form that does not identify the Dealer.</p>
        </Section>

        <Section title="9. Warranties and Disclaimers">
          <p>THE AUTOBENTAPH PLATFORM IS PROVIDED "AS IS." WE DO NOT WARRANT THAT THE PLATFORM WILL BE ERROR-FREE, UNINTERRUPTED, OR FREE FROM SECURITY VULNERABILITIES.</p>
          <p>AutoBentaPH does not warrant the quality or accuracy of leads delivered through the platform. Lead volume and conversion rates depend on market conditions and the Dealer's listing quality, pricing, and responsiveness — factors outside AutoBentaPH's control.</p>
        </Section>

        <Section title="10. Governing Law and Dispute Resolution">
          <p>This Agreement is governed by the laws of the Republic of the Philippines.</p>
          <p><strong>Informal resolution:</strong> Before initiating any formal dispute process, both parties agree to negotiate in good faith for at least 30 days following written notice of the dispute.</p>
          <p><strong>Jurisdiction:</strong> Any unresolved dispute shall be submitted to the exclusive jurisdiction of the appropriate courts of Metro Manila, Philippines.</p>
        </Section>

        <Section title="11. Entire Agreement">
          <p>This Agreement, together with the AutoBentaPH <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a> and <a href="/privacy" className="text-blue-600 hover:underline">Privacy Policy</a>, constitutes the entire agreement between the parties regarding the dealer platform subscription. It supersedes all prior proposals, negotiations, or representations, whether written or oral.</p>
          <p>In the event of conflict between this Agreement and the Terms of Service on dealer-specific matters (fees, data, cancellation), this Agreement controls.</p>
          <p>No amendment to this Agreement is valid unless made in writing and signed (or electronically acknowledged) by both parties.</p>
        </Section>

        <Section title="12. Contact">
          <ul className="list-none space-y-1">
            <li><strong>Billing:</strong> <a href="mailto:billing@autobentaph.com" className="text-blue-600 hover:underline">billing@autobentaph.com</a></li>
            <li><strong>Support:</strong> <a href="mailto:support@autobentaph.com" className="text-blue-600 hover:underline">support@autobentaph.com</a></li>
            <li><strong>Legal:</strong> <a href="mailto:legal@autobentaph.com" className="text-blue-600 hover:underline">legal@autobentaph.com</a></li>
          </ul>
          <p className="text-sm text-on-surface-variant mt-6 p-4 bg-surface-container rounded-lg border border-border-subtle">
            <strong>Note to Founding Dealers:</strong> This Agreement is provided for transparency and will be presented for
            formal acceptance before your first billing date. A personalized PDF copy will be sent to your registered email
            address once your account is activated. AutoBentaPH recommends that all Dealers have this Agreement reviewed
            by a licensed Philippine attorney before signing.
          </p>
        </Section>
      </div>
    </div>
  );
}
