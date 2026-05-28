import { Link } from 'react-router-dom';

// Clean inline SVG silhouettes — no emoji, single accent color.
const SedanIcon = (props) => (
  <svg viewBox="0 0 64 32" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M4 22h56l-4-6-10-2-6-6H22l-6 6-10 2-2 6z" />
    <circle cx="18" cy="24" r="4" />
    <circle cx="46" cy="24" r="4" />
  </svg>
);

const SuvIcon = (props) => (
  <svg viewBox="0 0 64 32" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M4 22h56v-6l-8-2-4-8H16l-4 8-8 2v6z" />
    <circle cx="18" cy="24" r="4" />
    <circle cx="46" cy="24" r="4" />
  </svg>
);

const PickupIcon = (props) => (
  <svg viewBox="0 0 64 32" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M4 22h56v-6l-8-2-4-8H26v16M26 14H6l-2 8" />
    <circle cx="18" cy="24" r="4" />
    <circle cx="46" cy="24" r="4" />
  </svg>
);

const VanIcon = (props) => (
  <svg viewBox="0 0 64 32" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M4 22h56V8H12L4 16v6z" />
    <path d="M12 8v8h22V8M34 8v8h18" />
    <circle cx="18" cy="24" r="4" />
    <circle cx="46" cy="24" r="4" />
  </svg>
);

const HatchIcon = (props) => (
  <svg viewBox="0 0 64 32" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M4 22h56l-6-6-6-8H20l-12 12-4 2z" />
    <circle cx="18" cy="24" r="4" />
    <circle cx="46" cy="24" r="4" />
  </svg>
);

const LuxIcon = (props) => (
  <svg viewBox="0 0 64 32" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
    <path d="M2 22h60l-6-6-12-2-4-6H22l-4 6-12 2-2 6z" />
    <circle cx="18" cy="24" r="4" />
    <circle cx="46" cy="24" r="4" />
    <path d="M28 8l4-3 4 3" />
  </svg>
);

const TYPES = [
  { label: 'Sedan', count: '2,400+ listings', Icon: SedanIcon, query: 'bodyType=Sedan' },
  { label: 'SUV', count: '3,100+ listings', Icon: SuvIcon, query: 'bodyType=SUV' },
  { label: 'Pickup', count: '1,800+ listings', Icon: PickupIcon, query: 'bodyType=Pickup' },
  { label: 'Van / MPV', count: '1,200+ listings', Icon: VanIcon, query: 'bodyType=Van' },
  { label: 'Hatchback', count: '900+ listings', Icon: HatchIcon, query: 'bodyType=Hatchback' },
  { label: 'Luxury', count: '300+ listings', Icon: LuxIcon, query: 'bodyType=Luxury' },
];

export default function BrowseByType() {
  return (
    <section className="bg-softbg">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-electric">
            Browse by type
          </p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            Find the body style that fits your life
          </h2>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {TYPES.map(({ label, count, Icon, query }) => (
            <Link
              key={label}
              to={`/cars?${query}`}
              className="group flex flex-col items-start gap-3 rounded-2xl border border-cardborder bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:border-deepblue hover:shadow-lg"
            >
              <div className="flex h-12 w-16 items-center justify-center text-deepblue transition-colors group-hover:text-electric">
                <Icon className="h-12 w-16" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{label}</p>
                <p className="text-xs text-slatetext">{count}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
