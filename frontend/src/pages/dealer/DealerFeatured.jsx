import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Star, Info } from 'lucide-react';
import api from '../../api/client';

const FEATURE_TYPES = [
  { value: 'homepage_banner',  label: 'Homepage Banner',   pricePerWeek: 2500 },
  { value: 'search_boost',     label: 'Search Boost',      pricePerWeek: 500  },
  { value: 'sponsored',        label: 'Sponsored Listing', pricePerWeek: 300  },
  { value: 'featured_dealer',  label: 'Featured Dealer',   pricePerWeek: 1500 },
];

const DURATIONS = [
  { days: 7,  label: '7 days' },
  { days: 14, label: '14 days' },
  { days: 30, label: '30 days' },
];

const STATUS_COLORS = {
  pending:   'bg-yellow-100 text-yellow-700',
  active:    'bg-emerald-100 text-emerald-700',
  expired:   'bg-gray-100 text-gray-500',
  cancelled: 'bg-red-100 text-red-600',
};

function addDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

export default function DealerFeatured() {
  const qc = useQueryClient();
  const [listingId, setListingId] = useState('');
  const [featureType, setFeatureType] = useState('homepage_banner');
  const [duration, setDuration] = useState(7);
  const [submitError, setSubmitError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const { data: myListings = [], isLoading: listingsLoading } = useQuery({
    queryKey: ['dealer-listings-active'],
    queryFn: () => api.get('/dealers/me/listings?status=active').then(r => r.data),
  });

  const { data: featured = [], isLoading: featuredLoading } = useQuery({
    queryKey: ['dealer-featured'],
    queryFn: () => api.get('/dealer/featured').then(r => r.data),
  });

  const selectedType = FEATURE_TYPES.find(t => t.value === featureType);
  const weeks = Math.ceil(duration / 7);
  const estimatedPrice = selectedType ? selectedType.pricePerWeek * weeks : 0;

  const createFeatured = useMutation({
    mutationFn: (data) => api.post('/dealer/featured', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['dealer-featured'] });
      setSubmitSuccess(true);
      setListingId('');
      setFeatureType('homepage_banner');
      setDuration(7);
      setSubmitError(null);
      setTimeout(() => setSubmitSuccess(false), 4000);
    },
    onError: (err) => {
      setSubmitError(err?.response?.data?.error || 'Failed to create promotion.');
    },
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!listingId) return;
    setSubmitError(null);
    createFeatured.mutate({
      listingId,
      featureType,
      endAt: addDays(duration),
      pricePhp: estimatedPrice,
    });
  };

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-ink">Featured Listings</h1>

      {/* Section 1: Active promotions */}
      <div>
        <h2 className="text-base font-semibold text-ink mb-3">Active Promotions</h2>
        {featuredLoading ? (
          <div className="space-y-2">
            {[1,2].map(i => <div key={i} className="h-12 bg-softbg rounded-xl animate-pulse" />)}
          </div>
        ) : featured.length === 0 ? (
          <div className="card p-8 flex flex-col items-center gap-2 text-slatetext">
            <Star className="h-8 w-8 opacity-30" />
            <p className="text-sm">No active promotions yet.</p>
          </div>
        ) : (
          <div className="card p-0 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cardborder bg-softbg text-xs text-slatetext font-semibold uppercase tracking-wider">
                  <th className="text-left px-5 py-3">Listing</th>
                  <th className="text-left px-5 py-3">Type</th>
                  <th className="text-left px-4 py-3">Status</th>
                  <th className="text-left px-5 py-3">End Date</th>
                  <th className="text-right px-5 py-3">Price</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cardborder">
                {featured.map(f => {
                  const listing = f.listing;
                  const label = listing
                    ? `${listing.year} ${listing.make} ${listing.model}`
                    : f.listingId;
                  const typeLabel = FEATURE_TYPES.find(t => t.value === f.featureType)?.label || f.featureType;
                  const endDate = f.endAt ? new Date(f.endAt).toLocaleDateString('en-PH', { dateStyle: 'medium' }) : '—';
                  const statusColor = STATUS_COLORS[f.status] || 'bg-gray-100 text-gray-500';

                  return (
                    <tr key={f.id} className="hover:bg-softbg/50 transition-colors">
                      <td className="px-5 py-3 font-medium text-ink">{label}</td>
                      <td className="px-5 py-3 text-slatetext">{typeLabel}</td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${statusColor}`}>
                          {f.status}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-slatetext text-xs">{endDate}</td>
                      <td className="px-5 py-3 text-right font-medium text-ink">
                        ₱{(f.pricePhp || 0).toLocaleString()}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Create promotion */}
      <div>
        <h2 className="text-base font-semibold text-ink mb-3">Create New Promotion</h2>
        <div className="card p-5 max-w-lg">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Listing select */}
            <div>
              <label className="block text-xs font-semibold text-slatetext mb-1">Listing</label>
              {listingsLoading ? (
                <div className="h-10 bg-softbg rounded-xl animate-pulse" />
              ) : (
                <select
                  value={listingId}
                  onChange={e => setListingId(e.target.value)}
                  className="input text-sm"
                  required
                >
                  <option value="">Select a listing…</option>
                  {myListings.map(l => (
                    <option key={l.id} value={l.id}>
                      {l.year} {l.make} {l.model}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Feature type */}
            <div>
              <label className="block text-xs font-semibold text-slatetext mb-1">Feature Type</label>
              <select
                value={featureType}
                onChange={e => setFeatureType(e.target.value)}
                className="input text-sm"
              >
                {FEATURE_TYPES.map(t => (
                  <option key={t.value} value={t.value}>
                    {t.label} — ₱{t.pricePerWeek.toLocaleString()}/wk
                  </option>
                ))}
              </select>
            </div>

            {/* Duration */}
            <div>
              <label className="block text-xs font-semibold text-slatetext mb-2">Duration</label>
              <div className="flex gap-2">
                {DURATIONS.map(d => (
                  <button
                    key={d.days}
                    type="button"
                    onClick={() => setDuration(d.days)}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
                      duration === d.days
                        ? 'bg-deepblue text-white border-deepblue'
                        : 'border-cardborder text-slatetext hover:border-deepblue hover:text-deepblue'
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Estimated price */}
            <div className="bg-softbg rounded-xl p-3 flex items-center justify-between">
              <span className="text-sm text-slatetext font-medium">Estimated Price</span>
              <span className="text-lg font-bold text-ink">₱{estimatedPrice.toLocaleString()}</span>
            </div>

            {/* Note */}
            <div className="flex gap-2 text-xs text-slatetext bg-blue-50 border border-blue-100 rounded-xl p-3">
              <Info className="h-4 w-4 text-blue-400 shrink-0 mt-0.5" />
              <span>Promotions are reviewed and activated by our team within 24 hours.</span>
            </div>

            {submitError && (
              <p className="text-xs text-red-600 font-medium">{submitError}</p>
            )}
            {submitSuccess && (
              <p className="text-xs text-emerald-600 font-medium">Promotion submitted successfully!</p>
            )}

            <button
              type="submit"
              disabled={!listingId || createFeatured.isPending}
              className="btn-primary w-full disabled:opacity-50"
            >
              {createFeatured.isPending ? 'Submitting…' : 'Submit Promotion'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
