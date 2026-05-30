import { ShieldCheck } from 'lucide-react';

function computeScore(listing) {
  if (!listing) return { score: 0, items: [] };

  const items = [];
  let score = 0;

  if (listing.ownershipVerified) {
    items.push({ label: 'Ownership verified', points: 20, met: true });
    score += 20;
  } else {
    items.push({ label: 'Ownership verified', points: 20, met: false });
  }

  if (listing.hasOrCr) {
    items.push({ label: 'OR/CR available', points: 20, met: true });
    score += 20;
  } else {
    items.push({ label: 'OR/CR available', points: 20, met: false });
  }

  if (listing.sellerVerified || listing.dealer?.isVerified) {
    items.push({ label: 'Seller identity verified', points: 15, met: true });
    score += 15;
  } else {
    items.push({ label: 'Seller identity verified', points: 15, met: false });
  }

  if (listing.financingEligible) {
    items.push({ label: 'Insurance / financing eligible', points: 15, met: true });
    score += 15;
  } else {
    items.push({ label: 'Insurance / financing eligible', points: 15, met: false });
  }

  const hasCompletedInspection = listing.inspectionRequests?.some((r) => r.status === 'completed');
  if (hasCompletedInspection) {
    items.push({ label: 'Inspection completed', points: 15, met: true });
    score += 15;
  } else {
    items.push({ label: 'Inspection completed', points: 15, met: false });
  }

  const noFlags = !listing.hasAccident && !listing.hasFlood && listing.fraudScore < 30;
  if (noFlags) {
    items.push({ label: 'No ownership discrepancies', points: 15, met: true });
    score += 15;
  } else {
    items.push({ label: 'No ownership discrepancies', points: 15, met: false });
  }

  return { score, items };
}

function scoreColor(score) {
  if (score >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-600', label: 'Excellent' };
  if (score >= 55) return { bar: 'bg-deepblue', text: 'text-deepblue', label: 'Good' };
  if (score >= 30) return { bar: 'bg-accent', text: 'text-amber-600', label: 'Fair' };
  return { bar: 'bg-red-400', text: 'text-red-600', label: 'Needs attention' };
}

export default function ReadinessScore({ listing, compact = false }) {
  const { score, items } = computeScore(listing);
  const { bar, text, label } = scoreColor(score);

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="relative h-8 w-8">
          <svg viewBox="0 0 32 32" className="h-8 w-8 -rotate-90">
            <circle cx="16" cy="16" r="12" fill="none" stroke="#e2e8f0" strokeWidth="3" />
            <circle
              cx="16" cy="16" r="12"
              fill="none"
              strokeWidth="3"
              strokeDasharray={`${(score / 100) * 75.4} 75.4`}
              className={bar.replace('bg-', 'stroke-')}
              strokeLinecap="round"
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${text}`}>
            {score}
          </span>
        </div>
        <div>
          <p className="text-xs font-bold text-ink">Transfer Readiness</p>
          <p className={`text-[11px] font-semibold ${text}`}>{label}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cardborder bg-white p-5">
      <div className="flex items-center gap-3 mb-4">
        <ShieldCheck className="h-5 w-5 text-deepblue" />
        <h3 className="font-bold text-ink">Transfer Readiness Score</h3>
      </div>

      <div className="flex items-end gap-4 mb-4">
        <div>
          <span className={`text-4xl font-bold ${text}`}>{score}</span>
          <span className="text-xl text-slatetext">/100</span>
        </div>
        <span className={`mb-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${
          score >= 80 ? 'bg-emerald-100 text-emerald-700' :
          score >= 55 ? 'bg-blue-100 text-blue-700' :
          score >= 30 ? 'bg-amber-100 text-amber-700' :
          'bg-red-100 text-red-700'
        }`}>
          {label}
        </span>
      </div>

      <div className="mb-5 h-2 w-full rounded-full bg-softbg overflow-hidden">
        <div
          className={`h-2 rounded-full transition-all duration-700 ${bar}`}
          style={{ width: `${score}%` }}
        />
      </div>

      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${item.met ? 'bg-emerald-400' : 'bg-cardborder'}`} />
              <span className={item.met ? 'text-ink' : 'text-slatetext/60'}>{item.label}</span>
            </div>
            <span className={`text-xs font-bold ${item.met ? 'text-emerald-600' : 'text-slatetext/40'}`}>
              +{item.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
