import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import {
  Building2, FileText, Car, CreditCard, CheckCircle, XCircle,
  ChevronRight, Zap, Crown, BadgeCheck, Rocket,
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';

const STEPS = [
  { label: 'Business Info' },
  { label: 'Documents' },
  { label: 'Inventory' },
  { label: 'Choose Plan' },
  { label: 'Review' },
];

const DOCS = [
  { key: 'sec_dti', label: 'Business Registration / SEC/DTI Certificate', required: true },
  { key: 'mayors_permit', label: 'Business Permit / Mayor\'s Permit', required: true },
  { key: 'bir_cert', label: 'BIR Certificate of Registration', required: true },
  { key: 'gov_id', label: 'Valid Government ID', required: true },
  { key: 'proof_address', label: 'Proof of Business Address', required: false },
  { key: 'dealers_license', label: 'Dealer\'s License', required: false },
];

const INVENTORY_OPTIONS = [
  {
    id: 'manual',
    title: 'Manual Entry',
    description: 'Add listings one by one through the portal',
    badge: null,
  },
  {
    id: 'csv',
    title: 'CSV Import',
    description: 'Upload a spreadsheet of your inventory',
    badge: { label: 'Coming soon', color: 'bg-blue-100 text-blue-700' },
  },
  {
    id: 'v8atlas',
    title: 'V8Atlas Sync',
    description: 'Enterprise: auto-sync from your DMS',
    badge: { label: 'Enterprise', color: 'bg-amber-100 text-amber-700' },
  },
];

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: null,
    icon: Zap,
    features: ['Up to 5 listings', 'Basic access'],
    color: 'border-cardborder',
  },
  {
    id: 'verified',
    name: 'Verified',
    price: '₱1,499/mo',
    icon: BadgeCheck,
    features: ['Up to 25 listings', 'Verification badge', 'CRM'],
    color: 'border-blue-300',
  },
  {
    id: 'pro',
    name: 'Dealer Pro',
    price: '₱3,499/mo',
    icon: Crown,
    features: ['Up to 100 listings', 'Priority placement', 'Analytics'],
    color: 'border-purple-400',
    recommended: true,
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    icon: Building2,
    features: ['Unlimited listings', 'V8Atlas sync', 'API access', 'Multi-branch'],
    color: 'border-amber-400',
  },
];

