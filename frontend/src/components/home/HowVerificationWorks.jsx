import { Link } from 'react-router-dom';
import { BadgeCheck, FileCheck, ShieldCheck, BookOpen, ArrowRight, CheckCircle } from 'lucide-react';

const STEPS = [
  {
    icon: BadgeCheck,
    color: 'bg-deepblue/10 text-deepblue',
    title: 'Seller Identity Verification',
    badge: 'Verified Seller',
    badgeStyle: 'bg-deepblue/5 text-deepblue border border-deepblue/20',
    points: [
      'Upload government-issued ID',
      'Submit a selfie holding your ID',
      'Admin reviews within 24 hours',
      'Badge applied to all your listings',
    ],
  },
  {
    icon: FileCheck,
    color: 'bg-emerald-500/10 text-emerald-600',
    title: 'Ownership Verification',
    badge: 'Ownership Verified',
    badgeStyle: 'bg-blue-50 text-blue-700 border border-blue-200',
    points: [
      'Upload OR (Official Receipt) and CR (Certificate of Registration)',
      'Submit valid seller ID',
      'Name-matching review process',
      'Badge locks to the specific vehicle',
    ],
  },
  {
    icon: ShieldCheck,
    color: 'bg-purple-500/10 text-purple-600',
    title: 'Transfer Readiness',
    badge: 'Transfer Ready',
    badgeStyle: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
    points: [
      'OR and CR verified and on file',
      'Seller identity confirmed',
      'No ownership discrepancies found',
      'Required transfer documents complete',
    ],
  },
  {
    icon: BookOpen,
    color: 'bg-indigo-500/10 text-indigo-600',
    title: 'Vehicle History',
    badge: 'History Available',
    badgeStyle: 'bg-indigo-50 text-indigo-700 border border-indigo-200',
    points: [
      'Seller discloses previous owners',
      'OR/CR chain provided',
      'Service records uploaded',
      'LTO integration in progress',
    ],
  },
];

export default function HowVerificationWorks() {
  return (
    <section className="bg-softbg border-y border-cardborder py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 rounded-full border border-deepblue/20 bg-deepblue/5 px-3 py-1 text-xs font-medium text-deepblue mb-4">
            <ShieldCheck className="h-3.5 w-3.5" />
            Platform-enforced Trust
          </div>
          <h2 className="text-3xl font-bold text-ink sm:text-4xl">How Verification Works</h2>
          <p className="mt-4 text-lg text-slatetext max-w-2xl mx-auto">
            Every trust badge on AutoBentaPH is backed by a verified document trail — not a self-reported flag. Here is what each badge means.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((step) => (
            <div key={step.title} className="rounded-2xl border border-cardborder bg-white p-6">
              <div className={`inline-flex h-11 w-11 items-center justify-center rounded-xl ${step.color} mb-4`}>
                <step.icon className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-ink text-base mb-1">{step.title}</h3>
              <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${step.badgeStyle} mb-4`}>
                {step.badge}
              </span>
              <ul className="space-y-2">
                {step.points.map((point) => (
                  <li key={point} className="flex items-start gap-2 text-sm text-slatetext">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            to="/dashboard?tab=verification"
            className="inline-flex items-center gap-2 rounded-xl bg-deepblue px-6 py-3 text-sm font-bold text-white shadow transition-all hover:-translate-y-0.5 hover:shadow-md"
          >
            <BadgeCheck className="h-4 w-4" />
            Get Verified as a Seller
          </Link>
          <Link
            to="/safe-buying"
            className="inline-flex items-center gap-2 rounded-xl border border-cardborder bg-white px-6 py-3 text-sm font-semibold text-ink hover:bg-softbg"
          >
            Safe Buying Guide <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
