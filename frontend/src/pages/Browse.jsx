import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, X, ArrowUpDown, Bookmark } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { trackEvent } from '../utils/analytics';
import CarCard from '../components/CarCard';
import FilterPanel from '../components/FilterPanel';
import useGeolocation from '../hooks/useGeolocation';

const BASE_SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Newest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'viewCount_desc', label: 'Most Viewed' },
  { value: 'mileage_asc', label: 'Lowest Mileage' },
  { value: 'year_desc', label: 'Newest Year' },
];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState('createdAt_desc');
  const [page, setPage] = useState(1);
  const [savedMsg, setSavedMsg] = useState('');
  const geo = useGeolocation();

  const saveSearch = async () => {
    if (!user) return navigate('/login');
    const suggested = [filters.make, filters.model, filters.search].filter(Boolean).join(' ') || 'All cars';
    const name = window.prompt('Name this saved search:', suggested);
    if (!name) return;
    try {
      const active = Object.fromEntries(Object.entries(filters).filter(([k, v]) => v && k !== 'radius'));
      await api.post('/saved-searches', { name, filters: active, alertOn: true });
      setSavedMsg('Saved! We’ll alert you on new matches.');
      setTimeout(() => setSavedMsg(''), 3000);
    } catch {
      setSavedMsg('Could not save. Please try again.');
      setTimeout(() => setSavedMsg(''), 3000);
    }
  };

  // Auto-activate geo if coming from a "near me" link
  useEffect(() => {
    const lat = searchParams.get('lat');
    const lng = searchParams.get('lng');
    if (lat && lng && !geo.active) geo.request();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const SORT_OPTIONS = [
    ...(geo.active ? [{ value: 'nearby_asc', label: 'Nearest First' }] : []),
    ...BASE_SORT_OPTIONS,
  ];

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    make: searchParams.get('make') || '',
    model: searchParams.get('model') || '',
    bodyType: searchParams.get('bodyType') || '',
    yearMin: '', yearMax: '',
    priceMin: searchParams.get('priceMin') || '',
    priceMax: searchParams.get('priceMax') || '',
    mileageMax: '', fuelType: '', transmission: '',
    location: searchParams.get('location') || '',
    sellerType: searchParams.get('sellerType') || '', condition: '', radius: '50',
    verified: searchParams.get('verified') || '',
  });

  useEffect(() => {
    setPage(1);
  }, [filters, sort]);

  // When geo activates, auto-switch sort to nearest first
  useEffect(() => {
    if (geo.active) setSort('nearby_asc');
  }, [geo.active]);

  // Track SEARCH_PERFORMED — debounced 1s, only when non-empty
  useEffect(() => {
    if (!filters.search) return;
    const t = setTimeout(() => {
      trackEvent('SEARCH_PERFORMED', { meta: { query: filters.search } });
    }, 1000);
    return () => clearTimeout(t);
  }, [filters.search]);

  // Track FILTER_APPLIED when any non-search filter is set
  useEffect(() => {
    const hasFilter = Object.entries(filters).some(([k, v]) => k !== 'search' && k !== 'radius' && v);
    if (!hasFilter) return;
    trackEvent('FILTER_APPLIED', { meta: { filters } });
  }, [filters.make, filters.fuelType, filters.transmission, filters.sellerType, filters.condition]); // eslint-disable-line react-hooks/exhaustive-deps

  const buildQuery = () => {
    const isNearby = sort === 'nearby_asc' && geo.active;
    const [sortBy, sortOrder] = isNearby ? ['createdAt', 'desc'] : sort.split('_');
    const params = new URLSearchParams({ page, sortBy, sortOrder });
    Object.entries(filters).forEach(([k, v]) => { if (v && k !== 'radius') params.set(k, v); });
    if (isNearby) {
      params.set('lat', geo.lat);
      params.set('lng', geo.lng);
      params.set('radius', filters.radius || '50');
    }
    return params.toString();
  };

  const { data, isLoading } = useQuery({
    queryKey: ['listings', filters, sort, page],
    queryFn: () => api.get(`/listings?${buildQuery()}`).then(r => r.data),
    keepPreviousData: true,
  });

  const resetFilters = () => {
    setFilters({ search: '', make: '', model: '', bodyType: '', yearMin: '', yearMax: '', priceMin: '', priceMax: '', mileageMax: '', fuelType: '', transmission: '', location: '', sellerType: '', condition: '', radius: '50', verified: '' });
    setSearchParams({});
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-lg gap-3 flex-wrap">
        <div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Browse Cars</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">
            {isLoading
              ? 'Loading…'
              : <>Showing <span className="font-bold text-on-surface">{data?.pagination?.total?.toLocaleString() || 0}</span> vehicles</>}
          </p>
        </div>
        <div className="flex items-center gap-md">
          <button
            onClick={saveSearch}
            className="flex items-center gap-2 rounded-xl border border-border-subtle text-on-surface px-md py-sm text-label-md hover:bg-surface-container transition-colors"
          >
            <Bookmark className="w-4 h-4" /> Save Search
          </button>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`lg:hidden flex items-center gap-2 rounded-xl border px-md py-sm text-label-md transition-colors ${activeFilterCount > 0 ? 'border-primary text-primary' : 'border-border-subtle text-on-surface'}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters{activeFilterCount > 0 && <span className="bg-primary text-on-primary rounded-full w-5 h-5 flex items-center justify-center text-[11px]">{activeFilterCount}</span>}
          </button>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-on-surface-variant" />
            <select value={sort} onChange={e => setSort(e.target.value)} className="bg-surface-container border border-border-subtle rounded-xl text-on-surface text-body-sm font-semibold py-sm px-md focus:ring-2 focus:ring-primary outline-none cursor-pointer">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value} className="bg-surface">{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {savedMsg && (
        <div className="mb-lg rounded-xl bg-trust-emerald/10 border border-trust-emerald/30 px-4 py-2.5 text-body-sm text-trust-emerald flex items-center gap-2">
          <Bookmark className="w-4 h-4" /> {savedMsg} <Link to="/saved-searches" className="ml-auto font-semibold hover:underline">View saved searches →</Link>
        </div>
      )}

      {/* Active filter chips */}
      {(filters.verified === 'true' || filters.bodyType) && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {filters.verified === 'true' && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-label-sm text-primary">
              Verified sellers only
              <button
                type="button"
                onClick={() => setFilters(p => ({ ...p, verified: '' }))}
                className="ml-0.5 hover:opacity-70 transition-opacity"
                aria-label="Remove filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
          {filters.bodyType && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-label-sm text-primary capitalize">
              {filters.bodyType}
              <button
                type="button"
                onClick={() => setFilters(p => ({ ...p, bodyType: '' }))}
                className="ml-0.5 hover:opacity-70 transition-opacity"
                aria-label="Remove filter"
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      )}

      {/* Search bar */}
      <div className="mb-lg relative">
        <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
        <input
          type="text"
          aria-label="Search cars"
          placeholder="Search by brand, model, or body style…"
          value={filters.search}
          onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
          className="w-full bg-surface-container border border-border-subtle rounded-full pl-12 pr-md py-sm text-on-surface text-body-md focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-on-surface-variant/60"
        />
      </div>

      <div className="flex gap-xl">
        {/* Sidebar filters (desktop) */}
        <div className="hidden lg:block w-80 shrink-0">
          <FilterPanel filters={filters} onChange={setFilters} onReset={resetFilters} geo={geo} />
        </div>

        {/* Mobile filter drawer */}
        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-surface overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-on-surface">Filters</h2>
                <button onClick={() => setShowFilters(false)} className="text-on-surface"><X className="w-5 h-5" /></button>
              </div>
              <FilterPanel filters={filters} onChange={setFilters} onReset={resetFilters} geo={geo} />
              <button onClick={() => setShowFilters(false)} className="mt-4 w-full bg-primary text-on-primary rounded-xl py-sm font-label-md">
                Show {data?.pagination?.total || 0} Results
              </button>
            </div>
          </div>
        )}

        {/* Listings grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-xl">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border-subtle bg-surface-container overflow-hidden animate-pulse">
                  <div className="h-56 bg-surface-container-high" />
                  <div className="p-lg space-y-2">
                    <div className="h-4 bg-surface-container-high rounded w-3/4" />
                    <div className="h-5 bg-surface-container-high rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.listings?.length === 0 ? (
            <div className="text-center py-20">
              <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4">no_crash</span>
              <p className="text-on-surface-variant text-body-lg">No cars match your filters.</p>
              <button onClick={resetFilters} className="mt-4 bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-xl">
                {data?.listings?.map(listing => (
                  <CarCard key={listing.id} listing={listing} />
                ))}
              </div>

              {/* Pagination */}
              {data?.pagination?.pages > 1 && (
                <div className="flex items-center justify-center gap-md mt-2xl">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="rounded-xl border border-border-subtle text-on-surface px-md py-sm text-label-md disabled:opacity-40 hover:bg-surface-container transition-colors">← Prev</button>
                  <span className="text-body-sm text-on-surface-variant">Page {page} of {data.pagination.pages}</span>
                  <button onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))} disabled={page === data.pagination.pages} className="rounded-xl border border-border-subtle text-on-surface px-md py-sm text-label-md disabled:opacity-40 hover:bg-surface-container transition-colors">Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