export default function DealerApply() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    businessName: '',
    businessType: 'independent',
    contactName: '',
    contactPhone: '',
    address: '',
    city: '',
    selectedPlan: 'pro',
  });

  const [docChecks, setDocChecks] = useState({});
  const [inventoryMethod, setInventoryMethod] = useState('manual');

  const applyMutation = useMutation({
    mutationFn: (data) => api.post('/dealers/apply', data).then(r => r.data),
    onSuccess: () => setSubmitted(true),
  });

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    applyMutation.mutate({
      businessName: form.businessName,
      businessType: form.businessType,
      contactName: form.contactName,
      contactPhone: form.contactPhone,
      address: form.address,
      city: form.city,
      selectedPlan: form.selectedPlan,
      submit: true,
    });
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-softbg flex items-center justify-center p-6">
        <div className="card p-8 max-w-md w-full text-center">
          <div className="h-14 w-14 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="h-7 w-7 text-emerald-600" />
          </div>
          <h2 className="text-xl font-bold text-ink mb-2">Application Submitted!</h2>
          <p className="text-sm text-slatetext leading-relaxed mb-2">
            Our team will review within 2–3 business days.
          </p>
          {user?.email && (
            <p className="text-sm text-slatetext mb-6">
              You'll receive an email at{' '}
              <span className="font-semibold text-ink">{user.email}</span> when approved.
            </p>
          )}
          <Link to="/dashboard" className="btn-primary inline-flex items-center gap-1.5">
            Back to Dashboard <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-softbg py-10 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-ink">Become a Dealer</h1>
          <p className="text-sm text-slatetext mt-1">Complete the form to apply for a dealer account on AutoBentaPH.</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((s, i) => {
            const n = i + 1;
            const active = n === step;
            const done = n < step;
            return (
              <div key={s.label} className="flex items-center gap-2 flex-1 min-w-0">
                <div className="flex flex-col items-center gap-1">
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                    done ? 'bg-emerald-500 text-white' : active ? 'bg-deepblue text-white' : 'bg-cardborder text-slatetext'
                  }`}>
                    {done ? '✓' : n}
                  </div>
                  <span className={`text-[10px] font-medium whitespace-nowrap ${active ? 'text-deepblue' : 'text-slatetext'}`}>
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mb-4 ${done ? 'bg-emerald-400' : 'bg-cardborder'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Step content */}
        <div className="card p-6">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="font-bold text-ink text-lg">Business Information</h2>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Business Name <span className="text-red-500">*</span></label>
                <input className="input" value={form.businessName} onChange={(e) => set('businessName', e.target.value)} placeholder="e.g. Metro Motorworks" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Business Type</label>
                <select className="input" value={form.businessType} onChange={(e) => set('businessType', e.target.value)}>
                  <option value="independent">Independent Dealer</option>
                  <option value="multi_location">Multi-Location Dealer</option>
                  <option value="enterprise">Enterprise Dealer</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Contact Name <span className="text-red-500">*</span></label>
                <input className="input" value={form.contactName} onChange={(e) => set('contactName', e.target.value)} placeholder="Full name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Contact Phone</label>
                <input className="input" value={form.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} placeholder="+63 900 000 0000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">Address</label>
                <input className="input" value={form.address} onChange={(e) => set('address', e.target.value)} placeholder="Street address" />
              </div>
              <div>
                <label className="block text-sm font-medium text-ink mb-1">City</label>
                <input className="input" value={form.city} onChange={(e) => set('city', e.target.value)} placeholder="e.g. Quezon City" />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="font-bold text-ink text-lg">Verification Documents</h2>
              <p className="text-sm text-slatetext leading-relaxed">
                Check the documents you have ready. Documents will be requested once your application is submitted.
                Our team reviews within 2–3 business days.
              </p>
              <div className="space-y-2">
                {DOCS.map((doc) => (
                  <label
                    key={doc.key}
                    className={`flex items-center gap-3 rounded-xl border p-3.5 cursor-pointer transition-colors ${
                      docChecks[doc.key] ? 'border-emerald-300 bg-emerald-50' : 'border-cardborder bg-white hover:bg-softbg'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="h-4 w-4 rounded accent-emerald-600"
                      checked={!!docChecks[doc.key]}
                      onChange={(e) => setDocChecks((prev) => ({ ...prev, [doc.key]: e.target.checked }))}
                    />
                    <span className="flex-1 text-sm text-ink">{doc.label}</span>
                    {!doc.required && (
                      <span className="text-[10px] font-medium text-slatetext bg-softbg rounded px-1.5 py-0.5">Optional</span>
                    )}
                    {doc.required && docChecks[doc.key] && (
                      <CheckCircle className="h-4 w-4 text-emerald-500 shrink-0" />
                    )}
                  </label>
                ))}
              </div>
              <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-800">
                <FileText className="h-3.5 w-3.5 inline mr-1.5 text-blue-600" />
                Documents will be requested once your application is submitted. Our team reviews within 2–3 business days.
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="font-bold text-ink text-lg">How will you add inventory?</h2>
              <div className="space-y-3">
                {INVENTORY_OPTIONS.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-start gap-3 rounded-xl border-2 p-4 cursor-pointer transition-colors ${
                      inventoryMethod === opt.id ? 'border-deepblue bg-deepblue/5' : 'border-cardborder bg-white hover:bg-softbg'
                    }`}
                  >
                    <input
                      type="radio"
                      name="inventory"
                      value={opt.id}
                      checked={inventoryMethod === opt.id}
                      onChange={() => setInventoryMethod(opt.id)}
                      className="mt-0.5 accent-deepblue"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-ink">{opt.title}</span>
                        {opt.badge && (
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${opt.badge.color}`}>
                            {opt.badge.label}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slatetext mt-0.5">{opt.description}</p>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-4">
              <h2 className="font-bold text-ink text-lg">Choose Your Plan</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {PLANS.map((p) => {
                  const Icon = p.icon;
                  const selected = form.selectedPlan === p.id;
                  return (
                    <label
                      key={p.id}
                      className={`relative rounded-2xl border-2 p-4 cursor-pointer flex flex-col gap-2 transition-colors ${p.color} ${
                        selected ? 'ring-2 ring-deepblue ring-offset-1' : 'bg-white hover:bg-softbg'
                      }`}
                    >
                      {p.recommended && (
                        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                          <span className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-2.5 py-0.5 text-[10px] font-bold text-white">
                            <Rocket className="h-2.5 w-2.5" /> Recommended
                          </span>
                        </div>
                      )}
                      <input
                        type="radio"
                        name="plan"
                        value={p.id}
                        checked={selected}
                        onChange={() => set('selectedPlan', p.id)}
                        className="sr-only"
                      />
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-lg bg-softbg flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-ink" />
                        </div>
                        <div>
                          <p className="font-bold text-sm text-ink">{p.name}</p>
                          <p className="text-xs text-slatetext">{p.price || 'Free forever'}</p>
                        </div>
                      </div>
                      <ul className="space-y-1">
                        {p.features.map((f) => (
                          <li key={f} className="flex items-center gap-1.5 text-xs text-ink">
                            <CheckCircle className="h-3 w-3 text-emerald-500 shrink-0" /> {f}
                          </li>
                        ))}
                      </ul>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-5">
              <h2 className="font-bold text-ink text-lg">Review & Submit</h2>
              <div className="rounded-xl border border-cardborder divide-y divide-cardborder text-sm">
                {[
                  { label: 'Business Name', value: form.businessName || '—' },
                  { label: 'Business Type', value: form.businessType.replace('_', ' ') },
                  { label: 'Contact Name', value: form.contactName || '—' },
                  { label: 'Contact Phone', value: form.contactPhone || '—' },
                  { label: 'Address', value: form.address || '—' },
                  { label: 'City', value: form.city || '—' },
                  { label: 'Selected Plan', value: PLANS.find((p) => p.id === form.selectedPlan)?.name || '—' },
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between px-4 py-3">
                    <span className="text-slatetext">{label}</span>
                    <span className="font-medium text-ink capitalize">{value}</span>
                  </div>
                ))}
              </div>
              {applyMutation.isError && (
                <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
                  Submission failed. Please try again.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {step > 1 ? (
            <button className="btn-secondary" onClick={() => setStep((s) => s - 1)}>
              ← Back
            </button>
          ) : (
            <div />
          )}
          {step < 5 ? (
            <button
              className="btn-primary"
              onClick={() => setStep((s) => s + 1)}
              disabled={step === 1 && (!form.businessName.trim() || !form.contactName.trim())}
            >
              Next →
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={handleSubmit}
              disabled={applyMutation.isPending}
            >
              {applyMutation.isPending ? 'Submitting…' : 'Submit Application'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
