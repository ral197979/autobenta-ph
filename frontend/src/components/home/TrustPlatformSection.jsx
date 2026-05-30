import { Link } from 'react-router-dom';
import { FileCheck, Wrench, CreditCard, BadgeCheck, BookOpen, ShieldCheck, ArrowRight } from 'lucide-react';

const FEATURES = [
  {
    icon: FileCheck,
    label: 'Ownership Transfer Center',
    description: 'Step-by-step guidance, required documents, cost estimates, and an interactive checklist for LTO vehicle transfers.',
    href: '/ownership-transfer',
    color: 'bg-blue-50 text-deepblue',
  },
  {
    icon: Wrench,
    label: 'Vehicle Inspection',
    description: 'Book a 120-point pre-purchase inspection at a partner bay near the seller. Know exactly what you are buying.',
    href: '/inspections',
    color: 'bg-purple-50 text-purple-700',
  },
  {
    icon: CreditCard,
    label: 'Financing Assistance',
    description: 'Calculate monthly payments and submit pre-qualification requests to bank partners directly through the platform.',
    href: '/financing',
    color: 'bg-emerald-50 text-emerald-700',
  },
  {
    icon: BadgeCheck,
    label: 'Verified Sellers',
    description: 'Every dealer listing passes our identity and accreditation review. Verified badges indicate documented credentials.',
    href: '/cars?sellerType=dealer',
    color: 'bg-amber-50 text-amber-700',
  },
  {
    icon: BookOpen,
    label: 'Vehicle History Reports',
    description: 'LTO registration history, prior ownership records, and disclosed incident data — coming to all listings.',
    href: '/cars',
    color: 'bg-indigo-50 text-indigo-700',
    comingSoon: true,
  },
  {
    icon: ShieldCheck,
    label: 'Insurance Marketplace',
    description: 'Compare CTPL and comprehensive motor insurance quotes from leading Philippine insurers in one place.',
    href: '/insurance',
    color: 'bg-teal-50 text-teal-700',
  },
];

export default function TrustPlatformSection() {
  return (
    <section className="bg-softbg">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
        <div className="mb-10 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-electric mb-2">Complete platform</p>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">
              More than listings.<br className="hidden sm:block" />
              A safer way to buy.
            </h2>
          </div>
          <Link
            to="/safe-buying"
            className="hidden items-center gap-1.5 text-sm font-semibold text-deepblue hover:text-ink sm:inline-flex transition-colors"
          >
            Safe Buying Guide <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, label, description, href, color, comingSoon }) => (
            <Link
              key={label}
              to={href}
              className="group relative flex flex-col rounded-2xl border border-cardborder bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md hover:border-deepblue/20"
            >
              {comingSoon && (
                <span className="absolute right-4 top-4 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-600">
                  Coming soon
                </span>
              )}
              <div className={`mb-4 flex h-10 w-10 items-center justify-center rounded-xl ${color}`}>
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mb-2 font-bold text-ink">{label}</h3>
              <p className="flex-1 text-sm text-slatetext leading-relaxed">{description}</p>
              <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-deepblue opacity-0 transition-opacity group-hover:opacity-100">
                Learn more <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/safe-buying"
            className="inline-flex items-center gap-1 text-sm font-semibold text-deepblue"
          >
            Safe Buying Guide <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
