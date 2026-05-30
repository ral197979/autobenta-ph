import { FileText, Zap, Building2, Award } from 'lucide-react';

const PHASES = [
  {
    day: 'Day 1',
    label: 'Documents',
    icon: FileText,
    color: 'bg-deepblue',
    tasks: [
      'Execute Deed of Sale with notarization',
      'Verify OR/CR against vehicle details',
      'Confirm seller identity documents',
      'Secure buyer\'s TIN and IDs',
    ],
  },
  {
    day: 'Day 2',
    label: 'Testing & Insurance',
    icon: Zap,
    color: 'bg-electric',
    tasks: [
      'Complete emission test at PETC station',
      'Secure CTPL insurance policy',
      'Obtain HPG clearance if applicable',
      'Prepare complete LTO document package',
    ],
  },
  {
    day: 'Day 3–7',
    label: 'LTO Processing',
    icon: Building2,
    color: 'bg-accent',
    tasks: [
      'Submit documents at LTO district office',
      'Pay transfer and registration fees',
      'Receive official acknowledgment receipt',
      'Track application status via LTO portal',
    ],
  },
  {
    day: 'Day 7–14',
    label: 'Ownership Confirmed',
    icon: Award,
    color: 'bg-emerald-500',
    tasks: [
      'Collect new OR/CR in buyer\'s name',
      'Confirm plate number assignment',
      'Store original documents securely',
      'Transfer complete — vehicle is yours',
    ],
  },
];

export default function TransferTimeline() {
  return (
    <div className="relative">
      {/* Connector line */}
      <div className="absolute left-5 top-10 bottom-10 hidden w-0.5 bg-gradient-to-b from-deepblue via-electric to-emerald-500 lg:block" />

      <div className="space-y-6 lg:space-y-0 lg:grid lg:grid-cols-4 lg:gap-6">
        {PHASES.map((phase, idx) => {
          const Icon = phase.icon;
          return (
            <div key={phase.day} className="relative flex lg:flex-col gap-4 lg:gap-3">
              {/* Icon */}
              <div className={`relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${phase.color} shadow-md`}>
                <Icon className="h-5 w-5 text-white" />
              </div>

              {/* Content */}
              <div className="flex-1 lg:mt-3">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-xs font-bold uppercase tracking-wider text-slatetext">
                    {phase.day}
                  </span>
                </div>
                <h3 className="text-base font-bold text-ink mb-3">{phase.label}</h3>
                <ul className="space-y-1.5">
                  {phase.tasks.map((task) => (
                    <li key={task} className="flex items-start gap-2 text-sm text-slatetext">
                      <span className={`mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full ${phase.color}`} />
                      {task}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Step number — desktop only */}
              {idx < PHASES.length - 1 && (
                <div className="hidden lg:block absolute top-5 right-0 translate-x-1/2 z-10">
                  <div className="h-0.5 w-6 bg-cardborder" />
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        <strong>Note:</strong> Processing times vary by LTO district and current volume. Metro Manila offices may take up to 14 business days during peak periods. Verify current wait times with your local LTO before scheduling.
      </div>
    </div>
  );
}
