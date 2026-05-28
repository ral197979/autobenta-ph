import { ShieldCheck, BadgeCheck, Sparkles, MapPin, Gauge, Zap, CreditCard } from 'lucide-react';
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
            Verified listings · Real PH inspections · Fair price AI
          </div>
          <h1 className="mt-5 text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            The smarter way to buy
            <br />
            a <span className="text-accent">used car</span> in the Philippines.
          </h1>
          <p className="mt-4 max-w-xl text-base text-white/70 sm:text-lg">
            Browse thousands of inspection-ready cars from verified sellers across Metro
            Manila, Cebu, Davao and beyond. Compare, book an inspection, and close with
            confidence.
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

        {/* Right: featured car listing card */}
        <div className="relative hidden lg:col-span-5 lg:block">
          <div className="relative mx-auto w-full max-w-lg overflow-hidden">

            {/* Floating badge — top-left */}
            <div className="absolute -left-4 top-4 z-20 flex items-center gap-2 rounded-xl border border-white/10 bg-white/95 px-3 py-2 text-ink shadow-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-xs font-semibold">Inspection-ready</p>
                <p className="text-[11px] text-slatetext">120-point check</p>
              </div>
            </div>

            {/* Card */}
            <div className="rounded-2xl border border-cardborder bg-white shadow-2xl overflow-hidden">

              {/* Image area */}
              <div className="relative h-52">
                <img
                  src="https://placehold.co/800x500/1e3a5f/e2e8f0?text=2021+Toyota+Fortuner"
                  alt="2021 Toyota Fortuner"
                  className="h-full w-full object-cover"
                  onError={(e) => {
                    e.currentTarget.src =
                      'https://placehold.co/800x500/0B1220/FACC15?text=Featured+Vehicle';
                  }}
                />
                {/* Dark gradient overlay at bottom of image */}
                <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/60 to-transparent" />
              </div>

              {/* Card body */}
              <div className="p-5">

                {/* Title + price */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="text-base font-bold text-ink leading-snug">
                      2021 Toyota Fortuner
                    </h3>
                    <p className="text-xs text-slatetext mt-0.5">2.4 V Diesel 4x2 AT</p>
                  </div>
                  <p className="text-lg font-bold text-ink whitespace-nowrap">&#x20B1;1,780,000</p>
                </div>

                {/* Meta row */}
                <div className="mt-3 flex items-center gap-4 text-xs text-slatetext">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />
                    Makati City
                  </span>
                  <span className="flex items-center gap-1">
                    <Gauge className="h-3.5 w-3.5 shrink-0" />
                    35,000 km
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 shrink-0" />
                    Automatic
                  </span>
                  <span>Diesel</span>
                </div>

                {/* Badge pills */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="h-3 w-3 shrink-0" />
                    Verified
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-deepblue border border-blue-200">
                    <BadgeCheck className="h-3 w-3 shrink-0" />
                    Inspection-ready
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-medium text-amber-700 border border-amber-200">
                    <CreditCard className="h-3 w-3 shrink-0" />
                    Financing
                  </span>
                </div>

                {/* Monthly estimate */}
                <p className="mt-3 text-xs text-slatetext">
                  ~&#x20B1;29,700/mo &middot; 60 months
                </p>

                {/* CTA */}
                <a
                  href="#"
                  className="mt-4 flex w-full items-center justify-center rounded-xl bg-electric px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-deepblue transition-colors"
                >
                  View listing &rarr;
                </a>
              </div>
            </div>

            {/* Floating badge — bottom-right */}
            <div className="absolute -right-4 bottom-4 z-20 flex items-center gap-2 rounded-xl border border-white/10 bg-white/95 px-3 py-2 text-ink shadow-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-deepblue">
                <BadgeCheck className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-xs font-semibold">Verified seller</p>
                <p className="text-[11px] text-slatetext">DTI registered</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}
