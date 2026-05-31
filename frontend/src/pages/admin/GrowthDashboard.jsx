import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Users, CalendarCheck, TrendingUp, Trophy, DollarSign, XCircle, CheckCircle, BarChart2 } from 'lucide-react';
import api from '../../api/client';

const STAGES = [
  { key: 'prospect',       label: 'Prospect' },
  { key: 'contacted',      label: 'Contacted' },
  { key: 'demo_scheduled', label: 'Demo Scheduled' },
  { key: 'demo_completed', label: 'Demo Done' },
  { key: 'proposal_sent',  label: 'Proposal Sent' },
  { key: 'negotiating',    label: 'Negotiating' },
  { key: 'won',            label: 'Won' },
  { key: 'lost',           label: 'Lost' },
];

const BAR_COLORS = {
  prospect:       'bg-gray-400',
  contacted:      'bg-blue-500',
  demo_scheduled: 'bg-indigo-500',
  demo_completed: 'bg-purple-500',
  proposal_sent:  'bg-orange-500',
  negotiating:    'bg-yellow-500',
  won:            'bg-emerald-500',
  lost:           'bg-red-400',
};

const DEMO_STATUS_COLORS = {
  scheduled:  'bg-blue-100 text-blue-700',
  completed:  'bg-emerald-100 text-emerald-700',
  no_show:    'bg-red-100 text-red-600',
  cancelled:  'bg-gray-100 text-gray-600',
};

function fmt(n) {
  return `₱${(n || 0).toLocaleString()}`;
}

