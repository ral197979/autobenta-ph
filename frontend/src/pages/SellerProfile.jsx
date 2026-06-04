import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatRelativeTime } from '../utils/format';
import CarCard from '../components/CarCard';

function Icon({ name, className = '', filled = false }) {
  return <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>;
}

function Stars({ value, onSelect, size = 'text-[20px]' }) {
  return (
    <div className="flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <button key={n} type={onSelect ? 'button' : undefined} disabled={!onSelect} onClick={onSelect ? () => onSelect(n) : undefined}
          className={`${onSelect ? 'cursor-pointer' : 'cursor-default'} text-alert-orange leading-none`}>
          <Icon name="star" className={size} filled={n <= value} />
        </button>
      ))}
    </div>
  );
}

export default function SellerProfile() {
  const { id } = useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState('listings');
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const listingsQ = useQuery({ queryKey: ['seller-listings', id], queryFn: () => api.get(`/listings?sellerId=${id}`).then(r => r.data) });
  const reviewsQ = useQuery({ queryKey: ['seller-reviews', id], queryFn: () => api.get(`/reviews?sellerId=${id}`).then(r => r.data) });

  const submitReview = useMutation({
    mutationFn: () => api.post('/reviews', { sellerId: id, rating, comment }),
    onSuccess: () => { setComment(''); setRating(5); qc.invalidateQueries({ queryKey: ['seller-reviews', id] }); },
  });

  const listings = listingsQ.data?.listings || [];
  const reviews = reviewsQ.data?.reviews || [];
  const avg = reviewsQ.data?.average || 0;
  const count = reviewsQ.data?.count || 0;

  const first = listings[0] || {};
  const name = first.dealer?.businessName || first.seller?.name || 'Seller';
  const verified = first.dealer?.isVerified || first.sellerVerified;
  const role = first.dealer ? 'Dealer' : 'Private Seller';
  const canReview = user && user.id !== id;

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-xl">
        {/* Profile header */}
        <div className="flex flex-col md:flex-row items-center md:items-end gap-xl pb-xl border-b border-border-subtle text-center md:text-left">
          <div className="w-28 h-28 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-5xl font-bold border-4 border-surface-container shadow-lg shrink-0">
            {name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 space-y-xs">
            <div className="flex items-center justify-center md:justify-start gap-sm flex-wrap">
              <h1 className="font-headline-lg text-headline-lg text-on-surface">{name}</h1>
              {verified && <span className="bg-trust-emerald/10 text-trust-emerald text-[10px] px-2 py-0.5 rounded-full font-bold uppercase border border-trust-emerald/20 flex items-center gap-1"><Icon name="verified" className="text-[14px]" filled /> Verified</span>}
            </div>
            <div className="flex items-center justify-center md:justify-start gap-md flex-wrap text-on-surface-variant">
              <span className="flex items-center gap-1"><Stars value={Math.round(avg)} /> <span className="font-bold text-on-surface ml-1">{avg || '—'}</span> <span>({count} review{count === 1 ? '' : 's'})</span></span>
              <span>•</span>
              <span>{role}</span>
              <span>•</span>
              <span>{listings.length} active listing{listings.length === 1 ? '' : 's'}</span>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-lg border-b border-border-subtle mt-lg mb-lg">
          {[['listings', `Active Listings`], ['reviews', `Reviews (${count})`]].map(([t, label]) => (
            <button key={t} onClick={() => setTab(t)} className={`pb-md text-label-md font-label-md transition-colors border-b-2 ${tab === t ? 'border-primary text-primary' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>{label}</button>
          ))}
        </div>

        {tab === 'listings' ? (
          listingsQ.isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-80 rounded-2xl border border-border-subtle bg-surface-container animate-pulse" />)}</div>
          ) : listings.length === 0 ? (
            <p className="text-on-surface-variant text-center py-16">This seller has no active listings.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-xl">
              {listings.map((l) => <CarCard key={l.id} listing={l} />)}
            </div>
          )
        ) : (
          <div className="max-w-2xl space-y-lg">
            {canReview && (
              <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-lg">
                <h3 className="font-headline-sm text-headline-sm text-on-surface mb-md">Write a review</h3>
                <div className="flex items-center gap-md mb-md"><span className="text-label-md text-on-surface-variant">Rating</span><Stars value={rating} onSelect={setRating} size="text-2xl" /></div>
                <textarea value={comment} onChange={(e) => setComment(e.target.value)} rows={3} placeholder="Share your experience with this seller…"
                  className="w-full bg-surface-container border border-border-subtle rounded-xl px-md py-sm text-body-md text-on-surface focus:ring-2 focus:ring-primary outline-none resize-none mb-md" />
                <button onClick={() => submitReview.mutate()} disabled={submitReview.isPending} className="bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md hover:opacity-90 disabled:opacity-50">{submitReview.isPending ? 'Posting…' : 'Post Review'}</button>
              </div>
            )}
            {reviews.length === 0 ? (
              <p className="text-on-surface-variant text-center py-10">No reviews yet.</p>
            ) : (
              reviews.map((r) => (
                <div key={r.id} className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-lg">
                  <div className="flex items-center justify-between mb-sm">
                    <div className="flex items-center gap-sm">
                      <div className="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold">{r.reviewer?.name?.charAt(0) || 'U'}</div>
                      <span className="font-label-md text-on-surface">{r.reviewer?.name || 'User'}</span>
                    </div>
                    <span className="text-label-sm text-on-surface-variant">{formatRelativeTime(r.createdAt)}</span>
                  </div>
                  <Stars value={r.rating} size="text-[16px]" />
                  {r.comment && <p className="text-body-md text-on-surface-variant mt-sm">{r.comment}</p>}
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
