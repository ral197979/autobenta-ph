import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Tag, Users, Star, Headphones, CheckCircle, ChevronDown, ArrowRight, Zap, ShieldCheck,
} from 'lucide-react';

const BENEFITS = [
  {
    icon: Tag,
    title: '3 months free, then ₱3,599/mo — forever',
    desc: 'Start with a full 90-day free trial. After your trial, your Founding Dealer rate of ₱3,599/mo is locked in for life. No credit card required to start.',
  },
  {
    icon: Star,
    title: 'Founding Dealer badge',
    desc: 'A permanent badge on every listing and your dealer profile, signaling to buyers that you\'re a pioneer on the platform.',
  },
  {
    icon: Users,
    title: 'Direct line to the product team',
    desc: 'Monthly call with our CTO and product manager. Your feedback shapes what gets built next — starting with V8Atlas and the CRM.',
  },
  {
    icon: Headphones,
    title: 'Priority support SLA',
    desc: '4-hour guaranteed response time, 7 days a week. Your issues jump the queue automatically.',
  },
];

const FEATURES = [
  'Unlimited listings',
  'Lead CRM — 8-stage Kanban pipeline',
  'V8Atlas DMS two-way sync',
  'Advanced analytics dashboard',
  'CSV bulk import + field mapping',
  'AI-powered listing wizard',
  'Response time tracking',
  'Priority support (4-hr SLA)',
  'Founding Dealer badge on all listings',
  'Monthly product roadmap call',
  '3 months free, then ₱3,599/mo forever',
];

const FAQS = [
  {
    q: 'Is the ₱3,599/mo price really locked forever?',
    a: 'Yes. You get 3 months free, then ₱3,599/mo for life. Founding Dealer pricing is guaranteed for the lifetime of your subscription. As long as you remain subscribed, your rate will never increase, even as we raise standard pricing for new customers.',
  },
  {
    q: 'What happens once all 5 spots are filled?',
    a: 'The Founding Dealer program closes and new applicants will be offered standard Dealer Pro at ₱5,999/mo. We will not re-open founding pricing after the 5 spots are filled.',
  },
  {
    q: 'Can I cancel or is this a long-term contract?',
    a: 'There is no long-term contract. You can cancel anytime. If you cancel and later re-subscribe, you will be charged at the standard rate — the founding price does not carry over.',
  },
  {
    q: 'Do I need to be a V8Atlas customer to apply?',
    a: 'No. V8Atlas sync is included as a feature but not required. You can manage inventory through our CSV import, manual entry, or the AI listing wizard. V8Atlas integration can be enabled at any time.',
  },
];

