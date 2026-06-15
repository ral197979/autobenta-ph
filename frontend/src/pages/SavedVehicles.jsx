import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { formatPrice, formatMileage, TRANSMISSION_LABELS, photoOrFallback } from '../utils/format';

function Icon({ name, className = '', filled = false }) {
  return <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>;
}

export default function SavedVehicles() {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: favorites, isLoading } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.get('/favorites').then(r => r.data),
  });

  const unsave = useMutation({
    mutationFn: (listingId) => api.delete(`/favorites/${listingId}`),
    onMutate: async (listingId) => {
      await qc.cancelQueries({ queryKey: ['favorites'] });
      const prev = qc.getQueryData(['favorites']);
      qc.setQueryData(['favorites'], (old) => (old || []).filter((f) => f.listingId !== listingId));
      return { prev };
    },
    onError: (_e, _id, ctx) => ctx?.prev && qc.setQueryData(['favorites'], ctx.prev),
  });

  const items = favorites || [];
  const ids = items.map((f) => f.listingId).filter(Boolean);

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-lg">
        {/* Header bar */}
        <div className="flex justify-between items-center mb-lg gap-4">
          <div>
            <h1 className="text-headline-lg font-headline-lg text-on-surface">Saved Vehicles</h1>
            <p className="font-label-md text-on-surface-variant mt-1">
              {isLoading ? 'Loading…' : `${items.length} vehicle${items.length === 1 ? '' : 's'} saved`}
            </p>
          </div>
          {ids.length >= 2 && (
            <button
              onClick={() => navigate(`/compare?ids=${ids.slice(0, 3).join(',')}`)}
              className="flex items-center gap-xs px-md py-sm bg-primary text-on-primary rounded-lg font-label-md hover:opacity-90 transition-all"
            >
              <Icon name="compare_arrows" className="text-[18px]" />
              <span className="hidden md:inline">Compare</span>
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border-subtle bg-surface-container-lowest overflow-hidden animate-pulse">
                <div className="h-56 bg-surface-container" />
                <div className="p-md space-y-3"><div className="h-4 bg-surface-container rounded w-2/3" /><div className="h-9 bg-surface-container rounded" /></div>
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="favorite" className="text-6xl text-on-surface-variant/40 mb-3" />
            <p className="text-on-surface-variant text-body-lg mb-4">You haven't saved any vehicles yet.</p>
            <Link to="/cars" className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md">Browse Cars</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {items.map((f) => {
              const l = f.listing || {};
              const certified = l.inspectionRequests?.some((r) => r.status === 'completed') || l.dealer?.isVerified;
              const saved = Number(f.priceWhenSaved);
              const drop = f.priceWhenSaved && l.price != null && Number(l.price) < saved ? saved - Number(l.price) : 0;
              return (
                <div key={f.id} className="group bg-surface-container-lowest rounded-xl border border-border-subtle shadow-sm overflow-hidden transition-all hover:shadow-lg">
                  <div className="relative h-56 w-full">
                    <Link to={`/cars/${f.listingId}`}>
                      <img src={photoOrFallback(l.photos?.[0]?.url, l.make)} alt={`${l.year} ${l.make} ${l.model}`} className="w-full h-full object-cover" />
                    </Link>
                    {(drop > 0 || certified) && (
                      <div className="absolute top-md left-md flex flex-col gap-1.5 items-start">
                        {drop > 0 && (
                          <span className="bg-error text-white text-label-sm font-bold px-sm py-1 rounded-full flex items-center gap-xs shadow">
                            <Icon name="trending_down" className="text-[14px]" /> Price dropped {formatPrice(drop)}
                          </span>
                        )}
                        {certified && (
                          <span className="bg-trust-emerald text-white text-label-sm font-label-md px-sm py-1 rounded-full flex items-center gap-xs">
                            <Icon name="verified" className="text-[14px]" filled /> Ryderr Certified
                          </span>
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => unsave.mutate(f.listingId)}
                      aria-label="Remove from saved"
                      className="absolute top-md right-md w-10 h-10 bg-white/90 rounded-full flex items-center justify-center text-error transition-transform active:scale-90 shadow-sm hover:scale-105"
                    >
                      <Icon name="favorite" filled />
                    </button>
                  </div>
                  <div className="p-md">
                    <div className="flex justify-between items-start mb-xs gap-2">
                      <h3 className="font-headline-sm text-headline-sm text-primary line-clamp-1">{l.year} {l.make} {l.model}</h3>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="font-headline-sm text-headline-sm text-primary whitespace-nowrap">{formatPrice(l.price)}</span>
                        {drop > 0 && <span className="text-label-sm text-on-surface-variant/70 line-through whitespace-nowrap">{formatPrice(saved)}</span>}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-sm mb-lg">
                      <span className="flex items-center gap-xs text-on-surface-variant text-label-sm"><Icon name="speed" className="text-[16px]" /> {formatMileage(l.mileage)}</span>
                      {l.transmission && <span className="flex items-center gap-xs text-on-surface-variant text-label-sm"><Icon name="settings_input_component" className="text-[16px]" /> {TRANSMISSION_LABELS[l.transmission] || l.transmission}</span>}
                      {l.city && <span className="flex items-center gap-xs text-on-surface-variant text-label-sm"><Icon name="location_on" className="text-[16px]" /> {l.city}</span>}
                    </div>
                    <div className="grid grid-cols-2 gap-sm">
                      <Link to={`/compare?ids=${f.listingId}`} className="py-sm border border-primary text-primary text-center rounded-lg font-label-md hover:bg-surface-container-low transition-colors">Compare</Link>
                      <Link to={`/cars/${f.listingId}`} className="py-sm bg-primary text-on-primary text-center rounded-lg font-label-md hover:opacity-90 transition-all">View Details</Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
