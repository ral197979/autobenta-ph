import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X, Plus } from 'lucide-react';
import api from '../api/client';
import { formatPrice, formatMileage, FUEL_LABELS, TRANSMISSION_LABELS, CONDITION_LABELS, photoOrFallback } from '../utils/format';

const MAX_COMPARE = 3;

function Icon({ name, className = '', filled = false }) {
  return <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>;
}

function useListings(ids) {
  const [listings, setListings] = useState([]);
  useEffect(() => {
    if (!ids.length) { setListings([]); return; }
    Promise.all(ids.map(id => api.get(`/listings/${id}`).then(r => r.data).catch(() => null)))
      .then(results => setListings(results.filter(Boolean)));
  }, [ids.join(',')]); // eslint-disable-line react-hooks/exhaustive-deps
  return listings;
}

const SPEC_ROWS = [
  ['speed', 'Mileage', l => formatMileage(l.mileage)],
  ['local_gas_station', 'Fuel', l => FUEL_LABELS[l.fuelType]],
  ['settings_input_component', 'Transmission', l => TRANSMISSION_LABELS[l.transmission]],
  ['grade', 'Condition', l => CONDITION_LABELS[l.condition]],
  ['location_on', 'Location', l => l.city],
  ['person', 'Owners', l => l.ownerCount],
];

