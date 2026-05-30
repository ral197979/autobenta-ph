import { Link } from 'react-router-dom';
import { ArrowRight, MapPin, Navigation } from 'lucide-react';
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
  const listings = deduped.length >= 4 ? deduped.slice(0, 8) : MOCK_LISTINGS;

  const nearbyCount = geo.active ? deduped.length : null;

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-electric">
              {geo.active ? 'Near you' : 'Featured this week'}
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
              {geo.active ? 'Cars available near your location' : 'Hand-picked listings ready to inspect'}
            </h2>
            <div className="mt-1 flex items-center gap-3">
              <p className="text-sm text-slatetext">
                {geo.active
                  ? `${nearbyCount ?? '...'} listing${nearbyCount !== 1 ? 's' : ''} within 150 km`
                  : 'Verified sellers, transparent pricing, real photos.'}
              </p>
              {!geo.active && !geo.error && (
                <button
                  onClick={geo.request}
                  disabled={geo.loading}
                  className="inline-flex items-center gap-1 rounded-full border border-electric/40 bg-electric/5 px-3 py-1 text-xs font-semibold text-electric transition-colors hover:bg-electric/10 disabled:opacity-60"
                >
                  <Navigation className="h-3 w-3" />
                  {geo.loading ? 'Locating…' : 'Show near me'}
                </button>
              )}
              {geo.active && (
                <button
                  onClick={geo.clear}
                  className="text-xs text-slatetext underline hover:text-ink"
                >
                  Clear location
                </button>
              )}
            </div>
          </div>
          <Link
            to={geo.active ? `/cars?lat=${geo.lat}&lng=${geo.lng}&radius=150` : '/cars'}
            className="hidden items-center gap-1 text-sm font-semibold text-deepblue hover:text-ink sm:inline-flex"
          >
            View all listings <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse overflow-hidden rounded-2xl border border-cardborder bg-white"
              >
                <div className="aspect-[4/3] bg-softbg" />
                <div className="space-y-2 p-4">
                  <div className="h-3 w-1/2 rounded bg-softbg" />
                  <div className="h-4 w-3/4 rounded bg-softbg" />
                  <div className="h-5 w-1/3 rounded bg-softbg" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}

        <div className="mt-8 text-center sm:hidden">
          <Link
            to="/cars"
            className="inline-flex items-center gap-1 text-sm font-semibold text-deepblue"
          >
            View all listings <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
