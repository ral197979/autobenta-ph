import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, X } from 'lucide-react';
import api from '../../api/client';

const STAGES = [
  { key: 'demo_complete',      label: 'Demo Complete',      color: 'bg-blue-100 text-blue-800' },
  { key: 'proposal_sent',      label: 'Proposal Sent',      color: 'bg-blue-100 text-blue-800' },
  { key: 'verbal_yes',         label: 'Verbal Yes',         color: 'bg-yellow-100 text-yellow-800' },
  { key: 'agreement_sent',     label: 'Agreement Sent',     color: 'bg-yellow-100 text-yellow-800' },
  { key: 'agreement_signed',   label: 'Agreement Signed',   color: 'bg-yellow-100 text-yellow-800' },
  { key: 'invoice_sent',       label: 'Invoice Sent',       color: 'bg-orange-100 text-orange-800' },
  { key: 'payment_received',   label: 'Payment Received',   color: 'bg-orange-100 text-orange-800' },
  { key: 'onboarding_started', label: 'Onboarding Started', color: 'bg-green-100 text-green-800' },
  { key: 'go_live',            label: 'Go Live 🎉',          color: 'bg-green-100 text-green-800' },
];

function stageColor(key) {
  return STAGES.find(s => s.key === key)?.color || 'bg-gray-100 text-gray-700';
}

function stageLabel(key) {
  return STAGES.find(s => s.key === key)?.label || key;
}

function fmt(n) {
  return `₱${(n || 0).toLocaleString()}`;
}

function daysAgo(dateStr) {
  if (!dateStr) return 0;
  return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
}

