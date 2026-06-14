import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/client';
import { formatPrice } from '../../utils/format';

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}
const INPUT = 'w-full bg-surface-container border border-border-subtle rounded-lg px-3 py-2 text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none';
const BODY = ['Sedan', 'SUV', 'Crossover', 'MPV', 'Hatchback', 'Pickup', 'Van', 'Coupe'];
const FUEL = ['gasoline', 'diesel', 'hybrid', 'electric'];

const blank = () => ({ make: '', model: '', bodyType: 'Sedan', fuelType: 'gasoline', year: new Date().getFullYear(), startingPrice: '', imageUrl: '', brochureUrl: '', description: '', isElectric: false, isFeatured: false });

export default function AdminNewCars() {
  const qc = useQueryClient();
  const [editing, setEditing] = useState(null); // null | model | 'new'
  const { data, isLoading } = useQuery({ queryKey: ['admin-new-cars'], queryFn: () => api.get('/new-cars?limit=60&sort=newest').then((r) => r.data) });
  const models = data?.models || [];

  const del = useMutation({
    mutationFn: (id) => api.delete(`/new-cars/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-new-cars'] }),
  });

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-2xl">
        <div className="flex items-center justify-between mb-lg gap-4">
          <div>
            <h1 className="text-headline-lg font-headline-lg text-on-surface">New-Car Catalog</h1>
            <p className="text-body-sm text-on-surface-variant mt-1">{models.length} models · manage makes, prices, specs &amp; variants</p>
          </div>
          <button onClick={() => setEditing('new')} className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md flex items-center gap-1.5 hover:opacity-90"><Icon name="add" /> Add Model</button>
        </div>

        <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl overflow-hidden">
          {isLoading ? (
            <div className="p-lg space-y-2">{Array.from({ length: 5 }).map((_, i) => <div key={i} className="h-12 bg-surface-container rounded animate-pulse" />)}</div>
          ) : models.length === 0 ? (
            <p className="text-center text-on-surface-variant py-16">No models yet. Add your first.</p>
          ) : (
            <div className="divide-y divide-border-subtle">
              {models.map((m) => (
                <div key={m.id} className="flex items-center gap-md p-md">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-on-surface">{m.make} {m.model} {m.isFeatured && <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1">Featured</span>} {m.isElectric && <span className="text-[10px] bg-trust-emerald/15 text-trust-emerald px-1.5 py-0.5 rounded ml-1">EV</span>}</p>
                    <p className="text-label-sm text-on-surface-variant">{m.bodyType} · {m.fuelType} · {m.year} · {formatPrice(m.startingPrice)} · {m._count?.variants ?? 0} variants</p>
                  </div>
                  <button onClick={() => setEditing(m)} className="rounded-lg border border-border-subtle text-on-surface px-3 py-1.5 text-label-sm hover:bg-surface-container flex items-center gap-1"><Icon name="edit" className="text-[16px]" /> Edit</button>
                  <button onClick={() => { if (confirm(`Delete ${m.make} ${m.model}?`)) del.mutate(m.id); }} className="rounded-lg border border-error/40 text-error px-3 py-1.5 text-label-sm hover:bg-error/10 flex items-center gap-1"><Icon name="delete" className="text-[16px]" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      {editing && <ModelForm model={editing === 'new' ? null : editing} onClose={() => setEditing(null)} onSaved={() => { qc.invalidateQueries({ queryKey: ['admin-new-cars'] }); setEditing(null); }} />}
    </div>
  );
}

function ModelForm({ model, onClose, onSaved }) {
  const isEdit = !!model;
  const [f, setF] = useState(() => (model ? { ...blank(), ...model, startingPrice: String(model.startingPrice ?? '') } : blank()));
  const [specRows, setSpecRows] = useState(() => Object.entries(model?.specs || {}).map(([key, value]) => ({ key, value: String(value) })));
  const [variants, setVariants] = useState(() => (model?.variants || []).map((v) => ({ name: v.name, price: String(v.price), transmission: v.transmission || '', fuelType: v.fuelType || '' })));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [uploading, setUploading] = useState(false);

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const uploadBrochure = async (file) => {
    if (!file) return;
    setUploading(true); setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const { data } = await api.post('/new-cars/brochure', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      set('brochureUrl', data.url);
    } catch (err) {
      setError(err.response?.data?.error || 'Brochure upload failed.');
    } finally { setUploading(false); }
  };

  const save = async (e) => {
    e.preventDefault();
    if (!f.make || !f.model || !f.startingPrice) return setError('Make, model, and starting price are required.');
    setSaving(true); setError(null);
    const specs = {};
    specRows.forEach((r) => { if (r.key.trim()) specs[r.key.trim()] = r.value; });
    const payload = {
      make: f.make, model: f.model, bodyType: f.bodyType, fuelType: f.fuelType, year: f.year,
      startingPrice: f.startingPrice, imageUrl: f.imageUrl || null, brochureUrl: f.brochureUrl || null,
      description: f.description || null, isElectric: !!f.isElectric, isFeatured: !!f.isFeatured,
      specs, variants: variants.filter((v) => v.name && v.price),
    };
    try {
      if (isEdit) await api.patch(`/new-cars/${model.id}`, payload);
      else await api.post('/new-cars', payload);
      onSaved();
    } catch (err) {
      setError(err.response?.data?.error || 'Save failed.');
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-2xl bg-surface-container-lowest md:rounded-2xl border border-border-subtle shadow-2xl max-h-[95vh] overflow-y-auto">
        <div className="flex items-center justify-between p-lg border-b border-border-subtle sticky top-0 bg-surface-container-lowest z-10">
          <h2 className="text-headline-sm font-headline-sm text-on-surface">{isEdit ? `Edit ${model.make} ${model.model}` : 'Add New Model'}</h2>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-surface-container text-on-surface-variant"><Icon name="close" /></button>
        </div>
        <form onSubmit={save} className="p-lg space-y-md">
          <div className="grid grid-cols-2 gap-md">
            <Field label="Make"><input value={f.make} onChange={(e) => set('make', e.target.value)} className={INPUT} /></Field>
            <Field label="Model"><input value={f.model} onChange={(e) => set('model', e.target.value)} className={INPUT} /></Field>
            <Field label="Body Type"><select value={f.bodyType} onChange={(e) => set('bodyType', e.target.value)} className={INPUT}>{BODY.map((b) => <option key={b}>{b}</option>)}</select></Field>
            <Field label="Fuel"><select value={f.fuelType} onChange={(e) => set('fuelType', e.target.value)} className={INPUT}>{FUEL.map((x) => <option key={x}>{x}</option>)}</select></Field>
            <Field label="Year"><input type="number" value={f.year} onChange={(e) => set('year', e.target.value)} className={INPUT} /></Field>
            <Field label="Starting Price (₱)"><input type="number" value={f.startingPrice} onChange={(e) => set('startingPrice', e.target.value)} className={INPUT} /></Field>
            <Field label="Image URL"><input value={f.imageUrl} onChange={(e) => set('imageUrl', e.target.value)} className={INPUT} placeholder="https://…" /></Field>
            <Field label="Brochure (PDF)">
              <div className="flex gap-2">
                <input value={f.brochureUrl} onChange={(e) => set('brochureUrl', e.target.value)} className={INPUT} placeholder="https://… or upload →" />
                <label className={`shrink-0 cursor-pointer bg-surface-container-high border border-border-subtle rounded-lg px-3 py-2 text-body-sm font-semibold text-primary hover:bg-surface-container-highest flex items-center gap-1 ${uploading ? 'opacity-60 pointer-events-none' : ''}`}>
                  <Icon name={uploading ? 'progress_activity' : 'upload'} className={uploading ? 'animate-spin' : ''} />
                  {uploading ? '…' : 'PDF'}
                  <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={(e) => uploadBrochure(e.target.files?.[0])} disabled={uploading} />
                </label>
              </div>
              {f.brochureUrl && <a href={f.brochureUrl} target="_blank" rel="noopener noreferrer" className="text-label-sm text-primary hover:underline mt-1 inline-block">Preview current brochure ↗</a>}
            </Field>
          </div>
          <Field label="Description"><textarea rows={2} value={f.description} onChange={(e) => set('description', e.target.value)} className={`${INPUT} resize-none`} /></Field>
          <div className="flex gap-lg">
            <label className="flex items-center gap-2 text-body-sm text-on-surface"><input type="checkbox" checked={f.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="h-4 w-4 rounded text-primary" /> Featured</label>
            <label className="flex items-center gap-2 text-body-sm text-on-surface"><input type="checkbox" checked={f.isElectric} onChange={(e) => set('isElectric', e.target.checked)} className="h-4 w-4 rounded text-primary" /> Electric</label>
          </div>

          {/* Specs */}
          <div>
            <div className="flex items-center justify-between mb-1"><span className="text-label-sm font-label-sm text-on-surface-variant">Specifications</span><button type="button" onClick={() => setSpecRows((r) => [...r, { key: '', value: '' }])} className="text-label-sm text-primary">+ Add spec</button></div>
            <div className="space-y-2">
              {specRows.map((r, i) => (
                <div key={i} className="flex gap-2">
                  <input value={r.key} onChange={(e) => setSpecRows((rows) => rows.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} placeholder="Engine" className={INPUT} />
                  <input value={r.value} onChange={(e) => setSpecRows((rows) => rows.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} placeholder="1.5L DOHC" className={INPUT} />
                  <button type="button" onClick={() => setSpecRows((rows) => rows.filter((_, j) => j !== i))} className="text-on-surface-variant hover:text-error px-1"><Icon name="close" className="text-[18px]" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Variants */}
          <div>
            <div className="flex items-center justify-between mb-1"><span className="text-label-sm font-label-sm text-on-surface-variant">Variants</span><button type="button" onClick={() => setVariants((v) => [...v, { name: '', price: '', transmission: '', fuelType: '' }])} className="text-label-sm text-primary">+ Add variant</button></div>
            <div className="space-y-2">
              {variants.map((v, i) => (
                <div key={i} className="flex gap-2">
                  <input value={v.name} onChange={(e) => setVariants((rows) => rows.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} placeholder="Variant name" className={INPUT} />
                  <input type="number" value={v.price} onChange={(e) => setVariants((rows) => rows.map((x, j) => j === i ? { ...x, price: e.target.value } : x))} placeholder="Price" className={INPUT} />
                  <button type="button" onClick={() => setVariants((rows) => rows.filter((_, j) => j !== i))} className="text-on-surface-variant hover:text-error px-1"><Icon name="close" className="text-[18px]" /></button>
                </div>
              ))}
            </div>
          </div>

          {error && <p className="rounded-lg bg-error/10 border border-error/30 px-3 py-2 text-body-sm text-error">{error}</p>}
          <div className="flex justify-end gap-md pt-md border-t border-border-subtle">
            <button type="button" onClick={onClose} className="rounded-xl border border-border-subtle text-on-surface px-lg py-sm font-label-md hover:bg-surface-container">Cancel</button>
            <button type="submit" disabled={saving} className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md hover:opacity-90 disabled:opacity-50">{saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Create Model'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return <div className="space-y-1"><label className="block text-label-sm font-label-sm text-on-surface-variant">{label}</label>{children}</div>;
}
