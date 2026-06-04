import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Car, Users, Clock, BarChart2 } from 'lucide-react';
import api from '../../api/client';
import DealerReminders from './DealerReminders';

function StatCard({ label, value, sub, icon: Icon, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-on-surface">{value}</p>
        <p className="text-xs text-on-surface-variant">{label}</p>
        {sub && <p className="text-[11px] text-on-surface-variant/70 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function InventoryAging({ aging }) {
  if (!aging) return null;
  const bars = [
    { label: '30+ days', value: aging.aging30, color: 'bg-yellow-400' },
    { label: '60+ days', value: aging.aging60, color: 'bg-orange-400' },
    { label: '90+ days', value: aging.aging90, color: 'bg-red-500' },
  ];
  const max = Math.max(...bars.map(b => b.value), 1);
  return (
    <div className="card p-5">
      <h3 className="font-bold text-sm text-on-surface mb-4">Inventory Aging</h3>
      <div className="space-y-3">
        {bars.map(item => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-on-surface-variant">{item.label}</span>
              <span className="text-xs font-semibold text-on-surface">{item.value}</span>
            </div>
            <div className="h-2 rounded-full bg-surface-container overflow-hidden">
              <div
                className={`h-full rounded-full ${item.color} transition-all`}
                style={{ width: `${(item.value / max) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const SCORE_COLORS = {
  A: 'text-emerald-600 bg-emerald-100',
  B: 'text-blue-600 bg-blue-100',
  C: 'text-yellow-600 bg-yellow-100',
  D: 'text-red-600 bg-red-100',
};

function ScorecardSection({ scorecard }) {
  if (!scorecard) return null;

  const rank = scorecard.rank || 'B';
  const rankColor = SCORE_COLORS[rank] || SCORE_COLORS.B;

  return (
    <div className="card p-5">
      <h3 className="font-bold text-sm text-on-surface mb-4">Performance Score</h3>
      <div className="flex items-center gap-5">
        <div className={`h-16 w-16 rounded-2xl flex flex-col items-center justify-center shrink-0 ${rankColor}`}>
          <span className="text-2xl font-bold leading-none">{rank}</span>
          <span className="text-xs font-semibold mt-0.5">{scorecard.score ?? '—'}</span>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant text-xs">Verified</span>
            <span className="font-medium text-on-surface">{scorecard.verified ? 'Yes' : 'No'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant text-xs">Tier</span>
            <span className="font-medium text-on-surface capitalize">{scorecard.tier || '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant text-xs">Win Rate</span>
            <span className="font-medium text-on-surface">{scorecard.winRate != null ? `${scorecard.winRate}%` : '—'}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-on-surface-variant text-xs">Response Time</span>
            <span className="font-medium text-on-surface">{scorecard.responseTime || '—'}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function DealerAnalytics() {
  const { data, isLoading } = useQuery({
    queryKey: ['dealer-analytics'],
    queryFn: () => api.get('/dealer/analytics').then(r => r.data),
  });

  const { data: scorecard } = useQuery({
    queryKey: ['dealer-scorecard'],
    queryFn: () => api.get('/dealer/analytics/scorecard').then(r => r.data),
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-7 w-32 bg-surface-container rounded animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1,2,3,4].map(i => <div key={i} className="card h-24 animate-pulse bg-surface-container" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { listings, leads, inventory, recentActivities = [] } = data;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-on-surface">Analytics</h1>

      <ScorecardSection scorecard={scorecard} />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Car} label="Active Listings" value={listings.active} sub={`${listings.total} total`} color="text-primary bg-primary/10" />
        <StatCard icon={Users} label="Total Leads" value={leads.total} sub={`${leads.new30Days || 0} new (30d)`} color="text-purple-600 bg-purple-100" />
        <StatCard icon={TrendingUp} label="Win Rate" value={`${leads.winRate}%`} sub={`${leads.won} won · ${leads.lost} lost`} color="text-emerald-600 bg-emerald-100" />
        <StatCard icon={BarChart2} label="Sold Units" value={listings.sold} sub="all time" color="text-orange-600 bg-orange-100" />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <InventoryAging aging={inventory} />

        <div className="card p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="h-4 w-4 text-on-surface-variant" />
            <h3 className="font-bold text-sm text-on-surface">Reminders</h3>
          </div>
          <DealerReminders />
        </div>
      </div>

      <div className="card p-5">
        <h3 className="font-bold text-sm text-on-surface mb-4">Recent Activity</h3>
        {recentActivities.length === 0 ? (
          <p className="text-sm text-on-surface-variant">No recent activity.</p>
        ) : (
          <div className="space-y-2">
            {recentActivities.slice(0, 10).map(a => (
              <div key={a.id} className="flex items-start gap-3 text-sm">
                <span className="text-on-surface-variant text-xs shrink-0 mt-0.5 w-20">
                  {new Date(a.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                </span>
                <span className="text-on-surface">{a.description}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
