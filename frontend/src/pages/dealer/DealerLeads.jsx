import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, Search, ChevronDown, MessageSquare, Phone, Mail } from 'lucide-react';
import api from '../../api/client';
import { formatPrice, formatRelativeTime } from '../../utils/format';

const STATUSES = ['new', 'contacted', 'viewing_scheduled', 'financing', 'closed_won', 'closed_lost'];
const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-700',
  contacted: 'bg-yellow-100 text-yellow-700',
  viewing_scheduled: 'bg-purple-100 text-purple-700',
  financing: 'bg-orange-100 text-orange-700',
  closed_won: 'bg-emerald-100 text-emerald-700',
  closed_lost: 'bg-surface-container text-on-surface-variant',
};
const SOURCE_COLORS = {
  inquiry: 'bg-blue-50 text-blue-600',
  financing: 'bg-orange-50 text-orange-600',
  inspection: 'bg-purple-50 text-purple-600',
  api: 'bg-indigo-50 text-indigo-600',
  referral: 'bg-teal-50 text-teal-600',
};

export default function DealerLeads() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState(null);
  const [noteInput, setNoteInput] = useState({});

  const { data: leads = [], isLoading } = useQuery({
    queryKey: ['dealer-leads', statusFilter],
    queryFn: () => api.get(`/dealers/me/leads${statusFilter ? `?status=${statusFilter}` : ''}`).then(r => r.data),
  });

  const updateLead = useMutation({
    mutationFn: ({ leadId, status, notes }) => api.patch(`/dealers/me/leads/${leadId}`, { status, notes }),
    onSuccess: () => qc.invalidateQueries(['dealer-leads']),
  });

  const filtered = search
    ? leads.filter(l =>
        l.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
        l.listing?.make?.toLowerCase().includes(search.toLowerCase()) ||
        l.listing?.model?.toLowerCase().includes(search.toLowerCase())
      )
    : leads;

  const counts = STATUSES.reduce((acc, s) => {
    acc[s] = leads.filter(l => l.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-on-surface">Lead Management</h1>
        <span className="text-sm text-on-surface-variant">{leads.length} total leads</span>
      </div>

      {/* Status funnel */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {STATUSES.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
            className={`rounded-xl border p-3 text-center transition-all ${statusFilter === s ? 'border-primary bg-primary/5' : 'border-border-subtle bg-surface-container-lowest hover:border-primary/30'}`}
          >
            <p className={`text-lg font-bold ${statusFilter === s ? 'text-primary' : 'text-on-surface'}`}>{counts[s] || 0}</p>
            <p className="text-[10px] text-on-surface-variant mt-0.5 capitalize leading-tight">{s.replace(/_/g, ' ')}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-on-surface-variant" />
        <input
          type="text"
          placeholder="Search leads by buyer name or vehicle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-9 text-sm"
        />
      </div>

      {/* Lead list */}
      {isLoading ? (
        <div className="text-center py-16 text-on-surface-variant">Loading leads...</div>
      ) : !filtered.length ? (
        <div className="card p-12 text-center text-on-surface-variant">
          <Users className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No leads found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((lead) => (
            <div key={lead.id} className="card overflow-hidden">
              <div
                className="flex items-center gap-4 p-4 cursor-pointer hover:bg-surface-container"
                onClick={() => setExpandedId(expandedId === lead.id ? null : lead.id)}
              >
                <div className="h-12 w-16 rounded-lg overflow-hidden bg-surface-container shrink-0">
                  <img src={lead.listing?.photos?.[0]?.url || ''} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-sm text-on-surface">{lead.buyerName}</p>
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[lead.status]}`}>
                      {lead.status.replace(/_/g, ' ')}
                    </span>
                    {lead.source && lead.source !== 'inquiry' && (
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${SOURCE_COLORS[lead.source] || 'bg-surface-container text-on-surface-variant'}`}>
                        {lead.source}
                      </span>
                    )}
                  </div>
                  <Link to={`/cars/${lead.listingId}`} className="text-xs text-on-surface-variant hover:text-primary" onClick={e => e.stopPropagation()}>
                    {lead.listing?.year} {lead.listing?.make} {lead.listing?.model}
                    {lead.listing?.price && <span className="ml-1 font-semibold text-primary">{formatPrice(lead.listing.price)}</span>}
                  </Link>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-on-surface-variant">{formatRelativeTime(lead.createdAt)}</p>
                  <ChevronDown className={`h-4 w-4 text-on-surface-variant ml-auto mt-1 transition-transform ${expandedId === lead.id ? 'rotate-180' : ''}`} />
                </div>
              </div>

              {expandedId === lead.id && (
                <div className="border-t border-border-subtle p-4 bg-surface-container space-y-4">
                  {/* Contact info */}
                  <div className="flex gap-4 flex-wrap text-sm">
                    {lead.buyerPhone && (
                      <a href={`tel:${lead.buyerPhone}`} className="inline-flex items-center gap-1.5 text-on-surface hover:text-primary">
                        <Phone className="h-3.5 w-3.5" /> {lead.buyerPhone}
                      </a>
                    )}
                    {lead.buyerEmail && (
                      <a href={`mailto:${lead.buyerEmail}`} className="inline-flex items-center gap-1.5 text-on-surface hover:text-primary">
                        <Mail className="h-3.5 w-3.5" /> {lead.buyerEmail}
                      </a>
                    )}
                  </div>

                  {/* Inquiry message */}
                  {lead.inquiry?.message && (
                    <div className="rounded-lg border border-border-subtle bg-surface-container-lowest p-3 text-sm text-on-surface">
                      <p className="text-xs font-semibold text-on-surface-variant mb-1 flex items-center gap-1"><MessageSquare className="h-3 w-3" /> Buyer message</p>
                      {lead.inquiry.message}
                    </div>
                  )}

                  {/* Notes */}
                  {lead.notes && (
                    <div className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-800">
                      <p className="font-semibold mb-0.5">Notes</p>
                      {lead.notes}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 flex-wrap items-end">
                    <div className="flex-1 min-w-0">
                      <label className="block text-xs font-medium text-on-surface-variant mb-1">Add note</label>
                      <input
                        type="text"
                        placeholder="e.g. Scheduled test drive for Saturday..."
                        value={noteInput[lead.id] || ''}
                        onChange={(e) => setNoteInput(p => ({ ...p, [lead.id]: e.target.value }))}
                        className="input text-sm"
                      />
                    </div>
                    <div className="flex gap-2 shrink-0">
                      {noteInput[lead.id] && (
                        <button
                          onClick={() => {
                            updateLead.mutate({ leadId: lead.id, notes: noteInput[lead.id] });
                            setNoteInput(p => ({ ...p, [lead.id]: '' }));
                          }}
                          className="rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary/90"
                        >
                          Save Note
                        </button>
                      )}
                      <select
                        value={lead.status}
                        onChange={(e) => updateLead.mutate({ leadId: lead.id, status: e.target.value })}
                        className="input text-xs py-2 w-40"
                      >
                        {STATUSES.map((s) => <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
