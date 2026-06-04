import { useState } from 'react';
import api from '../api/client';
import { formatPrice } from '../utils/format';

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

export default function MakeOfferModal({ listing, onClose, onSubmitted }) {
  const [amount, setAmount] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const price = Number(listing.price) || 0;
  const low = Math.round(price * 0.9);
  const high = Math.round(price * 0.98);

  const submit = async (e) => {
    e.preventDefault();
    setError(null);
    const value = parseFloat(amount);
    if (!(value > 0)) return setError('Enter a valid offer amount.');
    setSubmitting(true);
    try {
      await api.post('/offers', { listingId: listing.id, amount: value, message });
      onSubmitted?.();
    } catch (err) {
      setError(err.response?.data?.error || 'Could not submit offer.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center p-0 md:p-4">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full md:max-w-lg bg-surface-container-lowest rounded-t-2xl md:rounded-2xl border border-border-subtle shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-lg border-b border-border-subtle sticky top-0 bg-surface-container-lowest">
          <h1 className="text-headline-sm font-headline-sm text-primary">Make an Offer</h1>
          <button onClick={onClose} aria-label="Close" className="p-sm rounded-full hover:bg-surface-container-low transition-colors text-on-surface-variant"><Icon name="close" /></button>
        </div>

        <form onSubmit={submit} className="p-lg space-y-lg">
          <div className="bg-surface-container rounded-xl p-md">
            <span className="text-label-sm text-on-surface-variant uppercase tracking-wider">Listing</span>
            <h2 className="text-body-lg font-bold text-on-surface">{listing.year} {listing.make} {listing.model}</h2>
            <p className="text-headline-sm font-bold text-primary-container">{formatPrice(price)}</p>
          </div>

          <div className="space-y-xs">
            <label htmlFor="offerPrice" className="text-label-md font-label-md text-on-surface-variant">Your Offer Price</label>
            <div className="relative">
              <span className="absolute left-md top-1/2 -translate-y-1/2 text-headline-sm font-bold text-primary">₱</span>
              <input id="offerPrice" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
                className="w-full pl-xl pr-md py-lg bg-surface-container border border-border-subtle rounded-xl text-headline-sm font-bold text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder:text-outline-variant" />
            </div>
            <p className="mt-xs text-label-sm text-on-surface-variant">Suggested: {formatPrice(low)} – {formatPrice(high)}</p>
          </div>

          <div className="space-y-xs">
            <div className="flex items-center justify-between">
              <label htmlFor="offerMsg" className="text-label-md font-label-md text-on-surface-variant">Message to Seller</label>
              <span className="text-label-sm text-outline">Optional</span>
            </div>
            <textarea id="offerMsg" rows={3} value={message} onChange={(e) => setMessage(e.target.value)}
              placeholder="Hi, I'm interested in this car. I can view and pay this week…"
              className="w-full p-md bg-surface-container border border-border-subtle rounded-xl text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all resize-none" />
          </div>

          {error && <p className="rounded-lg bg-error/10 border border-error/30 px-3 py-2 text-body-sm text-error">{error}</p>}

          <button type="submit" disabled={submitting} className="w-full bg-primary text-on-primary py-md rounded-xl font-headline-sm hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-sm shadow-md disabled:opacity-50">
            <Icon name="gavel" className="text-[20px]" /> {submitting ? 'Submitting…' : 'Submit Offer'}
          </button>
          <p className="text-center text-label-sm text-on-surface-variant">The seller can accept, decline, or counter your offer.</p>
        </form>
      </div>
    </div>
  );
}
