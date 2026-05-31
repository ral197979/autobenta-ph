import { useQuery } from '@tanstack/react-query';
import { BarChart3, ShoppingBag, Building2, Users, CheckCircle, FileCheck, Wrench, CreditCard } from 'lucide-react';
import api from '../../api/client';

function StatCard({ icon: Icon, label, value, sub, color }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-ink">{value ?? '—'}</p>
        <p className="text-xs text-slatetext">{label}</p>
        {sub && <p className="text-[11px] text-slatetext/70 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      <div className="h-5 w-40 bg-softbg rounded" />
      <div className="h-24 bg-softbg rounded-xl" />
    </div>
  );
}

function EmptyState() {
  return (
    <p className="text-sm text-slatetext py-6 text-center">
      No data yet — events will appear as users interact with the platform.
    </p>
  );
}

function FunnelSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton />;

  const stages = data?.stages || [];

  return (
    <div className="card p-5">
      <h2 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
        <BarChart3 className="h-4 w-4 text-deepblue" /> Conversion Funnel
      </h2>
      {stages.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="space-y-4">
          {stages.map((stage, i) => {
            const max = stages[0]?.count || 1;
            const pct = Math.round((stage.count / max) * 100);
            const prevCount = i > 0 ? stages[i - 1].count : null;
            const dropoff = prevCount ? Math.round(((prevCount - stage.count) / prevCount) * 100) : null;
            return (
              <div key={stage.name}>
                <div className="flex items-center justify-between mb-1 text-xs">
                  <span className="font-medium text-ink">{stage.name}</span>
                  <div className="flex items-center gap-3">
                    {dropoff !== null && (
                      <span className="text-red-500">-{dropoff}%</span>
                    )}
                    <span className="text-slatetext font-semibold">{stage.count.toLocaleString()}</span>
                  </div>
                </div>
                <div className="relative h-8 rounded-lg bg-softbg overflow-hidden">
                  <div
                    className="h-full bg-deepblue rounded-lg transition-all"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function TrustImpactSection({ data, isLoading }) {
  if (isLoading) return <SectionSkeleton />;

  const badges = data?.badges || [];

  return (
    <div className="card p-5">
      <h2 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
        <CheckCircle className="h-4 w-4 text-deepblue" /> Trust Badge Impact
      </h2>
      {badges.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-slatetext border-b border-cardborder">
                <th className="pb-2 text-left font-semibold">Badge</th>
                <th className="pb-2 text-right font-semibold">With Badge</th>
                <th className="pb-2 text-right font-semibold">Without Badge</th>
                <th className="pb-2 text-right font-semibold">Uplift</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-cardborder">
              {badges.map(b => (
                <tr key={b.badge} className="hover:bg-softbg">
                  <td className="py-2.5 font-medium text-ink">{b.badge}</td>
                  <td className="py-2.5 text-right text-slatetext">{b.withBadge?.toFixed(1)}</td>
                  <td className="py-2.5 text-right text-slatetext">{b.withoutBadge?.toFixed(1)}</td>
                  <td className={`py-2.5 text-right font-semibold ${b.uplift > 0 ? 'text-emerald-600' : 'text-slatetext'}`}>
                    {b.uplift > 0 ? `+${b.uplift}%` : `${b.uplift}%`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function MarketplaceAnalytics() {
  const { data: marketplace, isLoading: loadingMarket } = useQuery({
    queryKey: ['analytics-marketplace'],
    queryFn: () => api.get('/analytics/marketplace').then(r => r.data),
  });

  const { data: funnel, isLoading: loadingFunnel } = useQuery({
    queryKey: ['analytics-funnel'],
    queryFn: () => api.get('/analytics/funnel').then(r => r.data),
  });

  const { data: trustImpact, isLoading: loadingTrust } = useQuery({
    queryKey: ['analytics-trust-impact'],
    queryFn: () => api.get('/analytics/trust-impact').then(r => r.data),
  });

  const topEvents = marketplace?.topEvents || [];

  return (
    <div className="space-y-8">
      {/* Section 1 — Marketplace Health */}
      <div>
        <h2 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-deepblue" /> Marketplace Health
        </h2>
        {loadingMarket ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card h-24 bg-softbg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={ShoppingBag} label="Total Listings" value={marketplace?.totalListings?.toLocaleString()} color="text-deepblue bg-deepblue/10" />
            <StatCard icon={CheckCircle} label="Active Listings" value={marketplace?.activeListings?.toLocaleString()} color="text-emerald-600 bg-emerald-100" />
            <StatCard icon={CheckCircle} label="Verified Listings" value={marketplace?.verifiedListings?.toLocaleString()} color="text-blue-600 bg-blue-100" />
            <StatCard icon={FileCheck} label="Transfer Ready" value={marketplace?.transferReady?.toLocaleString()} color="text-purple-600 bg-purple-100" />
            <StatCard icon={Building2} label="Total Dealers" value={marketplace?.totalDealers?.toLocaleString()} color="text-orange-600 bg-orange-100" />
            <StatCard icon={Users} label="Lead Volume (30d)" value={marketplace?.leadVolume30d?.toLocaleString()} color="text-pink-600 bg-pink-100" />
            <StatCard icon={Wrench} label="Inspections (30d)" value={marketplace?.inspectionVolume30d?.toLocaleString()} color="text-yellow-600 bg-yellow-100" />
            <StatCard icon={CreditCard} label="Financing (30d)" value={marketplace?.financingVolume30d?.toLocaleString()} color="text-teal-600 bg-teal-100" />
          </div>
        )}
      </div>

      {/* Section 2 — Conversion Funnel */}
      <FunnelSection data={funnel} isLoading={loadingFunnel} />

      {/* Section 3 — Trust Impact */}
      <TrustImpactSection data={trustImpact} isLoading={loadingTrust} />

      {/* Section 4 — Top Event Types */}
      <div className="card p-5">
        <h2 className="text-sm font-bold text-ink mb-4 flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-deepblue" /> Top Event Types (Last 30d)
        </h2>
        {loadingMarket ? (
          <div className="space-y-2 animate-pulse">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-6 bg-softbg rounded w-3/4" />
            ))}
          </div>
        ) : topEvents.length === 0 ? (
          <EmptyState />
        ) : (
          <ol className="space-y-2">
            {topEvents.slice(0, 10).map((e, i) => (
              <li key={e.type} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="w-5 text-xs text-slatetext font-mono">{i + 1}.</span>
                  <span className="font-medium text-ink">{e.type}</span>
                </span>
                <span className="text-slatetext text-xs">{e.count?.toLocaleString()}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </div>
  );
}
