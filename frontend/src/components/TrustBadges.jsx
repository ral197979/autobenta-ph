import { useState } from 'react';
import { BadgeCheck, FileCheck, ShieldCheck, CreditCard, TrendingUp, BookOpen, UserCheck } from 'lucide-react';

const BADGE_CONFIG = {
  transfer_ready: {
    icon: FileCheck,
    label: 'Transfer Ready',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  seller_verified: {
    icon: UserCheck,
    label: 'Verified Seller',
    color: 'bg-deepblue/5 text-deepblue border-deepblue/20',
  },
  ownership_verified: {
    icon: BadgeCheck,
    label: 'Ownership Verified',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  inspection_ready: {
    icon: ShieldCheck,
    label: 'Inspected',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  financing_eligible: {
    icon: CreditCard,
    label: 'Financing Eligible',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  history_available: {
    icon: BookOpen,
    label: 'History Available',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
  price_verified: {
    icon: TrendingUp,
    label: 'Price Verified',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
  },
};

// Priority order — highest trust signal first
const PRIORITY = [
  'transfer_ready',
  'seller_verified',
  'ownership_verified',
  'inspection_ready',
  'financing_eligible',
  'history_available',
  'price_verified',
];

export default function TrustBadges({ listing, size = 'sm', maxCount, expandable = false }) {
  const [expanded, setExpanded] = useState(false);

  const all = [];
  if (listing?.transferReady) all.push('transfer_ready');
  if (listing?.sellerVerified || listing?.dealer?.isVerified) all.push('seller_verified');
  if (listing?.ownershipVerified) all.push('ownership_verified');
  if (listing?.inspectionRequests?.some((r) => r.status === 'completed')) all.push('inspection_ready');
  if (listing?.financingEligible) all.push('financing_eligible');
  if (listing?.vehicleHistoryAvailable) all.push('history_available');
  if (listing?.priceScore >= 70) all.push('price_verified');

  const activeBadges = all.sort((a, b) => PRIORITY.indexOf(a) - PRIORITY.indexOf(b));
  if (activeBadges.length === 0) return null;

  const showAll = !maxCount || expanded;
  const visible = showAll ? activeBadges : activeBadges.slice(0, maxCount);
  const overflow = (!showAll && maxCount) ? activeBadges.length - maxCount : 0;

  const iconSize = size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const textSize = size === 'xs' ? 'text-[10px]' : 'text-[11px]';
  const padding = size === 'xs' ? 'px-1.5 py-0.5' : 'px-2 py-1';

  return (
    <div className="flex flex-wrap gap-1.5">
      {visible.map((key) => {
        const { icon: Icon, label, color } = BADGE_CONFIG[key];
        return (
          <span
            key={key}
            className={`inline-flex items-center gap-1 rounded-full border font-semibold ${color} ${padding} ${textSize}`}
          >
            <Icon className={`${iconSize} shrink-0`} />
            {label}
          </span>
        );
      })}
      {overflow > 0 && (
        expandable ? (
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpanded(true); }}
            className={`inline-flex items-center rounded-full border border-deepblue/20 bg-deepblue/5 font-semibold text-deepblue hover:bg-deepblue/10 transition-colors ${padding} ${textSize}`}
          >
            +{overflow} more
          </button>
        ) : (
          <span className={`inline-flex items-center rounded-full border border-cardborder bg-softbg font-semibold text-slatetext ${padding} ${textSize}`}>
            +{overflow} more
          </span>
        )
      )}
    </div>
  );
}
