import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Building2, Users, Car, Plus, AlertCircle, BarChart2, Bell } from 'lucide-react';
import api from '../api/client';
import { formatPrice, formatRelativeTime } from '../utils/format';
import DealerAnalytics from './dealer/DealerAnalytics';
import DealerReminders from './dealer/DealerReminders';

const LEAD_STATUSES = ['new', 'contacted', 'viewing_scheduled', 'financing', 'closed_won', 'closed_lost'];
const STATUS_COLORS = {
  new: 'bg-blue-100 text-blue-700', contacted: 'bg-yellow-100 text-yellow-700',
  viewing_scheduled: 'bg-purple-100 text-purple-700', financing: 'bg-orange-100 text-orange-700',
  closed_won: 'bg-green-100 text-green-700', closed_lost: 'bg-gray-100 text-gray-500',
};

const TABS = [
  { id: 'pipeline', label: 'Lead Pipeline', icon: Users },
  { id: 'analytics', label: 'Analytics', icon: BarChart2 },
  { id: 'reminders', label: 'Reminders', icon: Bell },
];

export default function DealerPanel() {
  const [leadsFilter, setLeadsFilter] = useState('');
  const [activeTab, setActiveTab] = useState('pipeline');
  const qc = useQueryClient();

  const { data: leads, isLoading: leadsLoading } = useQuery({
    queryKey: ['dealer-leads', leadsFilter],
    queryFn: () => api.get(`/dealers/me/leads${leadsFilter ? `?status=${leadsFilter}` : ''}`).then(r => r.data),
  });

  const { data: myListings } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => api.get('/listings/user/my-listings').then(r => r.data),
  });

  const updateLead = useMutation({
    mutationFn: ({ leadId, status, notes }) => api.patch(`/dealers/me/leads/${leadId}`, { status, notes }),
    onSuccess: () => qc.invalidateQueries(['dealer-leads']),
  });

  const activeListings = myListings?.filter(l => l.status === 'active').length || 0;
  const totalLeads = leads?.length || 0;
  const wonLeads = leads?.filter(l => l.status === 'closed_won').length || 0;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-7 h-7 text-primary-600" /> Dealer Dashboard</h1>
        </div>
        <Link to="/sell" className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> Add Listing</Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { icon: Car, label: 'Active Listings', value: activeListings, color: 'text-blue-600 bg-blue-100' },
          { icon: Users, label: 'Total Leads', value: totalLeads, color: 'text-purple-600 bg-purple-100' },
          { icon: AlertCircle, label: 'New Leads', value: leads?.filter(l => l.status === 'new').length || 0, color: 'text-orange-600 bg-orange-100' },
          { icon: Building2, label: 'Won Deals', value: wonLeads, color: 'text-green-600 bg-green-100' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card p-5 flex items-center gap-4">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}><Icon className="w-5 h-5" /></div>
            <div><p className="text-2xl font-bold">{value}</p><p className="text-xs text-gray-500">{label}</p></div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-gray-200">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'analytics' && <DealerAnalytics />}
      {activeTab === 'reminders' && (
        <div className="bg-white rounded-xl border p-6">
          <DealerReminders />
        </div>
      )}

      {activeTab === 'pipeline' && (
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Lead Pipeline */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold text-lg">Lead Pipeline</h2>
              <div className="flex gap-1 flex-wrap">
                {['', ...LEAD_STATUSES].map(s => (
                  <button key={s} onClick={() => setLeadsFilter(s)}
                    className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${leadsFilter === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {s === '' ? 'All' : s.replace('_', ' ')}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-gray-50">
              {leadsLoading && Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="p-4 animate-pulse flex gap-3">
                  <div className="w-14 h-10 bg-gray-200 rounded" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-3.5 bg-gray-200 rounded w-1/2" />
                    <div className="h-3 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
              {!leadsLoading && leads?.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No leads yet</p>
                </div>
              )}
              {leads?.map(lead => (
                <div key={lead.id} className="p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-14 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                      <img src={lead.listing?.photos?.[0]?.url || 'https://placehold.co/56x40/e2e8f0/64748b?text=Car'} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm">{lead.buyerName}</p>
                        <span className={`badge text-xs ${STATUS_COLORS[lead.status]}`}>{lead.status.replace('_', ' ')}</span>
                      </div>
                      <Link to={`/cars/${lead.listingId}`} className="text-xs text-gray-500 hover:text-primary-600">
                        {lead.listing?.year} {lead.listing?.make} {lead.listing?.model} — {formatPrice(lead.listing?.price)}
                      </Link>
                      <p className="text-xs text-gray-400">{formatRelativeTime(lead.createdAt)}</p>
                    </div>
                    <select
                      value={lead.status}
                      onChange={e => updateLead.mutate({ leadId: lead.id, status: e.target.value })}
                      className="input text-xs py-1.5 w-36 shrink-0"
                    >
                      {LEAD_STATUSES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  {lead.inquiry && (
                    <div className="mt-2 ml-[68px] bg-gray-50 rounded p-2 text-xs text-gray-600 line-clamp-2">
                      "{lead.inquiry.message}"
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Active Listings */}
        <div>
          <div className="card">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="font-bold">Active Listings</h2>
              <Link to="/sell" className="text-xs text-primary-600 hover:underline">+ Add</Link>
            </div>
            <div className="divide-y divide-gray-50">
              {myListings?.filter(l => l.status === 'active').map(l => (
                <Link key={l.id} to={`/cars/${l.id}`} className="flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors">
                  <div className="w-12 h-9 rounded overflow-hidden bg-gray-100 shrink-0">
                    <img src={l.photos?.[0]?.url || 'https://placehold.co/48x36/e2e8f0/64748b?text=Car'} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{l.year} {l.make} {l.model}</p>
                    <p className="text-xs text-primary-600">{formatPrice(l.price)}</p>
                  </div>
                  <p className="text-xs text-gray-400 shrink-0">{l._count.inquiries} inq.</p>
                </Link>
              ))}
              {myListings?.filter(l => l.status === 'active').length === 0 && (
                <div className="text-center py-8 text-gray-400 text-sm">No active listings</div>
              )}
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
