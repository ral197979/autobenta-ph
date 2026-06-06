import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';
import { formatPrice } from '../utils/format';

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

const INPUT = 'w-full bg-surface-container border border-border-subtle rounded-xl px-md py-sm text-body-md text-on-surface focus:ring-2 focus:ring-primary outline-none placeholder-on-surface-variant/60';
const MAKES = ['Toyota', 'Mitsubishi', 'Honda', 'Ford', 'Nissan', 'Hyundai', 'Suzuki', 'Isuzu', 'Mazda', 'Kia', 'BYD'];
const CONDITIONS = [['excellent', 'Excellent'], ['good', 'Good'], ['fair', 'Fair'], ['poor', 'Poor']];
const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);
const CONF = { high: 'High confidence', medium: 'Medium confidence', low: 'Indicative only' };

export default function TradeInValuation() {
  const [f, setF] = useState({ make: '', model: '', year: new Date().getFullYear() - 3, mileage: '', condition: 'good' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!f.make || !f.mileage) return setError('Make and mileage are required.');
    setLoading(true); setError(null); setResult(null);
    try {
      const { data } = await api.post('/valuation', { ...f, year: parseInt(f.year), mileage: parseInt(f.mileage) });
      setResult(data);
    } catch {
      setError('Could not estimate right now. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-4xl mx-auto px-gutter-mobile md:px-gutter-desktop py-2xl">
        <div className="text-center mb-2xl">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-md"><Icon name="payments" className="text-primary text-2xl" /></div>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">What's My Car Worth?</h1>
          <p className="text-body-md text-on-surface-variant mt-1 max-w-lg mx-auto">Get a free estimate based on real comparable listings on Ryderr.</p>
        </div>

        <div className="grid md:grid-cols-2 gap-xl">
          {/* Form */}
          <form onSubmit={submit} className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-lg space-y-md self-start">
            <div className="grid grid-cols-2 gap-md">
              <Field label="Make">
                <select value={f.make} onChange={(e) => set('make', e.target.value)} className={INPUT}><option value="">Select</option>{MAKES.map((m) => <option key={m}>{m}</option>)}</select>
              </Field>
              <Field label="Model"><input value={f.model} onChange={(e) => set('model', e.target.value)} className={INPUT} placeholder="e.g. Vios" /></Field>
              <Field label="Year"><select value={f.year} onChange={(e) => set('year', e.target.value)} className={INPUT}>{YEARS.map((y) => <option key={y}>{y}</option>)}</select></Field>
              <Field label="Mileage (km)"><input type="number" value={f.mileage} onChange={(e) => set('mileage', e.target.value)} className={INPUT} placeholder="e.g. 45000" /></Field>
            </div>
            <Field label="Condition">
              <div className="flex flex-wrap gap-1.5">
                {CONDITIONS.map(([v, l]) => (
                  <button key={v} type="button" onClick={() => set('condition', v)} className={`px-md py-xs rounded-full text-body-sm transition-all ${f.condition === v ? 'bg-primary text-on-primary font-bold' : 'border border-border-subtle text-on-surface hover:border-primary'}`}>{l}</button>
                ))}
              </div>
            </Field>
            {error && <p className="rounded-lg bg-error/10 border border-error/30 px-3 py-2 text-body-sm text-error">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-primary text-on-primary py-md rounded-xl font-label-md hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              <Icon name="insights" className="text-[20px]" /> {loading ? 'Estimating…' : 'Get My Estimate'}
            </button>
          </form>

          {/* Result */}
          <div>
            {!result ? (
              <div className="h-full rounded-2xl border-2 border-dashed border-border-subtle flex flex-col items-center justify-center text-center p-xl min-h-[260px]">
                <Icon name="query_stats" className="text-5xl text-on-surface-variant/40 mb-2" />
                <p className="text-on-surface-variant">Fill in your car's details to see its estimated market value.</p>
              </div>
            ) : result.estimate == null ? (
              <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-xl text-center">
                <Icon name="info" className="text-4xl text-on-surface-variant mb-2" />
                <p className="text-on-surface">{result.message}</p>
                <Link to="/sell" className="mt-4 inline-block bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md">List it anyway</Link>
              </div>
            ) : (
              <div className="bg-primary-container rounded-2xl p-xl text-center relative overflow-hidden">
                <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-tertiary-container/30 blur-3xl" />
                <div className="relative z-10">
                  <span className="text-label-sm text-on-primary-container uppercase tracking-widest">Estimated private-sale value</span>
                  <p className="text-display-lg font-bold text-on-primary my-1">{formatPrice(result.estimate)}</p>
                  <p className="text-on-primary-container text-body-md">{formatPrice(result.low)} – {formatPrice(result.high)}</p>
                  <div className="mt-md bg-surface-container-lowest/95 rounded-xl p-md text-left space-y-1">
                    <div className="flex justify-between text-body-sm"><span className="text-on-surface-variant">Typical dealer trade-in</span><span className="font-bold text-on-surface">{formatPrice(result.tradeInEstimate)}</span></div>
                    <div className="flex justify-between text-label-sm"><span className="text-on-surface-variant">Based on</span><span className="text-on-surface-variant">{result.sampleSize} comparable listing{result.sampleSize === 1 ? '' : 's'} · {CONF[result.confidence]}</span></div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-sm mt-md">
                    <Link to="/sell" className="flex-1 bg-surface-container-lowest text-primary py-sm rounded-xl font-label-md hover:bg-surface-container-low transition-all">List My Car</Link>
                    <Link to={`/cars?make=${encodeURIComponent(f.make)}`} className="flex-1 border border-white/30 text-on-primary py-sm rounded-xl font-label-md hover:bg-white/10 transition-all">See similar listings</Link>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="text-center text-label-sm text-on-surface-variant/70 mt-lg max-w-xl mx-auto">Estimates are indicative, derived from current Ryderr listings, and not a guaranteed offer. Actual value depends on inspection, history, and demand.</p>
      </main>
    </div>
  );
}

function Field({ label, children }) {
  return <div className="space-y-1"><label className="block text-label-sm font-label-sm text-on-surface-variant px-1">{label}</label>{children}</div>;
}
