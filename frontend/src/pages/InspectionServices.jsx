import { Link, useNavigate } from 'react-router-dom';
import {
  ShieldCheck, CheckCircle, Car, ClipboardList, FileText,
  TrendingDown, Camera, Wrench, Eye, RotateCcw, ChevronDown,
  ArrowRight, Star,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useState } from 'react';

const STEPS = [
  {
    n: 1,
    icon: Car,
    title: 'Choose vehicle',
    desc: 'Find a listing on AutoBentaPH you want inspected before committing.',
  },
  {
    n: 2,
    icon: ClipboardList,
    title: 'Schedule inspection',
    desc: 'Pick a date and location. Our partner inspectors cover Metro Manila and key cities.',
  },
  {
    n: 3,
    icon: Eye,
    title: 'Inspector reviews vehicle',
    desc: 'A certified mechanic performs a 120-point mechanical and cosmetic check on-site.',
  },
  {
    n: 4,
    icon: FileText,
    title: 'Receive report',
    desc: 'Get a detailed digital report with photos, ratings, and inspector notes within 24 hours.',
  },
  {
    n: 5,
    icon: ShieldCheck,
    title: 'Buy with confidence',
    desc: 'Negotiate from a position of knowledge — or walk away knowing why.',
  },
];

const BENEFITS = [
  { icon: Wrench, title: 'Mechanical review', desc: 'Engine, transmission, brakes, suspension, and drivetrain assessed by a certified mechanic.' },
  { icon: Eye, title: 'Body condition', desc: 'Paint, panels, rust, flood damage, and frame integrity checked and documented.' },
  { icon: RotateCcw, title: 'Road test', desc: 'Inspector drives the vehicle to evaluate real-world performance and identify issues not visible statically.' },
  { icon: Camera, title: 'Photo documentation', desc: 'Every finding is photographed. You get a full visual record to share with your mechanic or family.' },
  { icon: FileText, title: 'Inspection report', desc: 'Structured pass/warning/fail report covering all 120 check points, delivered digitally.' },
  { icon: TrendingDown, title: 'Negotiation leverage', desc: 'Use findings to negotiate price reductions or repair commitments before signing anything.' },
];

const PLANS = [
  {
    name: 'Basic',
    price: '₱1,499',
    desc: 'Essential checks for budget-conscious buyers.',
    points: 60,
    features: ['Engine & transmission', 'Body condition', 'Electrical basics', 'Written report'],
    highlight: false,
  },
  {
    name: 'Premium',
    price: '₱2,999',
    desc: 'Full 120-point check recommended for most buyers.',
    points: 120,
    features: ['All Basic checks', 'Road test', 'Photo documentation', 'Undercarriage inspection', 'Digital report + photos', 'Same-day turnaround'],
    highlight: true,
  },
  {
    name: 'Dealer',
    price: 'Custom',
    desc: 'Bulk inspections for dealers and fleet buyers.',
    points: 120,
    features: ['All Premium checks', 'Volume pricing', 'Priority scheduling', 'API report delivery', 'Dedicated inspector'],
    highlight: false,
  },
];

