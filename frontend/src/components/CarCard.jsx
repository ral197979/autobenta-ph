import { Link } from 'react-router-dom';
import { useState } from 'react';
import {
  formatPrice,
  formatMileage,
  TRANSMISSION_LABELS,
  FUEL_LABELS,
  SELLER_TYPE_LABELS,
} from '../utils/format';
import api from '../api/client';

const carPlaceholder = (text) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="280"><rect fill="#1e293b" width="400" height="280"/><text fill="#64748b" font-family="sans-serif" font-size="16" font-weight="500" text-anchor="middle" x="200" y="148">${text}</text></svg>`;
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

function Icon({ name, className = '', filled = false }) {
  return (
    <span
      className={`material-symbols-outlined ${className}`}
      style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}
    >
      {name}
    </span>
  );
}

export default function CarCard({ listing, onFavoriteToggle }) {
  const [favorited, setFavorited] = useState(listing.isFavorited || false);
  const primaryPhoto = listing.photos?.[0]?.url || carPlaceholder(`${listing.make} ${listing.model}`);
  const certified = listing.inspectionRequests?.some((r) => r.status === 'completed') || listing.dealer?.isVerified;

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (favorited) await api.delete(`/favorites/${listing.id}`);
      else await api.post(`/favorites/${listing.id}`);
      setFavorited(!favorited);
      onFavoriteToggle?.(!favorited);
    } catch {
      // ignore auth errors silently
    }
  };

  return (
    <Link
      to={`/cars/${listing.id}`}
      className="group bg-surface-container border border-border-subtle rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 flex flex-col"
    >
      <div className="relative h-56 overflow-hidden">
        <img
          src={primaryPhoto}
          alt={`${listing.year} ${listing.make} ${listing.model}`}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          onError={(e) => { e.target.onerror = null; e.target.src = carPlaceholder(listing.make); }}
        />
        {certified ? (
          <div className="absolute top-md left-md bg-trust-emerald text-white px-md py-xs rounded-full flex items-center gap-xs shadow-lg">
            <Icon name="verified" className="text-[16px]" filled />
            <span className="text-[10px] font-bold uppercase tracking-wider">Ryderr Certified</span>
          </div>
        ) : listing.sellerType ? (
          <div className="absolute top-md left-md bg-primary-container text-on-primary px-md py-xs rounded-full text-[10px] font-bold uppercase tracking-wider shadow-lg">
            {SELLER_TYPE_LABELS[listing.sellerType]}
          </div>
        ) : null}

        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center gap-md">
          <span className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center transform scale-90 group-hover:scale-100 duration-300 shadow-xl">
            <Icon name="visibility" />
          </span>
          <button
            onClick={handleFavorite}
            aria-label="Save vehicle"
            className={`w-12 h-12 rounded-full bg-white flex items-center justify-center transform scale-90 group-hover:scale-100 duration-300 shadow-xl delay-75 ${favorited ? 'text-error' : 'text-black hover:text-primary'}`}
          >
            <Icon name="favorite" filled={favorited} />
          </button>
        </div>
      </div>

      <div className="p-lg flex flex-col gap-md flex-1">
        <div className="flex flex-col">
          <h3 className="text-headline-sm font-bold text-on-surface group-hover:text-primary transition-colors line-clamp-1">
            {listing.year} {listing.make} {listing.model}
          </h3>
          {listing.variant && (
            <p className="text-label-sm text-on-surface-variant uppercase tracking-widest line-clamp-1">{listing.variant}</p>
          )}
        </div>

        <div className="flex items-center justify-between border-y border-border-subtle/60 py-sm">
          <div className="flex flex-col items-center gap-xs">
            <Icon name="speed" className="text-primary" />
            <span className="text-[12px] font-medium text-on-surface">{formatMileage(listing.mileage)}</span>
          </div>
          <div className="flex flex-col items-center gap-xs">
            <Icon name="settings_input_component" className="text-primary" />
            <span className="text-[12px] font-medium text-on-surface">{TRANSMISSION_LABELS[listing.transmission] || '—'}</span>
          </div>
          <div className="flex flex-col items-center gap-xs">
            <Icon name="local_gas_station" className="text-primary" />
            <span className="text-[12px] font-medium text-on-surface">{FUEL_LABELS[listing.fuelType] || '—'}</span>
          </div>
        </div>

        <div className="flex items-center justify-between mt-auto">
          <span className="text-headline-sm font-bold text-primary">{formatPrice(listing.price)}</span>
          <span className="flex items-center gap-1 text-label-sm text-on-surface-variant">
            <Icon name="location_on" className="text-[16px]" />
            <span className="truncate max-w-[90px]">{listing.city}</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
