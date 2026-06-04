import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X } from 'lucide-react';
import api from '../../api/client';

const TTV_MILESTONES = [
  'Agreement Signed',
  'Invoice Paid',
  'First Login',
  'First Listing',
  'First Lead',
  'First Response',
  'First Qualified Lead',
  'First Sale',
];

const TASK_ICONS = { check_in: '📞', training: '🎓', optimization: '⚙️', renewal_prep: '🔄' };

function daysSince(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function fmtDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function healthColor(score) {
  if (score >= 75) return 'text-green-600';
  if (score >= 50) return 'text-yellow-600';
  if (score >= 25) return 'text-orange-500';
  return 'text-red-600';
}

function renewalBadge(level) {
  const map = {
    High: 'bg-green-100 text-green-800',
    Medium: 'bg-yellow-100 text-yellow-800',
    Low: 'bg-orange-100 text-orange-800',
    Critical: 'bg-red-100 text-red-800',
  };
  return map[level] || 'bg-surface-container text-on-surface';
}

function healthStatusColor(status) {
  const map = { Healthy: 'text-green-600', Watch: 'text-yellow-600', 'At Risk': 'text-orange-500', Critical: 'text-red-600' };
  return map[status] || 'text-on-surface-variant';
}

// --- TTV Drawer ---
function TTVDrawer({ dealer, onClose }) {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(false);
  const ttv = dealer.ttv || {};
  const [form, setForm] = useState(() =>
    Object.fromEntries(TTV_MILESTONES.map(m => [m, ttv[m] || '']))
  );

  const mutation = useMutation({
    mutationFn: (data) => api.patch(`/admin/dealer-success/${dealer.id || dealer._id}/ttv`, data).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['dealer-success']); setEditing(false); },
  });

  const dates = TTV_MILESTONES.map(m => (ttv[m] ? new Date(ttv[m]) : null));
  const bottleneckIdx = (() => {
    let maxGap = 0, idx = -1;
    for (let i = 1; i < dates.length; i++) {
      if (dates[i] && dates[i - 1]) {
        const gap = dates[i] - dates[i - 1];
        if (gap > maxGap) { maxGap = gap; idx = i; }
      }
    }
    return idx;
  })();

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-[400px] bg-surface-container-lowest shadow-2xl flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between p-5 border-b border-border-subtle sticky top-0 bg-surface-container-lowest z-10">
        <h2 className="font-bold text-on-surface text-base">Time-to-Value — {dealer.businessName}</h2>
        <button onClick={onClose} className="ml-3 shrink-0 text-on-surface-variant hover:text-on-surface"><X className="h-5 w-5" /></button>
      </div>
      <div className="p-5 flex-1 space-y-1">
        {TTV_MILESTONES.map((m, i) => {
          const done = !!ttv[m];
          const prev = i > 0 && dates[i - 1] && dates[i] ? Math.floor((dates[i] - dates[i - 1]) / 86400000) : null;
          const isBottleneck = i === bottleneckIdx;
          return (
            <div key={m} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${isBottleneck ? 'bg-amber-50 border border-amber-200' : ''}`}>
              <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${done ? 'bg-green-500' : i === TTV_MILESTONES.findIndex(x => !ttv[x]) ? 'bg-yellow-400' : 'bg-surface-container-high'}`} />
              <span className="text-sm text-on-surface flex-1">{m}</span>
              {editing ? (
                <input
                  type="date"
                  className="text-xs border border-border-subtle rounded px-1 py-0.5 w-32"
                  value={form[m] ? form[m].slice(0, 10) : ''}
                  onChange={e => setForm(f => ({ ...f, [m]: e.target.value }))}
                />
              ) : (
                <span className="text-xs text-on-surface-variant w-28 text-right">{fmtDate(ttv[m])}</span>
              )}
              {prev !== null && !editing && (
                <span className="text-[10px] text-on-surface-variant w-10 text-right">{prev}d</span>
              )}
            </div>
          );
        })}
        {mutation.isError && <p className="text-xs text-red-600">Save failed. Try again.</p>}
      </div>
      <div className="p-5 border-t border-border-subtle flex justify-end gap-2">
        {editing ? (
          <>
            <button onClick={() => setEditing(false)} className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface">Cancel</button>
            <button
              disabled={mutation.isPending}
              onClick={() => mutation.mutate(form)}
              className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
            >
              {mutation.isPending ? 'Saving…' : 'Save'}
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="px-4 py-2 text-sm border border-border-subtle rounded-lg hover:bg-surface-container">Edit Dates</button>
        )}
      </div>
    </div>
  );
}

