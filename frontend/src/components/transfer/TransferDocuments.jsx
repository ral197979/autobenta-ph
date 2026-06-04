import { CheckCircle2, User, Users, Car } from 'lucide-react';

const PARTIES = [
  {
    id: 'seller',
    label: 'Seller',
    icon: User,
    color: 'text-primary',
    bg: 'bg-blue-50',
    border: 'border-blue-100',
    items: [
      'Original Official Receipt (OR)',
      'Original Certificate of Registration (CR)',
      'Two valid government-issued IDs',
      'Signed Deed of Sale (notarized)',
      'Signed Deed of Absolute Sale (if fully paid)',
      'Authorization letter (if represented by agent)',
    ],
  },
  {
    id: 'buyer',
    label: 'Buyer',
    icon: Users,
    color: 'text-primary',
    bg: 'bg-indigo-50',
    border: 'border-indigo-100',
    items: [
      'Two valid government-issued IDs',
      'Tax Identification Number (TIN) — if applicable',
      'CTPL insurance policy',
      'Comprehensive insurance certificate (if financed)',
      'Authority to Register (if through a dealer)',
    ],
  },
  {
    id: 'vehicle',
    label: 'Vehicle',
    icon: Car,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    border: 'border-emerald-100',
    items: [
      'Emission Test Certificate (from accredited PETC)',
      'Vehicle clearance from HPG (if 400cc+ or for-hire)',
      'Chattel Mortgage Release (if previously financed)',
      'Vehicle Inspection Report (if used vehicle from dealer)',
      'Import documents (if previously imported)',
    ],
  },
];

export default function TransferDocuments() {
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {PARTIES.map(({ id, label, icon: Icon, color, bg, border, items }) => (
        <div
          key={id}
          className={`rounded-2xl border ${border} ${bg} p-5`}
        >
          <div className="flex items-center gap-2 mb-4">
            <div className={`flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container-lowest shadow-sm`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <h3 className="font-bold text-on-surface">{label} Documents</h3>
          </div>
          <ul className="space-y-2.5">
            {items.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-on-surface-variant">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-on-surface-variant/50" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
