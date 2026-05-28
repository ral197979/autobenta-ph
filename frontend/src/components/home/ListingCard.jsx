import { Link } from 'react-router-dom';
import { Heart, MapPin, Gauge, Fuel, Settings, ShieldCheck, BadgeCheck } from 'lucide-react';
import {
  formatPrice,
  formatMileage,
  TRANSMISSION_LABELS,
  FUEL_LABELS,
} from '../../utils/format';
import { estimateMonthly } from '../../data/mockListings';

export default function ListingCard({ listing }) {
  const photo =
    listing.photos?.[0]?.url ||
    `https://placehold.co/800x600/e2e8f0/334155?text=${encodeURIComponent(
      `${listing.make} ${listing.model}`,
    )}`;
  const inspected = listing.inspectionRequests?.some((r) => r.status === 'completed');
  const verified = listing.dealer?.isVerified;
  const monthly = estimateMonthly(listing.price);

  return (
    <Link
      to={`/cars/${listing.id}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-cardborder bg-white shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-softbg">
        <img
          src={photo}
          alt={`${listing.year} ${listing.make} ${listing.model}`}
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.target.src = `https://placehold.co/800x600/e2e8f0/334155?text=${encodeURIComponent(
              listing.make,
            )}`;
          }}
        />

        <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
          {verified && (
            <span className="inline-flex items-center gap-1 rounded-full bg-deepblue px-2 py-0.5 text-[11px] font-semibold text-white shadow">
              <BadgeCheck className="h-3 w-3" /> Verified
            </span>
          )}
          {inspected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[11px] font-semibold text-white shadow">
              <ShieldCheck className="h-3 w-3" /> Inspected
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
          }}
          aria-label="Save"
          className="absolute right-3 top-3 rounded-full bg-white/95 p-2 text-slatetext shadow-sm transition-colors hover:text-rose-500"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="mb-1 text-xs font-medium uppercase tracking-wide text-slatetext">
          {listing.year} {listing.bodyType || ''}
        </div>
        <h3 className="line-clamp-1 text-base font-semibold text-ink">
          {listing.make} {listing.model}
          {listing.variant && (
            <span className="font-normal text-slatetext"> {listing.variant}</span>
          )}
        </h3>

        <div className="mt-2 flex items-baseline gap-2">
          <p className="text-xl font-bold text-deepblue">{formatPrice(listing.price)}</p>
          <p className="text-xs text-slatetext">~ ₱{monthly.toLocaleString()}/mo</p>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slatetext">
          <div className="flex items-center gap-1">
            <Gauge className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{formatMileage(listing.mileage)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Settings className="h-3.5 w-3.5 shrink-0" />
            <span>{TRANSMISSION_LABELS[listing.transmission]}</span>
          </div>
          <div className="flex items-center gap-1">
            <Fuel className="h-3.5 w-3.5 shrink-0" />
            <span>{FUEL_LABELS[listing.fuelType]}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-cardborder pt-3">
          <div className="flex items-center gap-1 text-xs text-slatetext">
            <MapPin className="h-3.5 w-3.5" />
            <span className="truncate">{listing.city}</span>
          </div>
          <span className="text-xs font-semibold text-electric group-hover:underline">
            View details
          </span>
        </div>
      </div>
    </Link>
  );
}
