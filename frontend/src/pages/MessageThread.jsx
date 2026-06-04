import { useState, useRef, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatRelativeTime } from '../utils/format';

function Icon({ name, className = '', filled = false }) {
  return <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>;
}

export default function MessageThread() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [body, setBody] = useState('');
  const endRef = useRef(null);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['thread', id],
    queryFn: () => api.get(`/inquiries/${id}/messages`).then(r => r.data),
    refetchInterval: 15000,
  });

  const send = useMutation({
    mutationFn: (text) => api.post(`/inquiries/${id}/messages`, { body: text }),
    onSuccess: () => { setBody(''); qc.invalidateQueries({ queryKey: ['thread', id] }); },
  });

  const messages = data?.messages || [];
  const inquiry = data?.inquiry;
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  if (isError) return <div className="text-center py-24"><p className="text-on-surface-variant text-body-lg">Conversation not available.</p><Link to="/inquiries" className="mt-4 inline-block bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md">Back to Inquiries</Link></div>;

  const car = inquiry ? `${inquiry.listing?.year} ${inquiry.listing?.make} ${inquiry.listing?.model}` : '';
  const counterpart = inquiry ? (inquiry.buyerId === user?.id ? 'Seller' : inquiry.buyer?.name) : '';

  const submit = (e) => { e.preventDefault(); if (body.trim()) send.mutate(body.trim()); };

  return (
    <div className="bg-surface min-h-screen flex flex-col">
      {/* Header */}
      <header className="sticky top-16 z-30 bg-surface/95 backdrop-blur-md border-b border-border-subtle px-gutter-mobile md:px-gutter-desktop py-md">
        <div className="max-w-3xl mx-auto flex items-center gap-md">
          <button onClick={() => navigate('/inquiries')} className="p-1 rounded-full hover:bg-surface-container transition-colors text-on-surface"><Icon name="arrow_back" /></button>
          <div className="flex-1 min-w-0">
            <h1 className="font-headline-sm text-headline-sm text-primary leading-tight truncate">{counterpart || 'Conversation'}</h1>
            {inquiry && <Link to={`/cars/${inquiry.listing?.id}`} className="text-body-sm text-on-surface-variant hover:text-primary truncate block">{car}</Link>}
          </div>
          {inquiry && (
            <Link to={`/cars/${inquiry.listing?.id}`} className="px-3 py-1.5 bg-surface-container-highest text-primary font-label-sm rounded-lg hover:bg-outline-variant/40 transition-colors whitespace-nowrap">View car</Link>
          )}
        </div>
      </header>

      {/* Messages */}
      <main className="flex-1 max-w-3xl w-full mx-auto px-gutter-mobile md:px-gutter-desktop py-lg space-y-md">
        {isLoading ? (
          <div className="space-y-md animate-pulse">
            <div className="h-12 w-2/3 bg-surface-container rounded-2xl" />
            <div className="h-12 w-1/2 bg-surface-container rounded-2xl ml-auto" />
          </div>
        ) : messages.length === 0 ? (
          <p className="text-center text-on-surface-variant py-10">No messages yet. Say hello 👋</p>
        ) : (
          messages.map((m) => {
            const mine = m.sender?.id === user?.id;
            return (
              <div key={m.id} className={`flex flex-col max-w-[85%] ${mine ? 'items-end ml-auto' : 'items-start'}`}>
                {!mine && <span className="text-label-sm text-on-surface-variant mb-1 px-1">{m.sender?.name}</span>}
                <div className={`p-4 rounded-2xl ${mine ? 'bg-primary-container text-on-primary rounded-tr-none' : 'bg-surface-container-high text-on-surface rounded-tl-none'}`}>
                  <p className="text-body-md whitespace-pre-wrap">{m.body}</p>
                </div>
                <span className="text-label-sm text-on-surface-variant/70 mt-1 px-1">{formatRelativeTime(m.createdAt)}</span>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </main>

      {/* Composer */}
      <form onSubmit={submit} className="sticky bottom-0 bg-surface/95 backdrop-blur-md border-t border-border-subtle px-gutter-mobile md:px-gutter-desktop py-md">
        <div className="max-w-3xl mx-auto flex items-end gap-sm">
          <textarea
            value={body} onChange={(e) => setBody(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); submit(e); } }}
            placeholder="Type a message…" rows={1}
            className="flex-1 bg-surface-container-low border border-border-subtle rounded-2xl py-3 px-4 focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-body-md text-on-surface resize-none max-h-32" />
          <button type="submit" disabled={!body.trim() || send.isPending} className="shrink-0 w-12 h-12 rounded-full bg-primary flex items-center justify-center text-on-primary hover:opacity-90 transition-all active:scale-90 shadow-lg disabled:opacity-50">
            <Icon name="send" filled />
          </button>
        </div>
      </form>
    </div>
  );
}
