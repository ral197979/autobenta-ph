import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { formatPrice } from '../utils/format';

function Icon({ name, className = '', filled = false }) {
  return <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>;
}

const BODY_TYPES = ['Sedan', 'SUV', 'Crossover', 'MPV', 'Hatchback', 'Pickup'];
const FUELS = [['gasoline', 'Gasoline'], ['diesel', 'Diesel'], ['hybrid', 'Hybrid'], ['electric', 'Electric']];
const GRADIENT = 'bg-gradient-to-br from-[#1e3a5f] to-[#0B1220]';

function Chip({ active, onClick, children }) {
  return (
    <button onClick={onClick} className={`px-md py-xs rounded-full text-body-sm transition-all active:scale-95 ${active ? 'bg-primary text-on-primary font-bold' : 'border border-border-subtle text-on-surface hover:border-primary'}`}>{children}</button>
  );
}

function ModelCard({ m }) {
  const [err, setErr] = useState(false);
  return (
    <Link to={`/new-cars/${m.id}`} className="group bg-surface-container-lowest border border-border-subtle rounded-2xl overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all flex flex-col">
      <div className="relative h-44 overflow-hidden">
        {m.imageUrl && !err ? (
          <img src={m.imageUrl} alt={`${m.make} ${m.model}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={() => setErr(true)} />
        ) : (
          <div className={`h-full w-full ${GRADIENT} flex flex-col items-center justify-center`}>
            <span className="text-label-sm uppercase tracking-widest text-white/40">{m.bodyType}</span>
            <span className="text-headline-sm font-bold text-white/90">{m.make} {m.model}</span>
          </div>
        )}
        {m.isElectric && <span className="absolute top-3 left-3 bg-trust-emerald text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><Icon name="bolt" className="text-[12px]" filled /> ELECTRIC</span>}
      </div>
      <div className="p-md flex flex-col gap-1 flex-1">
        <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">{m.bodyType} · {m.year}</span>
        <h3 className="text-headline-sm font-headline-sm text-on-surface">{m.make} {m.model}</h3>
        <div className="mt-auto pt-sm">
          <span className="text-label-sm text-on-surface-variant block">Starts at</span>
          <span className="text-headline-sm font-bold text-primary">{formatPrice(m.startingPrice)}</span>
          {m._count?.variants > 0 && <span className="text-label-sm text-on-surface-variant ml-2">· {m._count.variants} variants</span>}
        </div>
      </div>
    </Link>
  );
}

export default function NewCars() {
  const [params, setParams] = useSearchParams();
  const [sort, setSort] = useState('featured');
  const make = params.get('make') || '';
  const bodyType = params.get('bodyType') || '';
  const fuelType = params.get('fuelType') || '';
  const electric = params.get('electric') === 'true';

  const setFilter = (k, v) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v); else next.delete(k);
    setParams(next, { replace: true });
  };

  const { data: makes } = useQuery({ queryKey: ['new-car-makes'], queryFn: () => api.get('/new-cars/makes').then(r => r.data) });
  const qs = new URLSearchParams({ sort, ...(make && { make }), ...(bodyType && { bodyType }), ...(fuelType && { fuelType }), ...(electric && { electric: 'true' }) }).toString();
  const { data, isLoading } = useQuery({ queryKey: ['new-cars', qs], queryFn: () => api.get(`/new-cars?${qs}`).then(r => r.data) });

  const models = data?.models || [];

  const Filters = () => (
    <div className="space-y-lg">
      <div>
        <h4 className="text-label-md font-semibold text-on-surface mb-sm">Make</h4>
        <select value={make} onChange={(e) => setFilter('make', e.target.value)} className="w-full bg-surface-container border border-border-subtle rounded-xl px-md py-sm text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none">
          <option value="">All Makes</option>
          {(makes || []).map((mk) => <option key={mk} value={mk}>{mk}</option>)}
        </select>
      </div>
      <div>
        <h4 className="text-label-md font-semibold text-on-surface mb-sm">Body Type</h4>
        <div className="flex flex-wrap gap-1.5">
          {BODY_TYPES.map((b) => <Chip key={b} active={bodyType === b} onClick={() => setFilter('bodyType', bodyType === b ? '' : b)}>{b}</Chip>)}
        </div>
      </div>
      <div>
        <h4 className="text-label-md font-semibold text-on-surface mb-sm">Fuel</h4>
        <div className="flex flex-wrap gap-1.5">
          {FUELS.map(([v, l]) => <Chip key={v} active={fuelType === v} onClick={() => setFilter('fuelType', fuelType === v ? '' : v)}>{l}</Chip>)}
        </div>
      </div>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={electric} onChange={(e) => setFilter('electric', e.target.checked ? 'true' : '')} className="h-4 w-4 rounded border-border-subtle text-primary focus:ring-primary bg-surface-container" />
        <span className="text-body-sm text-on-surface">Electric only</span>
      </label>
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-lg">
        <div className="mb-lg">
          <h1 className="text-headline-lg font-headline-lg text-on-surface">New Cars</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">{isLoading ? 'Loading…' : `${data?.pagination?.total || 0} brand-new models with prices and specs.`}</p>
        </div>

        <div className="flex gap-xl">
          <aside className="hidden lg:block w-72 shrink-0">
            <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-lg sticky top-20">
              <Filters />
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-md gap-3">
              <div className="lg:hidden"><details className="relative"><summary className="list-none rounded-xl border border-border-subtle px-md py-sm text-label-md text-on-surface cursor-pointer">Filters</summary><div className="absolute z-20 mt-2 w-72 bg-surface-container-lowest border border-border-subtle rounded-2xl p-lg shadow-lg"><Filters /></div></details></div>
              <select value={sort} onChange={(e) => setSort(e.target.value)} className="ml-auto bg-surface-container border border-border-subtle rounded-xl text-on-surface text-body-sm font-semibold py-sm px-md focus:ring-2 focus:ring-primary outline-none">
                <option value="featured">Featured</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="newest">Newest</option>
              </select>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-lg">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-72 rounded-2xl border border-border-subtle bg-surface-container animate-pulse" />)}</div>
            ) : models.length === 0 ? (
              <p className="text-center text-on-surface-variant py-20">No models match your filters.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-lg">
                {models.map((m) => <ModelCard key={m.id} m={m} />)}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
