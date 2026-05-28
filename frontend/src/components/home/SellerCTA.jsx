import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

const PERKS = [
  'Free listing for private sellers',
  'AI listing wizard fills the details for you',
  'Reach 200,000+ monthly buyers nationwide',
  'Verified-seller badge boosts response rate',
];

export default function SellerCTA() {
  return (
    <section className="bg-softbg">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-ink via-deepblue to-electric p-8 text-white shadow-xl sm:p-12 lg:p-16">
          <div
            aria-hidden
            className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-accent/20 blur-3xl"
          />
          <div
            aria-hidden
            className="absolute -bottom-20 -left-10 h-72 w-72 rounded-full bg-electric/40 blur-3xl"
          />

          <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent">
                Sell your car
              </p>
              <h2 className="mt-3 text-3xl font-bold leading-tight sm:text-4xl">
                List in under 5 minutes.
                <br />
                Get serious buyers, not lowballers.
              </h2>
              <p className="mt-4 max-w-lg text-sm text-white/80 sm:text-base">
                Our AI wizard drafts your listing from photos and OR/CR. We screen buyers,
                you keep 100% of the sale.
              </p>

              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Link
                  to="/register"
                  className="inline-flex items-center gap-2 rounded-xl bg-accent px-5 py-3 text-sm font-bold text-ink shadow-lg transition-transform hover:-translate-y-0.5 hover:shadow-xl"
                >
                  List your car <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  to="/financing"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/20 bg-white/5 px-5 py-3 text-sm font-semibold text-white backdrop-blur-sm transition-colors hover:bg-white/10"
                >
                  Get a price estimate
                </Link>
              </div>
            </div>

            <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {PERKS.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-3 rounded-xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm"
                >
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                  <span className="text-sm leading-snug text-white/90">{p}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
