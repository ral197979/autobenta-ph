import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CheckCircle, User, Car, CreditCard, Rocket, Copy, Zap } from 'lucide-react';
import api from '../../api/client';

const RANK_COLORS = {
  A: 'bg-emerald-100 text-emerald-700',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-red-100 text-red-700',
};

const STEPS = [
  { icon: User, label: 'Complete Your Profile' },
  { icon: Car, label: 'Add Your First Listing' },
  { icon: CreditCard, label: 'Your Free Trial' },
  { icon: Rocket, label: 'Go Live' },
];

export default function DealerOnboarding() {
  const { dealer } = useOutletContext();
  const qc = useQueryClient();
  const [step, setStep] = useState(1);
  const [profileSaved, setProfileSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileForm, setProfileForm] = useState({
    businessName: dealer?.businessName || '',
    city: dealer?.city || '',
    phone: dealer?.phone || '',
    description: dealer?.description || '',
    website: dealer?.website || '',
  });

  const { data: analytics } = useQuery({
    queryKey: ['dealer-analytics'],
    queryFn: () => api.get('/dealer/analytics').then(r => r.data),
  });

  const { data: scorecard } = useQuery({
    queryKey: ['dealer-scorecard'],
    queryFn: () => api.get('/dealer/analytics/scorecard').then(r => r.data),
    enabled: step === 4,
  });

  const profileMutation = useMutation({
    mutationFn: (data) => api.patch('/dealers/me/profile', data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['dealer-profile']);
      setProfileSaved(true);
    },
  });

  const hasListings = (analytics?.listings?.active || 0) > 0;
  const isFreePlan = !dealer?.plan || dealer?.plan === 'free';
  const dealerId = dealer?.id || dealer?._id;

  const handleCopyLink = () => {
    const url = `${window.location.origin}/dealers/${dealerId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const completionChecklist = [
    { label: 'Profile complete', done: profileSaved || !!dealer?.description },
    { label: 'First listing active', done: hasListings },
    { label: 'Free trial active', done: true },
  ];

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-xl font-bold text-ink">Dealer Onboarding</h1>
        <p className="text-sm text-slatetext mt-1">Follow these steps to get your dealer profile ready.</p>
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
                <span className={`text-[10px] font-medium text-center leading-tight ${active ? 'text-deepblue' : 'text-slatetext'}`}>
                  {s.label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mb-5 ${done ? 'bg-emerald-400' : 'bg-cardborder'}`} />
              )}
            </div>
          );
        })}
      </div>

      {/* Step content */}
      <div className="card p-6">
        {step === 1 && (
          <div className="space-y-4">
            <h2 className="font-bold text-ink">Complete Your Profile</h2>
            {[
              { field: 'businessName', label: 'Business Name', placeholder: 'Your dealership name' },
              { field: 'city', label: 'City', placeholder: 'e.g. Makati' },
              { field: 'phone', label: 'Phone', placeholder: '+63 900 000 0000' },
              { field: 'website', label: 'Website', placeholder: 'https://yourdealership.com' },
            ].map(({ field, label, placeholder }) => (
              <div key={field}>
                <label className="block text-sm font-medium text-ink mb-1">{label}</label>
                <input
                  className="input"
                  value={profileForm[field]}
                  onChange={(e) => setProfileForm((prev) => ({ ...prev, [field]: e.target.value }))}
                  placeholder={placeholder}
                />
              </div>
            ))}
            <div>
              <label className="block text-sm font-medium text-ink mb-1">Description</label>
              <textarea
                className="input resize-none h-20"
                value={profileForm.description}
                onChange={(e) => setProfileForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="Tell buyers about your dealership…"
              />
            </div>
            {profileSaved && (
              <div className="flex items-center gap-2 text-sm text-emerald-700 font-medium">
                <CheckCircle className="h-4 w-4" /> Step complete
              </div>
            )}
            <button
              className="btn-primary"
              onClick={() => profileMutation.mutate(profileForm)}
              disabled={profileMutation.isPending}
            >
              {profileMutation.isPending ? 'Saving…' : 'Save Profile'}
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h2 className="font-bold text-ink">Add Your First Listing</h2>
            <p className="text-sm text-slatetext">You need at least 1 active listing to start receiving leads.</p>

            {hasListings ? (
              <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700 font-medium">
                <CheckCircle className="h-4 w-4 shrink-0" />
                You already have listings — great start!
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-3">
                <Link
                  to="/sell"
                  className="flex flex-col gap-1.5 rounded-xl border-2 border-cardborder bg-white p-4 hover:border-deepblue hover:bg-deepblue/5 transition-colors"
                >
                  <Car className="h-5 w-5 text-deepblue" />
                  <p className="font-semibold text-sm text-ink">Add Manually</p>
                  <p className="text-xs text-slatetext">Add listings one by one through the portal</p>
                </Link>
                <Link
                  to="/ai-wizard"
                  className="flex flex-col gap-1.5 rounded-xl border-2 border-cardborder bg-white p-4 hover:border-deepblue hover:bg-deepblue/5 transition-colors"
                >
                  <Rocket className="h-5 w-5 text-purple-500" />
                  <p className="font-semibold text-sm text-ink">Use AI Wizard</p>
                  <p className="text-xs text-slatetext">Let AI help you create your listing</p>
                </Link>
              </div>
            )}
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h2 className="font-bold text-ink">Your Free Trial</h2>
            <div className="rounded-xl bg-deepblue/10 border border-deepblue/20 p-5">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-deepblue" />
                <span className="font-semibold text-ink">You're on a 90-day free trial</span>
              </div>
              <p className="text-sm text-slatetext mb-3">
                Full Pro features, no credit card required. Your Founding Dealer rate of <strong>₱3,599/month</strong> is locked in — just contact us before your trial ends to activate payment.
              </p>
              <ul className="space-y-1.5 text-sm text-slatetext">
                {['Unlimited listings', 'Lead CRM', 'Analytics dashboard', 'Priority placement', 'Verified Dealer badge', 'V8Atlas sync', 'API access'].map(f => (
                  <li key={f} className="flex items-center gap-2">
                    <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={() => setStep(4)}
              className="btn-primary w-full"
            >
              Continue to Go Live →
            </button>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-4">
            <h2 className="font-bold text-ink">Go Live</h2>
            <div className="space-y-2">
              {completionChecklist.map(({ label, done }) => (
                <div key={label} className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-softbg text-slatetext'}`}>
                  <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 text-[10px] font-bold ${done ? 'bg-emerald-500 text-white' : 'border-2 border-cardborder'}`}>
                    {done ? '✓' : ''}
                  </div>
                  {label}
                </div>
              ))}
            </div>

            {scorecard && (
              <div className="flex items-center gap-3 rounded-xl border border-cardborder p-4">
                <span className={`h-10 w-10 rounded-xl flex items-center justify-center text-lg font-black ${RANK_COLORS[scorecard.rank] || 'bg-gray-100 text-gray-600'}`}>
                  {scorecard.rank || '—'}
                </span>
                <div>
                  <p className="text-sm font-semibold text-ink">Your dealer score</p>
                  <p className="text-xs text-slatetext">{scorecard.score ?? '—'} / 100</p>
                </div>
              </div>
            )}

            {dealerId && (
              <button
                className="btn-secondary inline-flex items-center gap-1.5"
                onClick={handleCopyLink}
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied!' : 'Copy dealer page link'}
              </button>
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
        {step < 4 && (
          <button className="btn-primary" onClick={() => setStep((s) => s + 1)}>
            Next →
          </button>
        )}
      </div>
    </div>
  );
}
