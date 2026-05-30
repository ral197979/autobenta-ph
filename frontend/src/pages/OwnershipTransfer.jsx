import { Link } from 'react-router-dom';
import { FileCheck, ArrowRight, ClipboardList, BookOpen, Calculator, Clock, HelpCircle, ShieldCheck } from 'lucide-react';
import TransferChecklist from '../components/transfer/TransferChecklist';
import TransferDocuments from '../components/transfer/TransferDocuments';
import TransferCostEstimator from '../components/transfer/TransferCostEstimator';
import TransferTimeline from '../components/transfer/TransferTimeline';
import TransferFAQ from '../components/transfer/TransferFAQ';

const NAV_SECTIONS = [
  { id: 'checklist', icon: ClipboardList, label: 'Checklist' },
  { id: 'documents', icon: BookOpen, label: 'Documents' },
  { id: 'estimator', icon: Calculator, label: 'Cost Estimator' },
  { id: 'timeline', icon: Clock, label: 'Timeline' },
  { id: 'faq', icon: HelpCircle, label: 'FAQ' },
];

function Section({ id, icon: Icon, label, children }) {
  return (
    <section id={id} className="scroll-mt-20 py-12 border-b border-cardborder last:border-0">
      <div className="flex items-center gap-3 mb-8">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-deepblue/10">
          <Icon className="h-5 w-5 text-deepblue" />
        </div>
        <h2 className="text-xl font-bold text-ink">{label}</h2>
      </div>
      {children}
    </section>
  );
}

export default function OwnershipTransfer() {
  const scrollTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero */}
      <div className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-deepblue/30 blur-3xl" />
          <div className="absolute -right-12 bottom-0 h-80 w-80 rounded-full bg-electric/15 blur-3xl" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.15),transparent_60%)]" />
        </div>
        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/70 backdrop-blur mb-5">
              <ShieldCheck className="h-3.5 w-3.5 text-accent" />
              Philippines LTO-compliant transfer guide
            </div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight sm:text-5xl lg:text-6xl">
              Transfer ownership<br />
              <span className="text-accent">with confidence.</span>
            </h1>
            <p className="mt-5 text-lg text-white/70 leading-relaxed max-w-xl">
              Step-by-step guidance for transferring a used vehicle in the Philippines. Interactive checklist, required documents, and real cost estimates — all in one place.
            </p>
            <button
              onClick={() => scrollTo('checklist')}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3.5 text-sm font-bold text-ink shadow-md transition-all hover:-translate-y-0.5 hover:shadow-xl"
            >
              <FileCheck className="h-4 w-4" />
              Start Transfer Checklist
            </button>
          </div>
        </div>
      </div>

      {/* Sticky section nav */}
      <div className="sticky top-16 z-20 border-b border-cardborder bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex gap-1 overflow-x-auto py-2 scrollbar-hide">
            {NAV_SECTIONS.map(({ id, icon: Icon, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                className="flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-slatetext transition-colors hover:bg-softbg hover:text-ink"
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <Section id="checklist" icon={ClipboardList} label="Ownership Transfer Checklist">
          <p className="text-sm text-slatetext mb-6 max-w-2xl">
            Track each step of your transfer. Progress is saved in your browser so you can pick up where you left off.
          </p>
          <div className="max-w-2xl">
            <TransferChecklist />
          </div>
        </Section>

        <Section id="documents" icon={BookOpen} label="Required Documents">
          <p className="text-sm text-slatetext mb-6 max-w-2xl">
            Gather every document before visiting the LTO office. Incomplete submissions are the leading cause of transfer delays.
          </p>
          <TransferDocuments />
        </Section>

        <Section id="estimator" icon={Calculator} label="Transfer Cost Estimator">
          <p className="text-sm text-slatetext mb-6 max-w-2xl">
            Estimate total fees before completing the transaction. Input your vehicle type, region, and purchase price for a detailed breakdown.
          </p>
          <TransferCostEstimator />
        </Section>

        <Section id="timeline" icon={Clock} label="Typical Transfer Timeline">
          <p className="text-sm text-slatetext mb-6 max-w-2xl">
            A realistic 7–14 day timeline for a standard private vehicle transfer in the Philippines.
          </p>
          <TransferTimeline />
        </Section>

        <Section id="faq" icon={HelpCircle} label="Frequently Asked Questions">
          <p className="text-sm text-slatetext mb-6 max-w-2xl">
            Answers to the most common questions buyers and sellers face during the transfer process.
          </p>
          <div className="max-w-2xl">
            <TransferFAQ />
          </div>
        </Section>

        {/* CTA */}
        <div className="py-16">
          <div className="rounded-2xl bg-ink px-8 py-10 text-white text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-accent mb-4" />
            <h2 className="text-2xl font-bold mb-2">Ready to find your next car?</h2>
            <p className="text-white/60 mb-6 max-w-md mx-auto text-sm">
              Browse verified listings from dealers and private sellers across the Philippines. All listings include condition reports and seller verification.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                to="/cars"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-ink shadow transition-all hover:-translate-y-0.5 hover:shadow-md"
              >
                Browse Verified Cars <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                to="/safe-buying"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-white/20"
              >
                Safe Buying Guide
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
