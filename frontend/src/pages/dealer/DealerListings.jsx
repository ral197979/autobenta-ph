import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Car, Plus, Eye, MessageSquare, Edit } from 'lucide-react';
import api from '../../api/client';
import { formatPrice, formatRelativeTime } from '../../utils/format';

const STATUS_COLORS = {
  active: 'bg-emerald-100 text-emerald-700',
  pending: 'bg-yellow-100 text-yellow-700',
  draft: 'bg-surface-container text-on-surface-variant',
  sold: 'bg-blue-100 text-blue-700',
  archived: 'bg-surface-container text-on-surface-variant',
  rejected: 'bg-red-100 text-red-700',
  flagged: 'bg-orange-100 text-orange-700',
};

export default function DealerListings() {
  const [statusFilter, setStatusFilter] = useState('active');

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['my-listings'],
    queryFn: () => api.get('/listings/user/my-listings').then(r => r.data),
  });

  const filtered = statusFilter
    ? listings.filter(l => l.status === statusFilter)
    : listings;

  const counts = ['active', 'pending', 'draft', 'sold', 'archived'].reduce((acc, s) => {
    acc[s] = listings.filter(l => l.status === s).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-on-surface">My Listings</h1>
        <Link
          to="/sell"
          className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Listing
        </Link>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 flex-wrap">
        {[['all', 'All', listings.length], ['active', 'Active', counts.active], ['pending', 'Pending', counts.pending], ['draft', 'Draft', counts.draft], ['sold', 'Sold', counts.sold]].map(([s, label, count]) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s === 'all' ? '' : s)}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${(s === 'all' ? !statusFilter : statusFilter === s) ? 'bg-primary text-on-primary' : 'bg-surface-container-lowest border border-border-subtle text-on-surface-variant hover:border-primary/30'}`}
          >
            {label}
            <span className="rounded-full bg-current/20 px-1.5 text-xs">{count}</span>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-16 text-on-surface-variant">Loading listings...</div>
      ) : !filtered.length ? (
        <div className="card p-12 text-center text-on-surface-variant">
          <Car className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium mb-3">No listings in this category</p>
          <Link to="/sell" className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white">
            <Plus className="h-4 w-4" /> Post First Listing
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((listing) => (
            <div key={listing.id} className="card flex gap-4 p-4">
              <div className="h-16 w-24 rounded-xl overflow-hidden bg-surface-container shrink-0">
                <img
                  src={listing.photos?.[0]?.url || ''}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-sm text-on-surface">
                    {listing.year} {listing.make} {listing.model}
                    {listing.variant && <span className="font-normal text-on-surface-variant"> {listing.variant}</span>}
                  </p>
                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-medium ${STATUS_COLORS[listing.status]}`}>
                    {listing.status}
                  </span>
                </div>
                <p className="text-base font-bold text-primary mb-2">{formatPrice(listing.price)}</p>
                <div className="flex items-center gap-4 text-xs text-on-surface-variant">
                  <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{listing.viewCount || 0} views</span>
                  <span className="flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" />{listing.inquiryCount || 0} inquiries</span>
                  <span>{formatRelativeTime(listing.createdAt)}</span>
                </div>
              </div>
              <div className="flex flex-col gap-2 shrink-0">
                <Link
                  to={`/cars/${listing.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-border-subtle px-3 py-1.5 text-xs font-medium text-on-surface hover:bg-surface-container"
                >
                  <Eye className="h-3.5 w-3.5" /> View
                </Link>
                <Link
                  to={`/sell?edit=${listing.id}`}
                  className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-medium text-primary hover:bg-primary/10"
                >
                  <Edit className="h-3.5 w-3.5" /> Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
