import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatRelativeTime } from '../utils/format';

function Icon({ name, className = '', filled = false }) {
  return <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>;
}

const SEEN_KEY = 'ryderr-notif-seen';

const TYPE = {
  inquiry: { label: 'Inquiry', labelCls: 'text-secondary', icon: 'chat', iconBg: 'bg-surface-container-high', iconCls: 'text-on-surface-variant' },
  offer: { label: 'Offer', labelCls: 'text-secondary', icon: 'local_offer', iconBg: 'bg-secondary-container', iconCls: 'text-on-secondary-container' },
  inspection: { label: 'Inspection', labelCls: 'text-trust-emerald', icon: 'verified', iconBg: 'bg-trust-emerald/15', iconCls: 'text-trust-emerald' },
  search: { label: 'Saved Search', labelCls: 'text-primary', icon: 'bookmark', iconBg: 'bg-primary/10', iconCls: 'text-primary' },
};

function buildNotifications({ inquiries, inspections, offers, searches, canReceive }) {
  const out = [];
  (searches || []).forEach((s) => {
    if (!s.alertOn || !s.newCount) return;
    out.push({
      id: 'srch-' + s.id, type: 'search', time: new Date().toISOString(),
      title: `${s.newCount} new match${s.newCount === 1 ? '' : 'es'} for "${s.name}"`,
      body: `New listings match your saved search. Tap to view.`,
      link: '/saved-searches',
    });
  });
  (inquiries || []).forEach((q) => {
    const car = `${q.listing?.year || ''} ${q.listing?.make || ''} ${q.listing?.model || ''}`.trim();
    out.push({
      id: 'inq-' + q.id, type: 'inquiry', time: q.createdAt,
      title: canReceive ? 'New inquiry received' : 'Inquiry sent',
      body: canReceive ? `${q.buyer?.name || 'A buyer'} asked about your ${car}.` : `You inquired about the ${car}.`,
      link: '/inquiries',
    });
  });
  (offers || []).forEach((o) => {
    const car = `${o.listing?.year || ''} ${o.listing?.make || ''} ${o.listing?.model || ''}`.trim();
    const amt = o.amount != null ? `₱${Number(o.amount).toLocaleString()}` : '';
    out.push({
      id: 'off-' + o.id, type: 'offer', time: o.updatedAt || o.createdAt,
      title: canReceive ? 'New offer received!' : `Offer ${o.status}`,
      body: canReceive ? `${o.buyer?.name || 'A buyer'} offered ${amt} for your ${car}.` : `Your ${amt} offer on the ${car} is ${o.status}.`,
      link: '/offers',
    });
  });
  (inspections || []).forEach((ins) => {
    const car = `${ins.listing?.year || ''} ${ins.listing?.make || ''} ${ins.listing?.model || ''}`.trim();
    const done = ins.status === 'completed';
    out.push({
      id: 'insp-' + ins.id, type: 'inspection', time: ins.updatedAt || ins.createdAt,
      title: done ? 'Inspection completed' : 'Inspection update',
      body: done ? `Your ${car} passed inspection${ins.report ? ` — ${ins.report.overallScore}/100.` : '.'}` : `Inspection for the ${car} is ${ins.status}.`,
      link: done ? `/inspections/${ins.id}` : `/cars/${ins.listingId}`,
    });
  });
  return out.filter(n => n.time).sort((a, b) => new Date(b.time) - new Date(a.time));
}

export default function NotificationsCenter() {
  const { user } = useAuth();
  const canReceive = ['seller', 'dealer', 'admin'].includes(user?.role);
  const [tab, setTab] = useState('all');
  const [seen, setSeen] = useState(() => Number(localStorage.getItem(SEEN_KEY) || 0));

  const inqQ = useQuery({ queryKey: ['notif-inquiries', canReceive], queryFn: () => api.get(`/inquiries/${canReceive ? 'received' : 'sent'}`).then(r => r.data).catch(() => []) });
  const inspQ = useQuery({ queryKey: ['notif-inspections'], queryFn: () => api.get('/inspections').then(r => r.data).catch(() => []) });
  const offerQ = useQuery({ queryKey: ['notif-offers', canReceive], queryFn: () => api.get(`/offers?box=${canReceive ? 'received' : 'sent'}`).then(r => r.data).catch(() => []) });
  const searchQ = useQuery({ queryKey: ['notif-searches'], queryFn: () => api.get('/saved-searches').then(r => r.data).catch(() => []) });

  const loading = inqQ.isLoading || inspQ.isLoading;
  const all = buildNotifications({ inquiries: inqQ.data, inspections: inspQ.data, offers: offerQ.data, searches: searchQ.data, canReceive });
  const isUnread = (n) => new Date(n.time).getTime() > seen;
  const shown = tab === 'unread' ? all.filter(isUnread) : all;

  const markAllRead = () => { const now = Date.now(); localStorage.setItem(SEEN_KEY, String(now)); setSeen(now); };

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop pb-24">
        <div className="py-lg flex flex-col gap-sm">
          <div className="flex justify-between items-end">
            <h1 className="text-headline-lg font-headline-lg text-on-surface">Notifications</h1>
            <button onClick={markAllRead} className="text-on-tertiary-container font-label-md text-label-md hover:underline underline-offset-4 transition-all">Mark all as read</button>
          </div>
          <div className="flex gap-lg mt-md border-b border-border-subtle">
            {['all', 'unread'].map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`pb-md text-label-md font-label-md capitalize transition-colors border-b-2 ${tab === t ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
                {t}{t === 'unread' ? ` (${all.filter(isUnread).length})` : ''}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-base">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-md bg-surface-container-lowest rounded-xl flex gap-md border border-border-subtle animate-pulse">
                <div className="w-12 h-12 rounded-xl bg-surface-container shrink-0" />
                <div className="flex-1 space-y-2"><div className="h-3 bg-surface-container rounded w-1/4" /><div className="h-4 bg-surface-container rounded w-3/4" /></div>
              </div>
            ))
          ) : shown.length === 0 ? (
            <div className="text-center py-20">
              <Icon name="notifications_off" className="text-6xl text-on-surface-variant/40 mb-3" />
              <p className="text-on-surface-variant text-body-lg">{tab === 'unread' ? "You're all caught up." : 'No notifications yet.'}</p>
            </div>
          ) : (
            shown.map((n) => {
              const t = TYPE[n.type];
              const unread = isUnread(n);
              return (
                <Link key={n.id} to={n.link}
                  className={`notification-card p-md rounded-xl flex gap-md items-start relative transition-all ${unread ? 'bg-surface-container-lowest border border-border-subtle shadow-sm' : 'bg-surface border border-transparent hover:border-border-subtle'}`}>
                  {unread && <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-on-tertiary-container rounded-full" />}
                  <div className={`w-12 h-12 rounded-xl ${t.iconBg} flex items-center justify-center shrink-0`}>
                    <Icon name={t.icon} className={t.iconCls} />
                  </div>
                  <div className="flex flex-col gap-xs pr-4 min-w-0">
                    <div className="flex items-center gap-xs">
                      <span className={`text-label-sm font-label-sm uppercase tracking-widest ${t.labelCls}`}>{t.label}</span>
                      <span className="text-outline text-[10px]">•</span>
                      <span className="text-label-sm font-label-sm text-on-surface-variant">{formatRelativeTime(n.time)}</span>
                    </div>
                    <p className="text-body-md font-semibold text-on-surface">{n.title}</p>
                    <p className="text-body-sm text-on-surface-variant">{n.body}</p>
                  </div>
                </Link>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
}
