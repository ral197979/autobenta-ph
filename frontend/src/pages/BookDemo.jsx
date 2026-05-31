import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { CheckCircle, Clock, CreditCard, Mail, Store, ClipboardList, Link2, Rocket } from 'lucide-react';
import api from '../api/client';

const DEMO_TYPES = [
  {
    key: 'marketplace',
    icon: Store,
    label: 'Marketplace Demo',
    desc: 'How buyers find your listings',
  },
  {
    key: 'crm',
    icon: ClipboardList,
    label: 'CRM Demo',
    desc: 'Lead pipeline and follow-up automation',
  },
  {
    key: 'v8atlas',
    icon: Link2,
    label: 'V8Atlas Demo',
    desc: 'DMS sync and inventory management',
  },
  {
    key: 'full_platform',
    icon: Rocket,
    label: 'Full Platform Demo',
    desc: 'Everything in 30 minutes',
  },
];

const TIME_SLOTS = [
  '9:00 AM', '10:00 AM', '11:00 AM',
  '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM',
];

const INVENTORY_OPTIONS = ['<10', '10-25', '25-50', '50+'];
const PROCESS_OPTIONS = [
  'None / Manual',
  'Facebook Marketplace',
  'Philkotse / OLX',
  'Excel / Spreadsheet',
  'CDK / Reynolds / DMS',
  'Other',
];

function getTomorrow() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

function combineDateTime(date, time) {
  if (!date || !time) return null;
  const [timePart, ampm] = time.split(' ');
  let [hours, minutes] = timePart.split(':').map(Number);
  if (ampm === 'PM' && hours !== 12) hours += 12;
  if (ampm === 'AM' && hours === 12) hours = 0;
  return new Date(`${date}T${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`).toISOString();
}

