import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatRelativeTime, photoOrFallback } from '../utils/format';

function Icon({ name, className = '', filled = false }) {
  return <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>;
}

const STATUS_STYLE = {
  new: { cls: 'bg-secondary-container text-on-secondary-container', icon: 'mark_email_unread', label: 'New' },
  responded: { cls: 'bg-primary/10 text-primary', icon: 'forum', label: 'Responded' },
  contacted: { cls: 'bg-primary/10 text-primary', icon: 'forum', label: 'Contacted' },
  negotiating: { cls: 'bg-surface-container-highest text-on-surface-variant', icon: 'payments', label: 'Negotiating' },
  closed: { cls: 'bg-trust-emerald/10 text-trust-emerald', icon: 'verified', label: 'Closed' },
  sold: { cls: 'bg-trust-emerald/10 text-trust-emerald', icon: 'verified', label: 'Sold' },
};
const statusOf = (s) => STATUS_STYLE[s] || { cls: 'bg-surface-container-highest text-on-surface-variant', icon: 'chat', label: s || '—' };

export default function InquiryHistory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const canReceive = ['seller', 'dealer', 'admin'].includes(user?.role);
  const [box, setBox] = useState(canReceive ? 'received' : 'sent');
  const [filter, setFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['inquiries', box],
    queryFn: () => api.get(`/inquiries/${box}`).then(r => r.data),
  });

  const inquiries = data || [];
  const statuses = ['all', ...Array.from(new Set(inquiries.map(i => i.status).filter(Boolean)))];
  const shown = filter === 'all' ? inquiries : inquiries.filter(i => i.status === filter);

  return (
    <div className="bg-surface min-h-screen">
      <main className="max-w-container-max mx-auto">
        {/* Header */}
        <div className="px-gutter-mobile md:px-gutter-desktop pt-lg flex items-center gap-4">
          <button onClick={() => navigate(-1)} aria-label="Back" className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-surface-container-low transition-colors">
            <Icon name="arrow_back" className="text-on-surface" />
          </button>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Inquiry History</h1>
        </div>

        {/* Box toggle (received/sent) */}
        {canReceive && (
          <div className="px-gutter-mobile md:px-gutter-desktop pt-md flex gap-sm">
            {['received', 'sent'].map((b) => (
              <button key={b} onClick={() => { setBox(b); setFilter('all'); }}
                className={`px-md py-sm rounded-full text-label-md capitalize transition-colors ${box === b ? 'bg-primary text-on-primary' : 'bg-surface-container text-on-surface-variant hover:bg-surface-container-high'}`}>
                {b}
              </button>
            ))}
          </div>
        )}

        {/* Status filter tabs */}
        <nav className="flex px-gutter-mobile md:px-gutter-desktop overflow-x-auto hide-scrollbar gap-6 border-b border-border-subtle mt-md">
          {statuses.map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`relative py-4 text-label-md whitespace-nowrap capitalize transition-colors ${filter === s ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}>
              {s === 'all' ? 'All' : statusOf(s).label}
              {filter === s && <span className="absolute bottom-0 left-0 w-full h-0.5 bg-primary rounded-full" />}
            </button>
          ))}
        </nav>

        {/* List */}
        <section className="px-gutter-mobile md:px-gutter-desktop py-lg space-y-md">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-surface-container-lowest border border-border-subtle rounded-xl p-md flex gap-md animate-pulse">
                <div className="w-20 h-20 rounded-lg bg-surface-container shrink-0" />
                <div className="flex-1 space-y-2"><div className="h-4 bg-surface-container rounded w-1/2" /><div className="h-3 bg-surface-container rounded w-3/4" /></div>
              </div>
            ))
          ) : shown.length === 0 ? (
            <div className="text-center py-20">
              <Icon name="forum" className="text-6xl text-on-surface-variant/40 mb-3" />
              <p className="text-on-surface-variant text-body-lg mb-4">No {box} inquiries{filter !== 'all' ? ` (${statusOf(filter).label.toLowerCase()})` : ''} yet.</p>
              <Link to="/cars" className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md">Browse Cars</Link>
            </div>
          ) : (
            shown.map((inq) => {
              const l = inq.listing || {};
              const st = statusOf(inq.status);
              const counterpart = box === 'received' ? inq.buyer?.name : null;
              return (
                <Link key={inq.id} to={`/messages/${inq.id}`}
                  className="bg-surface-container-lowest border border-border-subtle rounded-xl p-md flex gap-md hover:shadow-lg transition-all group active:scale-[0.99]">
                  <div className="relative w-20 h-20 md:w-24 md:h-24 shrink-0 overflow-hidden rounded-lg">
                    <img src={photoOrFallback(l.photos?.[0]?.url, l.make)} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h3 className="text-label-md font-label-md text-primary truncate">{l.year} {l.make} {l.model}</h3>
                        {counterpart && <p className="text-body-sm text-secondary font-semibold truncate">{counterpart}</p>}
                      </div>
                      <span className="text-label-sm text-on-surface-variant whitespace-nowrap">{formatRelativeTime(inq.createdAt)}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <p className="text-body-sm text-on-surface-variant line-clamp-1 italic">"{inq.message}"</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 ${st.cls} text-label-sm rounded-full flex items-center gap-1`}>
                          <Icon name={st.icon} className="text-[14px]" /> {st.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </section>
      </main>
    </div>
  );
}
