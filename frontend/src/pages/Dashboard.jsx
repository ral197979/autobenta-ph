import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Car, Heart, MessageCircle, Wrench, CreditCard, Plus, BadgeCheck } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatPrice, formatRelativeTime, STATUS_COLORS, photoOrFallback } from '../utils/format';
import SellerVerification from '../components/seller/SellerVerification';

const TABS = ['my-listings', 'favorites', 'inquiries', 'inspections', 'financing', 'verification'];

export default function Dashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('favorites');

  const { data: myListings } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => api.get('/listings/user/my-listings').then(r => r.data),
    enabled: tab === 'my-listings',
  });
  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.get('/favorites').then(r => r.data),
    enabled: tab === 'favorites',
  });
  const { data: sentInquiries } = useQuery({
    queryKey: ['sent-inquiries'],
    queryFn: () => api.get('/inquiries/sent').then(r => r.data),
    enabled: tab === 'inquiries',
  });
  const { data: inspections } = useQuery({
    queryKey: ['my-inspections'],
    queryFn: () => api.get('/inspections').then(r => r.data),
    enabled: tab === 'inspections',
  });
  const { data: financing } = useQuery({
    queryKey: ['my-financing'],
    queryFn: () => api.get('/financing/my-requests').then(r => r.data),
    enabled: tab === 'financing',
  });

  const TabBtn = ({ id, icon: Icon, label }) => (
    <button onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap ${tab === id ? 'bg-primary-600 text-white' : 'text-gray-600 hover:bg-gray-100'}`}>
      <Icon className="w-4 h-4" />{label}
    </button>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Dashboard</h1>
          <p className="text-gray-500 text-sm">Welcome back, {user?.name}</p>
        </div>
        {['seller', 'dealer', 'admin'].includes(user?.role) && (
          <Link to="/sell" className="btn-primary flex items-center gap-2 text-sm"><Plus className="w-4 h-4" /> New Listing</Link>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 mb-6">
        {['seller', 'dealer', 'admin'].includes(user?.role) && <TabBtn id="my-listings" icon={Car} label="My Listings" />}
        <TabBtn id="favorites" icon={Heart} label="Saved Cars" />
        <TabBtn id="inquiries" icon={MessageCircle} label="Inquiries" />
        <TabBtn id="inspections" icon={Wrench} label="Inspections" />
        <TabBtn id="financing" icon={CreditCard} label="Financing" />
        {['seller', 'dealer', 'admin'].includes(user?.role) && <TabBtn id="verification" icon={BadgeCheck} label="Verification" />}
      </div>

      {/* My Listings */}
      {tab === 'my-listings' && (
        <div className="space-y-3">
          {myListings?.length === 0 && <EmptyState icon={Car} msg="No listings yet." cta={<Link to="/sell" className="btn-primary text-sm">Post Your First Car</Link>} />}
          {myListings?.map(l => (
            <div key={l.id} className="card p-4 flex items-center gap-4">
              <div className="w-20 h-14 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                <img src={photoOrFallback(l.photos?.[0]?.url, l.make)} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{l.year} {l.make} {l.model}</p>
                <p className="text-primary-600 font-bold text-sm">{formatPrice(l.price)}</p>
                <div className="flex items-center gap-3 text-xs text-gray-500 mt-1">
                  <span>{l._count.inquiries} inquiries</span>
                  <span>{l._count.favorites} saved</span>
                  <span>{formatRelativeTime(l.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`badge ${STATUS_COLORS[l.status]}`}>{l.status}</span>
                <Link to={`/cars/${l.id}`} className="btn-secondary text-xs py-1.5">View</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Favorites */}
      {tab === 'favorites' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites?.length === 0 && <div className="col-span-3"><EmptyState icon={Heart} msg="No saved cars yet." cta={<Link to="/cars" className="btn-primary text-sm">Browse Cars</Link>} /></div>}
          {favorites?.map(f => (
            <Link key={f.id} to={`/cars/${f.listingId}`} className="card p-3 flex gap-3 hover:shadow-md transition-shadow">
              <div className="w-20 h-16 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                <img src={photoOrFallback(f.listing?.photos?.[0]?.url, f.listing?.make)} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{f.listing?.year} {f.listing?.make} {f.listing?.model}</p>
                <p className="text-primary-600 font-bold text-sm">{formatPrice(f.listing?.price)}</p>
                <p className="text-xs text-gray-400">{f.listing?.city}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Inquiries */}
      {tab === 'inquiries' && (
        <div className="space-y-3">
          {sentInquiries?.length === 0 && <EmptyState icon={MessageCircle} msg="No inquiries sent yet." cta={<Link to="/cars" className="btn-primary text-sm">Browse Cars</Link>} />}
          {sentInquiries?.map(inq => (
            <div key={inq.id} className="card p-4">
              <div className="flex items-center gap-3 mb-2">
                <Link to={`/cars/${inq.listingId}`} className="font-medium text-sm text-primary-600 hover:underline">{inq.listing?.year} {inq.listing?.make} {inq.listing?.model}</Link>
                <span className={`badge text-xs ${inq.status === 'new' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{inq.status.replace('_', ' ')}</span>
              </div>
              <p className="text-sm text-gray-600 line-clamp-2">{inq.message}</p>
              <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(inq.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Inspections */}
      {tab === 'inspections' && (
        <div className="space-y-3">
          {inspections?.length === 0 && <EmptyState icon={Wrench} msg="No inspection requests yet." cta={<Link to="/cars" className="btn-primary text-sm">Browse Cars</Link>} />}
          {inspections?.map(ins => (
            <div key={ins.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <Link to={`/cars/${ins.listingId}`} className="font-medium text-sm text-primary-600 hover:underline">{ins.listing?.year} {ins.listing?.make} {ins.listing?.model}</Link>
                <span className={`badge text-xs ${ins.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>{ins.status}</span>
              </div>
              {ins.report && (
                <div className="bg-green-50 rounded-lg p-3 text-sm">
                  <p className="font-medium text-green-800">Score: {ins.report.overallScore}/100 — {ins.report.result.toUpperCase()}</p>
                </div>
              )}
              <p className="text-xs text-gray-400 mt-1">{formatRelativeTime(ins.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Financing */}
      {tab === 'financing' && (
        <div className="space-y-3">
          {financing?.length === 0 && <EmptyState icon={CreditCard} msg="No financing requests yet." cta={<Link to="/financing" className="btn-primary text-sm">Calculate Financing</Link>} />}
          {financing?.map(f => (
            <div key={f.id} className="card p-4">
              <div className="flex items-center justify-between mb-2">
                <Link to={`/cars/${f.listingId}`} className="font-medium text-sm text-primary-600 hover:underline">{f.listing?.year} {f.listing?.make} {f.listing?.model}</Link>
                <span className={`badge text-xs ${f.status === 'approved' ? 'bg-green-100 text-green-700' : f.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>{f.status}</span>
              </div>
              <div className="grid grid-cols-3 gap-3 text-sm">
                <div><p className="text-gray-400 text-xs">Vehicle Price</p><p className="font-medium">{formatPrice(f.vehiclePrice)}</p></div>
                <div><p className="text-gray-400 text-xs">Monthly</p><p className="font-medium text-primary-700">{formatPrice(f.monthlyPayment)}</p></div>
                <div><p className="text-gray-400 text-xs">Term</p><p className="font-medium">{f.termMonths} months</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'verification' && (
        <div className="max-w-2xl">
          <div className="mb-6">
            <h2 className="text-lg font-bold text-ink">Identity & Business Verification</h2>
            <p className="text-sm text-slatetext mt-1">
              Verified sellers earn trust badges that appear on your listings — increasing buyer confidence and inquiry rates.
            </p>
          </div>
          <SellerVerification user={user} />
        </div>
      )}
    </div>
  );
}

function EmptyState({ icon: Icon, msg, cta }) {
  return (
    <div className="text-center py-16">
      <Icon className="w-12 h-12 text-gray-300 mx-auto mb-3" />
      <p className="text-gray-400 mb-4">{msg}</p>
      {cta}
    </div>
  );
}