export default function BookDemo() {
  const [form, setForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    inventoryCount: '<10',
    currentProcess: 'None / Manual',
    biggestChallenge: '',
    demoType: 'full_platform',
    preferredDate: '',
    preferredTime: '10:00 AM',
  });
  const [submitted, setSubmitted] = useState(false);

  const mutation = useMutation({
    mutationFn: (data) => api.post('/book-demo', data).then(r => r.data),
    onSuccess: () => setSubmitted(true),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e) {
    e.preventDefault();
    const scheduledAt = combineDateTime(form.preferredDate, form.preferredTime);
    mutation.mutate({ ...form, scheduledAt });
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-softbg flex items-center justify-center px-4">
        <div className="card p-10 max-w-md w-full text-center space-y-4">
          <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto">
            <CheckCircle className="h-8 w-8 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-ink">Demo Booked!</h2>
          <p className="text-slatetext text-sm">
            We'll send a confirmation to <span className="font-semibold text-ink">{form.email}</span>.
            {form.preferredDate && (
              <> See you on <span className="font-semibold text-ink">{new Date(form.preferredDate + 'T12:00:00').toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</span> at <span className="font-semibold text-ink">{form.preferredTime}</span>.</>
            )}
          </p>
          <p className="text-xs text-slatetext">Questions? Email us at <a href="mailto:demos@autobentaph.com" className="text-deepblue hover:underline">demos@autobentaph.com</a></p>
          <a href="/" className="inline-block mt-2 text-sm text-deepblue hover:underline">Back to AutoBentaPH</a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-softbg">
      {/* Hero */}
      <div className="bg-gray-900 text-white py-10 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-bold">Book a Demo</h1>
          <p className="text-gray-400 mt-2 text-sm sm:text-base">See how AutoBentaPH helps Filipino dealers close more deals</p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Form — 3 cols */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="card p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slatetext mb-1">Full Name *</label>
                  <input
                    className="input w-full"
                    required
                    placeholder="Juan dela Cruz"
                    value={form.name}
                    onChange={e => set('name', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slatetext mb-1">Dealership / Company *</label>
                  <input
                    className="input w-full"
                    required
                    placeholder="Dela Cruz Motors"
                    value={form.company}
                    onChange={e => set('company', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slatetext mb-1">Email *</label>
                  <input
                    className="input w-full"
                    type="email"
                    required
                    placeholder="juan@example.com"
                    value={form.email}
                    onChange={e => set('email', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slatetext mb-1">Phone</label>
                  <input
                    className="input w-full"
                    type="tel"
                    placeholder="+63 9XX XXX XXXX"
                    value={form.phone}
                    onChange={e => set('phone', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slatetext mb-1">Inventory Count</label>
                  <select className="input w-full" value={form.inventoryCount} onChange={e => set('inventoryCount', e.target.value)}>
                    {INVENTORY_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slatetext mb-1">Current Process</label>
                  <select className="input w-full" value={form.currentProcess} onChange={e => set('currentProcess', e.target.value)}>
                    {PROCESS_OPTIONS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slatetext mb-1">Biggest Challenge</label>
                <textarea
                  className="input w-full resize-none text-sm"
                  rows={3}
                  placeholder="e.g. No follow-up system for Facebook leads, hard to track inventory..."
                  value={form.biggestChallenge}
                  onChange={e => set('biggestChallenge', e.target.value)}
                />
              </div>

              {/* Demo type selector */}
              <div>
                <label className="block text-xs font-semibold text-slatetext mb-2">Demo Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {DEMO_TYPES.map(({ key, icon: Icon, label, desc }) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => set('demoType', key)}
                      className={`flex items-start gap-3 rounded-xl border p-3 text-left transition-all ${
                        form.demoType === key
                          ? 'border-deepblue bg-deepblue/5 shadow-sm'
                          : 'border-cardborder hover:border-deepblue/30'
                      }`}
                    >
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center shrink-0 ${form.demoType === key ? 'bg-deepblue text-white' : 'bg-softbg text-slatetext'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <p className={`text-xs font-semibold leading-tight ${form.demoType === key ? 'text-deepblue' : 'text-ink'}`}>{label}</p>
                        <p className="text-[11px] text-slatetext mt-0.5 leading-snug">{desc}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Date + time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slatetext mb-1">Available Date</label>
                  <input
                    className="input w-full"
                    type="date"
                    min={getTomorrow()}
                    value={form.preferredDate}
                    onChange={e => set('preferredDate', e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slatetext mb-1">Preferred Time</label>
                  <select className="input w-full" value={form.preferredTime} onChange={e => set('preferredTime', e.target.value)}>
                    {TIME_SLOTS.map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
              </div>

              {mutation.isError && (
                <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                  Something went wrong. Please try again or email us at demos@autobentaph.com.
                </p>
              )}

              <button
                type="submit"
                disabled={mutation.isPending}
                className="btn-primary w-full py-3 text-base font-semibold disabled:opacity-50"
              >
                {mutation.isPending ? 'Booking…' : 'Book My Demo →'}
              </button>
            </form>
          </div>

          {/* Info panel — 2 cols */}
          <div className="lg:col-span-2 space-y-5">
            {/* What to expect */}
            <div className="card p-5">
              <h3 className="text-sm font-bold text-ink mb-4">What to Expect</h3>
              <ul className="space-y-3">
                {[
                  'A personalized walkthrough of the features most relevant to your dealership',
                  'Live demo of lead management and follow-up automation',
                  'See real inventory listings from Philippine dealers',
                  'Honest Q&A — no pressure, no sales scripts',
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5">
                    <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm text-ink">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Quick facts */}
            <div className="card p-5 space-y-3">
              <div className="flex items-center gap-2.5 text-sm text-ink">
                <Clock className="h-4 w-4 text-slatetext shrink-0" />
                <span>Demo takes 30 minutes</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-ink">
                <CreditCard className="h-4 w-4 text-slatetext shrink-0" />
                <span>No credit card required</span>
              </div>
              <div className="flex items-center gap-2.5 text-sm text-ink">
                <Mail className="h-4 w-4 text-slatetext shrink-0" />
                <a href="mailto:demos@autobentaph.com" className="text-deepblue hover:underline">demos@autobentaph.com</a>
              </div>
            </div>

            {/* Founding Dealer callout */}
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <p className="text-xs font-bold text-amber-700 uppercase tracking-wide mb-1">Founding Dealer Program</p>
              <p className="text-sm text-ink mb-3">Lock in lifetime pricing as one of our first 5 dealers. Limited slots available.</p>
              <a
                href="/for-dealers/founding"
                className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 hover:text-amber-800 underline"
              >
                Learn more →
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
