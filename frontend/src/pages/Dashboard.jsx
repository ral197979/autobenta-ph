import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Car, Heart, MessageCircle, Wrench, CreditCard, Plus, BadgeCheck } from 'lucide-react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatPrice, formatRelativeTime, STATUS_COLORS, photoOrFallback } from '../utils/format';
import SellerVerification from '../components/seller/SellerVerification';

const CARD = 'bg-surface-container-lowest rounded-2xl border border-border-subtle';
const BTN_PRIMARY = 'bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md hover:opacity-90 active:scale-95 transition-all';
const BTN_SECONDARY = 'rounded-xl border border-border-subtle text-on-surface px-md py-1.5 text-label-md hover:bg-surface-container transition-colors';

export default function Dashboard() {
  const { user } = useAuth();
  const canSell = ['seller', 'dealer', 'admin'].includes(user?.role);
  const [tab, setTab] = useState('favorites');

  // Eager so the profile stats row is always populated.
  const { data: myListings } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => api.get('/listings/user/my-listings').then(r => r.data),
    enabled: canSell,
  });
  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => api.get('/favorites').then(r => r.data),
  });
  const { data: sentInquiries } = useQuery({
    queryKey: ['sent-inquiries'],
    queryFn: () => api.get('/inquiries/sent').then(r => r.data),
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
    <button onClick={() => setTab(id)} className={`flex items-center gap-2 px-4 py-2.5 text-label-md font-medium rounded-lg transition-colors whitespace-nowrap ${tab === id ? 'bg-primary text-on-primary' : 'text-on-surface-variant hover:bg-surface-container'}`}>
      <Icon className="w-4 h-4" />{label}
    </button>
  );

  const Status = ({ children, cls }) => (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${cls}`}>{children}</span>
  );

  const stats = [
    ...(canSell ? [{ n: myListings?.length ?? 0, label: 'Active Listings' }] : []),
    { n: favorites?.length ?? 0, label: 'Saved Cars' },
    { n: sentInquiries?.length ?? 0, label: 'Inquiries' },
  ];

  return (
    <div className="max-w-6xl mx-auto px-gutter-mobile md:px-gutter-desktop py-2xl space-y-xl">
      {/* Profile header */}
      <section className={`${CARD} flex flex-col items-center text-center gap-md py-xl`}>
        <div className="relative">
          <div className="h-24 w-24 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-4xl font-bold border-4 border-surface-container-lowest shadow-lg">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="absolute bottom-0 right-0 bg-trust-emerald text-white rounded-full p-1 border-2 border-surface-container-lowest flex items-center justify-center">
            <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
          </div>
        </div>
        <div className="flex flex-col gap-xs">
          <h1 className="text-headline-lg font-headline-lg text-on-surface">{user?.name}</h1>
          <p className="text-on-surface-variant text-body-md capitalize">{user?.role} account</p>
        </div>
        {canSell && (
          <Link to="/sell" className={`${BTN_PRIMARY} flex items-center gap-2`}><Plus className="w-4 h-4" /> New Listing</Link>
        )}
      </section>

      {/* Quick stats */}
      <section className={`grid gap-md ${stats.length === 3 ? 'grid-cols-3' : 'grid-cols-2'}`}>
        {stats.map((s) => (
          <div key={s.label} className={`${CARD} p-md flex flex-col items-center gap-xs text-center`}>
            <span className="text-headline-sm font-headline-sm text-primary">{s.n}</span>
            <span className="text-label-sm font-label-sm text-on-surface-variant">{s.label}</span>
          </div>
        ))}
      </section>

      <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-2">
        {canSell && <TabBtn id="my-listings" icon={Car} label="My Listings" />}
        <TabBtn id="favorites" icon={Heart} label="Saved Cars" />
        <TabBtn id="inquiries" icon={MessageCircle} label="Inquiries" />
        <TabBtn id="inspections" icon={Wrench} label="Inspections" />
        <TabBtn id="financing" icon={CreditCard} label="Financing" />
        {['seller', 'dealer', 'admin'].includes(user?.role) && <TabBtn id="verification" icon={BadgeCheck} label="Verification" />}
      </div>

      {/* My Listings */}
      {tab === 'my-listings' && (
        <div className="space-y-3">
          {myListings?.length === 0 && <EmptyState icon={Car} msg="No listings yet." cta={<Link to="/sell" className={BTN_PRIMARY}>Post Your First Car</Link>} />}
          {myListings?.map(l => (
            <div key={l.id} className={`${CARD} p-4 flex items-center gap-4`}>
              <div className="w-20 h-14 rounded-lg overflow-hidden bg-surface-container shrink-0">
                <img src={photoOrFallback(l.photos?.[0]?.url, l.make)} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-body-sm text-on-surface truncate">{l.year} {l.make} {l.model}</p>
                <p className="text-primary font-bold text-body-sm">{formatPrice(l.price)}</p>
                <div className="flex items-center gap-3 text-xs text-on-surface-variant mt-1">
                  <span>{l._count.inquiries} inquiries</span>
                  <span>{l._count.favorites} saved</span>
                  <span>{formatRelativeTime(l.createdAt)}</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Status cls={STATUS_COLORS[l.status]}>{l.status}</Status>
                {['dealer', 'admin'].includes(user?.role) && (
                  <Link to={`/promote/${l.id}`} className={`${BTN_SECONDARY} flex items-center gap-1`}><span className="material-symbols-outlined text-[16px]">rocket_launch</span> Promote</Link>
                )}
                <Link to={`/cars/${l.id}`} className={BTN_SECONDARY}>View</Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Favorites */}
      {tab === 'favorites' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favorites?.length === 0 && <div className="col-span-3"><EmptyState icon={Heart} msg="No saved cars yet." cta={<Link to="/cars" className={BTN_PRIMARY}>Browse Cars</Link>} /></div>}
          {favorites?.map(f => (
            <Link key={f.id} to={`/cars/${f.listingId}`} className={`${CARD} p-3 flex gap-3 hover:shadow-md transition-shadow`}>
              <div className="w-20 h-16 rounded-lg overflow-hidden bg-surface-container shrink-0">
                <img src={photoOrFallback(f.listing?.photos?.[0]?.url, f.listing?.make)} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-body-sm text-on-surface truncate">{f.listing?.year} {f.listing?.make} {f.listing?.model}</p>
                <p className="text-primary font-bold text-body-sm">{formatPrice(f.listing?.price)}</p>
                <p className="text-xs text-on-surface-variant">{f.listing?.city}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Inquiries */}
      {tab === 'inquiries' && (
        <div className="space-y-3">
          {sentInquiries?.length === 0 && <EmptyState icon={MessageCircle} msg="No inquiries sent yet." cta={<Link to="/cars" className={BTN_PRIMARY}>Browse Cars</Link>} />}
          {sentInquiries?.map(inq => (
            <div key={inq.id} className={`${CARD} p-4`}>
              <div className="flex items-center gap-3 mb-2">
                <Link to={`/cars/${inq.listingId}`} className="font-medium text-body-sm text-primary hover:underline">{inq.listing?.year} {inq.listing?.make} {inq.listing?.model}</Link>
                <Status cls={inq.status === 'new' ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-on-surface-variant'}>{inq.status.replace('_', ' ')}</Status>
              </div>
              <p className="text-body-sm text-on-surface-variant line-clamp-2">{inq.message}</p>
              <p className="text-xs text-on-surface-variant/70 mt-1">{formatRelativeTime(inq.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Inspections */}
      {tab === 'inspections' && (
        <div className="space-y-3">
          {inspections?.length === 0 && <EmptyState icon={Wrench} msg="No inspection requests yet." cta={<Link to="/cars" className={BTN_PRIMARY}>Browse Cars</Link>} />}
          {inspections?.map(ins => (
            <div key={ins.id} className={`${CARD} p-4`}>
              <div className="flex items-center justify-between mb-2">
                <Link to={ins.status === 'completed' ? `/inspections/${ins.id}` : `/cars/${ins.listingId}`} className="font-medium text-body-sm text-primary hover:underline">{ins.listing?.year} {ins.listing?.make} {ins.listing?.model}</Link>
                <Status cls={ins.status === 'completed' ? 'bg-trust-emerald/15 text-trust-emerald' : 'bg-alert-orange/15 text-alert-orange'}>{ins.status}</Status>
              </div>
              {ins.report && (
                <Link to={`/inspections/${ins.id}`} className="block bg-trust-emerald/10 rounded-lg p-3 text-body-sm hover:bg-trust-emerald/20 transition-colors">
                  <p className="font-medium text-trust-emerald">Score: {ins.report.overallScore}/100 — {ins.report.result.toUpperCase()} · View report →</p>
                </Link>
              )}
              <p className="text-xs text-on-surface-variant/70 mt-1">{formatRelativeTime(ins.createdAt)}</p>
            </div>
          ))}
        </div>
      )}

      {/* Financing */}
      {tab === 'financing' && (
        <div className="space-y-3">
          {financing?.length === 0 && <EmptyState icon={CreditCard} msg="No financing requests yet." cta={<Link to="/financing" className={BTN_PRIMARY}>Calculate Financing</Link>} />}
          {financing?.map(f => (
            <div key={f.id} className={`${CARD} p-4`}>
              <div className="flex items-center justify-between mb-2">
                <Link to={`/cars/${f.listingId}`} className="font-medium text-body-sm text-primary hover:underline">{f.listing?.year} {f.listing?.make} {f.listing?.model}</Link>
                <Status cls={f.status === 'approved' ? 'bg-trust-emerald/15 text-trust-emerald' : f.status === 'rejected' ? 'bg-error/15 text-error' : 'bg-alert-orange/15 text-alert-orange'}>{f.status}</Status>
              </div>
              <div className="grid grid-cols-3 gap-3 text-body-sm">
                <div><p className="text-on-surface-variant text-xs">Vehicle Price</p><p className="font-medium text-on-surface">{formatPrice(f.vehiclePrice)}</p></div>
                <div><p className="text-on-surface-variant text-xs">Monthly</p><p className="font-medium text-primary">{formatPrice(f.monthlyPayment)}</p></div>
                <div><p className="text-on-surface-variant text-xs">Term</p><p className="font-medium text-on-surface">{f.termMonths} months</p></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'verification' && (
        <div className="max-w-2xl">
          <div className="mb-6">
            <h2 className="text-headline-sm font-bold text-on-surface">Identity & Business Verification</h2>
            <p className="text-body-sm text-on-surface-variant mt-1">
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
      <Icon className="w-12 h-12 text-on-surface-variant/40 mx-auto mb-3" />
      <p className="text-on-surface-variant mb-4">{msg}</p>
      {cta}
    </div>
  );
}
