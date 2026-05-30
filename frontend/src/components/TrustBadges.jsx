import { BadgeCheck, FileCheck, ShieldCheck, CreditCard, TrendingUp, BookOpen } from 'lucide-react';

const BADGE_CONFIG = {
  ownership_verified: {
    icon: BadgeCheck,
    label: 'Verified Ownership',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
  },
  transfer_ready: {
    icon: FileCheck,
    label: 'Ready For Transfer',
    color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  inspection_ready: {
    icon: ShieldCheck,
    label: 'Inspection Ready',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
  },
  financing_eligible: {
    icon: CreditCard,
    label: 'Financing Eligible',
    color: 'bg-orange-50 text-orange-700 border-orange-200',
  },
  price_verified: {
    icon: TrendingUp,
    label: 'Price Verified',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
  },
  history_available: {
    icon: BookOpen,
    label: 'History Available',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  },
};

export default function TrustBadges({ listing, size = 'sm' }) {
  const activeBadges = [];

  if (listing?.ownershipVerified) activeBadges.push('ownership_verified');
  if (listing?.transferReady) activeBadges.push('transfer_ready');
  if (listing?.inspectionRequests?.some((r) => r.status === 'completed')) activeBadges.push('inspection_ready');
  if (listing?.financingEligible) activeBadges.push('financing_eligible');
  if (listing?.priceScore >= 70) activeBadges.push('price_verified');
  if (listing?.vehicleHistoryAvailable) activeBadges.push('history_available');

  if (activeBadges.length === 0) return null;

  const iconSize = size === 'xs' ? 'h-3 w-3' : 'h-3.5 w-3.5';
  const textSize = size === 'xs' ? 'text-[10px]' : 'text-[11px]';
  const padding = size === 'xs' ? 'px-1.5 py-0.5' : 'px-2 py-1';

  return (
    <div className="flex flex-wrap gap-1.5">
      {activeBadges.map((key) => {
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
    </div>
  );
}