function StageBadge({ stage }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${stageColor(stage)}`}>
      {stageLabel(stage)}
    </span>
  );
}

function EditDrawer({ prospect, onClose }) {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    closingStage: prospect.closingStage || 'demo_complete',
    expectedMrr: prospect.expectedMrr || 3599,
    closeProbability: prospect.closeProbability || 50,
    nextAction: prospect.nextAction || '',
    riskFlags: (prospect.riskFlags || []).join(', '),
    ownedBy: prospect.ownedBy || prospect.owner || '',
  });

  const mutation = useMutation({
    mutationFn: (data) => api.patch(`/admin/closing/${prospect.id || prospect._id}`, data).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-closing']);
      qc.invalidateQueries(['admin-closing-summary']);
      onClose();
    },
  });

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  function handleSubmit(e) {
    e.preventDefault();
    mutation.mutate({
      closingStage: form.closingStage,
      expectedMrr: Number(form.expectedMrr) || 0,
      closeProbability: Number(form.closeProbability) || 0,
      nextAction: form.nextAction,
      riskFlags: form.riskFlags.split(',').map(s => s.trim()).filter(Boolean),
      ownedBy: form.ownedBy,
    });
  }

  return (
    <div className="fixed inset-y-0 right-0 z-40 w-full max-w-sm bg-white shadow-2xl flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between p-5 border-b border-gray-200 sticky top-0 bg-white z-10">
        <h2 className="font-bold text-gray-900 text-base truncate">{prospect.dealerName}</h2>
        <button onClick={onClose} className="ml-3 shrink-0 text-gray-500 hover:text-gray-900">
          <X className="h-5 w-5" />
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-5 space-y-4 flex-1">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Closing Stage</label>
          <select className="input w-full" value={form.closingStage} onChange={e => set('closingStage', e.target.value)}>
            {STAGES.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Expected MRR (₱)</label>
          <input className="input w-full" type="number" min="0" value={form.expectedMrr} onChange={e => set('expectedMrr', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Close Probability — <span className="text-blue-600">{form.closeProbability}%</span>
          </label>
          <input className="w-full" type="range" min="0" max="100" value={form.closeProbability} onChange={e => set('closeProbability', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Next Action</label>
          <input className="input w-full" placeholder="e.g. Follow up on agreement" value={form.nextAction} onChange={e => set('nextAction', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Risk Flags (comma-separated)</label>
          <input className="input w-full" placeholder="e.g. slow decision, budget concern" value={form.riskFlags} onChange={e => set('riskFlags', e.target.value)} />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">Owner</label>
          <input className="input w-full" placeholder="e.g. Rommel" value={form.ownedBy} onChange={e => set('ownedBy', e.target.value)} />
        </div>
        {mutation.isError && <p className="text-xs text-red-600">Save failed. Try again.</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900">Cancel</button>
          <button type="submit" disabled={mutation.isPending} className="btn-primary px-5 py-2 text-sm disabled:opacity-50">
            {mutation.isPending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </form>
    </div>
  );
}

function AddToClosingModal({ onClose }) {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState('');

  const { data: prospects } = useQuery({
    queryKey: ['admin-prospects-list'],
    queryFn: () => api.get('/admin/prospects').then(r => r.data),
  });

  const list = Array.isArray(prospects) ? prospects : [];
  const filtered = list.filter(p => p.dealerName?.toLowerCase().includes(search.toLowerCase())).slice(0, 10);

  const mutation = useMutation({
    mutationFn: (id) => api.patch(`/admin/closing/${id}`, { closingStage: 'demo_complete' }).then(r => r.data),
    onSuccess: () => {
      qc.invalidateQueries(['admin-closing']);
      qc.invalidateQueries(['admin-closing-summary']);
      onClose();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-bold text-gray-900">Add to Closing Pipeline</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-900"><X className="h-5 w-5" /></button>
        </div>
        <input
          className="input w-full mb-3"
          placeholder="Search prospect name…"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {filtered.map(p => (
            <button
              key={p.id || p._id}
              type="button"
              onClick={() => setSelectedId(p.id || p._id)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                selectedId === (p.id || p._id) ? 'bg-blue-50 text-blue-800 font-semibold' : 'hover:bg-gray-50 text-gray-900'
              }`}
            >
              {p.dealerName}
              {p.location && <span className="text-gray-500 ml-1.5 text-xs">{p.location}</span>}
            </button>
          ))}
          {filtered.length === 0 && <p className="text-sm text-gray-500 text-center py-4">No prospects found.</p>}
        </div>
        {mutation.isError && <p className="text-xs text-red-600 mt-2">Failed. Try again.</p>}
        <div className="flex justify-end gap-3 mt-4">
          <button type="button" onClick={onClose} className="px-4 py-2 text-sm text-gray-500 hover:text-gray-900">Cancel</button>
          <button
            type="button"
            disabled={!selectedId || mutation.isPending}
            onClick={() => mutation.mutate(selectedId)}
            className="btn-primary px-5 py-2 text-sm disabled:opacity-50"
          >
            {mutation.isPending ? 'Adding…' : 'Add to Closing'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ClosingCenter() {
  const [editProspect, setEditProspect] = useState(null);
  const [showAdd, setShowAdd] = useState(false);

  const { data: deals, isLoading } = useQuery({
    queryKey: ['admin-closing'],
    queryFn: () => api.get('/admin/closing').then(r => r.data),
  });

  const { data: summary } = useQuery({
    queryKey: ['admin-closing-summary'],
    queryFn: () => api.get('/admin/closing/summary').then(r => r.data),
  });

  const list = Array.isArray(deals) ? deals : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Closing Center</h1>
          <p className="text-sm text-gray-500 mt-1">Track every deal from demo to payment</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="btn-primary flex items-center gap-2 px-4 py-2 text-sm">
          <Plus className="h-4 w-4" />
          Add to Closing
        </button>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Pipeline MRR', value: fmt(summary?.totalPipeline) },
          { label: 'Avg Close %', value: `${Math.round(summary?.avgCloseProbability || 0)}%` },
          { label: 'Deals Active', value: list.length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-white rounded-xl border border-gray-200 p-4 text-center">
            <p className="text-xs text-gray-500 mb-1">{label}</p>
            <p className="text-xl font-bold text-gray-900">{value}</p>
          </div>
        ))}
      </div>

      {/* Deal list */}
      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 rounded-xl animate-pulse" />)}
        </div>
      ) : list.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <p className="text-gray-500 text-sm">No deals in closing pipeline yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {list.map(deal => {
            const days = daysAgo(deal.updatedAt);
            const risks = deal.riskFlags || [];
            const id = deal.id || deal._id;
            return (
              <div key={id} className="bg-white rounded-xl border border-gray-200 px-4 py-3 flex items-center gap-3 flex-wrap">
                {/* Name + location */}
                <div className="min-w-[140px] flex-1">
                  <p className="font-semibold text-gray-900 text-sm leading-tight">{deal.dealerName}</p>
                  {deal.location && <p className="text-xs text-gray-500">{deal.location}</p>}
                </div>
                {/* Stage badge */}
                <StageBadge stage={deal.closingStage} />
                {/* MRR */}
                <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-bold bg-blue-50 text-blue-700">
                  {fmt(deal.expectedMrr)}/mo
                </span>
                {/* Probability */}
                <span className="text-xs text-gray-700 font-semibold">{deal.closeProbability ?? 0}%</span>
                {/* Days in stage */}
                <span className="text-[11px] text-gray-500">{days}d in stage</span>
                {/* Risk flags */}
                {risks.map(r => (
                  <span key={r} className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold bg-red-100 text-red-700">
                    {r}
                  </span>
                ))}
                {/* Next action */}
                {deal.nextAction && (
                  <span className="text-xs text-gray-500 italic truncate max-w-[160px]">{deal.nextAction}</span>
                )}
                {/* Owner */}
                {(deal.ownedBy || deal.owner) && (
                  <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 font-semibold uppercase">
                    {(deal.ownedBy || deal.owner).slice(0, 2)}
                  </span>
                )}
                {/* Edit */}
                <button
                  onClick={() => setEditProspect(deal)}
                  className="ml-auto shrink-0 rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Edit
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit drawer */}
      {editProspect && (
        <>
          <div className="fixed inset-0 z-30 bg-black/20" onClick={() => setEditProspect(null)} />
          <EditDrawer prospect={editProspect} onClose={() => setEditProspect(null)} />
        </>
      )}

      {/* Add modal */}
      {showAdd && <AddToClosingModal onClose={() => setShowAdd(false)} />}
    </div>
  );
}
