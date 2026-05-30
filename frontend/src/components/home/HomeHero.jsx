import { ShieldCheck, Sparkles, MapPin, Gauge } from 'lucide-react';
import SearchPanel from './SearchPanel';

export default function HomeHero() {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      {/* Background gradient + grid glow */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full bg-deepblue/40 blur-3xl" />
        <div className="absolute -right-20 top-1/3 h-96 w-96 rounded-full bg-electric/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(37,99,235,0.18),transparent_55%)]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:py-20">
        {/* Left */}
        <div className="lg:col-span-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs font-medium text-white/80 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 text-accent" />
            Verified listings · Brand new &amp; used · Fair price AI
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            The smarter way to buy a
            <br />
            <span className="text-accent">brand new or used car</span> in the Philippines.
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70 sm:text-lg">
            Browse brand new dealer units and inspection-ready used cars from verified
            sellers across Metro Manila, Cebu, Davao and beyond. Compare, inspect, and
            drive home with confidence.
          </p>

          <div className="mt-8">
            <SearchPanel />
          </div>

          <dl className="mt-8 grid max-w-lg grid-cols-3 gap-6">
            {[
              { v: '12,000+', l: 'Active listings' },
              { v: '180+', l: 'Verified dealers' },
              { v: '60+', l: 'Cities covered' },
            ].map((s) => (
              <div key={s.l}>
                <dt className="text-2xl font-bold text-white">{s.v}</dt>
                <dd className="text-xs text-white/60">{s.l}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Right: listing cards */}
        <div className="hidden lg:col-span-5 lg:flex lg:flex-col lg:justify-center lg:gap-3">

          {[
            {
              year: 2021, make: 'Toyota', model: 'Fortuner',
              variant: '2.4 V Diesel 4x2 AT',
              price: '1,780,000',
              city: 'Makati City', km: '35,000',
              photo: 'https://upload.wikimedia.org/wikipedia/commons/d/d5/2022_Toyota_Fortuner_2.8_VRZ_GR_Sport_4x2_GUN166R_%2820220428%29.jpg',
              badges: ['Verified', 'Financing'],
            },
            {
              year: 2020, make: 'Honda', model: 'CR-V',
              variant: '1.5 Turbo Prestige 4x2 CVT',
              price: '1,250,000',
              city: 'Quezon City', km: '42,000',
              photo: 'https://upload.wikimedia.org/wikipedia/commons/1/10/2021_Honda_CR-V_1.5_Turbo_Prestige_%28front_left%29%2C_Central_Surabaya.jpg',
              badges: ['Verified', 'Inspection-ready'],
            },
            {
              year: 2022, make: 'Mitsubishi', model: 'Montero Sport',
              variant: 'GLS Premium 4x2 AT',
              price: '1,950,000',
              city: 'BGC, Taguig', km: '18,000',
              photo: 'https://upload.wikimedia.org/wikipedia/commons/7/7b/2021_Mitsubishi_Montero_Sport_Limited_%28cropped%29.jpg',
              badges: ['Verified', 'Financing'],
            },
          ].map((car) => (
            <a
              key={car.model}
              href="#"
              className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur transition hover:bg-white/10"
            >
              {/* Real car photo thumbnail */}
              <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl">
                <img
                  src={car.photo}
                  alt={`${car.year} ${car.make} ${car.model}`}
                  className="h-full w-full object-cover"
                />
              </div>

              {/* Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">
                      {car.year} {car.make} {car.model}
                    </p>
                    <p className="truncate text-[11px] text-white/50">{car.variant}</p>
                  </div>
                  <p className="shrink-0 text-sm font-bold text-accent">&#x20B1;{car.price}</p>
                </div>

                <div className="mt-1.5 flex items-center gap-3 text-[11px] text-white/50">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 shrink-0" />{car.city}
                  </span>
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3 w-3 shrink-0" />{car.km} km
                  </span>
                </div>

                <div className="mt-2 flex gap-1.5">
                  {car.badges.map((b) => (
                    <span key={b} className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/70">
                      <ShieldCheck className="h-2.5 w-2.5 shrink-0" />{b}
                    </span>
                  ))}
                </div>
              </div>
            </a>
          ))}

          <a href="#" className="mt-1 text-center text-xs font-medium text-white/40 hover:text-white/70 transition-colors">
            View all 12,000+ listings &rarr;
          </a>

        </div>
      </div>
    </section>
  );
}
