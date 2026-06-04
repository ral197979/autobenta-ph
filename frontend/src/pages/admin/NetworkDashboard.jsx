import { useQuery } from '@tanstack/react-query';
import { Building2, Car, TrendingUp, Zap, PenLine, Plug } from 'lucide-react';
import api from '../../api/client';

function StatCard({ label, value, icon: Icon, color = 'text-primary bg-primary/10', loading }) {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="h-3 w-24 bg-surface-container rounded animate-pulse mb-3" />
        <div className="h-7 w-16 bg-surface-container rounded animate-pulse" />
      </div>
    );
  }
  return (
    <div className="card p-5 flex items-center gap-3">
      {Icon && (
        <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div>
        <p className="text-xs font-semibold text-on-surface-variant">{label}</p>
        <p className="text-2xl font-bold text-on-surface mt-0.5">{value ?? '—'}</p>
      </div>
    </div>
  );
}

const SOURCE_STATUS = {
  healthy: (
    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
      Healthy
    </span>
  ),
  degraded: (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
      Degraded
    </span>
  ),
  error: (
    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
      Error
    </span>
  ),
};

const EVENT_BADGE = {
  sync_ok:      'bg-emerald-100 text-emerald-700',
  sync_error:   'bg-red-100 text-red-600',
  connected:    'bg-blue-100 text-blue-700',
  disconnected: 'bg-surface-container text-on-surface-variant',
};

function fmtDate(x) {
  if (!x) return '—';
  return new Date(x).toLocaleString('en-PH', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function NetworkDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-network'],
    queryFn: () => api.get('/admin/network').then(r => r.data),
    retry: 1,
  });

  const stats = data?.stats || {};
  const sources = data?.sources || [];
  const syncEvents = data?.syncEvents || [];

  const totalListings = sources.reduce((s, r) => s + (r.listings || 0), 0);

  return (
    <div className="min-h-screen bg-surface-container">
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-xl font-bold text-on-surface">Network Health</h1>
          <p className="text-sm text-on-surface-variant mt-0.5">Ryderr marketplace ecosystem.</p>
        </div>

        {isError && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
            Could not reach the network endpoint. Data may be unavailable — showing empty state.
          </div>
        )}

        {/* Stat row */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          <StatCard label="Total Dealers" value={stats.totalDealers} icon={Building2} loading={isLoading} />
          <StatCard label="Active Listings" value={stats.activeListings} icon={Car} color="text-primary bg-electric/10" loading={isLoading} />
          <StatCard label="Active Leads" value={stats.activeLeads} icon={TrendingUp} color="text-emerald-600 bg-emerald-100" loading={isLoading} />
          <StatCard label="Leads Today" value={stats.leadsToday} icon={Zap} color="text-accent bg-accent/10" loading={isLoading} />
          <StatCard label="Manual Dealers" value={stats.manualDealers} icon={PenLine} color="text-purple-600 bg-purple-100" loading={isLoading} />
          <StatCard label="V8Atlas Dealers" value={stats.v8atlasDealers} icon={Plug} color="text-indigo-600 bg-indigo-100" loading={isLoading} />
        </div>

        {/* Inventory Sources */}
        <div className="card p-5">
          <h2 className="font-bold text-on-surface mb-4">Inventory Sources</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-10 bg-surface-container rounded animate-pulse" />
              ))}
            </div>
          ) : sources.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No source data available.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-subtle text-xs font-semibold text-on-surface-variant">
                    <th className="text-left pb-3 pr-4">Source</th>
                    <th className="text-right pb-3 pr-4">Listings</th>
                    <th className="text-right pb-3 pr-4">% of Total</th>
                    <th className="text-right pb-3 pr-4">Avg Lead Rate</th>
                    <th className="text-left pb-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sources.map(row => {
                    const pct = totalListings > 0 ? Math.round((row.listings / totalListings) * 100) : 0;
                    return (
                      <tr key={row.source} className="border-b border-border-subtle last:border-0">
                        <td className="py-3 pr-4 font-medium text-on-surface capitalize">{row.source}</td>
                        <td className="py-3 pr-4 text-right text-on-surface">{row.listings ?? 0}</td>
                        <td className="py-3 pr-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <div className="w-16 bg-surface-container rounded-full h-1.5 overflow-hidden">
                              <div
                                className="h-1.5 bg-primary rounded-full"
                                style={{ width: `${pct}%` }}
                              />
                            </div>
                            <span className="text-on-surface-variant w-8 text-right">{pct}%</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-right text-on-surface-variant">
                          {row.avgLeadRate != null ? `${row.avgLeadRate} leads/listing` : '—'}
                        </td>
                        <td className="py-3">
                          {SOURCE_STATUS[row.status] ?? SOURCE_STATUS.healthy}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Sync Activity */}
        <div className="card p-5">
          <h2 className="font-bold text-on-surface mb-4">Recent Sync Activity</h2>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 bg-surface-container rounded animate-pulse" />
              ))}
            </div>
          ) : syncEvents.length === 0 ? (
            <p className="text-sm text-on-surface-variant">No recent sync activity.</p>
          ) : (
            <ul className="divide-y divide-cardborder">
              {syncEvents.slice(0, 10).map((evt, i) => (
                <li key={i} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <span
                    className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold shrink-0 ${EVENT_BADGE[evt.eventType] ?? 'bg-surface-container text-on-surface-variant'}`}
                  >
                    {evt.eventType?.replace('_', ' ') ?? 'event'}
                  </span>
                  <span className="font-medium text-on-surface text-sm truncate">{evt.dealerName ?? '—'}</span>
                  <span className="text-xs text-on-surface-variant capitalize shrink-0">{evt.source}</span>
                  <span className="text-xs text-on-surface-variant ml-auto shrink-0">{fmtDate(evt.timestamp)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
