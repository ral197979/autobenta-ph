import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import ListingCard from './ListingCard';
import { MOCK_LISTINGS } from '../../data/mockListings';

export default function FeaturedListings() {
  const { data, isLoading } = useQuery({
    queryKey: ['featured-listings'],
    queryFn: () => api.get('/listings?sortBy=viewCount&sortOrder=desc').then((r) => r.data),
  });

  const apiListings = data?.listings || [];
  const listings = apiListings.length >= 4 ? apiListings.slice(0, 8) : MOCK_LISTINGS;

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-electric">
              Featured this week
            </p>
            <h2 className="mt-2 text-2xl font-bold text-ink sm:text-3xl">
              Hand-picked listings ready to inspect
            </h2>
            <p className="mt-1 text-sm text-slatetext">
              Verified sellers, transparent pricing, real photos.
            </p>
          </div>
          <Link
            to="/cars"
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
