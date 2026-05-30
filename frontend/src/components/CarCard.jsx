import { Link } from 'react-router-dom';
import { Heart, MapPin, Gauge, Fuel, Settings, CheckCircle } from 'lucide-react';
import { formatPrice, formatMileage, TRANSMISSION_LABELS, FUEL_LABELS, CONDITION_COLORS, CONDITION_LABELS, SELLER_TYPE_LABELS } from '../utils/format';
import TrustBadges from './TrustBadges';
import api from '../api/client';
import { useState } from 'react';

export default function CarCard({ listing, onFavoriteToggle }) {
  const [favorited, setFavorited] = useState(listing.isFavorited || false);

  const primaryPhoto = listing.photos?.[0]?.url || `https://placehold.co/400x280/e2e8f0/64748b?text=${encodeURIComponent(listing.make + ' ' + listing.model)}`;

  const handleFavorite = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (favorited) {
        await api.delete(`/favorites/${listing.id}`);
      } else {
        await api.post(`/favorites/${listing.id}`);
      }
      setFavorited(!favorited);
      onFavoriteToggle?.(!favorited);
    } catch {
      // ignore auth errors silently
    }
  };

  return (
    <Link to={`/cars/${listing.id}`} className="card group hover:shadow-md transition-all duration-200 overflow-hidden flex flex-col">
      <div className="relative overflow-hidden aspect-[4/3] bg-gray-100">
        <img
          src={primaryPhoto}
          alt={`${listing.year} ${listing.make} ${listing.model}`}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={e => { e.target.src = `https://placehold.co/400x280/e2e8f0/64748b?text=${encodeURIComponent(listing.make)}`; }}
        />
        <button
          onClick={handleFavorite}
          className={`absolute top-2 right-2 p-2 rounded-full bg-white/90 backdrop-blur-sm shadow transition-colors ${favorited ? 'text-red-500' : 'text-gray-400 hover:text-red-400'}`}
        >
          <Heart className={`w-4 h-4 ${favorited ? 'fill-current' : ''}`} />
        </button>
        {listing.sellerType && (
          <div className={`absolute top-2 left-2 badge text-xs ${listing.sellerType === 'dealer' ? 'bg-blue-600 text-white' : listing.sellerType === 'repossessed' ? 'bg-orange-600 text-white' : 'bg-gray-600 text-white'}`}>
            {SELLER_TYPE_LABELS[listing.sellerType]}
          </div>
        )}
        {listing.inspectionRequests?.some(r => r.status === 'completed') && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 bg-green-600 text-white text-xs px-2 py-1 rounded-full">
            <CheckCircle className="w-3 h-3" /> Inspected
          </div>
        )}
      </div>

      <div className="p-4 flex flex-col flex-1">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-gray-900 text-sm leading-tight line-clamp-1">
            {listing.year} {listing.make} {listing.model}
            {listing.variant && <span className="text-gray-500 font-normal"> {listing.variant}</span>}
          </h3>
          <span className={`badge shrink-0 ${CONDITION_COLORS[listing.condition]}`}>{CONDITION_LABELS[listing.condition]}</span>
        </div>

        <p className="text-xl font-bold text-primary-700 mb-3">{formatPrice(listing.price)}</p>

        <div className="grid grid-cols-3 gap-1 text-xs text-gray-500 mb-3">
          <div className="flex items-center gap-1"><Gauge className="w-3 h-3 shrink-0" /><span className="truncate">{formatMileage(listing.mileage)}</span></div>
          <div className="flex items-center gap-1"><Fuel className="w-3 h-3 shrink-0" /><span>{FUEL_LABELS[listing.fuelType]}</span></div>
          <div className="flex items-center gap-1"><Settings className="w-3 h-3 shrink-0" /><span>{TRANSMISSION_LABELS[listing.transmission]}</span></div>
        </div>

        <div className="mt-auto space-y-2">
          <TrustBadges listing={listing} size="xs" maxCount={3} />
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate">{listing.city}</span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
