import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { formatPrice, carPlaceholder } from '../utils/format';

function Icon({ name, className = '', filled = false }) {
  return <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>;
}

const STAGES = [
  { key: 'saved', label: 'Saved', icon: 'bookmark', accent: 'text-on-surface-variant', dot: 'bg-on-surface-variant' },
  { key: 'inquired', label: 'Inquired', icon: 'forum', accent: 'text-primary', dot: 'bg-primary' },
  { key: 'test_drive', label: 'Test Drive', icon: 'directions_car', accent: 'text-secondary', dot: 'bg-secondary' },
  { key: 'negotiating', label: 'Negotiating', icon: 'handshake', accent: 'text-trust-emerald', dot: 'bg-trust-emerald' },
];
const ORDER = STAGES.map((s) => s.key);

export default function DealTracker() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ['deal-tracker'], queryFn: () => api.get('/deal-tracker').then((r) => r.data) });
  const cards = data || [];

  const move = useMutation({
    mutationFn: ({ id, stage }) => api.patch(`/deal-tracker/${id}`, { stage }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deal-tracker'] }),
  });
  const remove = useMutation({
    mutationFn: (id) => api.delete(`/deal-tracker/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['deal-tracker'] }),
  });

  const byStage = (key) => cards.filter((c) => c.stage === key);

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-xl pb-24">
        <div className="mb-lg">
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Deal Tracker</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Move the cars you're considering through to purchase. {cards.length} in your pipeline.</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-lg">
            {STAGES.map((s) => <div key={s.key} className="h-64 rounded-2xl border border-border-subtle bg-surface-container animate-pulse" />)}
          </div>
        ) : cards.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="view_kanban" className="text-6xl text-on-surface-variant/40 mb-3" />
            <p className="text-on-surface-variant mb-4">Your pipeline is empty. Add cars from any listing with "Track this car".</p>
            <Link to="/cars" className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md">Browse Cars</Link>
          </div>
        ) : (
          <div className="flex gap-lg overflow-x-auto pb-4 md:grid md:grid-cols-2 xl:grid-cols-4 hide-scrollbar">
            {STAGES.map((s, si) => {
              const col = byStage(s.key);
              return (
                <div key={s.key} className="shrink-0 w-[85vw] sm:w-72 md:w-auto">
                  <div className="flex items-center gap-2 mb-md px-1">
                    <span className={`w-2 h-2 rounded-full ${s.dot}`} />
                    <Icon name={s.icon} className={`text-[18px] ${s.accent}`} />
                    <h2 className="text-label-md font-bold text-on-surface">{s.label}</h2>
                    <span className="ml-auto text-label-sm text-on-surface-variant bg-surface-container rounded-full px-2 py-0.5">{col.length}</span>
                  </div>
                  <div className="space-y-md min-h-[80px] rounded-2xl bg-surface-container-low/50 border border-border-subtle p-md">
                    {col.length === 0 ? (
                      <p className="text-label-sm text-on-surface-variant/60 text-center py-6">Nothing here yet</p>
                    ) : (
                      col.map((card) => {
                        const l = card.listing || {};
                        const title = `${l.year || ''} ${l.make || ''} ${l.model || ''}`.trim();
                        const photo = l.photos?.[0]?.url || carPlaceholder(l.make);
                        return (
                          <div key={card.id} className="bg-surface-container-lowest border border-border-subtle rounded-xl overflow-hidden">
                            <Link to={`/cars/${card.listingId}`} className="block">
                              <div className="aspect-video w-full overflow-hidden bg-surface-container">
                                <img src={photo} alt={title} className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = carPlaceholder(l.make); }} />
                              </div>
                            </Link>
                            <div className="p-md space-y-2">
                              <Link to={`/cars/${card.listingId}`} className="block text-body-md font-bold text-on-surface hover:text-primary transition-colors line-clamp-1">{title || 'Listing'}</Link>
                              <p className="text-headline-sm font-bold text-primary">{l.price ? formatPrice(l.price) : '—'}</p>
                              <div className="flex items-center justify-between pt-1">
                                <div className="flex items-center gap-1">
                                  <button
                                    onClick={() => move.mutate({ id: card.id, stage: ORDER[si - 1] })}
                                    disabled={si === 0 || move.isLoading}
                                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Move back"
                                  ><Icon name="chevron_left" className="text-[20px]" /></button>
                                  <button
                                    onClick={() => move.mutate({ id: card.id, stage: ORDER[si + 1] })}
                                    disabled={si === ORDER.length - 1 || move.isLoading}
                                    className="p-1.5 rounded-lg text-on-surface-variant hover:bg-surface-container disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                    aria-label="Move forward"
                                  ><Icon name="chevron_right" className="text-[20px]" /></button>
                                </div>
                                <button onClick={() => remove.mutate(card.id)} className="p-1.5 rounded-lg text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors" aria-label="Remove">
                                  <Icon name="delete" className="text-[18px]" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
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
