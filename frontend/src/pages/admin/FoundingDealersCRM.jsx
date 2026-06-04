import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, TrendingUp, DollarSign, Trophy, X, Plus, Phone, Mail, MapPin, ChevronDown } from 'lucide-react';
import api from '../../api/client';

const STAGES = [
  { key: 'prospect',       label: 'Prospect',        color: 'bg-surface-container text-on-surface',   bar: 'bg-gray-400' },
  { key: 'contacted',      label: 'Contacted',       color: 'bg-blue-100 text-blue-700',   bar: 'bg-blue-500' },
  { key: 'demo_scheduled', label: 'Demo Scheduled',  color: 'bg-indigo-100 text-indigo-700', bar: 'bg-indigo-500' },
  { key: 'demo_completed', label: 'Demo Done',       color: 'bg-purple-100 text-purple-700', bar: 'bg-purple-500' },
  { key: 'proposal_sent',  label: 'Proposal Sent',   color: 'bg-orange-100 text-orange-700', bar: 'bg-orange-500' },
  { key: 'negotiating',    label: 'Negotiating',     color: 'bg-yellow-100 text-yellow-700', bar: 'bg-yellow-500' },
  { key: 'won',            label: 'Won ✓',           color: 'bg-emerald-100 text-emerald-700', bar: 'bg-emerald-500' },
  { key: 'lost',           label: 'Lost ✗',          color: 'bg-red-100 text-red-700',     bar: 'bg-red-400' },
];

const ACTIVITY_TYPES = ['note', 'call', 'email', 'demo_scheduled'];
const ACTIVITY_COLORS = {
  note:           'bg-surface-container text-on-surface-variant',
  call:           'bg-blue-100 text-blue-700',
  email:          'bg-indigo-100 text-indigo-700',
  demo_scheduled: 'bg-purple-100 text-purple-700',
};

const TIER_CONFIG = {
  hot:         { label: '🔥 Hot',        bg: 'bg-red-100',    text: 'text-red-700',    border: 'border-red-200' },
  warm:        { label: '☀️ Warm',       bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
  cold:        { label: '❄️ Cold',       bg: 'bg-blue-100',   text: 'text-blue-700',   border: 'border-blue-200' },
  unqualified: { label: '○ Unqualified', bg: 'bg-surface-container',   text: 'text-on-surface-variant',   border: 'border-border-subtle' },
};

const INVENTORY_OPTIONS = ['<10', '10-25', '25-50', '50+'];
const CURRENT_SYSTEM_OPTIONS = ['None / Manual', 'Facebook Marketplace', 'Philkotse / OLX', 'Excel / Spreadsheet', 'CDK / Reynolds / DMS', 'Other'];
const SOURCE_OPTIONS = ['Referral', 'Cold Outreach', 'Facebook Ad', 'Organic Search', 'Event', 'Other'];

function fmt(n) {
  return `₱${(n || 0).toLocaleString()}`;
}

function fmtDate(x) {
  if (!x) return null;
  return new Date(x).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
}

function StagePill({ stage }) {
  const s = STAGES.find(s => s.key === stage);
  if (!s) return null;
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.color}`}>
      {s.label}
    </span>
  );
}

function ProspectCard({ prospect, onClick }) {
  const lastActivity = prospect.activities?.[prospect.activities.length - 1];
  return (
    <div
      className="bg-surface-container-lowest rounded-xl border border-border-subtle p-3 cursor-pointer hover:shadow-md hover:border-primary/30 transition-all"
      onClick={() => onClick(prospect)}
    >
      {prospect.qualificationTier && (() => {
        const t = TIER_CONFIG[prospect.qualificationTier] || TIER_CONFIG.unqualified;
        return (
          <span className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full border ${t.bg} ${t.text} ${t.border} mb-1`}>
            {t.label}
            {prospect.qualificationScore != null && <span className="opacity-70">· {prospect.qualificationScore}</span>}
          </span>
        );
      })()}
      <p className="font-semibold text-on-surface text-sm leading-tight">{prospect.dealerName}</p>
      {prospect.contactName && (
        <p className="text-xs text-on-surface-variant mt-0.5">{prospect.contactName}{prospect.phone && ` · ${prospect.phone}`}</p>
      )}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs font-bold text-primary">{fmt(prospect.expectedMrr)}<span className="font-normal text-on-surface-variant">/mo</span></span>
        <span className="text-xs text-on-surface-variant">{prospect.closeProbability ?? 0}%</span>
      </div>
      {prospect.owner && (
        <span className="inline-flex items-center rounded-full bg-surface-container px-2 py-0.5 text-[10px] text-on-surface-variant mt-1.5">
          {prospect.owner}
        </span>
      )}
      {prospect.nextFollowUpAt && (
        <p className="text-[11px] text-orange-600 mt-1">Follow up: {fmtDate(prospect.nextFollowUpAt)}</p>
      )}
      {lastActivity && (
        <p className="text-[11px] text-on-surface-variant mt-1 truncate">{lastActivity.content}</p>
      )}
    </div>
  );
}

