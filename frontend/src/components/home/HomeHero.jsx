import { ShieldCheck, BadgeCheck, Sparkles } from 'lucide-react';
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

        {/* Right: car showcase */}
        <div className="relative hidden lg:col-span-5 lg:block">
          <div className="relative mx-auto aspect-[5/4] w-full max-w-lg">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-deepblue/40 via-electric/20 to-transparent blur-2xl" />
            <img
              src="https://placehold.co/1000x800/0B1220/FACC15?text=AutoBentaPH"
              alt="Featured car"
              className="relative h-full w-full rounded-3xl border border-white/10 object-cover shadow-2xl"
            />

            {/* Floating badges */}
            <div className="absolute -left-6 top-6 flex items-center gap-2 rounded-xl border border-white/10 bg-white/95 px-3 py-2 text-ink shadow-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-xs font-semibold">Inspection-ready</p>
                <p className="text-[11px] text-slatetext">120-point check</p>
              </div>
            </div>

            <div className="absolute -right-4 bottom-8 flex items-center gap-2 rounded-xl border border-white/10 bg-white/95 px-3 py-2 text-ink shadow-xl">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-deepblue">
                <BadgeCheck className="h-4 w-4" />
              </div>
              <div className="leading-tight">
                <p className="text-xs font-semibold">Verified seller</p>
                <p className="text-[11px] text-slatetext">DTI registered</p>
              </div>
            </div>

            <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 rounded-xl border border-white/10 bg-ink/90 px-4 py-2 text-white shadow-xl backdrop-blur">
              <p className="text-[11px] text-white/60">Fair price estimate</p>
              <p className="text-sm font-bold text-accent">₱748,000 · Great deal</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