export default function Compare() {
  const [searchParams] = useSearchParams();
  const initialIds = searchParams.get('ids')?.split(',').filter(Boolean) || [];
  const [ids, setIds] = useState(initialIds.slice(0, MAX_COMPARE));
  const [searchInput, setSearchInput] = useState('');
  const [aiAnswer, setAiAnswer] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);

  const listings = useListings(ids);

  const { data: searchResults } = useQuery({
    queryKey: ['compare-search', searchInput],
    queryFn: () => api.get(`/listings?search=${encodeURIComponent(searchInput)}&sortBy=viewCount`).then(r => r.data),
    enabled: searchInput.length > 2,
  });

  const addId = (id) => { if (!ids.includes(id) && ids.length < MAX_COMPARE) setIds(p => [...p, id]); };
  const removeId = (id) => setIds(p => p.filter(i => i !== id));

  // Cheapest listing gets the "value" pick badge.
  const cheapestId = listings.length >= 2
    ? listings.reduce((a, b) => (Number(a.price) <= Number(b.price) ? a : b)).id
    : null;

  const askAI = async () => {
    if (listings.length < 2) return;
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/buyer-assistant', { question: 'Compare these cars for me', compareIds: ids });
      setAiAnswer(data);
    } catch {
      setAiAnswer({ answer: 'AI comparison failed. Try again later.' });
    } finally {
      setAiLoading(false);
    }
  };

  return (
    <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-xl">
      {/* Header */}
      <section className="mb-xl">
        <h1 className="font-headline-lg text-headline-lg text-on-surface mb-xs">Smart Comparison</h1>
        <p className="text-on-surface-variant font-body-md">Precision analytics for your next high-performance investment.</p>
      </section>

      {/* Add car */}
      {ids.length < MAX_COMPARE && (
        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-lg mb-xl">
          <p className="text-body-sm text-on-surface-variant mb-2">Add a car to compare ({ids.length}/{MAX_COMPARE})</p>
          <div className="relative">
            <Icon name="search" className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input value={searchInput} onChange={e => setSearchInput(e.target.value)} aria-label="Search cars to compare" placeholder="Search by make or model…"
              className="w-full bg-surface-container border border-border-subtle rounded-full pl-12 pr-md py-sm text-body-md text-on-surface focus:ring-2 focus:ring-primary outline-none placeholder-on-surface-variant/60" />
          </div>
          {searchResults?.listings?.length > 0 && searchInput.length > 2 && (
            <div className="mt-2 border border-border-subtle rounded-xl divide-y divide-border-subtle max-h-48 overflow-y-auto">
              {searchResults.listings.filter(l => !ids.includes(l.id)).slice(0, 8).map(l => (
                <button key={l.id} onClick={() => { addId(l.id); setSearchInput(''); }}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-surface-container text-left transition-colors">
                  <div className="w-12 h-9 rounded overflow-hidden bg-surface-container shrink-0">
                    <img src={photoOrFallback(l.photos?.[0]?.url, l.make)} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-body-sm font-medium text-on-surface truncate">{l.year} {l.make} {l.model}</p>
                    <p className="text-xs text-on-surface-variant">{formatPrice(l.price)} · {l.city}</p>
                  </div>
                  <Plus className="w-4 h-4 text-primary ml-auto shrink-0" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {ids.length === 0 ? (
        <div className="text-center py-20">
          <Icon name="balance" className="text-6xl text-on-surface-variant/40 mb-3" />
          <p className="text-on-surface-variant mb-4">Search and add up to 3 cars to compare side by side.</p>
          <Link to="/cars" className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md">Browse Cars</Link>
        </div>
      ) : (
        <>
          {/* Comparison grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
            {ids.map((id) => {
              const l = listings.find(x => x?.id === id);
              return (
                <div key={id} className="flex flex-col gap-md">
                  <div className="relative group rounded-xl border border-border-subtle overflow-hidden">
                    <button onClick={() => removeId(id)} className="absolute top-md right-md z-20 bg-black/50 text-white rounded-full p-1.5 hover:bg-black/70 transition-colors"><X className="w-4 h-4" /></button>
                    {l && cheapestId === id && (
                      <div className="absolute top-md left-md z-20 flex items-center gap-xs bg-trust-emerald text-white px-md py-1 rounded-full shadow-lg">
                        <Icon name="verified" className="text-[18px]" filled />
                        <span className="font-label-md text-label-md">Best Value</span>
                      </div>
                    )}
                    <div className="aspect-[16/9] w-full overflow-hidden bg-surface-container-highest">
                      {l && <img src={photoOrFallback(l.photos?.[0]?.url, l.make)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />}
                    </div>
                  </div>

                  {l ? (
                    <>
                      <div className="flex flex-col gap-xs mt-sm">
                        <span className="text-on-surface-variant font-label-md uppercase tracking-wider">{l.bodyType || 'Vehicle'} • {l.year}</span>
                        <h3 className="font-headline-md text-headline-md text-on-surface">{l.make} {l.model}</h3>
                        <div className="text-primary font-display-lg text-display-lg mt-xs">{formatPrice(l.price)}</div>
                      </div>

                      <div className="mt-lg flex flex-col gap-sm">
                        {SPEC_ROWS.map(([icon, label, fn]) => (
                          <div key={label} className="flex items-center justify-between p-md rounded-lg bg-surface-container-low border border-border-subtle hover:border-primary/30 transition-colors">
                            <div className="flex items-center gap-sm">
                              <Icon name={icon} className="text-on-surface-variant" />
                              <span className="text-on-surface-variant font-body-md">{label}</span>
                            </div>
                            <span className="text-on-surface font-headline-sm">{fn(l)}</span>
                          </div>
                        ))}
                        <Disclosure ok={l.hasOrCr} label="OR/CR" yes="Available" no="Not available" />
                        <Disclosure ok={!l.hasAccident} label="Accident" yes="None disclosed" no="Disclosed" />
                        <Disclosure ok={!l.hasFlood} label="Flood" yes="None disclosed" no="Disclosed" />
                      </div>

                      <Link to={`/cars/${id}`} className="mt-lg w-full py-md bg-primary text-on-primary text-center font-headline-sm rounded-xl hover:opacity-90 active:scale-95 transition-all">
                        View {l.make} {l.model}
                      </Link>
                    </>
                  ) : (
                    <div className="animate-pulse space-y-3 mt-sm">
                      <div className="h-4 bg-surface-container rounded w-1/2" />
                      <div className="h-8 bg-surface-container rounded w-2/3" />
                      <div className="h-40 bg-surface-container rounded-xl" />
                    </div>
                  )}
                </div>
              );
            })}

            {ids.length < MAX_COMPARE && (
              <div className="rounded-xl border-2 border-dashed border-border-subtle flex flex-col items-center justify-center py-2xl text-on-surface-variant min-h-[200px]">
                <Plus className="w-8 h-8 mb-1" />
                <span className="text-label-sm">Add a car (search above)</span>
              </div>
            )}
          </div>

          {/* AI insights */}
          {listings.length >= 2 && (
            <section className="mt-3xl">
              <div className="flex items-center justify-between gap-md mb-lg">
                <div className="flex items-center gap-sm">
                  <Icon name="auto_awesome" className="text-primary" filled />
                  <h4 className="font-headline-sm text-headline-sm text-on-surface">Ryderr AI Insights</h4>
                </div>
                <button onClick={askAI} disabled={aiLoading} className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md hover:opacity-90 disabled:opacity-50">
                  {aiLoading ? 'Comparing…' : 'Compare with AI'}
                </button>
              </div>
              {aiAnswer && (
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-xl text-body-md">
                  <p className="text-on-surface whitespace-pre-wrap leading-relaxed">{aiAnswer.answer}</p>
                  {aiAnswer.checklist?.length > 0 && (
                    <ul className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                      {aiAnswer.checklist.map((item, i) => (
                        <li key={i} className="flex gap-2 text-on-surface-variant"><Icon name="check_circle" className="text-trust-emerald text-[18px]" filled /> {item}</li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </section>
          )}
        </>
      )}
    </div>
  );
}

function Disclosure({ ok, label, yes, no }) {
  return (
    <div className={`flex items-center justify-between p-md rounded-lg bg-surface-container-low border transition-colors ${ok ? 'border-trust-emerald/20 hover:border-trust-emerald/40' : 'border-alert-orange/30 hover:border-alert-orange/50'}`}>
      <div className="flex items-center gap-sm">
        <Icon name={ok ? 'check_circle' : 'warning'} className={ok ? 'text-trust-emerald' : 'text-alert-orange'} filled />
        <span className="text-on-surface-variant font-body-md">{label}</span>
      </div>
      <span className={`font-headline-sm ${ok ? 'text-on-surface' : 'text-alert-orange'}`}>{ok ? yes : no}</span>
    </div>
  );
}
