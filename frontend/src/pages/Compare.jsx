import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { X, Plus, Bot } from 'lucide-react';
import api from '../api/client';
import { formatPrice, formatMileage, FUEL_LABELS, TRANSMISSION_LABELS, CONDITION_LABELS, photoOrFallback } from '../utils/format';

const MAX_COMPARE = 3;

function useListings(ids) {
  const [listings, setListings] = useState([]);
  useEffect(() => {
    if (!ids.length) { setListings([]); return; }
    Promise.all(ids.map(id => api.get(`/listings/${id}`).then(r => r.data).catch(() => null)))
      .then(results => setListings(results.filter(Boolean)));
  }, [ids.join(',')]);
  return listings;
}

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

  const addId = (id) => {
    if (!ids.includes(id) && ids.length < MAX_COMPARE) setIds(p => [...p, id]);
  };
  const removeId = (id) => setIds(p => p.filter(i => i !== id));

  const askAI = async () => {
    if (listings.length < 2) return;
    setAiLoading(true);
    try {
      const { data } = await api.post('/ai/buyer-assistant', {
        question: 'Compare these cars for me',
        compareIds: ids,
      });
      setAiAnswer(data);
    } catch {
      setAiAnswer({ answer: 'AI comparison failed. Try again later.' });
    } finally {
      setAiLoading(false);
    }
  };

  const ROWS = [
    ['Price', l => formatPrice(l.price)],
    ['Year', l => l.year],
    ['Make / Model', l => `${l.make} ${l.model}`],
    ['Variant', l => l.variant || '—'],
    ['Mileage', l => formatMileage(l.mileage)],
    ['Fuel Type', l => FUEL_LABELS[l.fuelType]],
    ['Transmission', l => TRANSMISSION_LABELS[l.transmission]],
    ['Condition', l => CONDITION_LABELS[l.condition]],
    ['Color', l => l.color || '—'],
    ['Body Type', l => l.bodyType || '—'],
    ['Location', l => l.city],
    ['Owners', l => l.ownerCount],
    ['OR/CR', l => l.hasOrCr ? '✅ Yes' : '❌ No'],
    ['Service History', l => l.serviceHistory ? '✅ Available' : '—'],
    ['Accident', l => l.hasAccident ? '⚠️ Yes' : '✅ None'],
    ['Flood', l => l.hasFlood ? '🚨 Yes' : '✅ None'],
    ['Negotiable', l => l.negotiable ? '✅ Yes' : 'Fixed'],
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Compare Cars</h1>

      {ids.length < MAX_COMPARE && (
        <div className="card p-4 mb-6">
          <p className="text-sm text-gray-600 mb-2">Add a car to compare ({ids.length}/{MAX_COMPARE})</p>
          <input value={searchInput} onChange={e => setSearchInput(e.target.value)} placeholder="Search by make or model..." className="input text-sm" />
          {searchResults?.listings?.length > 0 && searchInput.length > 2 && (
            <div className="mt-2 border border-gray-200 rounded-lg divide-y max-h-48 overflow-y-auto">
              {searchResults.listings.filter(l => !ids.includes(l.id)).slice(0, 8).map(l => (
                <button key={l.id} onClick={() => { addId(l.id); setSearchInput(''); }}
                  className="w-full flex items-center gap-3 p-2.5 hover:bg-gray-50 text-left transition-colors">
                  <div className="w-12 h-9 rounded overflow-hidden bg-gray-100 shrink-0">
                    <img src={l.photos?.[0]?.url || ''} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{l.year} {l.make} {l.model}</p>
                    <p className="text-xs text-gray-500">{formatPrice(l.price)} · {l.city}</p>
                  </div>
                  <Plus className="w-4 h-4 text-primary-600 ml-auto" />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {ids.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-gray-400 mb-4">Search and add up to 3 cars to compare side by side.</p>
          <Link to="/cars" className="btn-primary">Browse Cars</Link>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead>
                <tr>
                  <th className="w-32 text-left text-xs text-gray-400 font-medium pb-3">Feature</th>
                  {ids.map(id => {
                    const l = listings.find(x => x?.id === id);
                    return (
                      <th key={id} className="px-2 pb-3">
                        <div className="card overflow-hidden relative">
                          <button onClick={() => removeId(id)} className="absolute top-2 right-2 bg-black/50 text-white rounded-full p-1 z-10"><X className="w-3 h-3" /></button>
                          <div className="aspect-[4/3] bg-gray-100">
                            {l && <img src={photoOrFallback(l.photos?.[0]?.url, l.make)} alt="" className="w-full h-full object-cover" />}
                          </div>
                          <div className="p-3 text-left">
                            {l ? (
                              <>
                                <Link to={`/cars/${id}`} className="font-semibold text-sm text-primary-600 hover:underline line-clamp-1">{l.year} {l.make} {l.model}</Link>
                                <p className="text-lg font-bold text-gray-900">{formatPrice(l.price)}</p>
                              </>
                            ) : (
                              <div className="animate-pulse"><div className="h-4 bg-gray-200 rounded mb-1 w-3/4" /><div className="h-5 bg-gray-200 rounded w-1/2" /></div>
                            )}
                          </div>
                        </div>
                      </th>
                    );
                  })}
                  {ids.length < MAX_COMPARE && <th className="px-2 pb-3 align-top"><div className="card border-2 border-dashed border-gray-300 h-full flex flex-col items-center justify-center py-8 text-gray-400"><Plus className="w-8 h-8 mb-1" /><span className="text-xs">Add Car</span></div></th>}
                </tr>
              </thead>
              <tbody>
                {ROWS.map(([label, fn]) => (
                  <tr key={label} className="border-t border-gray-100 hover:bg-gray-50">
                    <td className="py-2.5 pr-4 text-xs text-gray-500 font-medium w-32">{label}</td>
                    {ids.map(id => {
                      const l = listings.find(x => x?.id === id);
                      return <td key={id} className="px-2 py-2.5 text-sm text-center font-medium">{l ? fn(l) : <span className="text-gray-300">—</span>}</td>;
                    })}
                    {ids.length < MAX_COMPARE && <td />}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {listings.length >= 2 && (
            <div className="card p-5 mt-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold flex items-center gap-2"><Bot className="w-5 h-5 text-primary-600" /> AI Comparison</h3>
                <button onClick={askAI} disabled={aiLoading} className="btn-primary text-sm">{aiLoading ? 'Comparing...' : 'Compare with AI'}</button>
              </div>
              {aiAnswer && (
                <div className="bg-primary-50 border border-primary-100 rounded-lg p-4 text-sm">
                  <p className="text-gray-700 whitespace-pre-wrap">{aiAnswer.answer}</p>
                  {aiAnswer.checklist?.length > 0 && (
                    <ul className="mt-3 space-y-1">{aiAnswer.checklist.map((item, i) => <li key={i} className="text-gray-600 flex gap-2">✅ {item}</li>)}</ul>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
