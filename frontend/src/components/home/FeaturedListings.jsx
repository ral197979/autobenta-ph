import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import ListingCard from './ListingCard';
import { MOCK_LISTINGS } from '../../data/mockListings';
import useGeolocation from '../../hooks/useGeolocation';

export default function FeaturedListings() {
  const geo = useGeolocation();

  const queryUrl = geo.active
    ? `/listings?lat=${geo.lat}&lng=${geo.lng}&radius=150&sortBy=viewCount&sortOrder=desc`
    : '/listings?sortBy=viewCount&sortOrder=desc';

  const { data, isLoading } = useQuery({
    queryKey: ['featured-listings', geo.lat, geo.lng],
    queryFn: () => api.get(queryUrl).then((r) => r.data),
  });

  const apiListings = data?.listings || [];
  const seen = new Set();
  const deduped = apiListings.filter((l) => {
    const key = `${l.make}-${l.model}-${l.year}-${l.variant}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  const listings = deduped.length >= 4 ? deduped.slice(0, 6) : MOCK_LISTINGS.slice(0, 6);
  const nearby = geo.active;

  return (
    <section className="py-3xl bg-background">
      <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop">
        <div className="flex items-end justify-between mb-2xl gap-4">
          <div>
            <h2 className="text-headline-lg font-headline-lg text-primary mb-sm">
              {nearby ? 'Available near you' : 'Featured Listings'}
            </h2>
            <p className="text-on-surface-variant font-body-md text-body-md">
              {nearby
                ? `${deduped.length} verified vehicle${deduped.length !== 1 ? 's' : ''} within 150 km`
                : 'Hand-picked premium vehicles with full history reports.'}
            </p>
            {!nearby && !geo.error && (
              <button
                onClick={geo.request}
                disabled={geo.loading}
                className="mt-2 inline-flex items-center gap-1 rounded-full border border-primary/30 px-3 py-1 text-label-sm text-primary hover:bg-surface-container-low transition-colors disabled:opacity-60"
              >
                <span className="material-symbols-outlined text-[16px]">near_me</span>
                {geo.loading ? 'Locating…' : 'Show near me'}
              </button>
            )}
            {nearby && (
              <button onClick={geo.clear} className="mt-2 text-label-sm text-on-surface-variant underline hover:text-primary">
                Clear location
              </button>
            )}
          </div>
          <Link
            to={nearby ? `/cars?lat=${geo.lat}&lng=${geo.lng}&radius=150` : '/cars'}
            className="hidden md:flex items-center gap-2 border border-primary px-lg py-sm rounded-lg text-primary font-label-md text-label-md hover:bg-surface-container-low transition-colors"
          >
            View Marketplace <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-xl border border-border-subtle bg-surface-container-lowest overflow-hidden">
                <div className="h-60 bg-surface-container" />
                <div className="p-md space-y-3">
                  <div className="h-4 w-1/2 rounded bg-surface-container" />
                  <div className="h-3 w-3/4 rounded bg-surface-container" />
                  <div className="h-9 w-full rounded bg-surface-container" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}

        <div className="mt-2xl text-center md:hidden">
          <Link to="/cars" className="inline-flex items-center gap-2 text-primary font-label-md text-label-md">
            View Marketplace <span className="material-symbols-outlined">arrow_forward</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
