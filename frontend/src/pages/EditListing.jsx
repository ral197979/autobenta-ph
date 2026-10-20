import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

const INPUT = 'w-full bg-surface border border-border-subtle rounded-xl px-md py-sm text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-on-surface-variant/60';
const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

const FIELDS = ['make', 'model', 'year', 'variant', 'price', 'mileage', 'fuelType', 'transmission', 'condition', 'bodyType', 'color', 'city', 'region', 'description', 'negotiable', 'hasOrCr', 'serviceHistory', 'hasAccident', 'accidentNotes', 'hasFlood', 'floodNotes', 'ownerCount'];

export default function EditListing() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null);

  const { data: listing, isLoading, isError } = useQuery({
    queryKey: ['listing', id],
    queryFn: () => api.get(`/listings/${id}`).then(r => r.data),
  });

  useEffect(() => {
    if (listing && !form) {
      const f = {};
      FIELDS.forEach((k) => { f[k] = listing[k] ?? (typeof listing[k] === 'boolean' ? false : ''); });
      setForm(f);
    }
  }, [listing]); // eslint-disable-line react-hooks/exhaustive-deps

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const save = async (e) => {
    e?.preventDefault();
    setSaving(true); setMsg(null);
    try {
      await api.patch(`/listings/${id}`, {
        ...form,
        year: parseInt(form.year), mileage: parseInt(form.mileage),
        price: parseFloat(form.price), ownerCount: parseInt(form.ownerCount) || 1,
      });
      setMsg({ ok: true, text: 'Changes saved.' });
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.error || 'Save failed.' });
    } finally { setSaving(false); }
  };

  const setStatus = async (status) => {
    if (status === 'sold' && !confirm('Mark this listing as sold?')) return;
    try { await api.patch(`/listings/${id}`, { status }); navigate('/dashboard'); }
    catch (err) { setMsg({ ok: false, text: err.response?.data?.error || 'Update failed.' }); }
  };

  const remove = async () => {
    if (!confirm('Delete this listing permanently? This cannot be undone.')) return;
    try { await api.delete(`/listings/${id}`); navigate('/dashboard'); }
    catch (err) { setMsg({ ok: false, text: err.response?.data?.error || 'Delete failed.' }); }
  };

  if (isLoading || !form) return <div className="max-w-2xl mx-auto px-gutter-mobile py-2xl animate-pulse space-y-4"><div className="h-8 bg-surface-container rounded w-1/3" /><div className="h-64 bg-surface-container rounded-2xl" /></div>;
  if (isError) return <div className="text-center py-24"><p className="text-on-surface-variant text-body-lg">Listing not found.</p><Link to="/dashboard" className="mt-4 inline-block bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md">Dashboard</Link></div>;

  const Field = ({ label, children }) => (<div className="space-y-xs"><label className="block text-label-sm font-label-sm text-on-surface-variant px-1">{label}</label>{children}</div>);
  const Check = ({ label, k }) => (
    <label className="flex items-center gap-3 cursor-pointer">
      <input type="checkbox" checked={!!form[k]} onChange={(e) => set(k, e.target.checked)} className="h-4 w-4 rounded border-border-subtle text-primary focus:ring-primary bg-surface" />
      <span className="text-body-sm text-on-surface">{label}</span>
    </label>
  );

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-2xl mx-auto px-gutter-mobile md:px-gutter-desktop py-2xl">
        <div className="flex items-center gap-md mb-lg">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-surface-container transition-colors text-on-surface"><Icon name="arrow_back" /></button>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Edit Listing</h1>
        </div>

        <form onSubmit={save} className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-lg md:p-xl space-y-lg">
          <h3 className="text-headline-sm font-headline-sm text-on-surface">{form.year} {form.make} {form.model}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            <Field label="Make"><input value={form.make} onChange={(e) => set('make', e.target.value)} className={INPUT} /></Field>
            <Field label="Model"><input value={form.model} onChange={(e) => set('model', e.target.value)} className={INPUT} /></Field>
            <Field label="Year"><select value={form.year} onChange={(e) => set('year', e.target.value)} className={INPUT}>{YEARS.map((y) => <option key={y} value={y}>{y}</option>)}</select></Field>
            <Field label="Variant"><input value={form.variant || ''} onChange={(e) => set('variant', e.target.value)} className={INPUT} /></Field>
            <Field label="Price (₱)"><input type="number" value={form.price} onChange={(e) => set('price', e.target.value)} className={INPUT} /></Field>
            <Field label="Mileage (km)"><input type="number" value={form.mileage} onChange={(e) => set('mileage', e.target.value)} className={INPUT} /></Field>
            <Field label="Fuel Type"><select value={form.fuelType} onChange={(e) => set('fuelType', e.target.value)} className={INPUT}>{[['gasoline','Gasoline'],['diesel','Diesel'],['hybrid','Hybrid'],['electric','Electric'],['lpg','LPG']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            <Field label="Transmission"><select value={form.transmission} onChange={(e) => set('transmission', e.target.value)} className={INPUT}><option value="automatic">Automatic</option><option value="manual">Manual</option><option value="cvt">CVT</option></select></Field>
            <Field label="Condition"><select value={form.condition} onChange={(e) => set('condition', e.target.value)} className={INPUT}>{[['excellent','Excellent'],['good','Good'],['fair','Fair'],['poor','Poor']].map(([v,l]) => <option key={v} value={v}>{l}</option>)}</select></Field>
            <Field label="Body Type"><input value={form.bodyType || ''} onChange={(e) => set('bodyType', e.target.value)} className={INPUT} /></Field>
            <Field label="Color"><input value={form.color || ''} onChange={(e) => set('color', e.target.value)} className={INPUT} /></Field>
            <Field label="City"><input value={form.city || ''} onChange={(e) => set('city', e.target.value)} className={INPUT} /></Field>
          </div>
          <Field label="Description"><textarea rows={4} value={form.description || ''} onChange={(e) => set('description', e.target.value)} className={`${INPUT} resize-none`} /></Field>

          <div className="space-y-3 pt-2 border-t border-border-subtle">
            <Check label="Price is negotiable" k="negotiable" />
            <Check label="OR/CR is available" k="hasOrCr" />
            <Check label="Complete service history" k="serviceHistory" />
            <Check label="Has accident history" k="hasAccident" />
            <Check label="Has flood damage history" k="hasFlood" />
          </div>

          {msg && <p className={`text-body-sm ${msg.ok ? 'text-trust-emerald' : 'text-error'}`}>{msg.text}</p>}

          <div className="flex flex-wrap items-center gap-md pt-lg border-t border-border-subtle">
            <button type="submit" disabled={saving} className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md hover:opacity-90 disabled:opacity-50">{saving ? 'Saving…' : 'Save Changes'}</button>
            <Link to={`/cars/${id}`} className="rounded-xl border border-border-subtle text-on-surface px-lg py-sm font-label-md hover:bg-surface-container transition-colors">View Listing</Link>
            <Link to={`/listings/${id}/documents`} className="rounded-xl border border-border-subtle text-on-surface px-lg py-sm font-label-md hover:bg-surface-container transition-colors flex items-center gap-1"><Icon name="description" className="text-[18px]" /> Verify Documents</Link>
            <button type="button" onClick={() => setStatus('sold')} className="rounded-xl border border-trust-emerald/40 text-trust-emerald px-lg py-sm font-label-md hover:bg-trust-emerald/10 transition-colors">Mark as Sold</button>
            <button type="button" onClick={remove} className="ml-auto rounded-xl border border-error/40 text-error px-lg py-sm font-label-md hover:bg-error/10 transition-colors flex items-center gap-1"><Icon name="delete" className="text-[18px]" /> Delete</button>
          </div>
        </form>
      </main>
    </div>
  );
}
