import { useQuery } from '@tanstack/react-query';
import { ShieldCheck } from 'lucide-react';
import api from '../api/client';

// Client-side fallback used when API isn't available (e.g. mock listings)
function computeScoreFallback(listing) {
  if (!listing) return { total: 0, criteria: [], band: 'Fair', color: 'amber' };

  const criteria = [
    { key: 'seller_verified', label: 'Seller identity verified', points: 20, passed: !!(listing.sellerVerified || listing.seller?.isVerified || listing.dealer?.isVerified) },
    { key: 'ownership_verified', label: 'Ownership verified', points: 25, passed: !!listing.ownershipVerified },
    { key: 'history_available', label: 'Vehicle history available', points: 15, passed: !!listing.vehicleHistoryAvailable },
    { key: 'transfer_docs', label: 'Transfer documents complete', points: 20, passed: !!(listing.hasOrCr && listing.ownershipVerified) },
    { key: 'inspection_completed', label: 'Inspection completed', points: 10, passed: !!(listing.inspectionRequests?.some(r => r.status === 'completed')) },
    { key: 'financing_eligible', label: 'Financing eligible', points: 10, passed: !!listing.financingEligible },
  ];

  const total = criteria.reduce((sum, c) => sum + (c.passed ? c.points : 0), 0);
  let band, color;
  if (total >= 70) { band = 'Excellent'; color = 'green'; }
  else if (total >= 40) { band = 'Good'; color = 'blue'; }
  else { band = 'Fair'; color = 'amber'; }

  return { total, criteria, band, color };
}

function scoreStyle(color) {
  if (color === 'green') return { bar: 'bg-emerald-500', text: 'text-emerald-600', pill: 'bg-emerald-100 text-emerald-700' };
  if (color === 'blue') return { bar: 'bg-deepblue', text: 'text-deepblue', pill: 'bg-blue-100 text-blue-700' };
  return { bar: 'bg-amber-400', text: 'text-amber-600', pill: 'bg-amber-100 text-amber-700' };
}

export default function ReadinessScore({ listing, compact = false }) {
  const listingId = listing?.id;

  const { data: apiScore } = useQuery({
    queryKey: ['readiness-score', listingId],
    queryFn: () => api.get(`/verifications/listing/${listingId}/readiness-score`).then(r => r.data),
    enabled: !!listingId && !listingId?.startsWith('mock'),
    staleTime: 5 * 60 * 1000,
  });

  const score = apiScore || computeScoreFallback(listing);
  const { total, criteria, band, color } = score;
  const { bar, text, pill } = scoreStyle(color);

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
              strokeDasharray={`${(total / 100) * 75.4} 75.4`}
              className={bar.replace('bg-', 'stroke-')}
              strokeLinecap="round"
            />
          </svg>
          <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${text}`}>
            {total}
          </span>
        </div>
        <div>
          <p className="text-xs font-bold text-ink">Transfer Readiness</p>
          <p className={`text-[11px] font-semibold ${text}`}>{band}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-cardborder bg-white p-5">
      <div className="flex items-center gap-3 mb-4">
        <ShieldCheck className="h-5 w-5 text-deepblue" />
        <h3 className="font-bold text-ink">Transfer Readiness Score</h3>
        {apiScore && <span className="ml-auto text-[10px] text-slatetext/50">Verified by platform</span>}
      </div>

      <div className="flex items-end gap-4 mb-4">
        <div>
          <span className={`text-4xl font-bold ${text}`}>{total}</span>
          <span className="text-xl text-slatetext">/100</span>
        </div>
        <span className={`mb-1 rounded-full px-2.5 py-0.5 text-xs font-bold ${pill}`}>{band}</span>
      </div>

      <div className="mb-5 h-2 w-full rounded-full bg-softbg overflow-hidden">
        <div className={`h-2 rounded-full transition-all duration-700 ${bar}`} style={{ width: `${total}%` }} />
      </div>

      <div className="space-y-2">
        {criteria.map((item) => (
          <div key={item.key} className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${item.passed ? 'bg-emerald-400' : 'bg-cardborder'}`} />
              <span className={item.passed ? 'text-ink' : 'text-slatetext/60'}>{item.label}</span>
            </div>
            <span className={`text-xs font-bold ${item.passed ? 'text-emerald-600' : 'text-slatetext/40'}`}>
              +{item.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
