import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown } from 'lucide-react';
import api from '../../api/client';

function StatCard({ label, value, sub, loading }) {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="h-3 w-24 bg-softbg rounded animate-pulse mb-3" />
        <div className="h-7 w-32 bg-softbg rounded animate-pulse" />
      </div>
    );
  }
  return (
    <div className="card p-5">
      <span className="text-xs font-semibold text-slatetext">{label}</span>
      <p className="text-2xl font-bold text-ink mt-1">{value}</p>
      {sub && <p className="text-xs text-slatetext mt-1">{sub}</p>}
    </div>
  );
}

function GrowthBadge({ pct }) {
  if (pct == null) return null;
  const positive = pct >= 0;
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-semibold ${positive ? 'text-emerald-600' : 'text-red-500'}`}>
      {positive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
      {Math.abs(pct).toFixed(1)}%
    </span>
  );
}

const PLAN_COLORS = {
  enterprise: 'bg-deepblue',
  pro:        'bg-purple-500',
  verified:   'bg-emerald-500',
  free:       'bg-gray-300',
};

const PLAN_TEXT_COLORS = {
  enterprise: 'text-deepblue',
  pro:        'text-purple-600',
  verified:   'text-emerald-600',
  free:       'text-gray-500',
};

export default function RevenueInsights() {
  const { data: revenue, isLoading } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: () => api.get('/api/analytics/revenue').then(r => r.data),
  });

  const planBreakdown = revenue?.planBreakdown || {};
  const maxCount = Math.max(...Object.values(planBreakdown).map(v => v || 0), 1);

  return (
    <div className="space-y-8">
      <h1 className="text-xl font-bold text-ink">Revenue Insights</h1>

      {/* Row 1: Key metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className={`card p-5 ${isLoading ? '' : ''}`}>
          {isLoading ? (
            <>
              <div className="h-3 w-20 bg-softbg rounded animate-pulse mb-3" />
              <div className="h-7 w-28 bg-softbg rounded animate-pulse mb-2" />
              <div className="h-3 w-16 bg-softbg rounded animate-pulse" />
            </>
          ) : (
            <>
              <span className="text-xs font-semibold text-slatetext">MRR</span>
              <p className="text-2xl font-bold text-ink mt-1">
                ₱{(revenue?.mrr || 0).toLocaleString()}
              </p>
              <div className="mt-1">
                <GrowthBadge pct={revenue?.mrrGrowth} />
              </div>
            </>
          )}
        </div>

        <StatCard
          label="Paid Dealers"
          value={isLoading ? '—' : `${revenue?.activePaidDealers ?? 0} / ${revenue?.totalDealers ?? 0}`}
          sub={isLoading ? null : 'active / total'}
          loading={false}
        />

        <StatCard
          label="ARPU"
          value={isLoading ? '—' : `₱${(revenue?.arpu || 0).toLocaleString()}`}
          loading={false}
        />

        <StatCard
          label="Featured Revenue"
          value={isLoading ? '—' : `₱${(revenue?.featuredRevenue || 0).toLocaleString()}`}
          sub={isLoading ? null : `${revenue?.activeFeatured ?? 0} active promotions`}
          loading={false}
        />
      </div>

      {/* Row 2: Plan breakdown */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-ink mb-4">Plan Breakdown</h2>
        {isLoading ? (
          <div className="space-y-3">
            {[1,2,3,4].map(i => (
              <div key={i} className="h-8 bg-softbg rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {['enterprise', 'pro', 'verified', 'free'].map(plan => {
              const count = planBreakdown[plan] || 0;
              const widthPct = Math.round((count / maxCount) * 100);
              const barColor = PLAN_COLORS[plan] || 'bg-gray-300';
              const textColor = PLAN_TEXT_COLORS[plan] || 'text-gray-500';

              return (
                <div key={plan} className="flex items-center gap-3">
                  <span className={`text-xs font-semibold capitalize w-20 shrink-0 ${textColor}`}>
                    {plan}
                  </span>
                  <div className="flex-1 bg-softbg rounded-full h-4 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor}`}
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-ink w-8 text-right shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Row 3: MoM comparison */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-ink mb-4">Month-over-Month</h2>
        {isLoading ? (
          <div className="flex gap-8">
            <div>
              <div className="h-3 w-20 bg-softbg rounded animate-pulse mb-2" />
              <div className="h-8 w-28 bg-softbg rounded animate-pulse" />
            </div>
            <div>
              <div className="h-3 w-20 bg-softbg rounded animate-pulse mb-2" />
              <div className="h-8 w-28 bg-softbg rounded animate-pulse" />
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-8 items-end">
            <div>
              <p className="text-xs text-slatetext font-medium mb-1">This Month</p>
              <p className="text-3xl font-bold text-ink">₱{(revenue?.mrr || 0).toLocaleString()}</p>
              <p className="text-xs text-slatetext mt-1">{revenue?.invoicesThisMonth ?? 0} invoices</p>
            </div>
            <div>
              <p className="text-xs text-slatetext font-medium mb-1">Last Month</p>
              <p className="text-3xl font-bold text-slatetext">₱{(revenue?.lastMrr || 0).toLocaleString()}</p>
            </div>
            {revenue?.mrrGrowth != null && (
              <div className="pb-1">
                <p className="text-xs text-slatetext font-medium mb-1">Growth</p>
                <GrowthBadge pct={revenue.mrrGrowth} />
                <p className="text-xs text-slatetext mt-0.5">
                  {revenue.mrrGrowth >= 0 ? '+' : ''}
                  ₱{((revenue.mrr || 0) - (revenue.lastMrr || 0)).toLocaleString()}
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
