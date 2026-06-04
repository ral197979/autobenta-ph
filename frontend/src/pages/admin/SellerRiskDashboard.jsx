import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';

const RISK_COLORS = {
  low: 'bg-green-100 text-green-700',
  medium: 'bg-yellow-100 text-yellow-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-800',
};

export default function SellerRiskDashboard() {
  const [minRisk, setMinRisk] = useState('medium');
  const [page, setPage] = useState(1);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['seller-risk', minRisk, page],
    queryFn: () =>
      api.get(`/admin/fraud/sellers?minRisk=${minRisk}&page=${page}&limit=20`).then(r => r.data),
  });

  const suspendMutation = useMutation({
    mutationFn: ({ userId, isSuspended }) =>
      api.patch(`/admin/users/${userId}`, { isSuspended }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['seller-risk'] }),
  });

  const { profiles = [], total = 0, pages = 1 } = data || {};

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-on-surface">Seller Risk Dashboard</h1>
          <p className="text-sm text-on-surface-variant">{total} sellers at elevated risk</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="text-sm text-on-surface-variant">Min Risk:</label>
          <select
            value={minRisk}
            onChange={e => { setMinRisk(e.target.value); setPage(1); }}
            className="border rounded px-2 py-1 text-sm"
          >
            <option value="low">All</option>
            <option value="medium">Medium+</option>
            <option value="high">High+</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-12 text-on-surface-variant">Loading...</div>
      ) : (
        <div className="bg-surface-container-lowest rounded-xl border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-surface-container border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-on-surface-variant">Seller</th>
                <th className="text-left px-4 py-3 font-medium text-on-surface-variant">Risk Level</th>
                <th className="text-right px-4 py-3 font-medium text-on-surface-variant">Score</th>
                <th className="text-right px-4 py-3 font-medium text-on-surface-variant">Listings</th>
                <th className="text-right px-4 py-3 font-medium text-on-surface-variant">Flagged</th>
                <th className="text-center px-4 py-3 font-medium text-on-surface-variant">Flags</th>
                <th className="text-center px-4 py-3 font-medium text-on-surface-variant">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {profiles.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-on-surface-variant">No sellers at this risk level.</td>
                </tr>
              )}
              {profiles.map(profile => (
                <tr key={profile.id} className="hover:bg-surface-container">
                  <td className="px-4 py-3">
                    <div className="font-medium text-on-surface">{profile.user?.name}</div>
                    <div className="text-xs text-on-surface-variant">{profile.user?.email}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${RISK_COLORS[profile.riskLevel]}`}>
                      {profile.riskLevel}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right font-mono font-semibold">{profile.riskScore}</td>
                  <td className="px-4 py-3 text-right">{profile.totalListings}</td>
                  <td className="px-4 py-3 text-right">{profile.flaggedListings}</td>
                  <td className="px-4 py-3 text-center text-xs">
                    {profile.rapidListings && <span className="bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded mr-1">Rapid</span>}
                    {profile.duplicateHistory && <span className="bg-red-100 text-red-700 px-1.5 py-0.5 rounded">Dupe</span>}
                  </td>
                  <td className="px-4 py-3 text-center">
                    {profile.user?.isSuspended ? (
                      <span className="text-xs text-red-600 font-medium">Suspended</span>
                    ) : (
                      <span className="text-xs text-green-600">Active</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => suspendMutation.mutate({
                        userId: profile.userId,
                        isSuspended: !profile.user?.isSuspended,
                      })}
                      className={`text-xs px-2 py-1 rounded ${
                        profile.user?.isSuspended
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                      }`}
                    >
                      {profile.user?.isSuspended ? 'Restore' : 'Suspend'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
