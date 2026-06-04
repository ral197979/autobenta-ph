import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck, CheckCircle, BarChart2, RefreshCw, Users, Zap,
  ArrowRight, Star, ChevronRight, TrendingUp, Database, Layers,
  MessageSquare, Clock, FileSpreadsheet,
} from 'lucide-react';

const PILLARS = [
  {
    icon: ShieldCheck,
    title: 'Verified Listings',
    desc: 'Every listing goes through our verification flow — photos, docs, and seller identity — so buyers trust your inventory.',
  },
  {
    icon: Layers,
    title: 'Lead CRM',
    desc: '8-stage Kanban pipeline built for car sales. Track every lead from inquiry to closed deal without spreadsheets.',
  },
  {
    icon: RefreshCw,
    title: 'V8Atlas DMS Sync',
    desc: 'Connect your existing DMS or use our CSV import. Inventory stays in sync automatically — no double entry.',
  },
  {
    icon: BarChart2,
    title: 'Analytics Dashboard',
    desc: 'Lead sources, conversion rates, response times, and revenue — all in one dashboard built for Philippine dealers.',
  },
];

const STATS = [
  { value: '90', label: 'Days Free Trial' },
  { value: '3×', label: 'Faster Lead Response' },
  { value: '₱0', label: 'Setup Fee' },
];

const PLANS = [
  {
    name: 'Founding Dealer',
    price: 'Free',
    period: ' — 3 months',
    desc: 'Full Pro features for 90 days, then ₱3,599/month — locked for life.',
    features: [
      'Unlimited listings',
      'Lead CRM (8-stage pipeline)',
      'Advanced analytics',
      'Priority placement',
      'Verified Dealer badge',
      'V8Atlas DMS sync',
      'API access',
    ],
    highlight: true,
    cta: 'Start Free — 3 Months on Us',
    note: 'No credit card required',
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For multi-branch operations and large dealerships.',
    features: [
      'Multi-branch management',
      'White-label option',
      'API access',
      'Dedicated account manager',
      'Custom integrations',
      'SLA guarantee',
    ],
    highlight: false,
    cta: 'Contact Sales',
  },
];

const FOUNDING_BENEFITS = [
  '3 months free — no credit card required',
  'Then ₱3,599/month forever — Founding Dealer rate, locked for life',
  'Founding Dealer badge on all listings',
  'Direct line to product team — influence the roadmap',
  'Priority support with 4-hour response SLA',
  'Only available to the first dealers on the platform',
];

