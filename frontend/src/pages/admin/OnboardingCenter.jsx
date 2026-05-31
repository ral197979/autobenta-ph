import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';

const STEPS = [
  'Agreement Signed',
  'Invoice Paid',
  'Account Created',
  'Inventory Imported',
  'First Listing Live',
  'First Lead Received',
  'First Lead Responded',
  'CRM Used',
  'Go Live',
];

function loadProgress(dealerId) {
  try {
    const raw = localStorage.getItem(`onboarding_${dealerId}`);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveProgress(dealerId, progress) {
  localStorage.setItem(`onboarding_${dealerId}`, JSON.stringify(progress));
}

function DealerOnboardingCard({ dealer, healthScore }) {
  const id = dealer.id || dealer._id;
  const [progress, setProgress] = useState(() => loadProgress(id));

  useEffect(() => {
    saveProgress(id, progress);
  }, [id, progress]);

  const completedCount = STEPS.filter((_, i) => progress[i]).length;
  const pct = Math.round((completedCount / STEPS.length) * 100);

  function toggle(i) {
    setProgress(p => ({ ...p, [i]: !p[i] }));
  }

  function markAll() {
    const all = {};
    STEPS.forEach((_, i) => { all[i] = true; });
    setProgress(all);
  }

  const planLabel = dealer.subscriptionPlan || dealer.plan || 'Standard';
  const score = healthScore?.score;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 text-sm">{dealer.businessName || dealer.name || 'Unnamed Dealer'}</p>
          <span className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 px-2 py-0.5 text-[11px] font-semibold">
            {planLabel}
          </span>
          {score != null && (
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${score >= 70 ? 'bg-green-100 text-green-700' : score >= 40 ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-700'}`}>
              Health {score}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-500">{completedCount} / {STEPS.length} steps</span>
          <button onClick={markAll} className="text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors">
            Mark All Complete
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex gap-1 flex-wrap">
        {STEPS.map((step, i) => {
          const done = !!progress[i];
          const isCurrent = !done && (i === 0 || !!progress[i - 1]);
          return (
            <button
              key={step}
              type="button"
              onClick={() => toggle(i)}
              title={step}
              className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border text-center transition-all text-[10px] font-semibold min-w-[72px] flex-1
                ${done
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : isCurrent
                    ? 'border-blue-400 text-blue-700 bg-blue-50 ring-1 ring-blue-300 animate-pulse'
                    : 'bg-gray-50 border-gray-200 text-gray-400'
                }`}
            >
              <span className="leading-tight text-center">{step}</span>
            </button>
          );
        })}
      </div>

      <p className="text-[11px] text-gray-400 italic">
        Note: progress stored locally. Backend persistence coming soon.
      </p>
    </div>
  );
}

export default function OnboardingCenter() {
  const { data: dealers, isLoading } = useQuery({
    queryKey: ['admin-dealers'],
    queryFn: () => api.get('/admin/dealers').then(r => r.data),
  });

  const { data: scores } = useQuery({
    queryKey: ['admin-success-scores'],
    queryFn: () => api.get('/admin/success-scores').then(r => r.data),
  });

  const list = Array.isArray(dealers) ? dealers : dealers?.dealers || [];
  const active = list.filter(d => !d.isSuspended && d.status !== 'suspended');

  const scoreMap = {};
  if (Array.isArray(scores)) {
    scores.forEach(s => { scoreMap[s.dealerId || s.id] = s; });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Onboarding Center</h1>
        <p className="text-sm text-gray-500 mt-1">First dealer to Go Live</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => <div key={i} className="h-40 bg-gray-50 rounded-xl animate-pulse" />)}
        </div>
      ) : active.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-500 text-sm">No active dealers yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {active.map(dealer => {
            const id = dealer.id || dealer._id;
            return (
              <DealerOnboardingCard
                key={id}
                dealer={dealer}
                healthScore={scoreMap[id]}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
