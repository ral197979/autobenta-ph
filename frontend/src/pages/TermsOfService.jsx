import { useEffect } from 'react';
import { Link } from 'react-router-dom';

const Section = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="text-xl font-semibold text-on-surface mb-4">{title}</h2>
    <div className="space-y-3 text-on-surface leading-relaxed">{children}</div>
  </section>
);

export default function TermsOfService() {
  useEffect(() => {
    document.title = 'Terms of Service — AutoBentaPH';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-surface-container-lowest">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-on-surface mb-2">Terms of Service</h1>
          <p className="text-sm text-on-surface-variant">Effective date: June 1, 2026 &nbsp;·&nbsp; Last updated: June 1, 2026</p>
        </div>

        <p className="text-on-surface leading-relaxed mb-10">
          These Terms of Service ("Terms") govern your access to and use of the AutoBentaPH website, mobile site,
          and dealer platform (collectively, the "Service") operated by AutoBentaPH ("we," "us," or "our").
          By creating an account or using any part of the Service, you agree to be bound by these Terms.
          If you do not agree, do not use the Service.
        </p>

        <Section title="1. Eligibility">
          <p>You must be at least 18 years old and legally capable of entering into a binding contract under Philippine law to use the Service. By using the Service, you represent that you meet these requirements.</p>
          <p>Dealers must be duly registered businesses or sole proprietors in the Philippines with a valid DTI or SEC registration. Dealer accounts are subject to additional verification requirements described in Section 6.</p>
        </Section>

        <Section title="2. Account Registration">
          <p>You may browse public listings without an account. To post listings, submit inquiries, or access dealer features, you must register an account.</p>
          <p>You agree to: (a) provide accurate, current, and complete information during registration; (b) keep your account credentials confidential; (c) notify us immediately at <a href="mailto:support@autobentaph.com" className="text-blue-600 hover:underline">support@autobentaph.com</a> if you suspect unauthorized access to your account; and (d) take responsibility for all activity that occurs under your account.</p>
          <p>We reserve the right to refuse registration or terminate accounts at our discretion, including for violations of these Terms.</p>
        </Section>

        <Section title="3. Acceptable Use">
          <p>You agree to use the Service only for lawful purposes and in accordance with these Terms. You must not:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Post false, misleading, or fraudulent vehicle listings.</li>
            <li>Use the Service to facilitate any transaction that violates Philippine law.</li>
            <li>Attempt to gain unauthorized access to any part of the Service or any other user's account.</li>
            <li>Scrape, crawl, or harvest data from the Service using automated means without our prior written consent.</li>
            <li>Use the Service to transmit unsolicited commercial communications (spam).</li>
            <li>Impersonate another person, dealer, or entity.</li>
            <li>Interfere with the proper working of the Service, including by introducing viruses or other harmful code.</li>
            <li>Use the Service to launder money, facilitate tax evasion, or commit any other financial crime.</li>
          </ul>
        </Section>

        <Section title="4. Prohibited Listings">
          <p>The following vehicle listings are strictly prohibited and will be removed without notice. Accounts that post prohibited listings will be suspended or permanently banned:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Stolen vehicles.</strong> Listing a vehicle with an altered, removed, or fraudulent Vehicle Identification Number (VIN), or any vehicle known or suspected to be stolen, is prohibited and will be reported to law enforcement.</li>
            <li><strong>Flood-damaged vehicles without disclosure.</strong> All vehicles that have sustained flood damage must be clearly disclosed in the listing description. Listing a flood-damaged vehicle without disclosure constitutes fraud.</li>
            <li><strong>Salvage or total-loss vehicles without disclosure.</strong> Vehicles that have been declared a total loss by an insurance company, rebuilt from salvage, or reconstructed must be labeled as such in the listing. Failure to disclose salvage status is prohibited.</li>
            <li><strong>Vehicles with tampered odometers.</strong> Listing a vehicle with a rolled-back or otherwise altered odometer reading is prohibited under Republic Act No. 8750 (Seat Belts Use Act) and analogous consumer protection laws.</li>
            <li><strong>Vehicles under active chattel mortgage without lender consent.</strong> You may not list a vehicle as available for immediate transfer if it is encumbered by an active chattel mortgage unless you disclose the encumbrance and have obtained the lender's consent to the sale.</li>
            <li><strong>Non-existent vehicles ("ghost listings").</strong> Listings for vehicles that the poster does not own, possess, or have authority to sell are prohibited.</li>
          </ul>
          <p>We reserve the right, but not the obligation, to monitor listings for compliance. We are not liable for prohibited listings posted by users.</p>
        </Section>

        <Section title="5. Buyer-Seller Transactions">
          <p>AutoBentaPH is a marketplace platform. We are not a party to any transaction between buyers and sellers. We do not own, inspect, verify the condition of, or take title to any vehicle listed on the Service.</p>
          <p>Buyers are solely responsible for: (a) verifying vehicle condition, title, and history before purchase; (b) conducting independent inspection; (c) confirming the seller has legal authority to sell the vehicle; and (d) complying with LTO registration and ownership transfer requirements.</p>
          <p>We strongly recommend that all buyers use a licensed vehicle inspector and verify title through the Land Transportation Office (LTO) before completing any purchase.</p>
        </Section>

        <Section title="6. Dealer Accounts and Verification">
          <p>Dealers who apply for a verified dealer account must submit business registration documents and government-issued identification. We reserve the right to approve or reject dealer applications at our sole discretion.</p>
          <p>Verified dealers receive trust badges and enhanced platform features. Verification does not constitute an endorsement of the dealer's business practices, financial condition, or the quality of vehicles they sell.</p>
          <p>Dealer accounts are subject to the separate <Link to="/dealer-agreement" className="text-blue-600 hover:underline">Dealer Service Agreement</Link>, which governs subscription fees, billing, and termination. In the event of conflict between these Terms and the Dealer Service Agreement, the Dealer Service Agreement controls for dealer-specific matters.</p>
        </Section>

        <Section title="7. Intellectual Property">
          <p><strong>Our content:</strong> The AutoBentaPH name, logo, platform design, and all content we create are protected by copyright and may not be reproduced, distributed, or used for commercial purposes without our written permission.</p>
          <p><strong>User content:</strong> You retain ownership of the photos and text you post on the Service. By posting content, you grant AutoBentaPH a non-exclusive, worldwide, royalty-free license to display, reproduce, and distribute your content in connection with operating and promoting the Service. This license ends when you delete your content or terminate your account, except for cached or archived copies that may take up to 30 days to clear.</p>
          <p><strong>DMCA / Intellectual Property Complaints:</strong> If you believe content on the Service infringes your intellectual property rights, send a written notice to <a href="mailto:legal@autobentaph.com" className="text-blue-600 hover:underline">legal@autobentaph.com</a> with: (a) identification of the work claimed to be infringed; (b) identification of the infringing content and its location on the Service; (c) your contact information; and (d) a statement of good-faith belief and accuracy under penalty of perjury. We will investigate and remove infringing content upon receipt of a valid notice.</p>
        </Section>

        <Section title="8. Privacy">
          <p>Our collection and use of personal information is governed by our <Link to="/privacy" className="text-blue-600 hover:underline">Privacy Policy</Link>, which is incorporated into these Terms by reference.</p>
        </Section>

        <Section title="9. Disclaimers">
          <p>THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, OR NON-INFRINGEMENT.</p>
          <p>We do not warrant that: (a) the Service will be uninterrupted, error-free, or secure; (b) any vehicle listing is accurate, complete, or current; (c) any dealer is properly licensed or in good standing; or (d) any transaction facilitated through the Service will be completed successfully.</p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>TO THE MAXIMUM EXTENT PERMITTED BY PHILIPPINE LAW, AUTOBENTAPH AND ITS OFFICERS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE, INCLUDING LOSS OF PROFITS, DATA, OR GOODWILL.</p>
          <p>Our total liability to you for any claim arising from use of the Service shall not exceed the greater of: (a) the total fees you paid to us in the 3 months preceding the claim; or (b) ₱1,000.</p>
          <p>Some jurisdictions do not allow the exclusion of certain warranties or the limitation of liability — in such jurisdictions, our liability is limited to the maximum extent permitted by law.</p>
        </Section>

        <Section title="11. Account Suspension and Termination">
          <p><strong>By you:</strong> You may close your account at any time by contacting <a href="mailto:support@autobentaph.com" className="text-blue-600 hover:underline">support@autobentaph.com</a>. Account closure is subject to any outstanding payment obligations.</p>
          <p><strong>By us:</strong> We may suspend or terminate your account, with or without notice, if: (a) you violate these Terms; (b) we are required to do so by law or government order; (c) your account shows signs of fraudulent activity; or (d) you fail to pay subscription fees as a dealer.</p>
          <p>Upon termination, your right to use the Service ceases immediately. Sections 7, 9, 10, 12, and 13 survive termination.</p>
        </Section>

        <Section title="12. Dispute Resolution">
          <p><strong>Informal resolution first:</strong> Before filing any formal claim, you agree to contact us at <a href="mailto:legal@autobentaph.com" className="text-blue-600 hover:underline">legal@autobentaph.com</a> and attempt to resolve the dispute informally for at least 30 days.</p>
          <p><strong>Governing law:</strong> These Terms and any dispute arising from your use of the Service are governed by the laws of the Republic of the Philippines, without regard to conflict of law principles.</p>
          <p><strong>Jurisdiction:</strong> Any legal proceedings not resolved informally shall be brought exclusively in the appropriate courts of Metro Manila, Philippines. You consent to the personal jurisdiction of these courts.</p>
          <p><strong>Consumer rights:</strong> Nothing in these Terms limits any rights you may have under the Philippine Consumer Act (Republic Act No. 7394) or other applicable consumer protection laws.</p>
        </Section>

        <Section title="13. Changes to These Terms">
          <p>We may update these Terms from time to time. When we do, we will post the revised Terms at this URL and update the effective date. For material changes, we will notify registered users by email at least 30 days before the change takes effect.</p>
          <p>Continued use of the Service after the effective date constitutes acceptance of the revised Terms. If you do not agree to the revised Terms, stop using the Service and close your account.</p>
        </Section>

        <Section title="14. Contact Us">
          <ul className="list-none space-y-1">
            <li><strong>General:</strong> <a href="mailto:support@autobentaph.com" className="text-blue-600 hover:underline">support@autobentaph.com</a></li>
            <li><strong>Legal / IP:</strong> <a href="mailto:legal@autobentaph.com" className="text-blue-600 hover:underline">legal@autobentaph.com</a></li>
            <li><strong>Privacy:</strong> <a href="mailto:privacy@autobentaph.com" className="text-blue-600 hover:underline">privacy@autobentaph.com</a></li>
          </ul>
        </Section>
      </div>
    </div>
  );
}
