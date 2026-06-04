import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, BadgeCheck, Users, ClipboardList, XCircle, CheckCircle, ChevronDown } from 'lucide-react';
import api from '../../api/client';

const TIER_COLORS = {
  basic: 'bg-surface-container text-on-surface-variant',
  verified: 'bg-blue-100 text-blue-700',
  verified_pro: 'bg-purple-100 text-purple-700',
  enterprise: 'bg-amber-100 text-amber-700',
};

const RANK_COLORS = {
  A: 'bg-emerald-100 text-emerald-700',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-yellow-100 text-yellow-700',
  D: 'bg-red-100 text-red-700',
};

const TABS = ['All Dealers', 'Applications', 'Suspended'];

const TIERS = ['All Tiers', 'basic', 'verified', 'verified_pro', 'enterprise'];

function RejectionInput({ onConfirm, onCancel }) {
  const [reason, setReason] = useState('');
  return (
    <div className="flex items-center gap-2 mt-1">
      <input
        className="input text-xs py-1.5 flex-1"
        placeholder="Rejection reason…"
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        autoFocus
      />
      <button
        className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-40"
        disabled={!reason.trim()}
        onClick={() => onConfirm(reason)}
      >
        Confirm
      </button>
      <button className="text-xs text-on-surface-variant hover:text-on-surface" onClick={onCancel}>Cancel</button>
    </div>
  );
}

