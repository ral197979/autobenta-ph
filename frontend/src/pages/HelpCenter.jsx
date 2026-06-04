import { useState } from 'react';
import { Link } from 'react-router-dom';

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

const CATEGORIES = [
  { icon: 'directions_car', title: 'Buying a Car', desc: 'Search, inspect, and inquire with confidence.', to: '/cars' },
  { icon: 'sell', title: 'Selling Guide', desc: 'List your car and reach verified buyers.', to: '/sell' },
  { icon: 'verified_user', title: 'Ryderr Certified', desc: 'How inspections and verification work.', to: '/inspection-services' },
  { icon: 'fact_check', title: 'Ownership Transfer', desc: 'LTO requirements, fees, and checklist.', to: '/ownership-transfer' },
  { icon: 'payments', title: 'Financing & Taxes', desc: 'Loan calculator and pre-approval.', to: '/financing' },
  { icon: 'security', title: 'Account & Security', desc: 'Manage your profile and password.', to: '/account' },
];

const FAQS = [
  { q: 'How does Ryderr verify sellers?', a: 'Sellers submit a government ID and selfie; dealers add business registration and a permit. Verified accounts earn a badge shown on every listing.' },
  { q: 'What does "Ryderr Certified" mean?', a: 'The vehicle passed a 180-point pre-purchase inspection by our engineers. You can view the full report on the listing.' },
  { q: 'How do offers work?', a: 'Make an offer from any listing. The seller can accept, decline, or send a counter-offer, which you can then accept or withdraw — all tracked under Offers.' },
  { q: 'Is my payment held in escrow?', a: 'Escrow is coming soon via a licensed partner. For now, complete payment directly with the seller after inspection and use our transfer checklist.' },
  { q: 'How long does ownership transfer take?', a: 'A standard private transfer in the Philippines takes about 7–14 days. See the Ownership Transfer guide for the step-by-step timeline.' },
];

export default function HelpCenter() {
  const [open, setOpen] = useState(0);
  const [q, setQ] = useState('');
  const faqs = q ? FAQS.filter(f => (f.q + f.a).toLowerCase().includes(q.toLowerCase())) : FAQS;

  return (
    <div className="bg-background min-h-screen">
      {/* Hero */}
      <section className="bg-surface-container-lowest border-b border-border-subtle">
        <div className="max-w-3xl mx-auto px-gutter-mobile md:px-gutter-desktop py-3xl text-center">
          <h1 className="font-display-lg text-display-lg text-primary mb-md">How can we help?</h1>
          <div className="relative">
            <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search articles, guides, or issues…"
              className="w-full py-4 pl-14 pr-6 bg-surface border border-border-subtle rounded-xl focus:ring-2 focus:ring-primary outline-none transition-shadow shadow-sm text-body-md text-on-surface placeholder-on-surface-variant/60" />
          </div>
        </div>
      </section>

      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-2xl space-y-3xl">
        {/* Categories */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
          {CATEGORIES.map((c) => (
            <Link key={c.title} to={c.to} className="bg-surface-container-lowest border border-border-subtle rounded-xl p-lg hover:border-primary hover:-translate-y-0.5 transition-all group">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-md">
                <Icon name={c.icon} className="text-primary" />
              </div>
              <h3 className="font-headline-sm text-headline-sm text-on-surface mb-sm group-hover:text-primary transition-colors">{c.title}</h3>
              <p className="text-body-sm text-on-surface-variant">{c.desc}</p>
            </Link>
          ))}
        </div>

        {/* FAQ */}
        <section>
          <h2 className="font-headline-md text-headline-md text-primary mb-lg">Frequently Asked Questions</h2>
          <div className="space-y-sm max-w-3xl">
            {faqs.map((f, i) => (
              <div key={f.q} className="bg-surface-container-lowest border border-border-subtle rounded-xl overflow-hidden">
                <button onClick={() => setOpen(open === i ? -1 : i)} className="w-full flex items-center justify-between gap-4 p-lg text-left">
                  <span className="font-label-md text-on-surface">{f.q}</span>
                  <Icon name={open === i ? 'expand_less' : 'expand_more'} className="text-on-surface-variant shrink-0" />
                </button>
                {open === i && <div className="px-lg pb-lg text-body-md text-on-surface-variant -mt-sm">{f.a}</div>}
              </div>
            ))}
            {faqs.length === 0 && <p className="text-on-surface-variant">No articles match "{q}".</p>}
          </div>
        </section>

        {/* Contact */}
        <section>
          <h2 className="font-headline-md text-headline-md text-primary mb-lg">Need direct help?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
            {[
              { icon: 'chat', title: 'Live Chat', desc: 'Mon–Sat, 9am–6pm', cta: 'Start Chat', primary: true },
              { icon: 'confirmation_number', title: 'Open a Ticket', desc: 'We reply within 24 hours', cta: 'Open Ticket' },
              { icon: 'mail', title: 'Email Us', desc: 'support@ryderr.ph', cta: 'Send Email' },
            ].map((c) => (
              <div key={c.title} className="flex items-start gap-md p-lg bg-surface-container-lowest border border-border-subtle rounded-xl">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><Icon name={c.icon} className="text-primary" /></div>
                <div className="flex-1">
                  <h3 className="font-label-md text-on-surface">{c.title}</h3>
                  <p className="text-body-sm text-on-surface-variant mb-md">{c.desc}</p>
                  <button className={c.primary ? 'px-md py-sm bg-primary text-on-primary rounded-lg font-label-md hover:opacity-90 transition-opacity' : 'px-md py-sm border border-primary text-primary rounded-lg font-label-md hover:bg-surface-container-low transition-colors'}>{c.cta}</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