// --- CS Tasks Drawer ---
function TasksDrawer({ dealer, onClose }) {
  const qc = useQueryClient();
  const dealerId = dealer.id || dealer._id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['cs-tasks', dealerId],
    queryFn: () => api.get(`/admin/cs-tasks/${dealerId}`).then(r => r.data),
  });

  const patchTask = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/cs-tasks/${id}`, { status }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['cs-tasks']); qc.invalidateQueries(['dealer-success']); },
  });

  const genSchedule = useMutation({
    mutationFn: () => api.post(`/admin/cs-tasks/generate/${dealerId}`).then(r => r.data),
    onSuccess: () => qc.invalidateQueries(['cs-tasks', dealerId]),
  });

  const tasks = Array.isArray(data) ? data : [];
  const grouped = { Pending: [], Done: [], Skipped: [] };
  tasks.forEach(t => { grouped[t.status] && grouped[t.status].push(t); });

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-[420px] bg-surface-container-lowest shadow-2xl flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between p-5 border-b border-border-subtle sticky top-0 bg-surface-container-lowest z-10">
        <h2 className="font-bold text-on-surface text-base">CS Tasks — {dealer.businessName}</h2>
        <button onClick={onClose} className="ml-3 shrink-0 text-on-surface-variant hover:text-on-surface"><X className="h-5 w-5" /></button>
      </div>
      <div className="p-5 flex-1">
        {isLoading && <div className="text-sm text-on-surface-variant">Loading tasks…</div>}
        {error && <p className="text-sm text-red-600">Failed to load tasks.</p>}
        {!isLoading && !error && (
          <div className="space-y-4">
            {['Pending', 'Done', 'Skipped'].map(status => (
              grouped[status].length > 0 && (
                <div key={status}>
                  <p className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant mb-2">{status}</p>
                  <div className="space-y-1">
                    {grouped[status].map(t => {
                      const overdue = t.status === 'Pending' && t.dueDate && new Date(t.dueDate) < new Date();
                      return (
                        <div key={t.id || t._id} className={`flex items-center gap-2 px-3 py-2 rounded-lg ${overdue ? 'bg-red-50 border border-red-100' : 'bg-surface-container'}`}>
                          <span className="text-[11px] font-bold bg-surface-container-high text-on-surface rounded px-1.5 py-0.5 shrink-0">Day {t.day}</span>
                          <span>{TASK_ICONS[t.type] || '📋'}</span>
                          <span className="text-sm text-on-surface flex-1">{t.title}</span>
                          <span className={`text-[11px] ${overdue ? 'text-red-600 font-semibold' : 'text-on-surface-variant'}`}>{fmtDate(t.dueDate)}</span>
                          {t.status === 'Pending' && (
                            <div className="flex gap-1 shrink-0">
                              <button onClick={() => patchTask.mutate({ id: t.id || t._id, status: 'done' })} className="text-[11px] text-green-700 border border-green-200 rounded px-1.5 py-0.5 hover:bg-green-50">Done</button>
                              <button onClick={() => patchTask.mutate({ id: t.id || t._id, status: 'skipped' })} className="text-[11px] text-on-surface-variant border border-border-subtle rounded px-1.5 py-0.5 hover:bg-surface-container">Skip</button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )
            ))}
            {tasks.length === 0 && <p className="text-sm text-on-surface-variant">No tasks scheduled yet.</p>}
          </div>
        )}
      </div>
      <div className="p-5 border-t border-border-subtle flex justify-end">
        <button
          disabled={genSchedule.isPending}
          onClick={() => genSchedule.mutate()}
          className="px-4 py-2 text-sm border border-border-subtle rounded-lg hover:bg-surface-container disabled:opacity-50"
        >
          {genSchedule.isPending ? 'Generating…' : 'Generate Schedule'}
        </button>
      </div>
    </div>
  );
}

// --- Value Proof Drawer ---
function ValueDrawer({ dealer, onClose }) {
  const dealerId = dealer.id || dealer._id;

  const { data, isLoading, error } = useQuery({
    queryKey: ['value-proof', dealerId],
    queryFn: () => api.get(`/admin/value-proof/${dealerId}`).then(r => r.data),
  });

  const v = data || {};
  const metrics = [
    { label: 'Leads Generated (30d)', value: v.leads30d ?? '—' },
    { label: 'Total Leads', value: v.totalLeads ?? '—' },
    { label: 'Listings Published', value: v.listingsPublished ?? '—' },
    { label: 'CRM Adoption Rate', value: v.crmAdoptionRate != null ? `${v.crmAdoptionRate}%` : '—' },
    { label: 'Avg Leads / Listing', value: v.avgLeadsPerListing ?? '—' },
    { label: 'Est. Revenue Impact', value: v.estRevenueImpact != null ? `₱${Number(v.estRevenueImpact).toLocaleString()}` : '—' },
    { label: 'Time Saved (hrs)', value: v.timeSavedHours ?? '—' },
    { label: 'Inspection Requests', value: v.inspectionRequests ?? '—' },
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-[380px] bg-surface-container-lowest shadow-2xl flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between p-5 border-b border-border-subtle sticky top-0 bg-surface-container-lowest z-10">
        <h2 className="font-bold text-on-surface text-base">Value Proof — {dealer.businessName}</h2>
        <button onClick={onClose} className="ml-3 shrink-0 text-on-surface-variant hover:text-on-surface"><X className="h-5 w-5" /></button>
      </div>
      <div className="p-5 flex-1">
        {isLoading && <div className="text-sm text-on-surface-variant">Loading metrics…</div>}
        {error && <p className="text-sm text-red-600">Failed to load value data.</p>}
        {!isLoading && !error && (
          <div className="grid grid-cols-2 gap-3">
            {metrics.map(({ label, value }) => (
              <div key={label} className="bg-surface-container rounded-xl p-3 text-center">
                <p className="text-xs text-on-surface-variant mb-1">{label}</p>
                <p className="text-lg font-bold text-on-surface">{value}</p>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-5 border-t border-border-subtle">
        <p className="text-xs text-on-surface-variant text-center">Share this with your dealer to show value delivered.</p>
      </div>
    </div>
  );
}

// --- Dealer Card ---
function DealerCard({ dealer, onDrawer }) {
  const id = dealer.id || dealer._id;
  const metrics = dealer.metrics || {};
  const risks = dealer.riskFlags || [];
  const renewal = dealer.renewalProbability || 'Medium';
  const status = dealer.healthStatus || 'Watch';

  return (
    <div className="bg-surface-container-lowest rounded-xl border border-border-subtle p-4 flex flex-col sm:flex-row gap-4">
      {/* Left: Identity */}
      <div className="sm:w-44 shrink-0">
        <p className="font-bold text-on-surface text-base leading-tight">{dealer.businessName}</p>
        <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold bg-blue-100 text-blue-800 mt-1">
          Founding Dealer
        </span>
        <p className="text-xs text-on-surface-variant mt-1">Day {daysSince(dealer.signupDate)}</p>
        <p className="text-xs text-on-surface-variant">MRR: ₱3,599</p>
      </div>

      {/* Center: Health metrics */}
      <div className="flex-1 grid grid-cols-3 gap-2">
        {[
          { label: 'Listings', value: metrics.listings ?? '—' },
          { label: 'Leads', value: metrics.leads ?? '—' },
          { label: 'CRM Usage', value: metrics.crmUsage != null ? `${metrics.crmUsage} updated` : '—' },
          {
            label: 'Health Score',
            value: <span className={`font-bold ${healthColor(metrics.healthScore)}`}>{metrics.healthScore ?? '—'}<span className="text-xs text-on-surface-variant">/100</span></span>,
          },
          {
            label: 'Support Tickets',
            value: <span className={metrics.supportTickets > 0 ? 'text-red-600 font-semibold' : ''}>{metrics.supportTickets ?? 0}</span>,
          },
          {
            label: 'Renewal',
            value: <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${renewalBadge(renewal)}`}>{renewal}</span>,
          },
        ].map(({ label, value }) => (
          <div key={label} className="bg-surface-container rounded-lg p-2 text-center">
            <p className="text-[10px] text-on-surface-variant mb-0.5">{label}</p>
            <p className="text-sm">{value}</p>
          </div>
        ))}
      </div>

      {/* Right: Status + actions */}
      <div className="sm:w-44 shrink-0 flex flex-col gap-2">
        <div className="flex flex-wrap gap-1">
          {risks.length === 0
            ? <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-green-100 text-green-800">No risks</span>
            : risks.map(r => (
              <span key={r} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700">{r}</span>
            ))}
        </div>
        <p className={`text-sm font-semibold ${healthStatusColor(status)}`}>{status}</p>
        <div className="flex gap-1 mt-auto">
          <button onClick={() => onDrawer('ttv', id)} className="rounded-lg border border-border-subtle px-2 py-1 text-xs font-semibold text-on-surface hover:bg-surface-container">TTV</button>
          <button onClick={() => onDrawer('tasks', id)} className="rounded-lg border border-border-subtle px-2 py-1 text-xs font-semibold text-on-surface hover:bg-surface-container">Tasks</button>
          <button onClick={() => onDrawer('value', id)} className="rounded-lg border border-border-subtle px-2 py-1 text-xs font-semibold text-on-surface hover:bg-surface-container">Value</button>
        </div>
      </div>
    </div>
  );
}

