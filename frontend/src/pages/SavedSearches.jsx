import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { formatPrice } from '../utils/format';

function Icon({ name, className = '', filled = false }) {
  return <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>;
}

function summarize(f = {}) {
  const parts = [];
  if (f.make) parts.push(f.make);
  if (f.model) parts.push(f.model);
  if (f.bodyType) parts.push(f.bodyType);
  if (f.fuelType) parts.push(f.fuelType);
  if (f.transmission) parts.push(f.transmission);
  if (f.location) parts.push(f.location);
  if (f.priceMax) parts.push(`≤ ${formatPrice(f.priceMax)}`);
  if (f.priceMin) parts.push(`≥ ${formatPrice(f.priceMin)}`);
  if (f.yearMin) parts.push(`${f.yearMin}+`);
  if (f.search) parts.push(`"${f.search}"`);
  return parts.length ? parts.join(' · ') : 'All cars';
}
const toQuery = (f = {}) => {
  const p = new URLSearchParams();
  ['search', 'make', 'model'].forEach((k) => { if (f[k]) p.set(k, f[k]); });
  return p.toString();
};

export default function SavedSearches() {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: ['saved-searches'], queryFn: () => api.get('/saved-searches').then((r) => r.data) });
  const searches = data || [];

  const toggle = useMutation({ mutationFn: ({ id, alertOn }) => api.patch(`/saved-searches/${id}`, { alertOn }), onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-searches'] }) });
  const remove = useMutation({ mutationFn: (id) => api.delete(`/saved-searches/${id}`), onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-searches'] }) });
  const seen = useMutation({ mutationFn: (id) => api.post(`/saved-searches/${id}/seen`), onSuccess: () => qc.invalidateQueries({ queryKey: ['saved-searches'] }) });

  const openResults = async (s) => {
    await seen.mutateAsync(s.id).catch(() => {});
    navigate(`/cars${toQuery(s.filters) ? `?${toQuery(s.filters)}` : ''}`);
  };

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-3xl mx-auto px-gutter-mobile md:px-gutter-desktop py-xl">
        <div className="mb-lg">
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Saved Searches</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Get alerted when new cars match what you're looking for.</p>
        </div>

        {isLoading ? (
          <div className="space-y-md">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-24 rounded-2xl border border-border-subtle bg-surface-container animate-pulse" />)}</div>
        ) : searches.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="bookmark_added" className="text-6xl text-on-surface-variant/40 mb-3" />
            <p className="text-on-surface-variant mb-4">No saved searches yet. Save a search from the Browse page to get match alerts.</p>
            <Link to="/cars" className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md">Browse Cars</Link>
          </div>
        ) : (
          <div className="space-y-md">
            {searches.map((s) => (
              <div key={s.id} className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-lg">
                <div className="flex items-start justify-between gap-md">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-headline-sm font-headline-sm text-on-surface">{s.name}</h3>
                      {s.newCount > 0 && <span className="bg-trust-emerald text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">{s.newCount} new</span>}
                    </div>
                    <p className="text-body-sm text-on-surface-variant mt-0.5">{summarize(s.filters)}</p>
                    <p className="text-label-sm text-on-surface-variant/70 mt-1">{s.matchCount} matching listing{s.matchCount === 1 ? '' : 's'}</p>
                  </div>
                  <button onClick={() => remove.mutate(s.id)} className="p-2 rounded-full text-on-surface-variant hover:text-error hover:bg-error/10 transition-colors shrink-0" aria-label="Delete"><Icon name="delete" className="text-[18px]" /></button>
                </div>
                <div className="flex items-center justify-between mt-md pt-md border-t border-border-subtle">
                  <label className="flex items-center gap-2 text-body-sm text-on-surface cursor-pointer">
                    <button type="button" onClick={() => toggle.mutate({ id: s.id, alertOn: !s.alertOn })} className={`relative w-10 h-6 rounded-full transition-colors ${s.alertOn ? 'bg-primary' : 'bg-surface-container-highest'}`}>
                      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${s.alertOn ? 'left-[18px]' : 'left-0.5'}`} />
                    </button>
                    <span className="flex items-center gap-1"><Icon name="notifications" className="text-[16px]" /> Email/alerts {s.alertOn ? 'on' : 'off'}</span>
                  </label>
                  <button onClick={() => openResults(s)} className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md hover:opacity-90 flex items-center gap-1">View results <Icon name="arrow_forward" className="text-[18px]" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