export default function DealerOperations() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('All Dealers');
  const [search, setSearch] = useState('');
  const [tierFilter, setTierFilter] = useState('All Tiers');
  const [appStatusFilter, setAppStatusFilter] = useState('submitted');
  const [rejectingId, setRejectingId] = useState(null);

  const { data: dealers, isLoading: dealersLoading } = useQuery({
    queryKey: ['admin-dealers'],
    queryFn: () => api.get('/admin/dealers').then(r => r.data),
  });

  const { data: applications, isLoading: appsLoading } = useQuery({
    queryKey: ['admin-applications'],
    queryFn: () => api.get('/admin/applications').then(r => r.data),
  });

  const invalidate = () => {
    qc.invalidateQueries(['admin-dealers']);
    qc.invalidateQueries(['admin-applications']);
  };

  const verifyMutation = useMutation({
    mutationFn: ({ id, isVerified }) => api.patch(`/admin/dealers/${id}/verify`, { isVerified }),
    onSuccess: invalidate,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => api.patch(`/admin/dealers/${id}`, data),
    onSuccess: invalidate,
  });

  const suspendMutation = useMutation({
    mutationFn: ({ id, suspend }) =>
      api.patch(`/admin/dealers/${id}/suspend`, {
        suspend,
        ...(suspend ? { reason: 'Manual suspension' } : {}),
      }),
    onSuccess: invalidate,
  });

  const applicationMutation = useMutation({
    mutationFn: ({ id, action, rejectionReason }) =>
      api.patch(`/admin/applications/${id}`, { action, ...(rejectionReason ? { rejectionReason } : {}) }),
    onSuccess: () => {
      setRejectingId(null);
      invalidate();
    },
  });

  const allDealers = Array.isArray(dealers) ? dealers : dealers?.dealers || [];
  const allApps = Array.isArray(applications) ? applications : applications?.applications || [];

  // Stats
  const totalDealers = allDealers.length;
  const verifiedCount = allDealers.filter((d) => d.isVerified).length;
  const proEnterpriseCount = allDealers.filter((d) => ['verified_pro', 'enterprise'].includes(d.tier)).length;
  const pendingAppsCount = allApps.filter((a) => a.status === 'submitted' || a.status === 'under_review').length;

  // Filtered dealers
  const filteredDealers = allDealers.filter((d) => {
    const matchSearch =
      !search ||
      d.businessName?.toLowerCase().includes(search.toLowerCase()) ||
      d.user?.email?.toLowerCase().includes(search.toLowerCase());
    const matchTier = tierFilter === 'All Tiers' || d.tier === tierFilter;
    return matchSearch && matchTier && !d.user?.isSuspended;
  });

  const suspendedDealers = allDealers.filter((d) => d.user?.isSuspended);

  const filteredApps = allApps.filter((a) => {
    if (appStatusFilter === 'all') return true;
    return a.status === appStatusFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header stats */}
      <div>
        <h1 className="text-xl font-bold text-on-surface">Dealer Operations</h1>
        <p className="text-sm text-on-surface-variant mt-1">Manage all dealer accounts, applications, and suspensions.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Dealers', value: totalDealers, icon: Building2, color: 'text-primary bg-primary/10' },
          { label: 'Verified', value: verifiedCount, icon: BadgeCheck, color: 'text-emerald-600 bg-emerald-100' },
          { label: 'Pro / Enterprise', value: proEnterpriseCount, icon: Users, color: 'text-purple-600 bg-purple-100' },
          { label: 'Pending Applications', value: pendingAppsCount, icon: ClipboardList, color: 'text-orange-600 bg-orange-100' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="card p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-on-surface">{value}</p>
              <p className="text-xs text-on-surface-variant">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border-subtle gap-1">
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
              activeTab === tab
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab}
            {tab === 'Applications' && pendingAppsCount > 0 && (
              <span className="ml-1.5 rounded-full bg-orange-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {pendingAppsCount}
              </span>
            )}
            {tab === 'Suspended' && suspendedDealers.length > 0 && (
              <span className="ml-1.5 rounded-full bg-red-500 px-1.5 py-0.5 text-[10px] font-bold text-white">
                {suspendedDealers.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* All Dealers tab */}
      {activeTab === 'All Dealers' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <input
              className="input text-sm py-2 w-60"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="flex rounded-lg border border-border-subtle overflow-hidden text-sm">
              {TIERS.map((t) => (
                <button
                  key={t}
                  onClick={() => setTierFilter(t)}
                  className={`px-3 py-2 font-medium transition-colors capitalize ${
                    tierFilter === t ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'
                  }`}
                >
                  {t === 'All Tiers' ? t : t.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          {dealersLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : !filteredDealers.length ? (
            <div className="card p-10 text-center text-on-surface-variant">
              <Building2 className="h-8 w-8 opacity-30 mx-auto mb-2" />
              <p className="text-sm">No dealers found.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-container text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                      {['Dealer Name', 'City', 'Tier', 'Verified', 'Listings', 'Leads', 'Score', 'Joined', 'Actions'].map((h) => (
                        <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cardborder">
                    {filteredDealers.map((d) => (
                      <tr key={d.id || d._id} className="hover:bg-surface-container transition-colors">
                        <td className="px-4 py-3 font-medium text-on-surface whitespace-nowrap">
                          {d.businessName || d.user?.name || '—'}
                          {d.user?.email && <div className="text-xs text-on-surface-variant">{d.user.email}</div>}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">{d.city || '—'}</td>
                        <td className="px-4 py-3">
                          <select
                            className="rounded-lg border border-border-subtle px-2 py-1 text-xs bg-surface-container-lowest"
                            value={d.tier || 'basic'}
                            onChange={(e) => updateMutation.mutate({ id: d.id || d._id, tier: e.target.value })}
                          >
                            <option value="basic">Basic</option>
                            <option value="verified">Verified</option>
                            <option value="verified_pro">Pro</option>
                            <option value="enterprise">Enterprise</option>
                          </select>
                        </td>
                        <td className="px-4 py-3">
                          {d.isVerified
                            ? <span className="text-emerald-600 font-semibold text-xs">✓ Yes</span>
                            : <span className="text-on-surface-variant text-xs">No</span>}
                        </td>
                        <td className="px-4 py-3 text-center">{d.listingsCount ?? '—'}</td>
                        <td className="px-4 py-3 text-center">{d.leadsCount ?? '—'}</td>
                        <td className="px-4 py-3">
                          {d.score?.rank ? (
                            <span className={`inline-flex items-center justify-center h-6 w-6 rounded-lg text-xs font-bold ${RANK_COLORS[d.score.rank] || 'bg-surface-container text-on-surface-variant'}`}>
                              {d.score.rank}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                          {d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => verifyMutation.mutate({ id: d.id || d._id, isVerified: !d.isVerified })}
                              className={`rounded-lg px-2.5 py-1 text-xs font-semibold transition-colors ${
                                d.isVerified
                                  ? 'border border-border-subtle text-on-surface-variant hover:bg-surface-container'
                                  : 'bg-emerald-600 text-white hover:bg-emerald-700'
                              }`}
                            >
                              {d.isVerified ? 'Unverify' : 'Verify ✓'}
                            </button>
                            <button
                              onClick={() => suspendMutation.mutate({ id: d.id || d._id, suspend: true })}
                              className="rounded-lg border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-600 hover:bg-red-100 transition-colors"
                            >
                              Suspend
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Applications tab */}
      {activeTab === 'Applications' && (
        <div className="space-y-4">
          <div className="flex rounded-lg border border-border-subtle overflow-hidden text-sm w-fit">
            {[
              { value: 'submitted', label: 'Submitted' },
              { value: 'under_review', label: 'Under Review' },
              { value: 'all', label: 'All' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setAppStatusFilter(value)}
                className={`px-3 py-2 font-medium transition-colors ${
                  appStatusFilter === value ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {appsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-14 rounded-xl bg-surface-container animate-pulse" />
              ))}
            </div>
          ) : !filteredApps.length ? (
            <div className="card p-10 text-center text-on-surface-variant">
              <ClipboardList className="h-8 w-8 opacity-30 mx-auto mb-2" />
              <p className="text-sm">No applications in this queue.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-container text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                      {['Applicant', 'Business', 'City', 'Plan', 'Submitted', 'Actions'].map((h) => (
                        <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cardborder">
                    {filteredApps.map((app) => {
                      const appId = app.id || app._id;
                      return (
                        <tr key={appId} className="hover:bg-surface-container transition-colors align-top">
                          <td className="px-4 py-3 font-medium text-on-surface">
                            {app.contactName || app.user?.name || '—'}
                            {app.user?.email && <div className="text-xs text-on-surface-variant">{app.user.email}</div>}
                          </td>
                          <td className="px-4 py-3">{app.businessName || '—'}</td>
                          <td className="px-4 py-3 text-on-surface-variant">{app.city || '—'}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${TIER_COLORS[app.selectedPlan] || 'bg-surface-container text-on-surface-variant'}`}>
                              {app.selectedPlan || 'free'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                            {app.createdAt ? new Date(app.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="space-y-1.5">
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => applicationMutation.mutate({ id: appId, action: 'approve' })}
                                  disabled={applicationMutation.isPending}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" /> Approve
                                </button>
                                <button
                                  onClick={() => setRejectingId(rejectingId === appId ? null : appId)}
                                  className="inline-flex items-center gap-1 rounded-lg border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-100"
                                >
                                  <XCircle className="h-3.5 w-3.5" /> Reject
                                </button>
                              </div>
                              {rejectingId === appId && (
                                <RejectionInput
                                  onConfirm={(reason) =>
                                    applicationMutation.mutate({ id: appId, action: 'reject', rejectionReason: reason })
                                  }
                                  onCancel={() => setRejectingId(null)}
                                />
                              )}
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
        </div>
      )}

      {/* Suspended tab */}
      {activeTab === 'Suspended' && (
        <div className="space-y-4">
          {!suspendedDealers.length ? (
            <div className="card p-10 text-center text-on-surface-variant">
              <CheckCircle className="h-8 w-8 opacity-30 mx-auto mb-2 text-emerald-500" />
              <p className="text-sm">No suspended dealers.</p>
            </div>
          ) : (
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle bg-surface-container text-left text-xs font-semibold text-on-surface-variant uppercase tracking-wide">
                      {['Dealer', 'City', 'Tier', 'Suspended', 'Actions'].map((h) => (
                        <th key={h} className="px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-cardborder">
                    {suspendedDealers.map((d) => (
                      <tr key={d.id || d._id} className="hover:bg-surface-container transition-colors">
                        <td className="px-4 py-3 font-medium text-on-surface">
                          {d.businessName || d.user?.name || '—'}
                          {d.user?.email && <div className="text-xs text-on-surface-variant">{d.user.email}</div>}
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant">{d.city || '—'}</td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${TIER_COLORS[d.tier] || 'bg-surface-container text-on-surface-variant'}`}>
                            {(d.tier || 'basic').replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-on-surface-variant whitespace-nowrap">
                          {d.user?.suspendedAt
                            ? new Date(d.user.suspendedAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => suspendMutation.mutate({ id: d.id || d._id, suspend: false })}
                            disabled={suspendMutation.isPending}
                            className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                          >
                            Unsuspend
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
