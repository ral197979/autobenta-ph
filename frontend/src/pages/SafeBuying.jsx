import { Link } from 'react-router-dom';
import { ShieldCheck, AlertTriangle, Eye, CreditCard, FileText, Phone, CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

const SCAM_PATTERNS = [
  {
    title: 'Too-good-to-be-true pricing',
    description: 'A listing priced significantly below market value for a well-maintained vehicle. Sellers often claim "urgent sale" or overseas relocation as the reason.',
    redFlags: ['Price 30%+ below comparable listings', '"Urgent sale — leaving the country"', 'No negotiation on an unusually low price'],
  },
  {
    title: 'Advance payment requests',
    description: 'Seller requests a deposit or "reservation fee" before you have inspected the vehicle in person. Legitimate sellers do not require prepayment to view a car.',
    redFlags: ['Asked to pay before viewing', 'GCash / bank transfer to "hold" the car', 'Seller unavailable to meet in person'],
  },
  {
    title: 'OR/CR mismatch or tampering',
    description: 'The vehicle details on the OR/CR do not match the actual plate, chassis, or engine number of the car. This indicates the vehicle may be stolen or illegally registered.',
    redFlags: ['Plate, chassis, or engine number does not match OR/CR', 'Documents appear altered or reprinted', 'Seller cannot explain discrepancies'],
  },
  {
    title: 'Open or unsigned Deed of Sale',
    description: 'The seller offers to sign an open Deed of Sale with the buyer\'s name blank. This exposes the buyer to tax and legal liability while the seller retains the ability to dispute the transfer.',
    redFlags: ['Buyer name left blank on Deed of Sale', 'No notarization offered', '"It\'s standard practice here" — it is not'],
  },
  {
    title: 'Third-party vehicle with undisclosed lien',
    description: 'The vehicle is still under a chattel mortgage with a bank or financing company. A sale without releasing the mortgage is invalid and illegal.',
    redFlags: ['Seller reluctant to show financing clearance', 'Original CR shows a bank name as co-registrant', 'Price well below book value on a recently purchased vehicle'],
  },
];

const VERIFICATION_STEPS = [
  { icon: Eye, label: 'Inspect the vehicle physically before any payment', detail: 'Meet at a public location. Never pay a deposit to "hold" a vehicle you have not seen.' },
  { icon: FileText, label: 'Verify OR/CR against the actual vehicle', detail: 'Cross-check the plate number, chassis number, and engine number on the physical vehicle with the OR/CR documents.' },
  { icon: Phone, label: 'Confirm identity with two valid IDs', detail: 'Request government-issued IDs and verify the name matches the OR/CR. Take a clear photo of both IDs.' },
  { icon: ShieldCheck, label: 'Request a pre-purchase inspection', detail: 'Have the vehicle assessed by an independent mechanic before finalizing payment. AutoBenta connects you with partner inspection bays.' },
  { icon: CreditCard, label: 'Never pay the full amount before title transfer', detail: 'Use a staged payment: signing fee at Deed of Sale execution, balance upon receipt of new OR/CR in your name.' },
  { icon: FileText, label: 'Execute a notarized Deed of Sale', detail: 'Both parties must be present. Notarize the Deed of Sale on the same day as document exchange.' },
];

const PAYMENT_TIPS = [
  'Use bank transfer for large payments — leaves a clear paper trail',
  'Request an acknowledgment receipt for every payment made',
  'Never use GCash / e-wallets for full vehicle payment — limits dispute resolution',
  'For dealer purchases, always pay to the dealership account, never personal accounts',
  'If using escrow, use a licensed real-estate or legal professional, not a stranger',
  'Verify bank account names before transferring — account holder must match seller',
];

export default function SafeBuying() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-deepblue/25 blur-3xl" />
          <div className="absolute left-0 bottom-0 h-64 w-64 rounded-full bg-electric/10 blur-3xl" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur mb-5">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              Buyer Protection Guide
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              Buy smarter.<br />
              <span className="text-accent">Stay protected.</span>
            </h1>
            <p className="mt-5 text-lg text-white/70 max-w-xl">
              The Philippines used car market has real risks. Know the common scam patterns, what to verify, and how to protect your money before signing anything.
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-16">
        {/* Verification checklist */}
        <section>
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-electric mb-2">Before You Buy</p>
            <h2 className="text-2xl font-bold text-ink">Buyer verification checklist</h2>
            <p className="text-sm text-slatetext mt-1">Complete every step before releasing any payment.</p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {VERIFICATION_STEPS.map(({ icon: Icon, label, detail }, idx) => (
              <div key={idx} className="rounded-2xl border border-cardborder bg-softbg p-5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-deepblue/10 mb-3">
                  <Icon className="h-5 w-5 text-deepblue" />
                </div>
                <p className="font-semibold text-ink text-sm mb-1.5">{label}</p>
                <p className="text-xs text-slatetext leading-relaxed">{detail}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Scam patterns */}
        <section>
          <div className="mb-8">
            <p className="text-xs font-semibold uppercase tracking-wider text-red-500 mb-2">Common Scams</p>
            <h2 className="text-2xl font-bold text-ink">Know these fraud patterns</h2>
            <p className="text-sm text-slatetext mt-1">These are the most frequently reported vehicle purchase scams in the Philippines.</p>
          </div>
          <div className="space-y-4">
            {SCAM_PATTERNS.map((scam, idx) => (
              <div key={idx} className="rounded-2xl border border-red-100 bg-red-50/40 p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-red-100">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                  </div>
                  <h3 className="font-bold text-ink">{scam.title}</h3>
                </div>
                <p className="text-sm text-slatetext leading-relaxed mb-3 ml-11">{scam.description}</p>
                <div className="ml-11">
                  <p className="text-xs font-semibold uppercase tracking-wide text-red-600 mb-2">Warning signs</p>
                  <ul className="space-y-1">
                    {scam.redFlags.map((flag) => (
                      <li key={flag} className="flex items-start gap-2 text-sm text-red-700">
                        <XCircle className="h-4 w-4 shrink-0 mt-0.5 text-red-400" />
                        {flag}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Payment safety */}
        <section>
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-electric mb-2">Payment Safety</p>
            <h2 className="text-2xl font-bold text-ink">Safe payment practices</h2>
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {PAYMENT_TIPS.map((tip) => (
              <div key={tip} className="flex items-start gap-3 rounded-xl border border-cardborder bg-white p-4">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-500" />
                <p className="text-sm text-slatetext">{tip}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Seller verification explanation */}
        <section className="rounded-2xl bg-ink text-white p-8">
          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 items-center">
            <div>
              <ShieldCheck className="h-10 w-10 text-accent mb-4" />
              <h2 className="text-2xl font-bold mb-3">How AutoBenta verifies sellers</h2>
              <p className="text-white/70 text-sm leading-relaxed mb-4">
                Every dealer listing on AutoBenta is reviewed by our team. Verified dealers have submitted business registration documents, LTO accreditation, and passed our listing quality audit.
              </p>
              <ul className="space-y-2">
                {[
                  'Business registration verified (DTI/SEC)',
                  'LTO dealer accreditation on file',
                  'No outstanding fraud reports',
                  'Active moderation of listing quality',
                ].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-white/80">
                    <CheckCircle2 className="h-4 w-4 shrink-0 text-accent" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="space-y-3">
              <Link
                to="/cars?sellerType=dealer"
                className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 p-4 hover:bg-white/10 transition-colors group"
              >
                <div>
                  <p className="font-semibold text-white">Browse verified dealers</p>
                  <p className="text-xs text-white/50">Vetted business sellers with documented credentials</p>
                </div>
                <ArrowRight className="h-4 w-4 text-accent group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/ownership-transfer"
                className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 p-4 hover:bg-white/10 transition-colors group"
              >
                <div>
                  <p className="font-semibold text-white">Ownership transfer guide</p>
                  <p className="text-xs text-white/50">Step-by-step LTO transfer documentation</p>
                </div>
                <ArrowRight className="h-4 w-4 text-accent group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/inspections"
                className="flex items-center justify-between rounded-xl border border-white/15 bg-white/5 p-4 hover:bg-white/10 transition-colors group"
              >
                <div>
                  <p className="font-semibold text-white">Book a pre-purchase inspection</p>
                  <p className="text-xs text-white/50">Independent 120-point vehicle inspection</p>
                </div>
                <ArrowRight className="h-4 w-4 text-accent group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
