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
          {/* Outer wrapper — NO overflow-hidden so floating badges aren't clipped */}
          <div className="relative mx-auto w-full max-w-lg px-6 py-6">

            {/* Floating badge — top-left, outside card */}
            <div className="absolute left-0 top-2 z-20 flex items-center gap-2 rounded-xl border border-white/10 bg-white/95 px-3 py-2 text-ink shadow-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-xs font-semibold">Inspection-ready</p>
                <p className="text-[11px] text-slatetext">120-point check</p>
              </div>
            </div>

            {/* Card — overflow-hidden only here for border-radius clipping */}
            <div className="overflow-hidden rounded-2xl border border-cardborder bg-white shadow-2xl">

              {/* Image area — CSS gradient, never blank */}
              <div className="relative h-52 bg-gradient-to-br from-[#0f2744] via-[#1a3a6b] to-[#0B1220]">
                {/* Car silhouette SVG */}
                <svg viewBox="0 0 200 80" className="absolute inset-0 m-auto h-32 w-auto opacity-20" fill="currentColor" aria-hidden="true">
                  <path d="M170 48H30l5-18c2-7 8-12 15-14l30-6c4-1 8 0 11 3l14 10h20l18-6c5-2 10 0 13 4l9 12c3 2 5 5 5 9v6zm-140 0v8h12v-8zm108 0v8h12v-8z" className="text-white/40" />
                </svg>
                {/* Vehicle label */}
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-[11px] font-medium uppercase tracking-widest text-white/40">Featured listing</p>
                  <p className="mt-1 text-xl font-bold text-white/90">Toyota Fortuner</p>
                  <p className="text-xs text-accent font-semibold">2021 · Top of the line</p>
                </div>
                {/* Dark gradient overlay at bottom */}
                <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/50 to-transparent" />
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
