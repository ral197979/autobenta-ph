import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, X, ArrowUpDown } from 'lucide-react';
import api from '../api/client';
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
  const [showFilters, setShowFilters] = useState(false);
  const [sort, setSort] = useState('createdAt_desc');
  const [page, setPage] = useState(1);
  const geo = useGeolocation();

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
    yearMin: '', yearMax: '', priceMin: '', priceMax: '',
    mileageMax: '', fuelType: '', transmission: '', location: '',
    sellerType: '', condition: '', radius: '50',
    verified: searchParams.get('verified') || '',
  });

  useEffect(() => {
    setPage(1);
  }, [filters, sort]);

  // When geo activates, auto-switch sort to nearest first
  useEffect(() => {
    if (geo.active) setSort('nearby_asc');
  }, [geo.active]);

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
    setFilters({ search: '', make: '', model: '', yearMin: '', yearMax: '', priceMin: '', priceMax: '', mileageMax: '', fuelType: '', transmission: '', location: '', sellerType: '', condition: '', radius: '50', verified: '' });
    setSearchParams({});
  };

  const activeFilterCount = Object.values(filters).filter(v => v !== '').length;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5 gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Browse Cars</h1>
          <p className="text-sm text-gray-500">
            {isLoading ? 'Loading...' : `${data?.pagination?.total?.toLocaleString() || 0} cars found`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 btn-secondary text-sm ${activeFilterCount > 0 ? 'border-primary-500 text-primary-700' : ''}`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters{activeFilterCount > 0 && <span className="bg-primary-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">{activeFilterCount}</span>}
          </button>
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-gray-400" />
            <select value={sort} onChange={e => setSort(e.target.value)} className="input text-sm py-2">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {filters.verified === 'true' && (
        <div className="flex items-center gap-2 mb-4">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-deepblue/20 bg-deepblue/5 px-3 py-1 text-xs font-semibold text-deepblue">
            Verified sellers only
            <button
              type="button"
              onClick={() => setFilters(p => ({ ...p, verified: '' }))}
              className="ml-0.5 hover:text-ink transition-colors"
              aria-label="Remove filter"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        </div>
      )}

      {/* Search bar */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search by make, model, or description..."
          value={filters.search}
          onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
          className="input"
        />
      </div>

      <div className="flex gap-6">
        {/* Sidebar filters (desktop) */}
        <div className="hidden lg:block w-64 shrink-0">
          <FilterPanel filters={filters} onChange={setFilters} onReset={resetFilters} geo={geo} />
        </div>

        {/* Mobile filter drawer */}
        {showFilters && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
            <div className="absolute right-0 top-0 bottom-0 w-80 bg-white overflow-y-auto p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold">Filters</h2>
                <button onClick={() => setShowFilters(false)}><X className="w-5 h-5" /></button>
              </div>
              <FilterPanel filters={filters} onChange={setFilters} onReset={resetFilters} geo={geo} />
              <button onClick={() => setShowFilters(false)} className="mt-4 w-full btn-primary">
                Show {data?.pagination?.total || 0} Results
              </button>
            </div>
          </div>
        )}

        {/* Listings grid */}
        <div className="flex-1 min-w-0">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="card overflow-hidden animate-pulse">
                  <div className="aspect-[4/3] bg-gray-200" />
                  <div className="p-4 space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-5 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : data?.listings?.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🚗</div>
              <p className="text-gray-500 text-lg">No cars match your filters.</p>
              <button onClick={resetFilters} className="mt-4 btn-primary">Clear Filters</button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {data?.listings?.map(listing => (
                  <CarCard key={listing.id} listing={listing} />
                ))}
              </div>

              {/* Pagination */}
              {data?.pagination?.pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="btn-secondary text-sm disabled:opacity-40">← Prev</button>
                  <span className="text-sm text-gray-600">Page {page} of {data.pagination.pages}</span>
                  <button onClick={() => setPage(p => Math.min(data.pagination.pages, p + 1))} disabled={page === data.pagination.pages} className="btn-secondary text-sm disabled:opacity-40">Next →</button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
