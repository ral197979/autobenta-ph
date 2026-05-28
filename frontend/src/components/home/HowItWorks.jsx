import { Search, GitCompareArrows, CalendarCheck, Handshake } from 'lucide-react';

const STEPS = [
  {
    Icon: Search,
    title: 'Search',
    desc: 'Filter by budget, body type, mileage, transmission, and city.',
  },
  {
    Icon: GitCompareArrows,
    title: 'Compare',
    desc: 'Stack listings side-by-side with photos, specs, and fair price scores.',
  },
  {
    Icon: CalendarCheck,
    title: 'Book inspection',
    desc: 'Schedule a 120-point inspection at a partner bay near the seller.',
  },
  {
    Icon: Handshake,
    title: 'Connect & close',
    desc: 'Message the seller, settle financing, and complete the LTO transfer.',
  },
];

export default function HowItWorks() {
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-12 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-electric">
            How it works
          </p>
          <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
            Four clear steps from browsing to keys in hand
          </h2>
        </div>

        <div className="relative">
          {/* Connector line on large screens */}
          <div
            aria-hidden
            className="absolute left-0 right-0 top-12 hidden h-px bg-gradient-to-r from-transparent via-cardborder to-transparent lg:block"
          />

          <ol className="relative grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {STEPS.map(({ Icon, title, desc }, i) => (
              <li
                key={title}
                className="relative rounded-2xl border border-cardborder bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-deepblue text-white shadow-lg shadow-deepblue/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-bold uppercase tracking-wider text-accent">
                    Step {String(i + 1).padStart(2, '0')}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-ink">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slatetext">{desc}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
