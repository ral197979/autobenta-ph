import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { formatRelativeTime } from '../../utils/format';

const STATUSES = [
  { value: 'all', label: 'All Leads' },
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'viewing_scheduled', label: 'Viewing' },
  { value: 'financing', label: 'Financing' },
  { value: 'closed_won', label: 'Won' },
  { value: 'closed_lost', label: 'Lost' },
];

const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-purple-100 text-purple-700',
  viewing_scheduled: 'bg-yellow-100 text-yellow-700',
  financing: 'bg-orange-100 text-orange-700',
  closed_won: 'bg-green-100 text-green-700',
  closed_lost: 'bg-gray-100 text-gray-500',
};

export default function LeadPipeline() {
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedLead, setSelectedLead] = useState(null);
  const [newNote, setNewNote] = useState('');
  const qc = useQueryClient();

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['dealer-leads', statusFilter],
    queryFn: () => {
      const params = statusFilter !== 'all' ? `?status=${statusFilter}` : '';
      return api.get(`/dealers/me/leads${params}`).then(r => r.data);
    },
  });

  const updateLeadMutation = useMutation({
    mutationFn: ({ leadId, data }) => api.patch(`/dealers/me/leads/${leadId}`, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dealer-leads'] }),
  });

  return (
    <div className="flex h-full min-h-[600px]">
      {/* Lead list */}
      <div className="w-full max-w-md border-r flex flex-col">
        {/* Status filters */}
        <div className="p-4 border-b">
          <div className="flex flex-wrap gap-1.5">
            {STATUSES.map(s => (
              <button
                key={s.value}
                onClick={() => setStatusFilter(s.value)}
                className={`text-xs px-2.5 py-1 rounded-full font-medium transition-colors ${
                  statusFilter === s.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Lead cards */}
        <div className="flex-1 overflow-y-auto divide-y">
          {isLoading && <div className="p-4 text-sm text-gray-400">Loading leads...</div>}
          {!isLoading && leads.length === 0 && (
            <div className="p-6 text-center text-gray-400 text-sm">No leads in this status.</div>
          )}
          {leads.map(lead => (
            <div
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedLead?.id === lead.id ? 'bg-blue-50' : ''
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900 text-sm">{lead.buyerName}</p>
                  <p className="text-xs text-gray-500">{lead.buyerPhone || lead.buyerEmail || 'No contact'}</p>
                </div>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${STATUS_COLORS[lead.status] || 'bg-gray-100 text-gray-500'}`}>
                  {lead.status.replace(/_/g, ' ')}
                </span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(lead.createdAt)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lead detail */}
      <div className="flex-1 p-6 overflow-y-auto">
        {!selectedLead ? (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Select a lead to view details
          </div>
        ) : (
          <div className="max-w-lg">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{selectedLead.buyerName}</h3>
                <p className="text-sm text-gray-500">{selectedLead.buyerEmail} · {selectedLead.buyerPhone}</p>
              </div>
              <span className={`text-xs px-2 py-1 rounded font-medium ${STATUS_COLORS[selectedLead.status]}`}>
                {selectedLead.status.replace(/_/g, ' ')}
              </span>
            </div>

            {/* Status update */}
            <div className="mb-4">
              <label className="text-xs font-medium text-gray-600 block mb-1">Update Status</label>
              <select
                value={selectedLead.status}
                onChange={e => {
                  updateLeadMutation.mutate({ leadId: selectedLead.id, data: { status: e.target.value } });
                  setSelectedLead({ ...selectedLead, status: e.target.value });
                }}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              >
                {STATUSES.filter(s => s.value !== 'all').map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>

            {/* Notes */}
            {selectedLead.notes && (
              <div className="mb-4 bg-gray-50 rounded-lg p-3">
                <p className="text-xs font-medium text-gray-500 mb-1">Notes</p>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedLead.notes}</p>
              </div>
            )}

            {/* Add note */}
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Add Note</label>
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                rows={3}
                placeholder="Enter follow-up notes..."
                className="w-full border rounded-lg p-2 text-sm"
              />
              <button
                onClick={() => {
                  const combined = [selectedLead.notes, newNote].filter(Boolean).join('\n\n');
                  updateLeadMutation.mutate({ leadId: selectedLead.id, data: { notes: combined } });
                  setSelectedLead({ ...selectedLead, notes: combined });
                  setNewNote('');
                }}
                disabled={!newNote.trim() || updateLeadMutation.isPending}
                className="mt-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-sm disabled:opacity-50"
              >
                Save Note
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
