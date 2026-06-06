import { useState } from 'react';
import api from '../api/client';

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

const SLOTS = ['9:00 AM', '10:00 AM', '11:00 AM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM'];
const INPUT = 'w-full bg-surface-container border border-border-subtle rounded-xl px-md py-sm text-body-md text-on-surface focus:ring-2 focus:ring-primary outline-none';

export default function BookTestDriveModal({ listing, onClose, onBooked }) {
  const today = new Date().toISOString().split('T')[0];
  const [type, setType] = useState('test_drive');
  const [date, setDate] = useState('');
  const [slot, setSlot] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const submit = async (e) => {
    e.preventDefault();
    if (!date) return setError('Please choose a date.');
    setSubmitting(true); setError(null);
    try {
      await api.post('/bookings', { listingId: listing.id, type, preferredDate: date, timeSlot: slot, message });
      onBooked?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not book. Please try again.');
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-lg bg-surface-container-lowest rounded-t-2xl md:rounded-2xl border border-border-subtle shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-lg border-b border-border-subtle sticky top-0 bg-surface-container-lowest">
          <h1 className="text-headline-sm font-headline-sm text-primary">Book a Visit</h1>
          <button onClick={onClose} aria-label="Close" className="p-sm rounded-full hover:bg-surface-container-low text-on-surface-variant"><Icon name="close" /></button>
        </div>
        <form onSubmit={submit} className="p-lg space-y-lg">
          <div className="bg-surface-container rounded-xl p-md">
            <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">Vehicle</span>
            <h2 className="text-body-lg font-bold text-on-surface">{listing.year} {listing.make} {listing.model}</h2>
          </div>

          <div className="space-y-xs">
            <label className="text-label-md font-label-md text-on-surface-variant">Visit type</label>
            <div className="grid grid-cols-2 gap-sm">
              {[['test_drive', 'directions_car', 'Test Drive'], ['viewing', 'visibility', 'Viewing']].map(([v, icon, label]) => (
                <button key={v} type="button" onClick={() => setType(v)} className={`flex items-center justify-center gap-2 p-md rounded-xl border-2 transition-all ${type === v ? 'border-primary bg-primary/5 text-primary' : 'border-border-subtle text-on-surface'}`}>
                  <Icon name={icon} className="text-[20px]" /> {label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-xs">
            <label className="text-label-md font-label-md text-on-surface-variant">Preferred date</label>
            <input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className={INPUT} />
          </div>

          <div className="space-y-xs">
            <label className="text-label-md font-label-md text-on-surface-variant">Preferred time</label>
            <div className="flex flex-wrap gap-1.5">
              {SLOTS.map((s) => (
                <button key={s} type="button" onClick={() => setSlot(s === slot ? '' : s)} className={`px-md py-xs rounded-full text-body-sm transition-all ${slot === s ? 'bg-primary text-on-primary font-bold' : 'border border-border-subtle text-on-surface hover:border-primary'}`}>{s}</button>
              ))}
            </div>
          </div>

          <div className="space-y-xs">
            <label className="text-label-md font-label-md text-on-surface-variant">Note to seller <span className="text-outline">(optional)</span></label>
            <textarea rows={2} value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Anything the seller should know…" className={`${INPUT} resize-none`} />
          </div>

          {error && <p className="rounded-lg bg-error/10 border border-error/30 px-3 py-2 text-body-sm text-error">{error}</p>}
          <button type="submit" disabled={submitting} className="w-full bg-primary text-on-primary py-md rounded-xl font-label-md hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2">
            <Icon name="event" className="text-[20px]" /> {submitting ? 'Booking…' : 'Request Booking'}
          </button>
          <p className="text-center text-label-sm text-on-surface-variant">The seller will confirm your preferred slot.</p>
        </form>
      </div>
    </div>
  );
}
