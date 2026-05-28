import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';

function StatCard({ label, value, sub, color = 'blue' }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    orange: 'bg-orange-50 text-orange-700',
    red: 'bg-red-50 text-red-700',
  };
  return (
    <div className={`rounded-xl p-4 ${colors[color]}`}>
      <p className="text-sm font-medium opacity-80">{label}</p>
      <p className="text-3xl font-bold mt-1">{value}</p>
      {sub && <p className="text-xs mt-1 opacity-70">{sub}</p>}
    </div>
  );
}

function InventoryAging({ aging }) {
  if (!aging) return null;
  return (
    <div className="bg-white rounded-xl border p-5">
      <h3 className="font-semibold text-gray-800 mb-3">Inventory Aging</h3>
      <div className="space-y-2">
        {[
          { label: '30+ days listed', value: aging.aging30, color: 'bg-yellow-400' },
          { label: '60+ days listed', value: aging.aging60, color: 'bg-orange-400' },
          { label: '90+ days listed', value: aging.aging90, color: 'bg-red-500' },
        ].map(item => (
          <div key={item.label} className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{item.label}</span>
            <div className="flex items-center gap-2">
              <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${Math.min(item.value * 10, 120)}px`, minWidth: '4px' }} />
              <span className="text-sm font-semibold w-6 text-right">{item.value}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function DealerAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['dealer-analytics'],
    queryFn: () => api.get('/dealer/analytics').then(r => r.data),
  });

  const { data: reminders } = useQuery({
    queryKey: ['dealer-reminders'],
    queryFn: () => api.get('/dealer/analytics/reminders').then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
      </div>
    );
  }

  if (!data) return null;

  const { listings, leads, inventory, recentActivities = [] } = data;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Active Listings" value={listings.active} sub={`${listings.total} total`} color="blue" />
        <StatCard label="Total Leads" value={leads.total} sub={`${leads.new30Days} new (30d)`} color="green" />
        <StatCard label="Win Rate" value={`${leads.winRate}%`} sub={`${leads.won} won · ${leads.lost} lost`} color="orange" />
        <StatCard label="Sold Units" value={listings.sold} sub="all time" color="green" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Inventory Aging */}
        <InventoryAging aging={inventory} />

        {/* Upcoming Reminders */}
        <div className="bg-white rounded-xl border p-5">
          <h3 className="font-semibold text-gray-800 mb-3">Upcoming Reminders</h3>
          {(!reminders || reminders.length === 0) ? (
            <p className="text-sm text-gray-400">No upcoming reminders.</p>
          ) : (
            <div className="space-y-2">
              {reminders.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-start justify-between text-sm">
                  <span className="text-gray-700">{r.title}</span>
                  <span className="text-gray-400 shrink-0 ml-2">{new Date(r.dueAt).toLocaleDateString('en-PH')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl border p-5">
        <h3 className="font-semibold text-gray-800 mb-3">Recent Activity</h3>
        {recentActivities.length === 0 ? (
          <p className="text-sm text-gray-400">No recent activity.</p>
        ) : (
          <div className="space-y-2">
            {recentActivities.slice(0, 10).map(a => (
              <div key={a.id} className="flex items-start gap-3 text-sm">
                <span className="text-gray-400 text-xs shrink-0 mt-0.5">
                  {new Date(a.createdAt).toLocaleDateString('en-PH')}
                </span>
                <span className="text-gray-700">{a.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
