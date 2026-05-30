import { Link } from 'react-router-dom';

// Wikimedia Commons — free, model-specific car photos per body type
const TYPES = [
  {
    label: 'Sedan',
    count: '2,400+ listings',
    query: 'bodyType=Sedan',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/c/c6/2019_Honda_City_RS.jpg',
  },
  {
    label: 'SUV',
    count: '3,100+ listings',
    query: 'bodyType=SUV',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/2022_Toyota_Fortuner_2.8_VRZ_GR_Sport_4x2_GUN166R_%2820220428%29.jpg',
  },
  {
    label: 'Pickup',
    count: '1,800+ listings',
    query: 'bodyType=Pickup',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/5/58/Ford_Ranger_Wildtrak_%28T6%2C_P375%29_1X7A6170.jpg',
  },
  {
    label: 'Van / MPV',
    count: '1,200+ listings',
    query: 'bodyType=Van',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/0/09/00_hyundai_starex_van_1_%28cropped%29.jpg',
  },
  {
    label: 'Hatchback',
    count: '900+ listings',
    query: 'bodyType=Hatchback',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/3/3e/2020_Toyota_Yaris_Design_HEV_CVT_1.5_Front.jpg',
  },
  {
    label: 'Luxury',
    count: '300+ listings',
    query: 'bodyType=Luxury',
    photo: 'https://upload.wikimedia.org/wikipedia/commons/6/6b/2022_Lexus_ES_1.jpg',
  },
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
          {TYPES.map(({ label, count, photo, query }) => (
            <Link
              key={label}
              to={`/cars?${query}`}
              className="group relative overflow-hidden rounded-2xl shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              {/* Photo */}
              <div className="aspect-[4/3] overflow-hidden">
                <img
                  src={photo}
                  alt={label}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
              </div>
              {/* Gradient overlay + label */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 p-3">
                <p className="text-sm font-bold text-white leading-tight">{label}</p>
                <p className="text-xs text-white/70">{count}</p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
