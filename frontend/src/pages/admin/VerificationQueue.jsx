import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { BadgeCheck, Clock, CheckCircle, XCircle, Eye, ChevronDown, ChevronUp, FileText, User } from 'lucide-react';
import api from '../../api/client';

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800',
  under_review: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  expired: 'bg-surface-container text-on-surface-variant',
  suspended: 'bg-orange-100 text-orange-800',
};

const TYPE_LABELS = {
  seller_identity: 'Seller Identity',
  dealer_business: 'Dealer Business',
  ownership: 'Ownership',
  vehicle: 'Vehicle',
  transfer_readiness: 'Transfer Readiness',
};

function RequestRow({ request, onReview }) {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  return (
    <div className="border border-border-subtle rounded-xl overflow-hidden">
      <div
        className="flex items-center gap-4 p-4 cursor-pointer hover:bg-surface-container"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold text-on-surface text-sm">{request.user.name}</span>
            <span className="text-xs text-on-surface-variant">{request.user.email}</span>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[request.status]}`}>
              {request.status.replace('_', ' ')}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-on-surface-variant">
            <span className="font-medium text-primary">{TYPE_LABELS[request.verificationType]}</span>
            {request.listing && <span>{request.listing.year} {request.listing.make} {request.listing.model}</span>}
            <span>{new Date(request.submittedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
            <span>{request.documents?.length || 0} doc{request.documents?.length !== 1 ? 's' : ''}</span>
          </div>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-on-surface-variant shrink-0" /> : <ChevronDown className="w-4 h-4 text-on-surface-variant shrink-0" />}
      </div>

      {expanded && (
        <div className="border-t border-border-subtle p-4 bg-surface-container space-y-4">
          {/* Documents */}
          {request.documents?.length > 0 && (
            <div>
              <p className="text-xs font-semibold text-on-surface-variant uppercase tracking-wide mb-2">Documents</p>
              <div className="flex flex-wrap gap-2">
                {request.documents.map((doc) => (
                  <a
                    key={doc.id}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border-subtle bg-surface-container-lowest px-3 py-2 text-xs font-medium text-on-surface hover:bg-blue-50 hover:border-primary/30"
                  >
                    <FileText className="w-3.5 h-3.5 text-primary" />
                    {doc.fileName || doc.documentType}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Last review note */}
          {request.reviews?.[0] && (
            <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-800">
              <span className="font-semibold">Last review by {request.reviews[0].reviewer?.name}:</span>{' '}
              {request.reviews[0].notes || '(no notes)'}
            </div>
          )}

          {/* Review actions */}
          {(request.status === 'pending' || request.status === 'under_review') && (
            <div className="space-y-3">
              <textarea
                placeholder="Reviewer notes (optional)"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input text-sm resize-none h-16"
              />
              <input
                placeholder="Rejection reason (required if rejecting)"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                className="input text-sm"
              />
              <div className="flex gap-2 flex-wrap">
                {request.status === 'pending' && (
                  <button
                    onClick={() => onReview(request.id, 'under_review', notes)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                  >
                    <Eye className="w-3.5 h-3.5" /> Start Review
                  </button>
                )}
                <button
                  onClick={() => onReview(request.id, 'approved', notes)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-semibold text-white hover:bg-emerald-700"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve
                </button>
                <button
                  onClick={() => onReview(request.id, 'rejected', notes, rejectionReason)}
                  disabled={!rejectionReason}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-red-600 px-3 py-2 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject
                </button>
                <button
                  onClick={() => onReview(request.id, 'suspended', notes, rejectionReason)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-orange-300 bg-orange-50 px-3 py-2 text-xs font-semibold text-orange-700 hover:bg-orange-100"
                >
                  Suspend
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function VerificationQueue() {
  const qc = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending');
  const [typeFilter, setTypeFilter] = useState('');

  const { data: queueData, isLoading } = useQuery({
    queryKey: ['admin-verifications', statusFilter, typeFilter],
    queryFn: () => api.get('/verifications/admin/queue', { params: { status: statusFilter, type: typeFilter || undefined } }).then(r => r.data),
  });

  const { data: stats } = useQuery({
    queryKey: ['admin-verification-stats'],
    queryFn: () => api.get('/verifications/admin/stats').then(r => r.data),
    refetchInterval: 30000,
  });

  const reviewMutation = useMutation({
    mutationFn: ({ id, action, notes, rejectionReason }) =>
      api.patch(`/verifications/admin/${id}/review`, { action, notes, rejectionReason }),
    onSuccess: () => {
      qc.invalidateQueries(['admin-verifications']);
      qc.invalidateQueries(['admin-verification-stats']);
    },
  });

  const handleReview = (id, action, notes, rejectionReason) => {
    reviewMutation.mutate({ id, action, notes, rejectionReason });
  };

  return (
    <div className="space-y-6">
      {/* Stats bar */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: 'Pending', value: stats.pending, color: 'text-yellow-600' },
            { label: 'Under Review', value: stats.underReview, color: 'text-blue-600' },
            { label: 'Approved Today', value: stats.approvedToday, color: 'text-emerald-600' },
            { label: 'Rejected Today', value: stats.rejectedToday, color: 'text-red-600' },
          ].map((s) => (
            <div key={s.label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-on-surface-variant mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="flex rounded-lg border border-border-subtle overflow-hidden text-sm">
          {['pending', 'under_review', 'approved', 'rejected', 'all'].map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s === 'all' ? '' : s)}
              className={`px-3 py-2 font-medium transition-colors ${(s === 'all' ? !statusFilter : statusFilter === s) ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}
            >
              {s === 'all' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          className="input text-sm py-2 w-48"
        >
          <option value="">All Types</option>
          {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {/* Queue */}
      {isLoading ? (
        <div className="text-center py-12 text-on-surface-variant">Loading verification queue...</div>
      ) : !queueData?.requests?.length ? (
        <div className="card p-12 text-center text-on-surface-variant">
          <BadgeCheck className="w-10 h-10 opacity-30 mx-auto mb-3" />
          <p className="font-medium">No verifications in this queue</p>
        </div>
      ) : (
        <div className="space-y-3">
          {queueData.requests.map((req) => (
            <RequestRow key={req.id} request={req} onReview={handleReview} />
          ))}
          {queueData.total > 20 && (
            <p className="text-center text-sm text-on-surface-variant">Showing 20 of {queueData.total}</p>
          )}
        </div>
      )}
    </div>
  );
}
