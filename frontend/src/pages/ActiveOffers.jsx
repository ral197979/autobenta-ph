import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatPrice, photoOrFallback } from '../utils/format';

function Icon({ name, className = '', filled = false }) {
  return <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>;
}

const STATUS = {
  pending: 'bg-alert-orange/10 text-alert-orange',
  countered: 'bg-primary-container/10 text-primary-container',
  accepted: 'bg-trust-emerald/10 text-trust-emerald',
  declined: 'bg-error/10 text-error',
  withdrawn: 'bg-surface-container-highest text-on-surface-variant',
};
const BTN = 'flex-1 py-sm px-md rounded-xl font-label-md text-label-md transition-all active:scale-95';

export default function ActiveOffers() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const canReceive = ['seller', 'dealer', 'admin'].includes(user?.role);
  const [box, setBox] = useState(canReceive ? 'received' : 'sent');
  const [counterId, setCounterId] = useState(null);
  const [counterVal, setCounterVal] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['offers', box],
    queryFn: () => api.get(`/offers?box=${box}`).then(r => r.data),
  });

  const act = useMutation({
    mutationFn: ({ id, action, counterAmount }) => api.patch(`/offers/${id}`, { action, counterAmount }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['offers'] }); setCounterId(null); setCounterVal(''); },
  });

  const offers = data || [];

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-lg">
        <h1 className="text-headline-lg font-headline-lg text-on-surface mb-md">Active Offers</h1>

        {/* Tabs */}
        <div className="flex gap-lg border-b border-border-subtle mb-lg">
          {[['received', 'Offers Received'], ['sent', 'Offers Made']]
            .filter(([b]) => canReceive || b === 'sent')
            .map(([b, label]) => (
              <button key={b} onClick={() => setBox(b)} className={`pb-md text-label-md font-label-md transition-colors border-b-2 ${box === b ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
                {label}
              </button>
            ))}
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-72 rounded-xl border border-border-subtle bg-surface-container-lowest animate-pulse" />)}
          </div>
        ) : offers.length === 0 ? (
          <div className="text-center py-20">
            <Icon name="gavel" className="text-6xl text-on-surface-variant/40 mb-3" />
            <p className="text-on-surface-variant text-body-lg mb-4">No {box === 'received' ? 'offers received' : 'offers made'} yet.</p>
            <Link to="/cars" className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md">Browse Cars</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-lg">
            {offers.map((o) => {
              const l = o.listing || {};
              const isSeller = box === 'received';
              const counterpart = isSeller ? o.buyer?.name : o.seller?.name;
              const terminal = ['accepted', 'declined', 'withdrawn'].includes(o.status);
              return (
                <div key={o.id} className="bg-surface-container-lowest rounded-xl border border-border-subtle overflow-hidden flex flex-col">
                  <Link to={`/cars/${o.listingId}`} className="relative h-40 block">
                    <img src={photoOrFallback(l.photos?.[0]?.url, l.make)} alt="" className="w-full h-full object-cover" />
                    <span className={`absolute top-md left-md px-sm py-xs rounded text-label-sm uppercase tracking-wider font-bold ${STATUS[o.status]}`}>{o.status}</span>
                  </Link>
                  <div className="p-md flex flex-col gap-sm flex-1">
                    <h3 className="text-headline-sm font-headline-sm text-on-surface line-clamp-1">{l.year} {l.make} {l.model}</h3>
                    {counterpart && <p className="text-label-sm text-on-surface-variant">{isSeller ? 'From' : 'To'} {counterpart}</p>}
                    <div className="flex items-end justify-between mt-xs">
                      <div>
                        <span className="text-label-sm text-on-surface-variant block">{isSeller ? 'Their Offer' : 'Your Offer'}</span>
                        <span className="text-headline-sm font-bold text-primary">{formatPrice(o.amount)}</span>
                      </div>
                      {o.status === 'countered' && (
                        <div className="text-right">
                          <span className="text-label-sm text-on-surface-variant block">Counter</span>
                          <span className="text-headline-sm font-bold text-primary-container">{formatPrice(o.counterAmount)}</span>
                        </div>
                      )}
                    </div>
                    {o.message && <p className="text-body-sm text-on-surface-variant line-clamp-2 italic">"{o.message}"</p>}

                    {/* Actions */}
                    <div className="mt-auto pt-sm">
                      {counterId === o.id ? (
                        <div className="flex gap-sm">
                          <input type="number" value={counterVal} onChange={(e) => setCounterVal(e.target.value)} placeholder="₱ counter" className="flex-1 min-w-0 bg-surface-container border border-border-subtle rounded-xl px-md py-sm text-body-md text-on-surface focus:ring-2 focus:ring-primary outline-none" />
                          <button onClick={() => act.mutate({ id: o.id, action: 'counter', counterAmount: parseFloat(counterVal) })} disabled={!(parseFloat(counterVal) > 0) || act.isPending} className={`${BTN} bg-primary text-on-primary disabled:opacity-50`}>Send</button>
                          <button onClick={() => { setCounterId(null); setCounterVal(''); }} className={`${BTN} border border-border-subtle text-on-surface`}>✕</button>
                        </div>
                      ) : terminal ? (
                        o.status === 'accepted' ? (
                          <Link to="/inquiries" className={`${BTN} block text-center bg-trust-emerald/10 text-trust-emerald`}>Deal accepted — contact {isSeller ? 'buyer' : 'seller'}</Link>
                        ) : (
                          <span className="block text-center text-label-md text-on-surface-variant py-sm capitalize">{o.status}</span>
                        )
                      ) : isSeller ? (
                        o.status === 'pending' ? (
                          <div className="flex gap-sm">
                            <button onClick={() => act.mutate({ id: o.id, action: 'accept' })} className={`${BTN} bg-primary text-on-primary`}>Accept</button>
                            <button onClick={() => { setCounterId(o.id); setCounterVal(''); }} className={`${BTN} border border-primary text-primary hover:bg-surface-container-high`}>Counter</button>
                            <button onClick={() => act.mutate({ id: o.id, action: 'decline' })} className={`${BTN} border border-border-subtle text-on-surface-variant`}>Decline</button>
                          </div>
                        ) : (
                          <span className="block text-center text-label-md text-on-surface-variant py-sm">Waiting for buyer…</span>
                        )
                      ) : (
                        o.status === 'countered' ? (
                          <div className="flex gap-sm">
                            <button onClick={() => act.mutate({ id: o.id, action: 'accept' })} className={`${BTN} bg-primary text-on-primary`}>Accept Counter</button>
                            <button onClick={() => act.mutate({ id: o.id, action: 'withdraw' })} className={`${BTN} border border-border-subtle text-on-surface-variant`}>Withdraw</button>
                          </div>
                        ) : (
                          <button onClick={() => act.mutate({ id: o.id, action: 'withdraw' })} className={`${BTN} border border-border-subtle text-on-surface-variant w-full`}>Withdraw Offer</button>
                        )
                      )}
                    </div>
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
