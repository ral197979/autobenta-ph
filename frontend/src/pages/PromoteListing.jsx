import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { formatPrice, photoOrFallback } from '../utils/format';

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

const TIERS = [
  { key: 'spotlight', name: 'Spotlight', days: 3, price: 499, desc: 'Boost for quick interest.', perks: ['Highlighted in search'] },
  { key: 'featured', name: 'Featured', days: 7, price: 999, desc: 'Best value for most sellers.', perks: ['Highlighted in search', 'Homepage feature'] },
  { key: 'premium', name: 'Premium', days: 14, price: 1899, desc: 'National featured placement.', perks: ['Top of search results', 'Homepage + region feature'] },
];

export default function PromoteListing() {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const [tier, setTier] = useState('featured');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);

  const { data: listing } = useQuery({ queryKey: ['listing', listingId], queryFn: () => api.get(`/listings/${listingId}`).then(r => r.data) });

  const promote = async () => {
    const t = TIERS.find((x) => x.key === tier);
    setSubmitting(true); setError(null);
    try {
      const endAt = new Date(Date.now() + t.days * 24 * 60 * 60 * 1000).toISOString();
      await api.post('/featured/dealer/featured', { listingId, featureType: t.key, endAt, pricePhp: t.price });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Could not promote listing.');
    } finally { setSubmitting(false); }
  };

  if (done) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <Icon name="rocket_launch" className="text-6xl text-primary mb-4" />
      <h1 className="text-headline-lg font-headline-lg text-on-surface mb-2">Listing Promoted!</h1>
      <p className="text-on-surface-variant mb-6">Your {listing?.make} {listing?.model} is now boosted and will appear at the top of search results.</p>
      <div className="flex gap-3 justify-center">
        <Link to="/dealer/featured" className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md">View Promotions</Link>
        <Link to={`/cars/${listingId}`} className="rounded-xl border border-border-subtle text-on-surface px-lg py-sm font-label-md">View Listing</Link>
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-3xl mx-auto px-gutter-mobile md:px-gutter-desktop py-xl space-y-xl">
        <div className="flex items-center gap-md">
          <button onClick={() => navigate(-1)} className="p-1 rounded-full hover:bg-surface-container transition-colors text-on-surface"><Icon name="arrow_back" /></button>
          <h1 className="font-headline-lg text-headline-lg text-on-surface">Promote Listing</h1>
        </div>

        {/* Listing preview */}
        {listing && (
          <div className="bg-primary-container rounded-2xl p-lg flex items-center gap-md">
            <div className="w-24 h-16 rounded-lg overflow-hidden shrink-0">
              <img src={photoOrFallback(listing.photos?.[0]?.url, listing.make)} alt="" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-label-sm text-on-primary-container uppercase tracking-widest">Active Listing</p>
              <h2 className="font-headline-sm text-headline-sm text-on-primary">{listing.year} {listing.make} {listing.model}</h2>
              <p className="text-on-primary-container font-bold">{formatPrice(listing.price)}</p>
            </div>
          </div>
        )}

        {/* Tier selection */}
        <div>
          <h2 className="font-label-md text-label-md text-on-surface-variant uppercase tracking-widest mb-xs">Select Promotion Tier</h2>
          <p className="text-body-sm text-on-surface-variant mb-md">Boost your visibility and sell faster with specialized placement.</p>
          <div className="space-y-md">
            {TIERS.map((t) => (
              <button key={t.key} onClick={() => setTier(t.key)}
                className={`w-full text-left p-lg rounded-2xl border-2 transition-all ${tier === t.key ? 'border-primary bg-primary/5' : 'border-border-subtle bg-surface-container-lowest hover:border-outline-variant'}`}>
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <div className="flex items-center gap-sm">
                      <span className="font-headline-sm text-headline-sm text-on-surface">{t.name}</span>
                      {t.key === 'featured' && <span className="text-[10px] font-bold uppercase bg-primary text-on-primary px-2 py-0.5 rounded-full">Popular</span>}
                    </div>
                    <p className="text-body-sm text-on-surface-variant mt-xs">{t.desc}</p>
                    <ul className="mt-sm space-y-1">
                      {t.perks.map((p) => <li key={p} className="flex items-center gap-1 text-label-sm text-on-surface-variant"><Icon name="stars" className="text-[16px] text-primary" /> {p}</li>)}
                    </ul>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-headline-md text-headline-md text-primary">{formatPrice(t.price)}</p>
                    <span className="text-label-sm text-on-surface-variant">/ {t.days} days</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="bg-surface-container rounded-2xl p-lg">
          <h3 className="font-headline-sm text-headline-sm text-on-surface mb-xs">Why promote?</h3>
          <p className="text-body-sm text-on-surface-variant">Promoted listings appear at the top of search results and are featured on the homepages of active buyers in your region.</p>
        </div>

        {error && <p className="rounded-lg bg-error/10 border border-error/30 px-3 py-2 text-body-sm text-error">{error}</p>}

        <button onClick={promote} disabled={submitting} className="w-full bg-primary text-on-primary py-lg rounded-xl font-headline-sm font-bold flex items-center justify-center gap-md hover:opacity-90 active:scale-95 transition-all shadow-lg disabled:opacity-50">
          <Icon name="rocket_launch" /> {submitting ? 'Promoting…' : `Promote for ${formatPrice(TIERS.find(t => t.key === tier).price)}`}
        </button>
      </main>
    </div>
  );
}
