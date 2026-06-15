import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';

function Icon({ name, className = '', filled = false }) {
  return <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>;
}

function Stars({ value }) {
  return (
    <span className="inline-flex">
      {[1, 2, 3, 4, 5].map((n) => (
        <Icon key={n} name="star" className={`text-[16px] ${n <= Math.round(value) ? 'text-alert-orange' : 'text-outline-variant'}`} filled={n <= Math.round(value)} />
      ))}
    </span>
  );
}

export default function DealerDirectory() {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('');
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['dealers'],
    queryFn: () => api.get('/dealers').then((r) => r.data),
  });

  const dealers = (data || []).filter((d) =>
    (!q || d.businessName.toLowerCase().includes(q.toLowerCase())) &&
    (!city || d.city === city) &&
    (!verifiedOnly || d.isVerified)
  );
  const cities = [...new Set((data || []).map((d) => d.city).filter(Boolean))].sort();

  return (
    <div className="bg-background min-h-screen">
      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-xl">
        <div className="mb-lg">
          <h1 className="text-headline-lg font-headline-lg text-on-surface">Dealer Directory</h1>
          <p className="text-body-sm text-on-surface-variant mt-1">Browse verified dealerships across the Philippines — see their ratings and inventory.</p>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-md mb-lg">
          <div className="relative flex-1">
            <Icon name="search" className="absolute left-md top-1/2 -translate-y-1/2 text-on-surface-variant" />
            <input value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search dealerships" placeholder="Search dealerships…" className="w-full bg-surface-container border border-border-subtle rounded-full pl-12 pr-md py-sm text-body-md text-on-surface focus:ring-2 focus:ring-primary outline-none placeholder-on-surface-variant/60" />
          </div>
          <select value={city} onChange={(e) => setCity(e.target.value)} className="bg-surface-container border border-border-subtle rounded-xl px-md py-sm text-body-sm text-on-surface focus:ring-2 focus:ring-primary outline-none">
            <option value="">All Cities</option>
            {cities.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <label className="flex items-center gap-2 px-md py-sm rounded-xl border border-border-subtle text-body-sm text-on-surface cursor-pointer">
            <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} className="h-4 w-4 rounded text-primary focus:ring-primary bg-surface-container" /> Verified only
          </label>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 rounded-2xl border border-border-subtle bg-surface-container animate-pulse" />)}</div>
        ) : dealers.length === 0 ? (
          <p className="text-center text-on-surface-variant py-20">No dealers match your search.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-lg">
            {dealers.map((d) => (
              <Link key={d.id} to={`/seller/${d.userId}`} className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-lg hover:border-primary hover:-translate-y-0.5 transition-all flex flex-col gap-md">
                <div className="flex items-center gap-md">
                  <div className="w-14 h-14 rounded-xl bg-surface border border-border-subtle flex items-center justify-center overflow-hidden shrink-0">
                    {d.logoUrl ? <img src={d.logoUrl} alt="" className="w-full h-full object-cover" /> : <span className="text-headline-sm font-bold text-primary">{d.businessName.charAt(0)}</span>}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h3 className="text-headline-sm font-headline-sm text-on-surface truncate">{d.businessName}</h3>
                      {d.isVerified && <Icon name="verified" className="text-trust-emerald text-[18px] shrink-0" filled />}
                    </div>
                    <p className="text-label-sm text-on-surface-variant flex items-center gap-1"><Icon name="location_on" className="text-[14px]" /> {d.city}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-label-sm text-on-surface-variant">
                  <span className="flex items-center gap-1.5">
                    {d.rating?.count > 0 ? <><Stars value={d.rating.avg} /> <span className="font-bold text-on-surface">{d.rating.avg}</span> ({d.rating.count})</> : <span className="text-on-surface-variant/70">No reviews yet</span>}
                  </span>
                  <span className="flex items-center gap-1"><Icon name="directions_car" className="text-[16px]" /> {d._count?.listings ?? 0} listings</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