function RoiCalculator() {
  const [vehiclesSold, setVehiclesSold] = useState(10);
  const [avgProfit, setAvgProfit] = useState(50000);
  const [conversionRate, setConversionRate] = useState(8);

  const additionalLeads = vehiclesSold * 3;
  const leadsConverted = additionalLeads * (conversionRate / 100);
  const revenueUplift = leadsConverted * avgProfit;
  const platformCost = 3599;
  const roi = ((revenueUplift - platformCost) / platformCost) * 100;

  const formatPeso = (n) =>
    '₱' + Math.round(n).toLocaleString('en-PH');

  return (
    <section className="py-16 bg-surface-container">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">ROI Calculator</p>
          <h2 className="text-2xl font-bold text-on-surface sm:text-3xl">See your potential return</h2>
          <p className="text-sm text-on-surface-variant mt-2">Adjust the sliders to match your dealership.</p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-border-subtle p-6 sm:p-8">
          <div className="grid gap-8 lg:grid-cols-2">
            {/* Inputs */}
            <div className="space-y-6">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-on-surface">Vehicles sold / month</label>
                  <span className="text-sm font-bold text-primary">{vehiclesSold}</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={50}
                  value={vehiclesSold}
                  onChange={e => setVehiclesSold(Number(e.target.value))}
                  className="w-full accent-deepblue"
                />
                <div className="flex justify-between text-xs text-on-surface-variant mt-1"><span>1</span><span>50</span></div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-on-surface mb-2">Avg gross profit per vehicle</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-on-surface-variant">₱</span>
                  <input
                    type="number"
                    min={0}
                    step={5000}
                    value={avgProfit}
                    onChange={e => setAvgProfit(Math.max(0, Number(e.target.value)))}
                    className="w-full rounded-lg border border-border-subtle pl-8 pr-4 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-deepblue/30"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-on-surface">Current lead conversion rate</label>
                  <span className="text-sm font-bold text-primary">{conversionRate}%</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={30}
                  value={conversionRate}
                  onChange={e => setConversionRate(Number(e.target.value))}
                  className="w-full accent-deepblue"
                />
                <div className="flex justify-between text-xs text-on-surface-variant mt-1"><span>1%</span><span>30%</span></div>
              </div>

              <div className="rounded-xl bg-surface-container p-4 text-xs text-on-surface-variant space-y-1">
                <p>Additional leads / mo: <span className="font-semibold text-on-surface">{additionalLeads}</span></p>
                <p>Leads converted: <span className="font-semibold text-on-surface">{leadsConverted.toFixed(1)}</span></p>
                <p>Platform cost: <span className="font-semibold text-on-surface">₱3,599/mo (Founding Dealer rate)</span></p>
              </div>
            </div>

            {/* Outputs */}
            <div className="flex flex-col gap-4 justify-center">
              <div className="rounded-2xl bg-primary/5 border border-primary/20 p-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1">Monthly Revenue Uplift</p>
                <p className="text-4xl font-bold text-primary">{formatPeso(revenueUplift)}</p>
              </div>
              <div className={`rounded-2xl border p-6 text-center ${roi >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}>
                <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-1">ROI on Platform Cost</p>
                <p className={`text-4xl font-bold ${roi >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                  {roi >= 0 ? '+' : ''}{Math.round(roi)}%
                </p>
              </div>
              <Link
                to="/for-dealers/founding"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
              >
                Claim Your Spot <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default function ForDealers() {
  return (
    <div className="bg-surface-container-lowest">
      {/* Hero */}
      <section className="bg-gradient-to-br from-ink to-deepblue text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-surface-container-lowest/10 px-3 py-1 text-xs font-semibold text-white/80 mb-6">
            <Zap className="h-3.5 w-3.5 text-accent" />
            Built for Philippine Dealerships
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl leading-tight mb-4">
            The Dealer Platform Built<br className="hidden sm:block" /> for the Philippines
          </h1>
          <p className="text-base text-white/70 max-w-xl mx-auto mb-8 leading-relaxed">
            Verified listings, an 8-stage lead CRM, V8Atlas DMS sync, and analytics — everything a Filipino dealer needs to sell more cars without the ₱200K/year DMS price tag.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-ink hover:bg-accent/90 transition-colors"
            >
              Start Free — 3 Months on Us <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/for-dealers/founding"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-surface-container-lowest/10 px-6 py-3 text-sm font-semibold text-white hover:bg-surface-container-lowest/20 transition-colors"
            >
              Founding Dealer Program
            </Link>
          </div>
          <p className="text-xs text-white/50 mt-3">No credit card required · Then ₱3,599/month</p>
        </div>
      </section>

      {/* Problem */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">The Problem</p>
            <h2 className="text-2xl font-bold text-on-surface sm:text-3xl">The Problem with Selling Cars Today</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: MessageSquare,
                title: 'Facebook leads with no system',
                desc: 'Inquiries pour in through Messenger, but there\'s no follow-up system, no CRM, and no trust signals to close the deal.',
              },
              {
                icon: Database,
                title: 'No verified inventory pipeline',
                desc: 'Listings are scattered across platforms with inconsistent photos and zero verification — buyers don\'t trust what they see.',
              },
              {
                icon: FileSpreadsheet,
                title: 'DMS costs ₱200K+/year',
                desc: 'Enterprise DMS systems require IT teams and multi-year contracts. Small and mid-size dealers can\'t compete.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border-subtle p-6 flex flex-col gap-3">
                <div className="h-10 w-10 rounded-xl bg-red-50 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-red-500" />
                </div>
                <p className="text-sm font-bold text-on-surface">{title}</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-16 bg-surface-container">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">The Solution</p>
            <h2 className="text-2xl font-bold text-on-surface sm:text-3xl">AutoBentaPH Dealer Platform</h2>
            <p className="text-sm text-on-surface-variant mt-2">Four pillars that replace five separate tools.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {PILLARS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border-subtle bg-surface-container-lowest p-5 flex flex-col gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <p className="text-sm font-bold text-on-surface">{title}</p>
                <p className="text-xs text-on-surface-variant leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social proof strip */}
      <section className="py-10 border-y border-border-subtle">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-3 gap-4">
            {STATS.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-3xl font-bold text-primary">{value}</p>
                <p className="text-xs text-on-surface-variant mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Dealer CRM section */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Lead CRM</p>
              <h2 className="text-2xl font-bold text-on-surface sm:text-3xl mb-4">Your entire pipeline, one screen</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                Our 8-stage Kanban is designed around how Filipino dealers actually sell — from first inquiry through test drive, negotiation, and handed-over keys. Automated follow-up reminders mean no lead falls through the cracks.
              </p>
              <ul className="space-y-3">
                {[
                  'Timeline activity log for every lead',
                  'Automated follow-up at configurable intervals',
                  'Lead stage tagging and priority flags',
                  'Team assignment for multi-salesperson lots',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-on-surface">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border-2 border-dashed border-border-subtle bg-surface-container flex items-center justify-center h-56 sm:h-72">
              <div className="text-center">
                <Layers className="h-10 w-10 text-on-surface-variant/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-on-surface-variant/60">Kanban CRM</p>
                <p className="text-xs text-on-surface-variant/40">8-stage pipeline preview</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Management */}
      <section className="py-16 bg-surface-container">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Lead Management</p>
            <h2 className="text-2xl font-bold text-on-surface sm:text-3xl">Respond faster. Close more.</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: ChevronRight,
                title: 'Smart lead routing',
                desc: 'New inquiries are automatically assigned to the right salesperson based on availability and vehicle type.',
              },
              {
                icon: Zap,
                title: 'Credit system',
                desc: 'Pay only for leads you want to contact. No wasted spend on duplicates or out-of-area buyers.',
              },
              {
                icon: Clock,
                title: 'Response time tracking',
                desc: 'See average response times per salesperson. Buyers who get a reply in under 5 minutes convert 3× more.',
              },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border-subtle bg-surface-container-lowest p-5 flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm font-bold text-on-surface mb-1">{title}</p>
                  <p className="text-xs text-on-surface-variant leading-relaxed">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inventory Sync */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-2 items-center">
            <div className="order-2 lg:order-1 rounded-2xl border-2 border-dashed border-border-subtle bg-surface-container flex items-center justify-center h-56 sm:h-72">
              <div className="text-center">
                <RefreshCw className="h-10 w-10 text-on-surface-variant/40 mx-auto mb-2" />
                <p className="text-sm font-semibold text-on-surface-variant/60">V8Atlas Sync</p>
                <p className="text-xs text-on-surface-variant/40">Live inventory pipeline</p>
              </div>
            </div>
            <div className="order-1 lg:order-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Inventory Sync</p>
              <h2 className="text-2xl font-bold text-on-surface sm:text-3xl mb-4">Never type a listing twice</h2>
              <p className="text-sm text-on-surface-variant leading-relaxed mb-6">
                V8Atlas integration keeps your DMS and your AutoBentaPH listings in sync automatically. Or upload a CSV and our AI Listing Wizard fills in the rest — photos, descriptions, pricing — in minutes.
              </p>
              <ul className="space-y-3">
                {[
                  'V8Atlas two-way sync (no IT team needed)',
                  'CSV bulk import with field mapping',
                  'AI-powered listing descriptions',
                  'Duplicate detection and merge',
                ].map(f => (
                  <li key={f} className="flex items-center gap-2 text-sm text-on-surface">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section className="py-16 bg-surface-container">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Pricing</p>
            <h2 className="text-2xl font-bold text-on-surface sm:text-3xl">3 months free, then ₱3,599/month</h2>
            <p className="text-sm text-on-surface-variant mt-2">No credit card required. Founding Dealer rate locked for life. Only available to the first dealers on the platform.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 max-w-2xl mx-auto">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl border-2 bg-surface-container-lowest p-6 flex flex-col ${plan.highlight ? 'border-primary shadow-lg shadow-deepblue/10' : 'border-border-subtle'}`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="inline-flex items-center gap-1 rounded-full bg-primary px-3 py-0.5 text-[11px] font-bold text-white">
                      <Star className="h-2.5 w-2.5" /> Founding Dealer Offer
                    </span>
                  </div>
                )}
                <p className="text-sm font-bold text-on-surface mb-1">{plan.name}</p>
                <div className="flex items-end gap-0.5 mb-1">
                  <p className="text-2xl font-bold text-primary">{plan.price}</p>
                  {plan.period && <p className="text-xs text-on-surface-variant mb-1">{plan.period}</p>}
                </div>
                <p className="text-xs text-on-surface-variant mb-4">{plan.desc}</p>
                <ul className="space-y-2 mb-6 flex-1">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-xs text-on-surface">
                      <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.name === 'Enterprise' ? 'mailto:dealers@autobentaph.com' : '/register'}
                  className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-xs font-bold transition-colors ${plan.highlight ? 'bg-primary text-on-primary hover:bg-primary/90' : 'border border-border-subtle text-on-surface hover:bg-surface-container'}`}
                >
                  {plan.cta}
                </Link>
                {plan.note && (
                  <p className="text-center text-[11px] text-on-surface-variant mt-2">{plan.note}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <RoiCalculator />

      {/* Founding Dealer CTA */}
      <section className="py-16">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="rounded-2xl bg-gradient-to-br from-ink to-deepblue text-white p-8 sm:p-10">
            <div className="grid gap-8 lg:grid-cols-2 items-center">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-surface-container-lowest/10 px-3 py-1 text-xs font-semibold text-white/80 mb-4">
                  <Users className="h-3.5 w-3.5 text-accent" />
                  Only 5 spots available
                </div>
                <h2 className="text-2xl font-bold mb-3">Join 5 Founding Dealers</h2>
                <p className="text-sm text-white/70 leading-relaxed">
                  Lock in founding pricing, shape the roadmap, and be first to market with the Philippines' most advanced dealer platform.
                </p>
              </div>
              <div>
                <ul className="space-y-2 mb-6">
                  {FOUNDING_BENEFITS.map(b => (
                    <li key={b} className="flex items-start gap-2 text-sm text-white/90">
                      <CheckCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/for-dealers/founding"
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-ink hover:bg-accent/90 transition-colors"
                >
                  Apply Now <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Book Demo footer CTA */}
      <section className="py-16 bg-primary text-on-primary">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-2xl font-bold mb-3">Ready to grow?</h2>
          <p className="text-sm text-white/70 mb-8">
            Register in 3 minutes. No credit card. 3 months free, then ₱3,599/month — locked for life.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-ink hover:bg-accent/90 transition-colors"
            >
              Start Free — 3 Months on Us <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/for-dealers/founding"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-surface-container-lowest/10 px-6 py-3 text-sm font-semibold text-white hover:bg-surface-container-lowest/20 transition-colors"
            >
              Founding Dealer Program
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
