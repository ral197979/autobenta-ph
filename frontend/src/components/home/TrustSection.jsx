import { Link } from 'react-router-dom';
import {
  BadgeCheck,
  ShieldCheck,
  Banknote,
  AlertTriangle,
  ClipboardCheck,
  Lock,
  ChevronRight,
} from 'lucide-react';

const ITEMS = [
  {
    Icon: BadgeCheck,
    title: 'Verified sellers',
    desc: 'Every dealer is DTI-registered and ID-checked before listing.',
    cta: 'Browse verified listings',
    to: '/cars?verified=true',
  },
  {
    Icon: ShieldCheck,
    title: 'Inspection-ready',
    desc: '120-point mechanical and cosmetic inspection at trusted PH bays.',
    cta: 'Book an inspection',
    to: '/inspections',
  },
  {
    Icon: Banknote,
    title: 'Financing partners',
    desc: 'Pre-qualify with BPI, Security Bank, and Toyota Financial in minutes.',
    cta: 'Pre-qualify now',
    to: '/financing',
  },
  {
    Icon: AlertTriangle,
    title: 'Fraud detection',
    desc: 'AI flags stolen units, cloned plates, and suspicious pricing.',
    cta: 'Safe buying guide',
    to: '/safe-buying',
  },
  {
    Icon: ClipboardCheck,
    title: 'Ownership checklist',
    desc: 'OR/CR, deed of sale, and transfer guide for every transaction.',
    cta: 'View transfer guide',
    to: '/ownership-transfer',
  },
  {
    Icon: Lock,
    title: 'Secure inquiry',
    desc: 'Contact sellers without exposing your personal number.',
    cta: 'Browse listings',
    to: '/cars',
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
          {ITEMS.map(({ Icon, title, desc, cta, to }) => (
            <Link
              key={title}
              to={to}
              className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-sm transition-all hover:border-accent/50 hover:bg-white/10"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-deepblue/30 text-accent group-hover:bg-deepblue/50 transition-colors">
                <Icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-white/70">{desc}</p>
                <p className="mt-2.5 inline-flex items-center gap-1 text-xs font-semibold text-accent group-hover:gap-1.5 transition-all">
                  {cta}
                  <ChevronRight className="h-3 w-3" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