function fmtDate(x) {
  if (!x) return '—';
  return new Date(x).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StatCard({ label, value, sub, icon: Icon, color = 'text-deepblue bg-deepblue/10', loading }) {
  if (loading) {
    return (
      <div className="card p-5">
        <div className="h-3 w-24 bg-softbg rounded animate-pulse mb-3" />
        <div className="h-7 w-20 bg-softbg rounded animate-pulse" />
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
        <p className="text-xs font-semibold text-slatetext">{label}</p>
        <p className="text-2xl font-bold text-ink mt-0.5">{value}</p>
        {sub && <p className="text-xs text-slatetext mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

const GOALS = [
  { label: '50 qualified prospects tracked', check: (d) => (d?.prospects?.total || 0) >= 50 },
  { label: '10 demos scheduled', check: (d) => (d?.demos?.total || 0) >= 10 },
  { label: '5 demos completed', check: (d) => (d?.demos?.completed || 0) >= 5 },
  { label: '5 founding dealer applications', check: (d) => (d?.dealers?.won || 0) >= 5 },
  { label: 'First paying dealer', check: (d) => (d?.dealers?.won || 0) >= 1 },
];

function loadBullets(key, defaults) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaults;
  } catch {
    return defaults;
  }
}

function BulletEditor({ storageKey, title, defaults }) {
  const [items, setItems] = useState(() => loadBullets(storageKey, defaults));
  useEffect(() => { localStorage.setItem(storageKey, JSON.stringify(items)); }, [storageKey, items]);
  return (
    <div className="card p-4 space-y-2">
      <p className="text-xs font-bold text-slatetext uppercase tracking-wide">{title}</p>
      {items.map((item, i) => (
        <input
          key={i}
          className="input w-full text-sm"
          value={item}
          onChange={e => setItems(arr => arr.map((v, j) => j === i ? e.target.value : v))}
          placeholder={`Bullet ${i + 1}`}
        />
      ))}
    </div>
  );
}

function ExecutiveView() {
  const { data: closingSummary } = useQuery({
    queryKey: ['admin-closing-summary'],
    queryFn: () => api.get('/admin/closing/summary').then(r => r.data),
  });
  const { data: churnRisks } = useQuery({
    queryKey: ['admin-churn-risk'],
    queryFn: () => api.get('/admin/churn-risk').then(r => r.data),
  });

  const risks = Array.isArray(churnRisks) ? churnRisks : churnRisks?.risks || [];
  const topRisks = risks.slice(0, 3);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
      {/* Dealer #1 Status */}
      <div className="card p-5 col-span-1">
        <p className="text-xs font-bold text-slatetext uppercase tracking-wide mb-3">Dealer #1 Status</p>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs text-slatetext">Current MRR</p>
            <p className="font-bold text-ink">₱0</p>
          </div>
          <div>
            <p className="text-xs text-slatetext">Pipeline MRR</p>
            <p className="font-bold text-ink">₱{(closingSummary?.totalPipeline || 0).toLocaleString()}</p>
          </div>
        </div>
        <div className="mt-3 space-y-1 text-sm">
          {[
            { label: 'Agreement', value: '—' },
            { label: 'Invoice', value: '—' },
            { label: 'Onboarding', value: '—' },
            { label: 'Renewal Probability', value: '—' },
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between">
              <span className="text-slatetext text-xs">{label}</span>
              <span className="font-semibold text-ink text-xs">{value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Churn Risk */}
      <div className="card p-5">
        <p className="text-xs font-bold text-slatetext uppercase tracking-wide mb-3">
          Churn Risk
          {risks.length > 0 && (
            <span className="ml-2 inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px]">
              {risks.length} open
            </span>
          )}
        </p>
        {topRisks.length === 0 ? (
          <p className="text-xs text-slatetext">No churn risks detected.</p>
        ) : (
          <div className="space-y-2">
            {topRisks.map((r, i) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-ink font-medium truncate">{r.dealerName || r.name || '—'}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-slatetext">{r.trigger || r.topTrigger || '—'}</span>
                  <span className="inline-flex items-center rounded-full bg-red-100 text-red-700 px-2 py-0.5 text-[10px] font-bold">
                    {r.riskScore ?? r.score ?? '—'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top Blockers */}
      <BulletEditor
        storageKey="exec_blockers"
        title="Top Blockers"
        defaults={['', '', '']}
      />

      {/* Top Opportunities */}
      <BulletEditor
        storageKey="exec_opportunities"
        title="Top Opportunities"
        defaults={['', '', '']}
      />
    </div>
  );
}

export default function GrowthDashboard() {
  const [execView, setExecView] = useState(false);

  const { data: growth, isLoading } = useQuery({
    queryKey: ['admin-growth'],
    queryFn: () => api.get('/admin/growth').then(r => r.data),
  });

  const { data: demos, isLoading: demosLoading } = useQuery({
    queryKey: ['admin-demos'],
    queryFn: () => api.get('/admin/demos').then(r => r.data),
  });

  const wonCount = growth?.dealers?.won || 0;
  const byStage = growth?.prospects?.byStage || {};
  const maxStageCount = Math.max(...STAGES.map(s => byStage[s.key] || 0), 1);

  const demoCompletionRate = growth?.demos?.total
    ? Math.round(((growth.demos.completed || 0) / growth.demos.total) * 100)
    : 0;

  const demoList = Array.isArray(demos) ? demos : demos?.demos || [];
  const pendingDemos = demoList.filter(d => d.status === 'scheduled');

  const lostReasons = growth?.dealers?.lostReasons || [];
  const reasonCounts = lostReasons.reduce((acc, r) => {
    acc[r] = (acc[r] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-ink">Growth Dashboard</h1>
          <p className="text-sm text-slatetext mt-1">Path to first 5 paying dealers</p>
        </div>
        <button
          onClick={() => setExecView(v => !v)}
          className={`rounded-lg border px-4 py-2 text-xs font-semibold transition-colors ${
            execView ? 'bg-deepblue text-white border-deepblue' : 'border-cardborder text-slatetext hover:text-ink hover:bg-softbg'
          }`}
        >
          {execView ? 'Full Dashboard' : 'Executive View'}
        </button>
      </div>

      {execView && <ExecutiveView />}

      {/* Progress bar — 5 founding dealer slots */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-bold text-ink">Founding Dealers</p>
          <span className="text-sm font-bold text-deepblue">{wonCount} of 5</span>
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={i}
              className={`flex-1 h-4 rounded-full transition-colors ${i < wonCount ? 'bg-emerald-500' : 'bg-softbg border border-cardborder'}`}
            />
          ))}
        </div>
        {wonCount === 0 ? (
          <p className="text-sm font-bold text-orange-600 mt-3">No paying dealers yet — start here.</p>
        ) : (
          <p className="text-xs text-slatetext mt-2">{5 - wonCount} slot{5 - wonCount !== 1 ? 's' : ''} remaining</p>
        )}
      </div>

      {/* Row 1: 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Prospects"
          value={growth?.prospects?.total ?? 0}
          icon={Users}
          color="text-deepblue bg-deepblue/10"
          loading={isLoading}
        />
        <StatCard
          label="Demos Booked"
          value={growth?.demos?.total ?? 0}
          icon={CalendarCheck}
          color="text-indigo-600 bg-indigo-100"
          loading={isLoading}
        />
        <StatCard
          label="Demo Completion Rate"
          value={`${demoCompletionRate}%`}
          sub={`${growth?.demos?.completed ?? 0} completed · ${growth?.demos?.noShow ?? 0} no-show`}
          icon={CheckCircle}
          color="text-purple-600 bg-purple-100"
          loading={isLoading}
        />
        <StatCard
          label="Close Rate"
          value={`${growth?.conversion?.closeRate ?? 0}%`}
          sub={`Demo-to-close: ${growth?.conversion?.demoToClose ?? 0}%`}
          icon={TrendingUp}
          color="text-emerald-600 bg-emerald-100"
          loading={isLoading}
        />
      </div>

      {/* Row 2: 4 stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Pipeline Value"
          value={fmt(growth?.pipeline?.totalValue)}
          sub="total expected MRR"
          icon={DollarSign}
          color="text-emerald-600 bg-emerald-100"
          loading={isLoading}
        />
        <StatCard
          label="Weighted MRR"
          value={fmt(growth?.pipeline?.weightedValue)}
          sub="probability adjusted"
          icon={TrendingUp}
          color="text-purple-600 bg-purple-100"
          loading={isLoading}
        />
        <StatCard
          label="Won Dealers"
          value={growth?.dealers?.won ?? 0}
          icon={Trophy}
          color="text-amber-600 bg-amber-100"
          loading={isLoading}
        />
        <StatCard
          label="Lost Dealers"
          value={growth?.dealers?.lost ?? 0}
          icon={XCircle}
          color="text-red-600 bg-red-100"
          loading={isLoading}
        />
      </div>

      {/* Pipeline funnel */}
      <div className="card p-5">
        <div className="flex items-center gap-2 mb-4">
          <BarChart2 className="h-4 w-4 text-slatetext" />
          <h2 className="text-base font-semibold text-ink">Pipeline Funnel</h2>
        </div>
        {isLoading ? (
          <div className="space-y-2">
            {STAGES.map(s => (
              <div key={s.key} className="h-7 bg-softbg rounded-lg animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {STAGES.map(s => {
              const count = byStage[s.key] || 0;
              const widthPct = Math.round((count / maxStageCount) * 100);
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <span className="text-xs font-medium text-slatetext w-28 shrink-0">{s.label}</span>
                  <div className="flex-1 bg-softbg rounded-full h-5 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${BAR_COLORS[s.key]}`}
                      style={{ width: count === 0 ? '2px' : `${widthPct}%` }}
                    />
                  </div>
                  <span className="text-xs font-bold text-ink w-6 text-right shrink-0">{count}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Pending demos */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-ink mb-4">Upcoming Demos</h2>
        {demosLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => <div key={i} className="h-10 bg-softbg rounded-lg animate-pulse" />)}
          </div>
        ) : pendingDemos.length === 0 ? (
          <div className="text-center py-8">
            <CalendarCheck className="h-8 w-8 opacity-30 mx-auto mb-2 text-slatetext" />
            <p className="text-sm text-slatetext">No upcoming demos scheduled.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-cardborder bg-softbg text-left text-xs font-semibold text-slatetext uppercase tracking-wide">
                  {['Date', 'Name', 'Company', 'Type', 'Status'].map(h => (
                    <th key={h} className="px-4 py-2 whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-cardborder">
                {pendingDemos.map((d, i) => (
                  <tr key={d.id || d._id || i} className="hover:bg-softbg transition-colors">
                    <td className="px-4 py-2.5 text-slatetext whitespace-nowrap">{fmtDate(d.scheduledAt)}</td>
                    <td className="px-4 py-2.5 font-medium text-ink">{d.name || d.contactName || '—'}</td>
                    <td className="px-4 py-2.5 text-slatetext">{d.company || d.dealerName || '—'}</td>
                    <td className="px-4 py-2.5 text-slatetext capitalize">{d.demoType?.replace('_', ' ') || '—'}</td>
                    <td className="px-4 py-2.5">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold capitalize ${DEMO_STATUS_COLORS[d.status] || 'bg-gray-100 text-gray-600'}`}>
                        {d.status || '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Lost reasons */}
      {Object.keys(reasonCounts).length > 0 && (
        <div className="card p-5">
          <h2 className="text-base font-semibold text-ink mb-4">Lost Reasons</h2>
          <div className="space-y-2">
            {Object.entries(reasonCounts)
              .sort((a, b) => b[1] - a[1])
              .map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between">
                  <span className="text-sm text-ink">{reason}</span>
                  <span className="text-xs font-bold bg-red-100 text-red-700 rounded-full px-2 py-0.5">{count}</span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Goals checklist */}
      <div className="card p-5">
        <h2 className="text-base font-semibold text-ink mb-4">Goals Checklist</h2>
        <div className="space-y-2.5">
          {GOALS.map(({ label, check }) => {
            const met = check(growth);
            return (
              <div key={label} className="flex items-center gap-2.5">
                <div className={`h-5 w-5 rounded-full flex items-center justify-center shrink-0 ${met ? 'bg-emerald-500' : 'bg-softbg border border-cardborder'}`}>
                  {met && <CheckCircle className="h-3.5 w-3.5 text-white" />}
                </div>
                <span className={`text-sm ${met ? 'text-emerald-700 font-medium line-through' : 'text-ink'}`}>{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