const SPOTS_REMAINING = 3;
const SPOTS_TOTAL = 5;

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border-b border-border-subtle last:border-0">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex w-full items-center justify-between py-4 text-left text-sm font-semibold text-on-surface hover:text-primary transition-colors"
      >
        {q}
        <ChevronDown className={`h-4 w-4 shrink-0 text-on-surface-variant transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && <p className="pb-4 text-sm text-on-surface-variant leading-relaxed">{a}</p>}
    </div>
  );
}

const EMPTY_FORM = {
  businessName: '',
  contactName: '',
  email: '',
  phone: '',
  city: '',
  monthlyInventory: '',
  currentDms: '',
};

export default function FoundingDealer() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  const validate = () => {
    const e = {};
    if (!form.businessName.trim()) e.businessName = 'Required';
    if (!form.contactName.trim()) e.contactName = 'Required';
    if (!form.email.trim() || !/\S+@\S+\.\S+/.test(form.email)) e.email = 'Valid email required';
    if (!form.phone.trim()) e.phone = 'Required';
    if (!form.city.trim()) e.city = 'Required';
    if (!form.monthlyInventory) e.monthlyInventory = 'Required';
    if (!form.currentDms) e.currentDms = 'Required';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const e2 = validate();
    if (Object.keys(e2).length > 0) {
      setErrors(e2);
      return;
    }
    console.log('Founding Dealer application:', form);
    setSubmitted(true);
  };

  const handleChange = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }));
    setErrors(errs => ({ ...errs, [field]: undefined }));
  };

  const inputClass = (field) =>
    `w-full rounded-lg border px-3 py-2.5 text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-deepblue/30 transition-colors ${errors[field] ? 'border-red-400' : 'border-border-subtle'}`;

  return (
    <div className="bg-surface-container-lowest">
      {/* Hero */}
      <section className="bg-gradient-to-br from-ink to-deepblue text-white">
        <div className="mx-auto max-w-4xl px-4 py-20 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-surface-container-lowest/10 px-3 py-1 text-xs font-semibold text-white/80 mb-6">
            <Zap className="h-3.5 w-3.5 text-accent" />
            5 spots only — {SPOTS_REMAINING} remaining
          </div>
          <h1 className="text-3xl font-bold sm:text-4xl lg:text-5xl leading-tight mb-4">
            Become a Founding Dealer
          </h1>
          <p className="text-base text-white/70 max-w-2xl mx-auto mb-8 leading-relaxed">
            3 months free, no credit card required. Then ₱3,599/month — locked for life. Shape the product roadmap and be first to market with the Philippines' most advanced dealer platform.
          </p>
          <a
            href="#apply"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-bold text-ink hover:bg-accent/90 transition-colors"
          >
            Apply Now <ArrowRight className="h-4 w-4" />
          </a>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16">
        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Founding Benefits</p>
            <h2 className="text-2xl font-bold text-on-surface sm:text-3xl">What founding dealers get</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {BENEFITS.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-2xl border border-border-subtle p-6 flex gap-4">
                <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
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

      {/* What you get */}
      <section className="py-16 bg-surface-container">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Full Feature List</p>
            <h2 className="text-2xl font-bold text-on-surface sm:text-3xl">Everything in Dealer Pro, plus founding extras</h2>
          </div>
          <div className="bg-surface-container-lowest rounded-2xl border border-border-subtle p-6 sm:p-8">
            <div className="grid sm:grid-cols-2 gap-3">
              {FEATURES.map(f => (
                <div key={f} className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                  <span className="text-sm text-on-surface">{f}</span>
                </div>
              ))}
            </div>
            <div className="mt-6 pt-6 border-t border-border-subtle flex items-center justify-between gap-4 flex-wrap">
              <div>
                <span className="text-xl font-bold text-emerald-600">Free</span>
                <span className="text-sm text-on-surface-variant ml-1">for 3 months</span>
                <span className="mx-2 text-on-surface-variant">·</span>
                <span className="text-3xl font-bold text-primary">₱3,599</span>
                <span className="text-sm text-on-surface-variant">/mo after</span>
              </div>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-200 px-3 py-1 text-xs font-semibold text-emerald-700">
                <ShieldCheck className="h-3 w-3" /> Founding price — locked forever
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Spots counter */}
      <section className="py-10 border-y border-border-subtle">
        <div className="mx-auto max-w-lg px-4 text-center">
          <div className="flex justify-center gap-2 mb-4">
            {Array.from({ length: SPOTS_TOTAL }).map((_, i) => (
              <div
                key={i}
                className={`h-4 w-10 rounded-full ${i < SPOTS_TOTAL - SPOTS_REMAINING ? 'bg-primary' : 'bg-cardborder'}`}
              />
            ))}
          </div>
          <p className="text-lg font-bold text-on-surface">
            {SPOTS_REMAINING} of {SPOTS_TOTAL} spots remaining
          </p>
          <p className="text-sm text-on-surface-variant mt-1">
            Once filled, founding pricing closes permanently. No waitlist.
          </p>
        </div>
      </section>

      {/* Application form */}
      <section id="apply" className="py-16">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">Apply</p>
            <h2 className="text-2xl font-bold text-on-surface sm:text-3xl">Founding Dealer Application</h2>
            <p className="text-sm text-on-surface-variant mt-2">Takes about 2 minutes. We'll get back to you within 24 hours.</p>
          </div>

          {submitted ? (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-8 text-center">
              <CheckCircle className="h-12 w-12 text-emerald-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-on-surface mb-2">Application received!</h3>
              <p className="text-sm text-on-surface-variant">We'll contact you within 24 hours to confirm your spot and get you onboarded.</p>
              <Link
                to="/for-dealers"
                className="inline-flex items-center gap-2 mt-6 text-sm font-semibold text-primary hover:underline"
              >
                Back to Dealer Platform
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-border-subtle bg-surface-container-lowest p-6 sm:p-8 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1.5">Business name *</label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={handleChange('businessName')}
                    placeholder="ABC Motors"
                    className={inputClass('businessName')}
                  />
                  {errors.businessName && <p className="text-xs text-red-500 mt-1">{errors.businessName}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1.5">Contact name *</label>
                  <input
                    type="text"
                    value={form.contactName}
                    onChange={handleChange('contactName')}
                    placeholder="Juan dela Cruz"
                    className={inputClass('contactName')}
                  />
                  {errors.contactName && <p className="text-xs text-red-500 mt-1">{errors.contactName}</p>}
                </div>
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1.5">Email *</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={handleChange('email')}
                    placeholder="juan@abcmotors.ph"
                    className={inputClass('email')}
                  />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1.5">Phone *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={handleChange('phone')}
                    placeholder="+63 917 000 0000"
                    className={inputClass('phone')}
                  />
                  {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-on-surface mb-1.5">City *</label>
                <input
                  type="text"
                  value={form.city}
                  onChange={handleChange('city')}
                  placeholder="Quezon City, Metro Manila"
                  className={inputClass('city')}
                />
                {errors.city && <p className="text-xs text-red-500 mt-1">{errors.city}</p>}
              </div>

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1.5">Monthly inventory count *</label>
                  <select
                    value={form.monthlyInventory}
                    onChange={handleChange('monthlyInventory')}
                    className={inputClass('monthlyInventory') + ' bg-surface-container-lowest'}
                  >
                    <option value="">Select...</option>
                    <option value="<10">Less than 10</option>
                    <option value="10-25">10–25</option>
                    <option value="25-50">25–50</option>
                    <option value="50+">50+</option>
                  </select>
                  {errors.monthlyInventory && <p className="text-xs text-red-500 mt-1">{errors.monthlyInventory}</p>}
                </div>
                <div>
                  <label className="block text-xs font-semibold text-on-surface mb-1.5">Current DMS *</label>
                  <select
                    value={form.currentDms}
                    onChange={handleChange('currentDms')}
                    className={inputClass('currentDms') + ' bg-surface-container-lowest'}
                  >
                    <option value="">Select...</option>
                    <option value="none">None / Paper-based</option>
                    <option value="excel">Excel / Google Sheets</option>
                    <option value="cdk">CDK Global</option>
                    <option value="reynolds">Reynolds &amp; Reynolds</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.currentDms && <p className="text-xs text-red-500 mt-1">{errors.currentDms}</p>}
                </div>
              </div>

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
              >
                Submit Application <ArrowRight className="h-4 w-4" />
              </button>
              <p className="text-center text-xs text-on-surface-variant">
                We review every application within 24 hours. Only {SPOTS_REMAINING} spots remain.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 bg-surface-container">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-2">FAQ</p>
            <h2 className="text-2xl font-bold text-on-surface sm:text-3xl">Common questions</h2>
          </div>
          <div className="rounded-2xl border border-border-subtle bg-surface-container-lowest px-6">
            {FAQS.map(faq => <FaqItem key={faq.q} {...faq} />)}
          </div>
          <div className="text-center mt-8">
            <p className="text-sm text-on-surface-variant">Still have questions?</p>
            <a
              href="mailto:dealers@autobentaph.com"
              className="text-sm font-semibold text-primary hover:underline"
            >
              dealers@autobentaph.com
            </a>
          </div>
        </div>
      </section>
    </div>
  );
}
