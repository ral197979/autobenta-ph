import { Link } from 'react-router-dom';
import { ShieldCheck, Car, CreditCard, FileText, ArrowRight, Phone, CheckCircle2, AlertCircle } from 'lucide-react';

const INSURANCE_TYPES = [
  {
    id: 'ctpl',
    label: 'CTPL',
    fullName: 'Compulsory Third Party Liability',
    required: true,
    description: 'Legally required for all registered motor vehicles in the Philippines. Covers bodily injury and death of third parties in accidents involving your vehicle.',
    coverage: ['Bodily injury of third parties', 'Death of third parties', 'Medical expenses up to policy limit'],
    notCovered: ['Damage to your own vehicle', 'Your own medical expenses', 'Theft'],
    priceRange: '₱350 – ₱800 / year',
    color: 'border-deepblue/30 bg-blue-50/50',
    badge: 'bg-deepblue text-white',
  },
  {
    id: 'comprehensive',
    label: 'Comprehensive',
    fullName: 'Comprehensive Motor Insurance',
    required: false,
    description: 'Full protection for your vehicle and third-party liability. Recommended for newer vehicles and those under financing arrangements.',
    coverage: ['Own vehicle damage (collision, fire)', 'Theft and carnapping', 'Third party liability', 'Acts of nature (with add-on)', 'Medical expenses'],
    notCovered: ['Wear and tear', 'Deliberate damage', 'Unlicensed driver at fault'],
    priceRange: '1.5% – 3% of vehicle value / year',
    color: 'border-emerald-200 bg-emerald-50/50',
    badge: 'bg-emerald-600 text-white',
  },
  {
    id: 'financing',
    label: 'Financing-Required',
    fullName: 'Financing / Mortgagee-Noted Insurance',
    required: false,
    description: 'Required by banks and financing companies as a condition of vehicle loans. The policy notes the financier as an interested party.',
    coverage: ['All comprehensive coverage', 'Financier interest protection', 'Loan balance protection on total loss'],
    notCovered: ['Varies by financing agreement', 'Check your loan terms'],
    priceRange: 'Included in comprehensive or separate rider',
    color: 'border-amber-200 bg-amber-50/50',
    badge: 'bg-amber-600 text-white',
  },
];

const PROVIDERS = [
  { name: 'Malayan Insurance', type: 'Comprehensive + CTPL', note: 'Largest non-life insurer in PH' },
  { name: 'OONA Insurance', type: 'Comprehensive + CTPL', note: 'Formerly AXA Philippines Motor' },
  { name: 'BPI/MS Insurance', type: 'Comprehensive + CTPL', note: 'BPI Group — bank-affiliated' },
  { name: 'Philippine Charter', type: 'Comprehensive + CTPL', note: 'CTPL specialist with wide dealer network' },
];

export default function Insurance() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-deepblue/30 blur-3xl" />
          <div className="absolute right-0 top-1/4 h-72 w-72 rounded-full bg-electric/15 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur mb-5">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              Motor Insurance Guide — Philippines
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Protect your investment<br />
              <span className="text-accent">from day one.</span>
            </h1>
            <p className="mt-5 text-lg text-white/70 max-w-xl">
              Compare CTPL, comprehensive, and financing-required motor insurance. Understand your coverage before completing any vehicle purchase.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
        {/* Insurance types */}
        <section>
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-electric mb-2">Coverage Types</p>
            <h2 className="text-2xl font-bold text-ink">Which insurance do you need?</h2>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {INSURANCE_TYPES.map((ins) => (
              <div key={ins.id} className={`rounded-2xl border p-6 ${ins.color}`}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-bold mb-2 ${ins.badge}`}>
                      {ins.label}
                    </span>
                    <h3 className="text-sm font-bold text-ink leading-snug">{ins.fullName}</h3>
                  </div>
                  {ins.required && (
                    <span className="shrink-0 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[10px] font-bold uppercase text-red-600">
                      Required by Law
                    </span>
                  )}
                </div>

                <p className="text-sm text-slatetext leading-relaxed mb-4">{ins.description}</p>

                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slatetext mb-2">Covers</p>
                  <ul className="space-y-1">
                    {ins.coverage.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-ink">
                        <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-500" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slatetext mb-2">Not covered</p>
                  <ul className="space-y-1">
                    {ins.notCovered.map((item) => (
                      <li key={item} className="flex items-start gap-2 text-xs text-slatetext">
                        <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5 text-slatetext/50" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-lg bg-white/70 px-3 py-2 mt-4">
                  <p className="text-[11px] text-slatetext">Typical cost</p>
                  <p className="text-sm font-bold text-ink">{ins.priceRange}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Provider directory */}
        <section>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-electric mb-2">Providers</p>
            <h2 className="text-2xl font-bold text-ink">Major motor insurers in the Philippines</h2>
            <p className="text-sm text-slatetext mt-1">Contact providers directly for current rates and policy terms.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {PROVIDERS.map((p) => (
              <div key={p.name} className="flex items-center gap-4 rounded-xl border border-cardborder bg-softbg p-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-deepblue/10">
                  <ShieldCheck className="h-5 w-5 text-deepblue" />
                </div>
                <div>
                  <p className="font-semibold text-ink text-sm">{p.name}</p>
                  <p className="text-xs text-slatetext">{p.type} · {p.note}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slatetext">
            AutoBenta PH is not affiliated with any insurance provider. Information is provided for guidance only. Always verify current rates and terms directly with the insurer.
          </p>
        </section>

        {/* Future integrations note */}
        <section className="rounded-2xl border border-cardborder bg-softbg p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-deepblue/10">
              <CreditCard className="h-5 w-5 text-deepblue" />
            </div>
            <div>
              <h3 className="font-bold text-ink mb-1">Insurance comparison coming soon</h3>
              <p className="text-sm text-slatetext max-w-lg">
                We are building an integrated insurance marketplace where you can compare live quotes from multiple providers directly on the AutoBenta platform. Integration with leading insurers is underway.
              </p>
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <Link
                  to="/ownership-transfer"
                  className="inline-flex items-center gap-2 rounded-lg border border-deepblue/30 bg-white px-4 py-2.5 text-sm font-semibold text-deepblue transition-colors hover:bg-deepblue/5"
                >
                  <FileText className="h-4 w-4" />
                  Transfer Guide
                </Link>
                <Link
                  to="/cars"
                  className="inline-flex items-center gap-2 rounded-lg bg-deepblue px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5"
                >
                  <Car className="h-4 w-4" />
                  Browse Cars
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