function AddProspectModal({ onClose, onSuccess }) {
  const [form, setForm] = useState({
    dealerName: '', contactName: '', phone: '', email: '', location: '',
    inventorySize: '<10', currentSystem: 'None / Manual', source: 'Cold Outreach',
    expectedMrr: '', owner: '',
  });

  const mutation = useMutation({
    mutationFn: (data) => api.post('/admin/prospects', data).then(r => r.data),
    onSuccess: () => onSuccess(),
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e) {
    e.preventDefault();
    mutation.mutate({ ...form, expectedMrr: Number(form.expectedMrr) || 0 });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-on-surface">Add Prospect</h2>
          <button onClick={onClose} className="text-on-surface-variant hover:text-on-surface"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Dealer Name *</label>
              <input className="input w-full" required value={form.dealerName} onChange={e => set('dealerName', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Contact Name *</label>
              <input className="input w-full" required value={form.contactName} onChange={e => set('contactName', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Phone</label>
              <input className="input w-full" type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Email</label>
              <input className="input w-full" type="email" value={form.email} onChange={e => set('email', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Location</label>
              <input className="input w-full" value={form.location} onChange={e => set('location', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Inventory Size</label>
              <select className="input w-full" value={form.inventorySize} onChange={e => set('inventorySize', e.target.value)}>
                {INVENTORY_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Current System</label>
              <select className="input w-full" value={form.currentSystem} onChange={e => set('currentSystem', e.target.value)}>
                {CURRENT_SYSTEM_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Source</label>
              <select className="input w-full" value={form.source} onChange={e => set('source', e.target.value)}>
                {SOURCE_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Expected MRR (₱)</label>
              <input className="input w-full" type="number" min="0" value={form.expectedMrr} onChange={e => set('expectedMrr', e.target.value)} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Owner</label>
              <input className="input w-full" placeholder="e.g. Rommel" value={form.owner} onChange={e => set('owner', e.target.value)} />
            </div>
          </div>
          {mutation.isError && (
            <p className="text-xs text-red-600">Failed to add prospect. Please try again.</p>
          )}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-on-surface-variant hover:text-on-surface">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">
              {mutation.isPending ? 'Adding…' : 'Add Prospect'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DetailPanel({ prospect, onClose, onUpdate }) {
  const qc = useQueryClient();
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({ ...prospect });
  const [logType, setLogType] = useState('note');
  const [logContent, setLogContent] = useState('');

  const stageMutation = useMutation({
    mutationFn: ({ id, stage }) => api.patch(`/admin/prospects/${id}`, { stage }).then(r => r.data),
    onSuccess: (data) => {
      onUpdate(data);
      qc.invalidateQueries(['admin-prospects']);
    },
  });

  const editMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/admin/prospects/${id}`, data).then(r => r.data),
    onSuccess: (data) => {
      onUpdate(data);
      setEditMode(false);
      qc.invalidateQueries(['admin-prospects']);
    },
  });

  const activityMutation = useMutation({
    mutationFn: ({ id, type, content }) => api.post(`/admin/prospects/${id}/activities`, { type, content }).then(r => r.data),
    onSuccess: (data) => {
      onUpdate(data);
      setLogContent('');
      qc.invalidateQueries(['admin-prospects']);
    },
  });

  const id = prospect.id || prospect._id;

  function handleStageChange(e) {
    stageMutation.mutate({ id, stage: e.target.value });
  }

  function handleEditSubmit(e) {
    e.preventDefault();
    editMutation.mutate({ id, ...editForm, expectedMrr: Number(editForm.expectedMrr) || 0, closeProbability: Number(editForm.closeProbability) || 0 });
  }

  function handleLogActivity(e) {
    e.preventDefault();
    if (!logContent.trim()) return;
    activityMutation.mutate({ id, type: logType, content: logContent });
  }

  const setEdit = (k, v) => setEditForm(f => ({ ...f, [k]: v }));

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-md bg-surface-container-lowest shadow-2xl flex flex-col overflow-y-auto">
      {/* Header */}
      <div className="flex items-start justify-between p-5 border-b border-border-subtle sticky top-0 bg-surface-container-lowest z-10">
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-on-surface text-base leading-tight">{prospect.dealerName}</h2>
          <div className="mt-2">
            <select
              className="rounded-lg border border-border-subtle bg-surface-container px-3 py-1.5 text-xs font-semibold text-on-surface"
              value={prospect.stage}
              onChange={handleStageChange}
              disabled={stageMutation.isPending}
            >
              {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
            </select>
          </div>
        </div>
        <button onClick={onClose} className="ml-3 shrink-0 text-on-surface-variant hover:text-on-surface mt-0.5">
          <X className="h-5 w-5" />
        </button>
      </div>

      <div className="p-5 space-y-5 flex-1">
        {/* Contact info */}
        <div className="card p-4 space-y-1.5">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-2">Contact</p>
          {prospect.contactName && <p className="text-sm text-on-surface font-medium">{prospect.contactName}</p>}
          {prospect.phone && (
            <p className="text-sm text-on-surface-variant flex items-center gap-1.5"><Phone className="h-3.5 w-3.5" />{prospect.phone}</p>
          )}
          {prospect.email && (
            <p className="text-sm text-on-surface-variant flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{prospect.email}</p>
          )}
          {prospect.location && (
            <p className="text-sm text-on-surface-variant flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{prospect.location}</p>
          )}
          {prospect.source && <p className="text-xs text-on-surface-variant">Source: {prospect.source}</p>}
          {prospect.currentSystem && <p className="text-xs text-on-surface-variant">Current system: {prospect.currentSystem}</p>}
          {prospect.inventorySize && <p className="text-xs text-on-surface-variant">Inventory: {prospect.inventorySize} units</p>}
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-3">
          {editMode ? (
            <>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Expected MRR (₱)</label>
                <input className="input w-full" type="number" value={editForm.expectedMrr || ''} onChange={e => setEdit('expectedMrr', e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">Close Probability (%)</label>
                <input className="input w-full" type="number" min="0" max="100" value={editForm.closeProbability || ''} onChange={e => setEdit('closeProbability', e.target.value)} />
              </div>
            </>
          ) : (
            <>
              <div className="card p-3 text-center">
                <p className="text-xs text-on-surface-variant mb-1">Expected MRR</p>
                <p className="text-lg font-bold text-on-surface">{fmt(prospect.expectedMrr)}</p>
              </div>
              <div className="card p-3 text-center">
                <p className="text-xs text-on-surface-variant mb-1">Close Probability</p>
                <p className="text-lg font-bold text-on-surface">{prospect.closeProbability ?? 0}%</p>
              </div>
            </>
          )}
        </div>

        {/* Edit toggle */}
        {editMode ? (
          <form onSubmit={handleEditSubmit} className="card p-4 space-y-3">
            <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Edit Details</p>
            {[
              { k: 'dealerName', label: 'Dealer Name' },
              { k: 'contactName', label: 'Contact Name' },
              { k: 'phone', label: 'Phone', type: 'tel' },
              { k: 'email', label: 'Email', type: 'email' },
              { k: 'location', label: 'Location' },
              { k: 'owner', label: 'Owner' },
            ].map(({ k, label, type = 'text' }) => (
              <div key={k}>
                <label className="block text-xs font-semibold text-on-surface-variant mb-1">{label}</label>
                <input className="input w-full" type={type} value={editForm[k] || ''} onChange={e => setEdit(k, e.target.value)} />
              </div>
            ))}
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Inventory Size</label>
              <select className="input w-full" value={editForm.inventorySize || ''} onChange={e => setEdit('inventorySize', e.target.value)}>
                {INVENTORY_OPTIONS.map(o => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-on-surface-variant mb-1">Next Follow-Up</label>
              <input className="input w-full" type="date" value={editForm.nextFollowUpAt ? editForm.nextFollowUpAt.slice(0, 10) : ''} onChange={e => setEdit('nextFollowUpAt', e.target.value)} />
            </div>
            <div className="border-t border-border-subtle pt-4 mt-4">
              <h4 className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-3">Qualification</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-on-surface-variant">Monthly Units Sold</label>
                  <input
                    type="number" min="0"
                    className="input mt-0.5 w-full text-sm"
                    value={editForm.monthlyVehiclesSold ?? ''}
                    onChange={e => setEdit('monthlyVehiclesSold', e.target.value === '' ? null : parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant">Sales Team Size</label>
                  <input
                    type="number" min="1"
                    className="input mt-0.5 w-full text-sm"
                    value={editForm.salesTeamSize ?? ''}
                    onChange={e => setEdit('salesTeamSize', e.target.value === '' ? null : parseInt(e.target.value))}
                  />
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant">Pain Level (1-5)</label>
                  <select className="input mt-0.5 w-full text-sm"
                    value={editForm.painLevel ?? ''}
                    onChange={e => setEdit('painLevel', e.target.value === '' ? null : parseInt(e.target.value))}>
                    <option value="">—</option>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n} {n===1?'(mild)':n===5?'(critical)':''}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant">Buying Timeline</label>
                  <select className="input mt-0.5 w-full text-sm"
                    value={editForm.buyingTimeline ?? ''}
                    onChange={e => setEdit('buyingTimeline', e.target.value || null)}>
                    <option value="">Unknown</option>
                    <option value="immediate">Immediate</option>
                    <option value="1_month">~1 month</option>
                    <option value="3_months">~3 months</option>
                    <option value="6_months">~6 months</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-on-surface-variant">Budget</label>
                  <select className="input mt-0.5 w-full text-sm"
                    value={editForm.budgetRange ?? ''}
                    onChange={e => setEdit('budgetRange', e.target.value || null)}>
                    <option value="">Unknown</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="likely">Likely</option>
                    <option value="constrained">Constrained</option>
                  </select>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <input type="checkbox" id="dmAccess" className="rounded"
                    checked={editForm.decisionMakerAccess ?? false}
                    onChange={e => setEdit('decisionMakerAccess', e.target.checked)} />
                  <label htmlFor="dmAccess" className="text-sm text-on-surface">Decision maker in conversation</label>
                </div>
              </div>
              {prospect.qualificationTier && (() => {
                const t = TIER_CONFIG[prospect.qualificationTier] || TIER_CONFIG.unqualified;
                return (
                  <div className={`mt-3 p-3 rounded-lg border ${t.border} ${t.bg} flex items-center justify-between`}>
                    <span className={`text-sm font-semibold ${t.text}`}>{t.label}</span>
                    <span className="text-xs text-on-surface-variant">Score: {prospect.qualificationScore ?? '—'} / 100</span>
                  </div>
                );
              })()}
            </div>
            {editMutation.isError && <p className="text-xs text-red-600">Save failed. Try again.</p>}
            <div className="flex gap-2 justify-end">
              <button type="button" onClick={() => setEditMode(false)} className="px-3 py-1.5 text-xs text-on-surface-variant hover:text-on-surface">Cancel</button>
              <button type="submit" disabled={editMutation.isPending} className="btn-primary px-4 py-1.5 text-xs disabled:opacity-50">
                {editMutation.isPending ? 'Saving…' : 'Save'}
              </button>
            </div>
          </form>
        ) : (
          <button onClick={() => setEditMode(true)} className="w-full rounded-xl border border-border-subtle py-2 text-xs font-semibold text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors">
            Edit Details
          </button>
        )}

        {/* Activity log */}
        <div>
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide mb-3">Activity Log</p>
          {(!prospect.activities || prospect.activities.length === 0) ? (
            <p className="text-xs text-on-surface-variant">No activities yet.</p>
          ) : (
            <div className="space-y-2">
              {[...prospect.activities].reverse().map((act, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold shrink-0 mt-0.5 ${ACTIVITY_COLORS[act.type] || 'bg-surface-container text-on-surface-variant'}`}>
                    {act.type}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-on-surface leading-snug">{act.content}</p>
                    {act.createdAt && <p className="text-[11px] text-on-surface-variant mt-0.5">{fmtDate(act.createdAt)}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Log activity form */}
        <form onSubmit={handleLogActivity} className="card p-4 space-y-3">
          <p className="text-xs font-bold text-on-surface-variant uppercase tracking-wide">Log Activity</p>
          <div className="flex gap-2">
            {ACTIVITY_TYPES.map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setLogType(t)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors capitalize ${
                  logType === t ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
                }`}
              >
                {t.replace('_', ' ')}
              </button>
            ))}
          </div>
          <textarea
            className="input w-full text-sm resize-none"
            rows={3}
            placeholder="What happened?"
            value={logContent}
            onChange={e => setLogContent(e.target.value)}
          />
          {activityMutation.isError && <p className="text-xs text-red-600">Failed to log. Try again.</p>}
          <button
            type="submit"
            disabled={!logContent.trim() || activityMutation.isPending}
            className="btn-primary w-full py-2 text-sm disabled:opacity-50"
          >
            {activityMutation.isPending ? 'Saving…' : 'Log Activity'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function FoundingDealersCRM() {
  const qc = useQueryClient();
  const [showAdd, setShowAdd] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState(null);

  const { data: prospects, isLoading } = useQuery({
    queryKey: ['admin-prospects'],
    queryFn: () => api.get('/admin/prospects').then(r => r.data),
  });

  const list = Array.isArray(prospects) ? prospects : [];

  // Summary stats
  const totalProspects = list.length;
  const pipelineValue = list.reduce((s, p) => s + (p.expectedMrr || 0), 0);
  const weightedMrr = list.reduce((s, p) => s + ((p.expectedMrr || 0) * (p.closeProbability || 0) / 100), 0);
  const wonDealers = list.filter(p => p.stage === 'won').length;

  function handleProspectUpdate(updated) {
    setSelectedProspect(updated);
  }

  function handleAddSuccess() {
    qc.invalidateQueries(['admin-prospects']);
    setShowAdd(false);
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-on-surface">Founding Dealer Pipeline</h1>
          <p className="text-sm text-on-surface-variant mt-1">Track every prospect from first contact to closed deal.</p>
        </div>
        <button
          onClick={() => setShowAdd(true)}
          className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
        >
          <Plus className="h-4 w-4" />
          Add Prospect
        </button>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Prospects', value: totalProspects, icon: Users, color: 'text-primary bg-primary/10' },
          { label: 'Pipeline Value', value: fmt(pipelineValue) + '/mo', icon: DollarSign, color: 'text-emerald-600 bg-emerald-100' },
          { label: 'Weighted MRR', value: fmt(Math.round(weightedMrr)) + '/mo', icon: TrendingUp, color: 'text-purple-600 bg-purple-100', sub: 'probability adjusted' },
          { label: 'Won Dealers', value: wonDealers, icon: Trophy, color: 'text-amber-600 bg-amber-100' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-on-surface">{isLoading ? <span className="inline-block h-6 w-16 bg-surface-container rounded animate-pulse" /> : value}</p>
              <p className="text-xs text-on-surface-variant">{label}</p>
              {sub && <p className="text-[11px] text-on-surface-variant">{sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Kanban */}
      {isLoading ? (
        <div className="flex gap-3 overflow-x-auto pb-2">
          {STAGES.map(s => (
            <div key={s.key} className="min-w-[200px] space-y-2">
              <div className="h-8 bg-surface-container rounded-lg animate-pulse" />
              <div className="h-24 bg-surface-container rounded-xl animate-pulse" />
              <div className="h-20 bg-surface-container rounded-xl animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {STAGES.map(stage => {
              const cards = list.filter(p => p.stage === stage.key);
              const stageMrr = cards.reduce((s, p) => s + (p.expectedMrr || 0), 0);
              return (
                <div key={stage.key} className="w-52 flex flex-col gap-2">
                  {/* Column header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${stage.bar}`} />
                      <span className="text-xs font-bold text-on-surface">{stage.label}</span>
                    </div>
                    <span className="text-[11px] bg-surface-container rounded-full px-1.5 py-0.5 text-on-surface-variant font-medium">{cards.length}</span>
                  </div>
                  {stageMrr > 0 && (
                    <p className="text-[11px] text-on-surface-variant -mt-1">{fmt(stageMrr)}/mo</p>
                  )}
                  {/* Cards */}
                  <div className="space-y-2">
                    {cards.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border-subtle p-4 text-center">
                        <p className="text-xs text-on-surface-variant/50">Empty</p>
                      </div>
                    ) : (
                      cards.map(p => (
                        <ProspectCard
                          key={p.id || p._id}
                          prospect={p}
                          onClick={setSelectedProspect}
                        />
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Detail panel */}
      {selectedProspect && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setSelectedProspect(null)} />
          <DetailPanel
            prospect={selectedProspect}
            onClose={() => setSelectedProspect(null)}
            onUpdate={handleProspectUpdate}
          />
        </>
      )}

      {/* Add modal */}
      {showAdd && (
        <AddProspectModal
          onClose={() => setShowAdd(false)}
          onSuccess={handleAddSuccess}
        />
      )}
    </div>
  );
}
