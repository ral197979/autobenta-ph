import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { formatPrice } from '../utils/format';

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}
const MAX = 3;
const GRADIENT = 'bg-gradient-to-br from-[#1e3a5f] to-[#0B1220]';

export default function NewCarCompare() {
  const [params, setParams] = useSearchParams();
  const ids = (params.get('ids') || '').split(',').filter(Boolean).slice(0, MAX);
  const [models, setModels] = useState([]);

  useEffect(() => {
    if (!ids.length) { setModels([]); return; }
    Promise.all(ids.map((id) => api.get(`/new-cars/${id}`).then((r) => r.data).catch(() => null)))
      .then((res) => setModels(res.filter(Boolean)));
  }, [ids.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps

  const { data: all } = useQuery({ queryKey: ['new-cars-all'], queryFn: () => api.get('/new-cars?limit=60').then((r) => r.data) });
  const options = (all?.models || []).filter((m) => !ids.includes(m.id));

  const setIds = (next) => { const p = new URLSearchParams(params); if (next.length) p.set('ids', next.join(',')); else p.delete('ids'); setParams(p, { replace: true }); };
  const add = (id) => { if (id && ids.length < MAX) setIds([...ids, id]); };
  const remove = (id) => setIds(ids.filter((x) => x !== id));

  // Union of spec keys across all selected models, in first-seen order.
  const specKeys = [];
  models.forEach((m) => Object.keys(m.specs || {}).forEach((k) => { if (!specKeys.includes(k)) specKeys.push(k); }));

  const ROWS = [
    ['Starting Price', (m) => formatPrice(m.startingPrice), true],
    ['Body Type', (m) => m.bodyType],
    ['Fuel', (m) => m.fuelType],
    ['Year', (m) => m.year],
    ['Variants', (m) => m.variants?.length ?? '—'],
    ...specKeys.map((k) => [k, (m) => (m.specs?.[k] != null ? String(m.specs[k]) : '—')]),
  ];

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-xl">
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs">Compare New Cars</h1>
        <p className="text-on-surface-variant font-body-md mb-lg">Put up to {MAX} models side by side, spec for spec.</p>

        {ids.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="balance" className="text-6xl text-on-surface-variant/40 mb-3" />
            <p className="text-on-surface-variant mb-4">Add models below to start comparing.</p>
            {options.length > 0 && (
              <select onChange={(e) => add(e.target.value)} value="" className="bg-surface-container border border-border-subtle rounded-xl px-md py-sm text-on-surface">
                <option value="" disabled>Add a model…</option>
                {options.map((m) => <option key={m.id} value={m.id}>{m.make} {m.model}</option>)}
              </select>
            )}
            <div className="mt-4"><Link to="/new-cars" className="text-primary hover:underline">Browse New Cars</Link></div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-x-md min-w-[640px]">
              <thead>
                <tr>
                  <th className="w-32" />
                  {models.map((m) => (
                    <th key={m.id} className="align-top pb-md">
                      <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl overflow-hidden text-left">
                        <div className="relative h-28">
                          <div className={`h-full w-full ${GRADIENT} flex items-center justify-center`}>
                            {m.imageUrl
                              ? <img src={m.imageUrl} alt="" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                              : <span className="text-white/90 font-bold text-center px-2">{m.make} {m.model}</span>}
                          </div>
                          <button onClick={() => remove(m.id)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 hover:bg-black/70"><Icon name="close" className="text-[16px]" /></button>
                        </div>
                        <div className="p-md">
                          <Link to={`/new-cars/${m.id}`} className="font-headline-sm text-headline-sm text-on-surface hover:text-primary block leading-tight">{m.make} {m.model}</Link>
                        </div>
                      </div>
                    </th>
                  ))}
                  {ids.length < MAX && options.length > 0 && (
                    <th className="align-top pb-md">
                      <div className="border-2 border-dashed border-border-subtle rounded-2xl h-full min-h-[180px] flex flex-col items-center justify-center gap-2 p-md">
                        <Icon name="add" className="text-on-surface-variant text-2xl" />
                        <select onChange={(e) => add(e.target.value)} value="" className="bg-surface-container border border-border-subtle rounded-lg px-2 py-1 text-body-sm text-on-surface">
                          <option value="" disabled>Add model…</option>
                          {options.map((m) => <option key={m.id} value={m.id}>{m.make} {m.model}</option>)}
                        </select>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([label, fn, highlight]) => (
                  <tr key={label} className="border-t border-border-subtle">
                    <td className="py-3 pr-4 text-label-sm font-semibold text-on-surface-variant align-top">{label}</td>
                    {models.map((m) => (
                      <td key={m.id} className={`py-3 align-top ${highlight ? 'text-headline-sm font-bold text-primary' : 'text-body-md text-on-surface'}`}>{fn(m)}</td>
                    ))}
                    {ids.length < MAX && options.length > 0 && <td />}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}
