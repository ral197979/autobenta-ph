import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

const INPUT = 'w-full bg-surface-container border border-border-subtle rounded-xl px-md py-sm text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-on-surface-variant/60';
const CATEGORIES = ['Listing accuracy', 'Fraud or scam', 'Seller behavior', 'Payment issue', 'Inspection concern', 'Other'];

export default function ReportDispute() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const listingId = params.get('listingId') || '';
  const [form, setForm] = useState({ category: CATEGORIES[0], subject: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    if (!user) return navigate('/login');
    setError(null);
    if (form.description.trim().length < 10) return setError('Please describe the issue in a bit more detail.');
    setSubmitting(true);
    try {
      await api.post('/disputes', { ...form, listingId: listingId || undefined });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit your report.');
    } finally { setSubmitting(false); }
  };

  if (done) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <Icon name="task_alt" className="text-6xl text-trust-emerald mb-4" />
      <h1 className="text-headline-lg font-headline-lg text-on-surface mb-2">Report Submitted</h1>
      <p className="text-on-surface-variant mb-6">Our trust & safety team will review your report and follow up within 24–48 hours.</p>
      <div className="flex gap-3 justify-center">
        <Link to="/" className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md">Back to Home</Link>
        <Link to="/help" className="rounded-xl border border-border-subtle text-on-surface px-lg py-sm font-label-md">Help Center</Link>
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-2xl mx-auto px-gutter-mobile md:px-gutter-desktop py-2xl">
        <div className="flex items-center gap-md mb-md">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-surface-container transition-colors text-on-surface"><Icon name="arrow_back" /></button>
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Report a Dispute</h1>
        </div>
        <p className="text-on-surface-variant text-body-md mb-lg">Tell us what went wrong. Reports go to Ryderr's trust & safety team — for fraud or safety risks, please include as much detail as you can.</p>

        <form onSubmit={submit} className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-lg md:p-xl space-y-lg">
          {listingId && (
            <div className="flex items-center gap-2 text-label-sm text-on-surface-variant bg-surface-container rounded-lg px-md py-sm">
              <Icon name="link" className="text-[16px]" /> Linked to listing <Link to={`/cars/${listingId}`} className="text-primary font-semibold hover:underline">#{listingId.slice(0, 8)}</Link>
            </div>
          )}
          <div className="space-y-xs">
            <label className="block text-label-sm font-label-sm text-on-surface-variant px-1">Category</label>
            <select value={form.category} onChange={(e) => set('category', e.target.value)} className={INPUT}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-xs">
            <label className="block text-label-sm font-label-sm text-on-surface-variant px-1">Subject</label>
            <input value={form.subject} onChange={(e) => set('subject', e.target.value)} required className={INPUT} placeholder="Brief summary of the issue" />
          </div>
          <div className="space-y-xs">
            <label className="block text-label-sm font-label-sm text-on-surface-variant px-1">Description</label>
            <textarea rows={6} value={form.description} onChange={(e) => set('description', e.target.value)} required className={`${INPUT} resize-none`} placeholder="What happened? Include dates, names, amounts, and anything else relevant." />
          </div>
          {error && <p className="rounded-lg bg-error/10 border border-error/30 px-3 py-2 text-body-sm text-error">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full bg-primary text-on-primary py-md rounded-xl font-label-md hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            <Icon name="flag" className="text-[20px]" /> {submitting ? 'Submitting…' : 'Submit Report'}
          </button>
        </form>
      </main>
    </div>
  );
}
