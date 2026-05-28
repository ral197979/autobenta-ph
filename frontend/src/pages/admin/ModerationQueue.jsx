import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { formatPrice, formatRelativeTime } from '../../utils/format';

const ACTION_LABELS = {
  approve: { label: 'Approve', cls: 'bg-green-600 hover:bg-green-700' },
  reject: { label: 'Reject', cls: 'bg-red-600 hover:bg-red-700' },
  flag: { label: 'Flag', cls: 'bg-orange-500 hover:bg-orange-600' },
  request_info: { label: 'Request Info', cls: 'bg-blue-500 hover:bg-blue-600' },
};

function FraudBadge({ flags }) {
  if (!flags?.length) return null;
  return (
    <div className="flex flex-wrap gap-1 mt-1">
      {flags.map(f => (
        <span key={f.id} className={`text-xs px-1.5 py-0.5 rounded font-medium ${
          f.severity === 'high' || f.severity === 'critical' ? 'bg-red-100 text-red-700' :
          f.severity === 'medium' ? 'bg-yellow-100 text-yellow-700' :
          'bg-gray-100 text-gray-600'
        }`}>{f.title}</span>
      ))}
    </div>
  );
}

export default function ModerationQueue() {
  const [page, setPage] = useState(1);
  const [minFraudScore, setMinFraudScore] = useState(0);
  const [actionModal, setActionModal] = useState(null); // { listingId, action }
  const [reason, setReason] = useState('');
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['moderation-queue', page, minFraudScore],
    queryFn: () => api.get(`/admin/moderation?page=${page}&limit=20&minFraudScore=${minFraudScore}`).then(r => r.data),
  });

  const takeMutation = useMutation({
    mutationFn: ({ listingId, action, reason }) =>
      api.post(`/admin/moderation/${listingId}`, { action, reason }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['moderation-queue'] });
      setActionModal(null);
      setReason('');
    },
  });

  const handleAction = (listingId, action) => {
    if (action === 'approve') {
      takeMutation.mutate({ listingId, action, reason: '' });
    } else {
      setActionModal({ listingId, action });
    }
  };

  if (isLoading) return <div className="p-8 text-center text-gray-500">Loading moderation queue...</div>;

  const { listings = [], total = 0, pages = 1 } = data || {};

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Moderation Queue</h1>
          <p className="text-sm text-gray-500">{total} pending listings</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-gray-600">Min Fraud Score:</label>
          <select
            value={minFraudScore}
            onChange={e => { setMinFraudScore(+e.target.value); setPage(1); }}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value={0}>All</option>
            <option value={25}>25+ (Medium)</option>
            <option value={50}>50+ (High)</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {listings.length === 0 && (
          <div className="text-center py-12 text-gray-500 bg-white rounded-lg border">
            No listings pending review.
          </div>
        )}
        {listings.map(listing => (
          <div key={listing.id} className="bg-white rounded-lg border p-4 flex gap-4">
            <img
              src={listing.photos?.[0]?.url || '/placeholder-car.jpg'}
              alt=""
              className="w-28 h-20 object-cover rounded shrink-0"
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {listing.year} {listing.make} {listing.model}
                  </h3>
                  <p className="text-blue-600 font-medium">{formatPrice(listing.price)}</p>
                  <p className="text-sm text-gray-500">
                    Seller: {listing.seller?.name} · {listing._count?.photos || 0} photos · {formatRelativeTime(listing.createdAt)}
                  </p>
                  <FraudBadge flags={listing.fraudFlagRecords} />
                </div>
                <div className="text-right shrink-0">
                  {listing.fraudScore > 0 && (
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${
                      listing.fraudScore >= 50 ? 'bg-red-100 text-red-700' :
                      listing.fraudScore >= 25 ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      Fraud Score: {listing.fraudScore}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2 shrink-0">
              {Object.entries(ACTION_LABELS).map(([action, { label, cls }]) => (
                <button
                  key={action}
                  onClick={() => handleAction(listing.id, action)}
                  className={`text-white text-xs px-3 py-1.5 rounded font-medium ${cls}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {pages > 1 && (
        <div className="flex justify-center gap-2 mt-6">
          {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
            <button
              key={p}
              onClick={() => setPage(p)}
              className={`px-3 py-1 rounded border text-sm ${p === page ? 'bg-blue-600 text-white border-blue-600' : 'border-gray-300'}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Action modal */}
      {actionModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="font-semibold text-gray-900 mb-3 capitalize">{actionModal.action.replace(/_/g, ' ')} Listing</h3>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason (optional)"
              rows={3}
              className="w-full border rounded-lg p-2 text-sm mb-4"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={() => { setActionModal(null); setReason(''); }}
                className="px-4 py-2 border rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => takeMutation.mutate({ listingId: actionModal.listingId, action: actionModal.action, reason })}
                disabled={takeMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                {takeMutation.isPending ? 'Saving...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
