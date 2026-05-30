import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Users, Car, BarChart3, FileCheck, CreditCard, CheckCircle, XCircle, AlertTriangle, Building2, AlertOctagon, UserX, BadgeCheck } from 'lucide-react';
import api from '../api/client';
import { formatPrice, formatRelativeTime, STATUS_COLORS } from '../utils/format';
import ModerationQueue from './admin/ModerationQueue';
import FraudReview from './admin/FraudReview';
import SellerRiskDashboard from './admin/SellerRiskDashboard';
import VerificationQueue from './admin/VerificationQueue';

const TABS = ['overview', 'verifications', 'moderation', 'fraud', 'seller-risk', 'listings', 'users', 'dealers', 'financing', 'logs'];

export default function AdminPanel() {
  const [tab, setTab] = useState('overview');
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: () => api.get('/admin/stats').then(r => r.data),
  });
  const { data: listings } = useQuery({
    queryKey: ['admin-listings', tab],
    queryFn: () => api.get('/admin/listings?status=pending').then(r => r.data),
    enabled: tab === 'listings',
  });
  const { data: users } = useQuery({
    queryKey: ['admin-users'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
    enabled: tab === 'users',
  });
  const { data: dealers } = useQuery({
    queryKey: ['admin-dealers'],
    queryFn: () => api.get('/admin/dealers').then(r => r.data),
    enabled: tab === 'dealers',
  });
  const { data: financing } = useQuery({
    queryKey: ['admin-financing'],
    queryFn: () => api.get('/admin/financing').then(r => r.data),
    enabled: tab === 'financing',
  });
  const { data: logs } = useQuery({
    queryKey: ['admin-logs'],
    queryFn: () => api.get('/admin/audit-logs').then(r => r.data),
    enabled: tab === 'logs',
  });

  const updateListing = useMutation({
    mutationFn: ({ id, status, reason }) => api.patch(`/admin/listings/${id}/status`, { status, reason }),
    onSuccess: () => qc.invalidateQueries(['admin-listings']),
  });
  const updateUser = useMutation({
    mutationFn: ({ id, data }) => api.patch(`/admin/users/${id}`, data),
    onSuccess: () => qc.invalidateQueries(['admin-users']),
  });
  const verifyDealer = useMutation({
    mutationFn: ({ id, isVerified }) => api.patch(`/admin/dealers/${id}/verify`, { isVerified }),
    onSuccess: () => qc.invalidateQueries(['admin-dealers']),
  });
  const updateDealerTier = useMutation({
    mutationFn: ({ id, tier }) => api.patch(`/admin/dealers/${id}`, { tier }),
    onSuccess: () => qc.invalidateQueries(['admin-dealers']),
  });
  const updateFinancing = useMutation({
    mutationFn: ({ id, status }) => api.patch(`/financing/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries(['admin-financing']),
  });

  const TabBtn = ({ id, icon: Icon, label }) => (
    <button onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${tab === id ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
      <Icon className="w-4 h-4" />{label}
    </button>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="w-7 h-7 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold">Admin Panel</h1>
          <p className="text-sm text-gray-500">AutoBenta PH Control Center</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        <TabBtn id="overview" icon={BarChart3} label="Overview" />
        <TabBtn id="verifications" icon={BadgeCheck} label="Verifications" />
        <TabBtn id="moderation" icon={AlertTriangle} label="Moderation" />
        <TabBtn id="fraud" icon={AlertOctagon} label="Fraud" />
        <TabBtn id="seller-risk" icon={UserX} label="Seller Risk" />
        <TabBtn id="listings" icon={Car} label="Listings" />
        <TabBtn id="users" icon={Users} label="Users" />
        <TabBtn id="dealers" icon={Building2} label="Dealers" />
        <TabBtn id="financing" icon={CreditCard} label="Financing" />
        <TabBtn id="logs" icon={FileCheck} label="Audit Logs" />
      </div>

      {tab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'Total Listings', value: stats.listings.total, sub: `${stats.listings.active} active` },
              { label: 'Total Users', value: stats.users.total, sub: `${stats.dealers.total} dealers` },
              { label: 'Inspections', value: stats.inspections.total },
              { label: 'Financing Requests', value: stats.financing.total },
            ].map(s => (
              <div key={s.label} className="card p-5 text-center">
                <p className="text-3xl font-bold text-primary-700">{s.value}</p>
                <p className="text-sm text-gray-600 mt-1">{s.label}</p>
                {s.sub && <p className="text-xs text-gray-400">{s.sub}</p>}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <p className="text-lg font-bold text-yellow-600">{stats.listings.pending}</p>
              <p className="text-xs text-gray-500">Pending Review</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-lg font-bold text-green-600">{stats.listings.sold}</p>
              <p className="text-xs text-gray-500">Sold</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-lg font-bold text-primary-700">{stats.inquiries.total}</p>
              <p className="text-xs text-gray-500">Total Inquiries</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-lg font-bold text-gray-700">{stats.averagePrice ? formatPrice(stats.averagePrice) : '—'}</p>
              <p className="text-xs text-gray-500">Avg. Listing Price</p>
            </div>
          </div>
        </div>
      )}

      {tab === 'verifications' && (
        <div>
          <div className="flex items-center gap-2 mb-6">
            <BadgeCheck className="w-5 h-5 text-deepblue" />
            <h2 className="text-lg font-bold text-ink">Verification Queue</h2>
          </div>
          <VerificationQueue />
        </div>
      )}

      {tab === 'moderation' && <ModerationQueue />}
      {tab === 'fraud' && <FraudReview />}
      {tab === 'seller-risk' && <SellerRiskDashboard />}

      {tab === 'listings' && (
        <div className="card overflow-hidden">
          <div className="p-4 border-b bg-yellow-50 border-yellow-100 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-600" />
            <p className="text-sm font-medium text-yellow-800">Listings pending review: {listings?.total || 0}</p>
          </div>
          <div className="divide-y">
            {listings?.listings?.map(l => (
              <div key={l.id} className="p-4 flex items-center gap-4">
                <div className="w-16 h-12 rounded overflow-hidden bg-gray-100 shrink-0">
                  <img src={l.photos?.[0]?.url || 'https://placehold.co/64x48/e2e8f0/64748b?text=Car'} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{l.year} {l.make} {l.model}</p>
                  <p className="text-xs text-gray-500">{l.seller.name} · {l.seller.email} · {formatRelativeTime(l.createdAt)}</p>
                  <p className="text-sm font-bold text-primary-700">{formatPrice(l.price)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => updateListing.mutate({ id: l.id, status: 'active' })}
                    className="flex items-center gap-1 bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                    <CheckCircle className="w-3 h-3" /> Approve
                  </button>
                  <button onClick={() => updateListing.mutate({ id: l.id, status: 'rejected', reason: 'Does not meet listing standards' })}
                    className="flex items-center gap-1 bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg transition-colors">
                    <XCircle className="w-3 h-3" /> Reject
                  </button>
                </div>
              </div>
            ))}
            {listings?.listings?.length === 0 && <div className="text-center py-12 text-gray-400">No pending listings</div>}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>{['Name', 'Email', 'Role', 'Status', 'Joined', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {users?.users?.map(u => (
                <tr key={u.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{u.name}</td>
                  <td className="px-4 py-3 text-gray-500">{u.email}</td>
                  <td className="px-4 py-3"><span className="badge bg-gray-100 text-gray-700 capitalize">{u.role}</span></td>
                  <td className="px-4 py-3"><span className={`badge ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{u.isActive ? 'Active' : 'Suspended'}</span></td>
                  <td className="px-4 py-3 text-gray-400">{formatRelativeTime(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button onClick={() => updateUser.mutate({ id: u.id, data: { isActive: !u.isActive } })}
                      className={`text-xs px-2.5 py-1 rounded-lg ${u.isActive ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                      {u.isActive ? 'Suspend' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'dealers' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>{['Business', 'Owner', 'City', 'Tier', 'Plan', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {dealers?.map(d => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{d.businessName}</td>
                  <td className="px-4 py-3 text-gray-500">{d.user?.name}</td>
                  <td className="px-4 py-3">{d.city || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={d.tier || 'basic'}
                      onChange={e => updateDealerTier.mutate({ id: d.id, tier: e.target.value })}
                      className="text-xs border border-gray-200 rounded px-1.5 py-1 bg-white"
                    >
                      {['basic', 'verified', 'verified_pro', 'enterprise'].map(t => (
                        <option key={t} value={t}>{t.replace('_', ' ')}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-500 capitalize">{d.subscription?.plan || 'free'}</td>
                  <td className="px-4 py-3"><span className={`badge ${d.isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{d.isVerified ? 'Verified' : 'Pending'}</span></td>
                  <td className="px-4 py-3">
                    <button onClick={() => verifyDealer.mutate({ id: d.id, isVerified: !d.isVerified })}
                      className={`text-xs px-2.5 py-1 rounded-lg ${d.isVerified ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}>
                      {d.isVerified ? 'Unverify' : 'Verify'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'financing' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>{['Buyer', 'Vehicle', 'Amount', 'Monthly', 'Status', 'Actions'].map(h => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {financing?.map(f => (
                <tr key={f.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{f.buyer?.name}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">{f.listing?.year} {f.listing?.make} {f.listing?.model}</td>
                  <td className="px-4 py-3">{formatPrice(f.loanAmount)}</td>
                  <td className="px-4 py-3 font-bold text-primary-700">{formatPrice(f.monthlyPayment)}/mo</td>
                  <td className="px-4 py-3"><span className={`badge text-xs ${STATUS_COLORS[f.status] || 'bg-gray-100 text-gray-700'}`}>{f.status}</span></td>
                  <td className="px-4 py-3 flex gap-1">
                    {f.status === 'requested' && <>
                      <button onClick={() => updateFinancing.mutate({ id: f.id, status: 'prequalified' })} className="text-xs bg-green-100 text-green-700 hover:bg-green-200 px-2 py-1 rounded">Pre-approve</button>
                      <button onClick={() => updateFinancing.mutate({ id: f.id, status: 'rejected' })} className="text-xs bg-red-100 text-red-700 hover:bg-red-200 px-2 py-1 rounded">Reject</button>
                    </>}
                    {f.status === 'prequalified' && <button onClick={() => updateFinancing.mutate({ id: f.id, status: 'approved' })} className="text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-2 py-1 rounded">Approve</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'logs' && (
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs">
              <tr>{['Action', 'Admin', 'Entity', 'Time'].map(h => <th key={h} className="px-4 py-3 text-left font-semibold">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y">
              {logs?.map(l => (
                <tr key={l.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-mono text-xs text-gray-700">{l.action}</td>
                  <td className="px-4 py-3 text-gray-500">{l.user?.name || '—'}</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{l.entityType} {l.entityId?.slice(0, 8)}...</td>
                  <td className="px-4 py-3 text-gray-400 text-xs">{formatRelativeTime(l.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