const FAQS = [
  {
    q: 'Where do inspections take place?',
    a: 'At the seller\'s location, a neutral meeting point, or one of our partner inspection bays across Metro Manila, Cebu, and Davao. You choose when booking.',
  },
  {
    q: 'How long does an inspection take?',
    a: 'Typically 1–2 hours on-site. The digital report is delivered within 24 hours of the inspection.',
  },
  {
    q: 'Can I be present during the inspection?',
    a: 'Yes — and we encourage it. Being present lets you ask questions and see findings first-hand.',
  },
  {
    q: 'What if the seller refuses an inspection?',
    a: 'A seller refusing a third-party inspection is a significant red flag. We recommend walking away from any deal where inspection access is denied.',
  },
  {
    q: 'Do you inspect brand-new cars?',
    a: 'Our service is designed for used vehicles. For brand-new cars, we recommend verifying the dealer\'s accreditation and checking the vehicle\'s PDI (pre-delivery inspection) record.',
  },
];

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-cardborder last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold text-ink hover:text-deepblue transition-colors"
      >
        {q}
        <ChevronDown className={`h-4 w-4 shrink-0 text-slatetext transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-4 text-sm text-slatetext leading-relaxed">{a}</p>}
    </div>
  );
}

export default function InspectionServices() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleBook = () => {
    if (user) {
      navigate('/inspections');
    } else {
      navigate('/login?redirect=/inspections');
    }
  };

  return (
    <div className="bg-white">
      {/* Hero */}
      <section className="bg-ink text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 mb-6">
            <ShieldCheck className="h-3.5 w-3.5 text-accent" />
            Independent Vehicle Inspections
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl leading-tight mb-4">
            Know what you're buying<br className="hidden sm:block" /> before you commit.
          </h1>
          <p className="text-base text-white/70 max-w-xl mx-auto mb-8 leading-relaxed">
            Independent vehicle inspections help identify hidden issues before you purchase.
            Don't let a bad deal cost you more than the car is worth.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleBook}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-ink hover:bg-accent/90 transition-colors"
            >
              Book Inspection <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/cars"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
            >
              Browse Vehicles
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-softbg">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-deepblue mb-2">How it works</p>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Five steps to a confident purchase</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
            {STEPS.map(({ n, icon: Icon, title, desc }) => (
              <div key={n} className="relative bg-white rounded-2xl border border-cardborder p-5 flex flex-col items-start lg:items-center lg:text-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-deepblue/10 text-deepblue mb-3 shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <span className="absolute top-3 right-3 text-[10px] font-bold text-slatetext/40 lg:static lg:mb-1">Step {n}</span>
                <p className="text-sm font-bold text-ink mb-1">{title}</p>
                <p className="text-xs text-slatetext leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-deepblue mb-2">What's covered</p>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Everything a buyer needs to know</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-cardborder p-5 flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-ink mb-1">{title}</p>
                  <p className="text-xs text-slatetext leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-softbg">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-deepblue mb-2">Pricing</p>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Transparent, flat-rate pricing</h2>
            <p className="text-sm text-slatetext mt-2">No hidden fees. Pay only when your inspection is confirmed.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 bg-white p-6 flex flex-col ${plan.highlight ? 'border-deepblue shadow-lg shadow-deepblue/10' : 'border-cardborder'}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-deepblue px-3 py-0.5 text-[11px] font-bold text-white">
                      <Star className="h-2.5 w-2.5" /> Most popular
                    </span>
                  </div>
                )}
                <p className="text-sm font-bold text-ink mb-1">{plan.name} Inspection</p>
                <p className="text-2xl font-bold text-deepblue mb-1">{plan.price}</p>
                <p className="text-xs text-slatetext mb-1">{plan.desc}</p>
                <p className="text-[11px] font-semibold text-slatetext/60 mb-4">{plan.points}-point check</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-ink">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={handleBook}
                  className={`rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${plan.highlight ? 'bg-deepblue text-white hover:bg-deepblue/90' : 'border border-cardborder text-ink hover:bg-softbg'}`}
                >
                  {plan.name === 'Dealer' ? 'Contact us' : 'Book now'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-deepblue mb-2">FAQ</p>
            <h2 className="text-2xl font-bold text-ink sm:text-3xl">Common questions</h2>
          </div>
          <div className="rounded-2xl border border-cardborder bg-white px-6">
            {FAQS.map(faq => <FaqItem key={faq.q} {...faq} />)}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="py-16 bg-deepblue text-white">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to inspect before you invest?</h2>
          <p className="text-sm text-white/70 mb-8">
            Create a free account to book your first inspection. Takes under 2 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={handleBook}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-ink hover:bg-accent/90 transition-colors"
            >
              Book Inspection <ArrowRight className="h-4 w-4" />
            </button>
            <Link
              to="/cars"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white hover:bg-white/20 transition-colors"
            >
              Browse Vehicles
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
