import { Link } from 'react-router-dom';

// Distinct side-profile silhouettes per body type.
// viewBox="0 0 80 44" gives a natural car-width canvas.

/** Sedan — classic 3-box: long hood, raised cabin, short trunk */
const SedanIcon = (props) => (
  <svg viewBox="0 0 80 44" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" {...props}>
    <path d="M6 30 L6 24 L14 24 L22 14 L54 14 L62 24 L74 24 L74 30 Z" />
    <path d="M24 24 L28 16 L50 16 L56 24 Z" />
    <circle cx="20" cy="30" r="5" />
    <circle cx="60" cy="30" r="5" />
  </svg>
);

/** SUV — tall boxy cabin, high ride height, large wheels */
const SuvIcon = (props) => (
  <svg viewBox="0 0 80 44" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" {...props}>
    <path d="M4 30 L4 16 L14 16 L20 8 L62 8 L68 16 L76 16 L76 30 Z" />
    <path d="M22 16 L25 10 L60 10 L64 16 Z" />
    <circle cx="20" cy="31" r="6" />
    <circle cx="60" cy="31" r="6" />
  </svg>
);

/** Pickup — short cab left, open flat bed right — unmistakable */
const PickupIcon = (props) => (
  <svg viewBox="0 0 80 44" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" {...props}>
    {/* Cab */}
    <path d="M4 30 L4 20 L12 20 L20 10 L46 10 L46 30 Z" />
    {/* Bed walls */}
    <path d="M46 20 L74 20 L74 30 L46 30" />
    {/* Tailgate tick */}
    <line x1="72" y1="20" x2="72" y2="30" />
    <circle cx="18" cy="31" r="5.5" />
    <circle cx="60" cy="31" r="5.5" />
  </svg>
);

/** Van / MPV — cab-forward flat face, tall box, two side windows */
const VanIcon = (props) => (
  <svg viewBox="0 0 80 44" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" {...props}>
    <path d="M6 30 L6 8 L68 8 L74 18 L74 30 Z" />
    <rect x="10" y="13" width="18" height="11" rx="1.5" />
    <rect x="32" y="13" width="20" height="11" rx="1.5" />
    <circle cx="20" cy="31" r="5.5" />
    <circle cx="60" cy="31" r="5.5" />
  </svg>
);

/** Hatchback — compact, very steep rear hatch angle */
const HatchIcon = (props) => (
  <svg viewBox="0 0 80 44" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" {...props}>
    <path d="M8 30 L8 24 L18 24 L28 12 L56 12 L64 22 L64 24 L72 24 L72 30 Z" />
    <path d="M30 24 L36 14 L54 14 L62 24 Z" />
    <circle cx="22" cy="30" r="5" />
    <circle cx="58" cy="30" r="5" />
  </svg>
);

/** Luxury — very long, very low, elongated hood, fastback slope */
const LuxIcon = (props) => (
  <svg viewBox="0 0 80 44" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" strokeLinecap="round" {...props}>
    <path d="M2 30 L2 25 L10 25 L16 18 L54 18 L62 22 L78 22 L78 30 Z" />
    {/* Long hood */}
    <line x1="10" y1="25" x2="18" y2="20" />
    {/* Sloped fastback rear */}
    <path d="M26 25 L30 19 L52 19 L60 25 Z" />
    <circle cx="18" cy="30" r="4.5" />
    <circle cx="62" cy="30" r="4.5" />
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
