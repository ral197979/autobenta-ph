import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { formatPrice } from '../../utils/format';

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}
const STATUS = ['new', 'contacted', 'approved', 'declined'];
const STATUS_CLS = {
  new: 'bg-alert-orange/10 text-alert-orange',
  contacted: 'bg-primary/10 text-primary',
  approved: 'bg-trust-emerald/10 text-trust-emerald',
  declined: 'bg-error/10 text-error',
};
const fmtDate = (d) => new Date(d).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });

export default function AdminLeads() {
  const qc = useQueryClient();
  const [type, setType] = useState('all');
  const { data, isLoading } = useQuery({ queryKey: ['admin-leads'], queryFn: () => api.get('/leads').then((r) => r.data) });
  const update = useMutation({ mutationFn: ({ id, status }) => api.patch(`/leads/${id}`, { status }), onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-leads'] }) });

  const leads = (data || []).filter((l) => type === 'all' || l.type === type);

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-2xl">
        <div className="mb-lg">
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Finance &amp; Insurance Leads</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Pre-approval and insurance-quote requests to forward to partners.</p>
        </div>

        <div className="flex gap-2 mb-lg">
          {['all', 'financing', 'insurance'].map((t) => (
            <button key={t} onClick={() => setType(t)} className={`px-md py-sm rounded-full text-label-md capitalize transition-colors ${type === t ? 'bg-primary text-on-primary' : 'border border-border-subtle text-on-surface hover:bg-surface-container'}`}>{t}</button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-16 rounded-xl border border-border-subtle bg-surface-container animate-pulse" />)}</div>
        ) : leads.length === 0 ? (
          <p className="text-center text-on-surface-variant py-20">No leads yet.</p>
        ) : (
          <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl divide-y divide-border-subtle">
            {leads.map((l) => (
              <div key={l.id} className="flex flex-col md:flex-row md:items-center gap-md p-md">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className={`px-2 py-0.5 rounded-full text-label-sm uppercase tracking-wide font-bold ${l.type === 'financing' ? 'bg-secondary-container text-on-secondary-container' : 'bg-primary/10 text-primary'}`}>{l.type}</span>
                    <span className="font-semibold text-on-surface">{l.name}</span>
                    <span className="text-label-sm text-on-surface-variant">{fmtDate(l.createdAt)}</span>
                  </div>
                  <p className="text-body-sm text-on-surface-variant mt-0.5">
                    {l.email}{l.phone ? ` · ${l.phone}` : ''}{l.vehicleInfo ? ` · ${l.vehicleInfo}` : ''}{l.amount ? ` · ${formatPrice(l.amount)}` : ''}
                    {l.details?.coverage ? ` · ${l.details.coverage}` : ''}{l.details?.term ? ` · ${l.details.term}mo` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-label-sm font-bold capitalize ${STATUS_CLS[l.status]}`}>{l.status}</span>
                  <select value={l.status} onChange={(e) => update.mutate({ id: l.id, status: e.target.value })} className="bg-surface-container border border-border-subtle rounded-lg px-2 py-1 text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none">
                    {STATUS.map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}
                  </select>
                  <a href={`mailto:${l.email}`} className="rounded-lg border border-border-subtle text-on-surface px-3 py-1.5 text-label-sm hover:bg-surface-container flex items-center gap-1"><Icon name="mail" className="text-[16px]" /> Email</a>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
