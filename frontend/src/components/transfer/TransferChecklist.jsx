import { useState, useEffect } from 'react';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, FileText, ShieldCheck, Car, Clipboard, Zap, Search, Building2, CreditCard, Award } from 'lucide-react';

const STEPS = [
  {
    id: 'verify_orcr',
    icon: FileText,
    label: 'Verify Original OR/CR',
    detail: 'Confirm the Official Receipt and Certificate of Registration match the vehicle. Check that the plate number, chassis number, and engine number are consistent.',
  },
  {
    id: 'verify_identity',
    icon: ShieldCheck,
    label: 'Verify Seller Identity',
    detail: 'Request two valid government-issued IDs from the seller. Cross-reference the name on the OR/CR with the seller\'s identification.',
  },
  {
    id: 'deed_of_sale',
    icon: Clipboard,
    label: 'Execute Deed of Sale',
    detail: 'Prepare a notarized Deed of Sale with complete vehicle details, agreed price, and both parties\' signatures. Notarization typically costs ₱500–₱2,000.',
  },
  {
    id: 'insurance',
    icon: ShieldCheck,
    label: 'Secure Insurance',
    detail: 'Obtain a Compulsory Third Party Liability (CTPL) insurance policy, minimum. Comprehensive insurance is strongly recommended for financing-related transfers.',
  },
  {
    id: 'emissions',
    icon: Zap,
    label: 'Complete Emissions Test',
    detail: 'Have the vehicle pass an emissions test at an accredited PETC station. This certificate is required for LTO registration renewal and transfer.',
  },
  {
    id: 'hpg_clearance',
    icon: Search,
    label: 'Obtain HPG Clearance (if applicable)',
    detail: 'Vehicles with engine displacement of 400cc and above, or motor vehicles used for hire, require a Highway Patrol Group clearance. Fee is approximately ₱400.',
  },
  {
    id: 'lto_requirements',
    icon: Building2,
    label: 'Submit LTO Requirements',
    detail: 'Bring all documents to your local LTO district office: OR/CR, Deed of Sale, insurance certificate, emissions test result, and valid IDs. Processing takes 3–7 business days.',
  },
  {
    id: 'pay_fees',
    icon: CreditCard,
    label: 'Pay Applicable Fees',
    detail: 'Pay the transfer fee, registration fee, and any penalties. Estimated total government fees range from ₱1,500–₱4,500 depending on vehicle class and region.',
  },
  {
    id: 'receive_orcr',
    icon: Award,
    label: 'Receive New OR/CR',
    detail: 'The LTO will issue a new OR/CR in the buyer\'s name. The vehicle is now legally transferred. Keep the original documents in a secure location.',
  },
];

const STORAGE_KEY = 'autobenta_transfer_checklist';

export default function TransferChecklist({ listingId }) {
  const storageKey = listingId ? `${STORAGE_KEY}_${listingId}` : STORAGE_KEY;

  const [checked, setChecked] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(checked));
  }, [checked, storageKey]);

  const toggle = (id) => {
    setChecked((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const progress = Math.round((checked.length / STEPS.length) * 100);

  const progressColor =
    progress === 100
      ? 'bg-emerald-500'
      : progress >= 60
      ? 'bg-deepblue'
      : progress >= 30
      ? 'bg-electric'
      : 'bg-accent';

  return (
    <div>
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-ink">
            {checked.length} of {STEPS.length} completed
          </span>
          <span
            className={`text-sm font-bold ${
              progress === 100 ? 'text-emerald-600' : 'text-deepblue'
            }`}
          >
            {progress}%
          </span>
        </div>
        <div className="h-2 w-full rounded-full bg-softbg overflow-hidden">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${progressColor}`}
            style={{ width: `${progress}%` }}
          />
        </div>
        {progress === 100 && (
          <p className="mt-2 text-sm font-semibold text-emerald-600 flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4" /> All steps complete — you are ready for transfer.
          </p>
        )}
      </div>

      {/* Steps */}
      <div className="space-y-2">
        {STEPS.map((step, idx) => {
          const done = checked.includes(step.id);
          const open = expanded === step.id;
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`rounded-xl border transition-all duration-150 ${
                done
                  ? 'border-emerald-200 bg-emerald-50/60'
                  : 'border-cardborder bg-white'
              }`}
            >
              <div className="flex items-center gap-3 p-4">
                {/* Check toggle */}
                <button
                  type="button"
                  onClick={() => toggle(step.id)}
                  className="shrink-0 transition-transform active:scale-90"
                  aria-label={done ? 'Mark incomplete' : 'Mark complete'}
                >
                  {done ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-500" />
                  ) : (
                    <Circle className="h-6 w-6 text-cardborder" />
                  )}
                </button>

                {/* Step number + label */}
                <div className="flex flex-1 min-w-0 items-center gap-3">
                  <span
                    className={`hidden sm:flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      done ? 'bg-emerald-500 text-white' : 'bg-softbg text-slatetext'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div className="flex items-center gap-2 min-w-0">
                    <Icon
                      className={`h-4 w-4 shrink-0 ${
                        done ? 'text-emerald-500' : 'text-slatetext'
                      }`}
                    />
                    <span
                      className={`text-sm font-semibold truncate ${
                        done ? 'line-through text-slatetext' : 'text-ink'
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                </div>

                {/* Expand toggle */}
                <button
                  type="button"
                  onClick={() => setExpanded(open ? null : step.id)}
                  className="shrink-0 rounded-md p-1 text-slatetext transition-colors hover:bg-softbg"
                  aria-label="Toggle details"
                >
                  {open ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>

              {open && (
                <div className="px-4 pb-4 pl-[3.25rem]">
                  <p className="text-sm text-slatetext leading-relaxed">{step.detail}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {checked.length > 0 && progress < 100 && (
        <button
          type="button"
          onClick={() => setChecked([])}
          className="mt-4 text-xs text-slatetext underline hover:text-ink transition-colors"
        >
          Reset progress
        </button>
      )}
    </div>
  );
}