// --- Main Page ---
export default function DealerSuccess() {
  const tasksRef = useRef(null);
  const [activeDrawer, setActiveDrawer] = useState(null);
  const qc = useQueryClient();

  const { data: dealers, isLoading, error } = useQuery({
    queryKey: ['dealer-success'],
    queryFn: () => api.get('/admin/dealer-success').then(r => r.data),
  });

  const { data: overdueTasks } = useQuery({
    queryKey: ['cs-tasks-overdue'],
    queryFn: () => api.get('/admin/cs-tasks/overdue').then(r => r.data),
  });

  const patchOverdue = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/admin/cs-tasks/${id}`, { status }).then(r => r.data),
    onSuccess: () => { qc.invalidateQueries(['cs-tasks-overdue']); qc.invalidateQueries(['cs-tasks']); qc.invalidateQueries(['dealer-success']); },
  });

  const list = Array.isArray(dealers) ? dealers : [];
  const overdueList = Array.isArray(overdueTasks) ? overdueTasks : [];

  const openDrawer = (type, dealerId) => setActiveDrawer({ type, dealerId });
  const closeDrawer = () => setActiveDrawer(null);

  const activeDealer = activeDrawer ? list.find(d => (d.id || d._id) === activeDrawer.dealerId) : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-on-surface">Dealer Success</h1>
        <p className="text-sm text-on-surface-variant mt-1">Adoption · Retention · Renewal</p>
      </div>

      {/* Alert bar */}
      {overdueList.length > 0 && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
          <span className="text-sm text-red-700 flex-1">
            ⚠️ <strong>{overdueList.length}</strong> overdue CS task{overdueList.length !== 1 ? 's' : ''} — {overdueList[0].title} · {overdueList[0].dealerName}
          </span>
          <button
            onClick={() => tasksRef.current?.scrollIntoView({ behavior: 'smooth' })}
            className="shrink-0 text-xs font-semibold text-red-700 border border-red-300 rounded-lg px-3 py-1 hover:bg-red-100"
          >
            View All
          </button>
        </div>
      )}

      {/* Dealer cards */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-surface-container rounded-xl animate-pulse" />)}
        </div>
      ) : error ? (
        <p className="text-sm text-red-600">Failed to load dealer data.</p>
      ) : list.length === 0 ? (
        <div className="bg-surface-container-lowest rounded-xl border border-border-subtle p-10 text-center">
          <p className="text-on-surface-variant text-sm">No active dealers yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {list.map(dealer => (
            <DealerCard key={dealer.id || dealer._id} dealer={dealer} onDrawer={openDrawer} />
          ))}
        </div>
      )}

      {/* Overdue tasks table */}
      {overdueList.length > 0 && (
        <div ref={tasksRef} className="bg-surface-container-lowest rounded-xl border border-border-subtle overflow-hidden">
          <div className="px-4 py-3 border-b border-border-subtle">
            <h2 className="font-bold text-on-surface text-base">Overdue CS Tasks</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-surface-container">
                <tr>
                  {['Dealer', 'Day', 'Type', 'Task', 'Due Date', 'Days Overdue', 'Actions'].map(h => (
                    <th key={h} className="px-4 py-2 text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {overdueList.map(t => {
                  const daysOverdue = t.dueDate ? Math.floor((Date.now() - new Date(t.dueDate).getTime()) / 86400000) : '—';
                  return (
                    <tr key={t.id || t._id} className="hover:bg-surface-container">
                      <td className="px-4 py-2 font-medium text-on-surface">{t.dealerName}</td>
                      <td className="px-4 py-2 text-on-surface-variant">Day {t.day}</td>
                      <td className="px-4 py-2">{TASK_ICONS[t.type] || '📋'} {t.type}</td>
                      <td className="px-4 py-2 text-on-surface">{t.title}</td>
                      <td className="px-4 py-2 text-red-600 font-medium">{fmtDate(t.dueDate)}</td>
                      <td className="px-4 py-2 text-red-600 font-bold">{daysOverdue}d</td>
                      <td className="px-4 py-2">
                        <div className="flex gap-1">
                          <button onClick={() => patchOverdue.mutate({ id: t.id || t._id, status: 'done' })} className="text-[11px] text-green-700 border border-green-200 rounded px-2 py-0.5 hover:bg-green-50">Done</button>
                          <button onClick={() => patchOverdue.mutate({ id: t.id || t._id, status: 'skipped' })} className="text-[11px] text-on-surface-variant border border-border-subtle rounded px-2 py-0.5 hover:bg-surface-container">Skip</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Drawers */}
      {activeDrawer && activeDealer && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20" onClick={closeDrawer} />
          {activeDrawer.type === 'ttv' && <TTVDrawer dealer={activeDealer} onClose={closeDrawer} />}
          {activeDrawer.type === 'tasks' && <TasksDrawer dealer={activeDealer} onClose={closeDrawer} />}
          {activeDrawer.type === 'value' && <ValueDrawer dealer={activeDealer} onClose={closeDrawer} />}
        </>
      )}
    </div>
  );
}
