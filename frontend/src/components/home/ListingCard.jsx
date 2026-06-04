import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  formatPrice,
  formatMileage,
  TRANSMISSION_LABELS,
  FUEL_LABELS,
} from '../../utils/format';

// Deterministic gradient per make so each brand has a consistent swatch when a
// photo is missing.
const MAKE_GRADIENT = {
  Toyota:     'from-[#0f2744] via-[#1a3a6b] to-[#0B1220]',
  Honda:      'from-[#1a0a0a] via-[#5c1a1a] to-[#0B1220]',
  Mitsubishi: 'from-[#1a0a2e] via-[#3b1f6b] to-[#0B1220]',
  Nissan:     'from-[#0a1a2e] via-[#1a3a5c] to-[#0B1220]',
  Ford:       'from-[#0a1f1a] via-[#0f4a3a] to-[#0B1220]',
  Suzuki:     'from-[#1f1a0a] via-[#4a3a0f] to-[#0B1220]',
  Hyundai:    'from-[#0a1f2e] via-[#0f4a6b] to-[#0B1220]',
  Isuzu:      'from-[#1f0a0a] via-[#5c1f1a] to-[#0B1220]',
};
const gradientFor = (make) =>
  MAKE_GRADIENT[make] || 'from-[#0f1f2e] via-[#1a3a5c] to-[#0B1220]';

const isPlaceholder = (url) => !url || url.includes('placehold.co');

function FilledIcon({ name, className = '' }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={{ fontVariationSettings: "'FILL' 1" }}
    >
      {name}
    </span>
  );
}

export default function ListingCard({ listing }) {
  const rawPhoto = listing.photos?.[0]?.url;
  const [imgError, setImgError] = useState(false);
  const [saved, setSaved] = useState(false);
  const showGradient = isPlaceholder(rawPhoto) || imgError;

  const isNew = listing.condition === 'brand_new';
  const inspected = !isNew && listing.inspectionRequests?.some((r) => r.status === 'completed');
  const verified = listing.dealer?.isVerified;
  const km = isNew ? '0 KM' : formatMileage(listing.mileage);

  return (
    <Link
      to={`/cars/${listing.id}`}
      className="group bg-surface-container-lowest rounded-xl overflow-hidden border border-border-subtle hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1 flex flex-col"
    >
      <div className="relative h-60 overflow-hidden">
        {showGradient ? (
          <div className={`h-full w-full bg-gradient-to-br ${gradientFor(listing.make)} flex flex-col items-center justify-center gap-1`}>
            <p className="text-label-sm uppercase tracking-widest text-white/40">{listing.year} {listing.bodyType}</p>
            <p className="text-headline-sm font-bold text-white/90">{listing.make} {listing.model}</p>
          </div>
        ) : (
          <img
            src={rawPhoto}
            alt={`${listing.year} ${listing.make} ${listing.model}`}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            onError={() => setImgError(true)}
          />
        )}

        <div className="absolute top-4 left-4 flex gap-2">
          {(verified || inspected) && (
            <span className="bg-trust-emerald text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              <FilledIcon name="verified" className="text-[12px]" />
              CERTIFIED
            </span>
          )}
          {isNew && (
            <span className="bg-alert-orange text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1 shadow-sm">
              NEW
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setSaved((s) => !s);
          }}
          aria-label="Save vehicle"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/40 transition-colors"
        >
          {saved ? <FilledIcon name="favorite" className="text-sm" /> : <span className="material-symbols-outlined text-sm">favorite</span>}
        </button>
      </div>

      <div className="p-md flex flex-1 flex-col">
        <div className="flex justify-between items-start mb-2 gap-2">
          <h3 className="text-headline-sm font-headline-sm text-primary line-clamp-1">
            {listing.make} {listing.model}
          </h3>
          <span className="text-headline-sm font-headline-sm text-primary whitespace-nowrap">
            {formatPrice(listing.price)}
          </span>
        </div>
        <p className="text-on-surface-variant font-body-sm text-body-sm mb-md">
          {listing.year}
          {listing.variant ? ` • ${listing.variant}` : ''} • {km}
        </p>
        <div className="flex gap-2 flex-wrap mb-lg">
          {listing.transmission && (
            <span className="bg-surface-container-low px-2 py-1 rounded text-label-sm font-label-sm text-on-secondary-fixed-variant">
              {TRANSMISSION_LABELS[listing.transmission] || listing.transmission}
            </span>
          )}
          {listing.fuelType && (
            <span className="bg-surface-container-low px-2 py-1 rounded text-label-sm font-label-sm text-on-secondary-fixed-variant">
              {FUEL_LABELS[listing.fuelType] || listing.fuelType}
            </span>
          )}
          {listing.city && (
            <span className="bg-surface-container-low px-2 py-1 rounded text-label-sm font-label-sm text-on-secondary-fixed-variant">
              {listing.city}
            </span>
          )}
        </div>
        <span className="mt-auto block w-full text-center bg-primary-container text-white py-sm rounded-lg font-label-md text-label-md group-hover:bg-primary transition-colors">
          View Details
        </span>
      </div>
    </Link>
  );
}
