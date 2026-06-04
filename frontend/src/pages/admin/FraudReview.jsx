import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { formatPrice, formatRelativeTime } from '../../utils/format';

const SEVERITY_COLORS = {
  low: 'bg-surface-container text-on-surface-variant',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-red-100 text-red-700',
  critical: 'bg-red-200 text-red-900',
};

function FraudFlag({ flag, onResolve }) {
  const [note, setNote] = useState('');
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border rounded-lg p-3 bg-surface-container-lowest">
      <div className="flex items-start justify-between gap-2">
        <div>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded ${SEVERITY_COLORS[flag.severity]}`}>
            {flag.severity}
          </span>
          <span className="ml-2 text-sm font-medium text-on-surface">{flag.title}</span>
          <p className="text-xs text-on-surface-variant mt-0.5">{flag.description}</p>
        </div>
        {!flag.isResolved && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-600 hover:underline shrink-0"
          >
            {expanded ? 'Cancel' : 'Resolve'}
          </button>
        )}
        {flag.isResolved && (
          <span className="text-xs text-green-600 shrink-0">Resolved</span>
        )}
      </div>
      {expanded && (
        <div className="mt-2 flex gap-2">
          <input
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="Resolution note"
            className="flex-1 border rounded px-2 py-1 text-xs"
          />
          <button
            onClick={() => onResolve(flag.id, note)}
            className="text-xs bg-green-600 text-white px-3 py-1 rounded"
          >
            Mark Resolved
          </button>
        </div>
      )}
    </div>
  );
}

export default function FraudReview() {
  const [page, setPage] = useState(1);
  const [minScore, setMinScore] = useState(25);
  const [selectedListing, setSelectedListing] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['fraud-listings', page, minScore],
    queryFn: () => api.get(`/admin/fraud?page=${page}&limit=20&minScore=${minScore}`).then(r => r.data),
  });

  const reanalyzeMutation = useMutation({
    mutationFn: (listingId) => api.post(`/admin/fraud/${listingId}/analyze`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fraud-listings'] }),
  });

  const resolveFlagMutation = useMutation({
    mutationFn: ({ flagId, resolveNote }) =>
      api.patch(`/admin/fraud/flags/${flagId}/resolve`, { resolveNote }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fraud-listings'] });
      qc.invalidateQueries({ queryKey: ['fraud-listing-detail'] });
    },
  });

  const { listings = [], total = 0, pages = 1 } = data || {};

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Fraud Review</h1>
          <p className="text-sm text-on-surface-variant">{total} flagged listings</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-on-surface-variant">Min Score:</label>
          <select
            value={minScore}
            onChange={e => { setMinScore(+e.target.value); setPage(1); }}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value={0}>All</option>
            <option value={25}>25+ Medium</option>
            <option value={50}>50+ High</option>
            <option value={75}>75+ Critical</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-on-surface-variant">Loading...</div>
      ) : (
        <div className="grid gap-4">
          {listings.length === 0 && (
            <div className="text-center py-12 text-on-surface-variant bg-surface-container-lowest rounded-lg border">
              No flagged listings.
            </div>
          )}
          {listings.map(listing => (
            <div key={listing.id} className="bg-surface-container-lowest rounded-lg border p-4">
              <div className="flex gap-4">
                <img
                  src={listing.photos?.[0]?.url || '/placeholder-car.jpg'}
                  alt=""
                  className="w-24 h-16 object-cover rounded shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-on-surface">
                        {listing.year} {listing.make} {listing.model}
                      </h3>
                      <p className="text-sm text-on-surface-variant">
                        {formatPrice(listing.price)} · {listing.seller?.name} · {listing.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-xs font-bold px-2 py-1 rounded ${
                        listing.fraudScore >= 75 ? 'bg-red-200 text-red-900' :
                        listing.fraudScore >= 50 ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        Score: {listing.fraudScore}
                      </span>
                      <button
                        onClick={() => reanalyzeMutation.mutate(listing.id)}
                        disabled={reanalyzeMutation.isPending}
                        className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                      >
                        Re-analyze
                      </button>
                      <button
                        onClick={() => setSelectedListing(selectedListing === listing.id ? null : listing.id)}
                        className="text-xs bg-surface-container text-on-surface px-2 py-1 rounded hover:bg-surface-container-high"
                      >
                        {selectedListing === listing.id ? 'Hide Flags' : 'View Flags'}
                      </button>
                    </div>
                  </div>
                  {listing.sellerRiskProfile && (
                    <p className="text-xs text-on-surface-variant mt-1">
                      Seller Risk: <span className={`font-medium ${
                        listing.sellerRiskProfile.riskLevel === 'critical' ? 'text-red-700' :
                        listing.sellerRiskProfile.riskLevel === 'high' ? 'text-orange-600' :
                        listing.sellerRiskProfile.riskLevel === 'medium' ? 'text-yellow-700' :
                        'text-green-700'
                      }`}>{listing.sellerRiskProfile.riskLevel} ({listing.sellerRiskProfile.riskScore})</span>
                    </p>
                  )}
                </div>
              </div>
              {selectedListing === listing.id && listing.fraudFlagRecords?.length > 0 && (
                <div className="mt-3 space-y-2">
                  {listing.fraudFlagRecords.map(flag => (
                    <FraudFlag
                      key={flag.id}
                      flag={flag}
                      onResolve={(flagId, resolveNote) => resolveFlagMutation.mutate({ flagId, resolveNote })}
                    />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded border text-sm ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-border-subtle'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
