import { useState } from 'react';
import { X, Clock } from 'lucide-react';

export default function TrialBanner({ trial }) {
  const [dismissed, setDismissed] = useState(false);
  if (!trial?.isOnTrial || dismissed) return null;

  const urgent  = trial.daysRemaining <= 7;
  const warning = trial.daysRemaining <= 30;

  const bg = urgent ? 'bg-red-600' : warning ? 'bg-amber-500' : 'bg-deepblue';

  return (
    <div className={`${bg} text-white px-4 py-2.5 flex items-center justify-between gap-4`}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Clock className="h-4 w-4 shrink-0" />
        {urgent
          ? `⚠️ Your free trial ends in ${trial.daysRemaining} day${trial.daysRemaining === 1 ? '' : 's'}. Lock in ₱3,599/mo before it expires.`
          : warning
          ? `Your free trial ends in ${trial.daysRemaining} days. Upgrade now to keep the Founding Dealer rate of ₱3,599/mo.`
          : `You're on a 90-day free trial — ${trial.daysRemaining} days remaining. Full Pro features, no credit card needed.`
        }
        <a href="/dealer/subscription" className="underline font-semibold ml-1">
          {urgent || warning ? 'Upgrade now →' : 'Learn more →'}
        </a>
      </div>
      <button onClick={() => setDismissed(true)} className="shrink-0 opacity-80 hover:opacity-100">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
