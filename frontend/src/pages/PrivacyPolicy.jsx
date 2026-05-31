import { useEffect } from 'react';

const Section = ({ title, children }) => (
  <section className="mb-10">
    <h2 className="text-xl font-semibold text-gray-900 mb-4">{title}</h2>
    <div className="space-y-3 text-gray-700 leading-relaxed">{children}</div>
  </section>
);

export default function PrivacyPolicy() {
  useEffect(() => {
    document.title = 'Privacy Policy — AutoBentaPH';
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Effective date: June 1, 2026 &nbsp;·&nbsp; Last updated: June 1, 2026</p>
        </div>

        <p className="text-gray-700 leading-relaxed mb-10">
          AutoBentaPH ("we," "us," or "our") operates the AutoBentaPH website and dealer platform (the "Service").
          This Privacy Policy explains what personal information we collect, how we use it, and your rights under the
          Republic of the Philippines Data Privacy Act of 2012 (Republic Act No. 10173, "DPA") and its implementing rules.
          By using the Service, you consent to the practices described here.
        </p>

        <Section title="1. Personal Information We Collect">
          <p><strong>Account holders (buyers and sellers):</strong> name, email address, mobile number, and profile photo when you register an account.</p>
          <p><strong>Vehicle listings:</strong> vehicle photos, make, model, year, price, mileage, and location you provide when posting a listing.</p>
          <p><strong>Inquiries and leads:</strong> name, email, and phone number you submit when contacting a dealer or requesting information about a vehicle.</p>
          <p><strong>Dealer accounts:</strong> business name, business address, DTI or SEC registration number, contact person name and mobile number, and government-issued identification documents required for verification.</p>
          <p><strong>Payments:</strong> billing name and GCash or bank transfer references. We do not store full card numbers or bank account credentials.</p>
          <p><strong>Usage data:</strong> IP address, browser type, device type, pages visited, and session duration, collected via server logs and cookies.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use your personal information to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>Create and manage your account and authenticate your identity.</li>
            <li>Display vehicle listings to buyers and connect buyers with dealers.</li>
            <li>Send dealer leads (name, phone, inquiry message) to the relevant dealer through the platform.</li>
            <li>Process subscription payments and issue official receipts.</li>
            <li>Verify dealer identity and vehicle ownership to protect buyers from fraud.</li>
            <li>Send transactional emails (account confirmation, lead notifications, invoices, password resets).</li>
            <li>Improve the Service by analyzing usage patterns in aggregate, non-identifiable form.</li>
            <li>Comply with legal obligations, respond to lawful government requests, and enforce our Terms of Service.</li>
          </ul>
          <p>We do not sell your personal information to third parties.</p>
        </Section>

        <Section title="3. Who We Share Your Information With">
          <p><strong>Dealers:</strong> When a buyer submits an inquiry about a vehicle, the buyer's name, phone number, and message are shared with the dealer who listed that vehicle. Buyers consent to this sharing by submitting an inquiry.</p>
          <p><strong>V8Atlas (trust and verification provider):</strong> For dealers who opt into V8Atlas verification, vehicle and dealer data is transmitted to V8Atlas to generate trust scores. V8Atlas processes this data under a data processing agreement with us.</p>
          <p><strong>Hosting and infrastructure:</strong> Our service is hosted on Render.com and uses a managed PostgreSQL database. Server logs and database backups may reside on Render.com infrastructure located in the United States. Data is encrypted at rest and in transit.</p>
          <p><strong>Legal compliance:</strong> We may disclose personal information if required by Philippine law, court order, or authorized government request (e.g., NBI, PNP) following proper legal process.</p>
          <p>We do not share personal information with advertisers or data brokers.</p>
        </Section>

        <Section title="4. Data Retention">
          <p><strong>Active accounts:</strong> We retain personal information for as long as your account is active and for a reasonable period thereafter.</p>
          <p><strong>Lead data:</strong> Buyer inquiry data is retained for 24 months from the date of submission and then deleted from dealer CRM records unless the dealer has exported it.</p>
          <p><strong>Verification documents:</strong> Government IDs and business permits uploaded for dealer verification are retained for 3 years from the date of submission to satisfy anti-fraud obligations, then permanently deleted.</p>
          <p><strong>Cancelled accounts:</strong> Upon account deletion, we anonymize personal data within 30 days. Aggregated, non-identifiable analytics data may be retained indefinitely.</p>
          <p><strong>Backups:</strong> Database backups are retained for 30 days on a rolling basis. Deleted data may remain in a backup for up to 30 days before being overwritten.</p>
        </Section>

        <Section title="5. Cookies and Tracking">
          <p>We use the following types of cookies:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Session cookies (essential):</strong> Required for login and authentication. These cannot be disabled without breaking the Service.</li>
            <li><strong>Functional cookies:</strong> Store your preferences (e.g., saved search filters). Persist between sessions.</li>
            <li><strong>Analytics cookies:</strong> Used to understand how visitors navigate the site. No personal identifiers are transmitted to analytics providers. You may opt out by disabling cookies in your browser settings.</li>
          </ul>
          <p>We do not use advertising or cross-site tracking cookies.</p>
        </Section>

        <Section title="6. Security">
          <p>We use industry-standard security measures to protect your personal information:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li>All data in transit is encrypted using TLS 1.2 or higher (HTTPS).</li>
            <li>Database and backups are encrypted at rest.</li>
            <li>Verification documents are stored in access-controlled storage and are not publicly accessible.</li>
            <li>Passwords are hashed using bcrypt with per-user salts and are never stored in plaintext.</li>
            <li>Access to production systems is restricted to authorized personnel only.</li>
          </ul>
          <p>No system is perfectly secure. If you believe your account has been compromised, contact us immediately at <a href="mailto:support@autobentaph.com" className="text-blue-600 hover:underline">support@autobentaph.com</a>.</p>
        </Section>

        <Section title="7. Your Rights Under RA 10173 (Data Privacy Act)">
          <p>As a data subject under Philippine law, you have the right to:</p>
          <ul className="list-disc pl-6 space-y-1">
            <li><strong>Be informed</strong> about how your personal data is processed — which this document fulfills.</li>
            <li><strong>Access</strong> the personal information we hold about you. Submit a request to <a href="mailto:privacy@autobentaph.com" className="text-blue-600 hover:underline">privacy@autobentaph.com</a> and we will respond within 15 business days.</li>
            <li><strong>Correct</strong> inaccurate or incomplete personal data. You may update most information directly in your account settings.</li>
            <li><strong>Erase or block</strong> your personal data when it is no longer necessary for the purpose it was collected, subject to our retention obligations described in Section 4.</li>
            <li><strong>Object</strong> to processing for direct marketing purposes. To opt out of marketing emails, use the unsubscribe link in any marketing email.</li>
            <li><strong>Data portability</strong> — receive a copy of your personal data in a machine-readable format.</li>
            <li><strong>File a complaint</strong> with the National Privacy Commission (NPC) at <a href="https://www.privacy.gov.ph" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">privacy.gov.ph</a> if you believe we have violated your data privacy rights.</li>
          </ul>
          <p>To exercise any of these rights, email <a href="mailto:privacy@autobentaph.com" className="text-blue-600 hover:underline">privacy@autobentaph.com</a> with the subject line "Data Privacy Request." We will verify your identity before processing any request.</p>
        </Section>

        <Section title="8. Data Breach Notification">
          <p>
            In the event of a personal data breach that is likely to result in serious harm, we will notify affected individuals and the National Privacy Commission within 72 hours of discovering the breach, in accordance with NPC Circular 16-03. The notification will describe the nature of the breach, the personal data involved, the likely consequences, and the measures we are taking to address it.
          </p>
        </Section>

        <Section title="9. Children's Privacy">
          <p>The Service is not directed to individuals under 18 years of age. We do not knowingly collect personal information from minors. If you believe a minor has provided personal information to us, contact us at <a href="mailto:privacy@autobentaph.com" className="text-blue-600 hover:underline">privacy@autobentaph.com</a> and we will delete it promptly.</p>
        </Section>

        <Section title="10. Changes to This Policy">
          <p>We may update this Privacy Policy from time to time. When we do, we will post the revised policy on this page and update the "Last updated" date above. For material changes that affect how we use your personal information, we will notify you by email or by a prominent notice on the Service at least 30 days before the change takes effect.</p>
          <p>Continued use of the Service after the effective date of a revised policy constitutes your acceptance of the new terms.</p>
        </Section>

        <Section title="11. Contact Us">
          <p>For privacy-related questions, data subject requests, or concerns about this policy:</p>
          <ul className="list-none space-y-1">
            <li><strong>Email:</strong> <a href="mailto:privacy@autobentaph.com" className="text-blue-600 hover:underline">privacy@autobentaph.com</a></li>
            <li><strong>Support:</strong> <a href="mailto:support@autobentaph.com" className="text-blue-600 hover:underline">support@autobentaph.com</a></li>
            <li><strong>Registered address:</strong> [AutoBentaPH Business Address, Metro Manila, Philippines]</li>
          </ul>
          <p className="text-sm text-gray-500 mt-4">
            This Privacy Policy is governed by the laws of the Republic of the Philippines, including Republic Act No. 10173
            (Data Privacy Act of 2012) and its Implementing Rules and Regulations.
          </p>
        </Section>
      </div>
    </div>
  );
}
