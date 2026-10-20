import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { photoOrFallback } from '../utils/format';

function Icon({ name, className = '', filled = false }) {
  return <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>;
}

const STATUS = {
  requested: 'bg-alert-orange/10 text-alert-orange',
  confirmed: 'bg-trust-emerald/10 text-trust-emerald',
  declined: 'bg-error/10 text-error',
  completed: 'bg-primary/10 text-primary',
  cancelled: 'bg-surface-container-highest text-on-surface-variant',
};
const BTN = 'flex-1 py-sm px-md rounded-xl font-label-md text-label-md transition-all active:scale-95';

const fmtDate = (d) => new Date(d).toLocaleDateString('en-PH', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

export default function Appointments() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canReceive = ['seller', 'dealer', 'admin'].includes(user?.role);
  const [box, setBox] = useState(canReceive ? 'received' : 'sent');

  const { data, isLoading } = useQuery({ queryKey: ['bookings', box], queryFn: () => api.get(`/bookings?box=${box}`).then((r) => r.data) });
  const act = useMutation({
    mutationFn: ({ id, action }) => api.patch(`/bookings/${id}`, { action }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bookings'] }),
  });

  const bookings = data || [];

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-3xl mx-auto px-gutter-mobile md:px-gutter-desktop py-lg">
        <h1 className="text-headline-lg font-headline-lg text-on-surface mb-md">Test Drives &amp; Viewings</h1>

        <div className="flex gap-lg border-b border-border-subtle mb-lg">
          {[['received', 'Requests Received'], ['sent', 'My Bookings']].filter(([b]) => canReceive || b === 'sent').map(([b, label]) => (
            <button key={b} onClick={() => setBox(b)} className={`pb-md text-label-md font-label-md transition-colors border-b-2 ${box === b ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>{label}</button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-md">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-28 rounded-2xl border border-border-subtle bg-surface-container animate-pulse" />)}</div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="event_busy" className="text-6xl text-on-surface-variant/40 mb-3" />
            <p className="text-on-surface-variant mb-4">No {box === 'received' ? 'requests yet' : 'bookings yet'}.</p>
            <Link to="/cars" className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md">Browse Cars</Link>
          </div>
        ) : (
          <div className="space-y-md">
            {bookings.map((bk) => {
              const l = bk.listing || {};
              const isSeller = box === 'received';
              const terminal = ['declined', 'completed', 'cancelled'].includes(bk.status);
              return (
                <div key={bk.id} className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-md flex flex-col sm:flex-row gap-md">
                  <Link to={`/cars/${bk.listingId}`} className="w-full sm:w-28 h-28 sm:h-20 rounded-lg overflow-hidden bg-surface-container shrink-0">
                    <img src={photoOrFallback(l.photos?.[0]?.url, l.make)} alt="" className="w-full h-full object-cover" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-label-sm uppercase tracking-wider font-bold ${STATUS[bk.status]}`}>{bk.status}</span>
                      <span className="text-label-sm text-on-surface-variant flex items-center gap-1"><Icon name={bk.type === 'viewing' ? 'visibility' : 'directions_car'} className="text-[16px]" /> {bk.type === 'viewing' ? 'Viewing' : 'Test Drive'}</span>
                    </div>
                    <Link to={`/cars/${bk.listingId}`} className="block font-headline-sm text-headline-sm text-on-surface hover:text-primary mt-1">{l.year} {l.make} {l.model}</Link>
                    <p className="text-body-sm text-on-surface-variant flex items-center gap-2 mt-0.5">
                      <Icon name="event" className="text-[16px]" /> {fmtDate(bk.preferredDate)}{bk.timeSlot ? ` · ${bk.timeSlot}` : ''}
                      <span className="text-on-surface-variant/60">· {isSeller ? bk.buyer?.name : bk.seller?.name}</span>
                    </p>
                    {bk.message && <p className="text-body-sm text-on-surface-variant italic mt-1 line-clamp-2">"{bk.message}"</p>}

                    {!terminal && (
                      <div className="flex gap-sm mt-md">
                        {isSeller ? (
                          bk.status === 'requested' ? (
                            <>
                              <button onClick={() => act.mutate({ id: bk.id, action: 'confirm' })} className={`${BTN} bg-primary text-on-primary`}>Confirm</button>
                              <button onClick={() => act.mutate({ id: bk.id, action: 'decline' })} className={`${BTN} border border-border-subtle text-on-surface-variant`}>Decline</button>
                            </>
                          ) : (
                            <button onClick={() => act.mutate({ id: bk.id, action: 'complete' })} className={`${BTN} border border-primary text-primary`}>Mark Completed</button>
                          )
                        ) : (
                          <button onClick={() => act.mutate({ id: bk.id, action: 'cancel' })} className={`${BTN} border border-border-subtle text-on-surface-variant max-w-[160px]`}>Cancel</button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
