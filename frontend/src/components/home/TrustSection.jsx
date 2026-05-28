import {
  BadgeCheck,
  ShieldCheck,
  Banknote,
  AlertTriangle,
  ClipboardCheck,
  Lock,
} from 'lucide-react';

const ITEMS = [
  {
    Icon: BadgeCheck,
    title: 'Verified sellers',
    desc: 'Every dealer is DTI-registered and ID-checked before listing.',
  },
  {
    Icon: ShieldCheck,
    title: 'Inspection-ready',
    desc: '120-point mechanical and cosmetic inspection at trusted PH bays.',
  },
  {
    Icon: Banknote,
    title: 'Financing partners',
    desc: 'Pre-qualify with BPI, Security Bank, and Toyota Financial in minutes.',
  },
  {
    Icon: AlertTriangle,
    title: 'Fraud detection',
    desc: 'AI flags stolen units, cloned plates, and suspicious pricing.',
  },
  {
    Icon: ClipboardCheck,
    title: 'Ownership checklist',
    desc: 'OR/CR, deed of sale, and transfer guide for every transaction.',
  },
  {
    Icon: Lock,
    title: 'Secure inquiry',
    desc: 'Contact sellers without exposing your personal number.',
  },
];

export default function TrustSection() {
  return (
    <section className="bg-ink text-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">
            Why AutoBentaPH
          </p>
          <h2 className="mt-2 text-2xl font-bold sm:text-3xl">
            Built for safer used-car deals in the Philippines
          </h2>
          <p className="mt-3 text-sm text-white/70">
            Every listing passes through identity, document, and AI fraud checks before it
            reaches you.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {ITEMS.map(({ Icon, title, desc }) => (
            <div
              key={title}
              className="flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-colors hover:border-accent/50"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-deepblue/30 text-accent">
                <Icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/70">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
