import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { formatPrice, TRANSMISSION_LABELS, FUEL_LABELS } from '../utils/format';

function Icon({ name, className = '', filled = false }) {
  return <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>;
}
const GRADIENT = 'bg-gradient-to-br from-[#1e3a5f] to-[#0B1220]';

export default function NewCarDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [imgErr, setImgErr] = useState(false);

  const { data: m, isLoading, isError } = useQuery({ queryKey: ['new-car', id], queryFn: () => api.get(`/new-cars/${id}`).then(r => r.data) });

  if (isLoading) return <div className="max-w-container-max mx-auto px-gutter-desktop py-3xl animate-pulse"><div className="aspect-[21/9] bg-surface-container rounded-2xl mb-lg" /><div className="h-8 w-1/3 bg-surface-container rounded" /></div>;
  if (isError || !m) return <div className="text-center py-24"><p className="text-on-surface-variant text-body-lg">Model not found.</p><Link to="/new-cars" className="mt-4 inline-block bg-primary text-on-primary rounded-xl px-lg py-sm font-label-md">Browse New Cars</Link></div>;

  const specs = m.specs || {};
  const title = `${m.make} ${m.model}`;

  return (
    <div className="bg-surface min-h-screen">
      {/* Hero */}
      <section className="relative w-full overflow-hidden bg-ink">
        <div className="aspect-[21/9] max-h-[60vh] w-full relative">
          {m.imageUrl && !imgErr ? (
            <img src={m.imageUrl} alt={title} className="w-full h-full object-cover" onError={() => setImgErr(true)} />
          ) : (
            <div className={`h-full w-full ${GRADIENT}`} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          <div className="absolute bottom-xl left-gutter-mobile right-gutter-mobile md:left-gutter-desktop md:right-gutter-desktop max-w-container-max mx-auto">
            <nav className="flex items-center gap-sm text-label-sm text-white/70 mb-xs">
              <Link to="/" className="hover:text-white">Home</Link><Icon name="chevron_right" className="text-[14px]" />
              <Link to="/new-cars" className="hover:text-white">New Cars</Link>
            </nav>
            <div className="flex items-center gap-sm mb-xs">
              {m.isElectric && <span className="bg-trust-emerald text-white text-[10px] font-bold px-2 py-1 rounded-full flex items-center gap-1"><Icon name="bolt" className="text-[12px]" filled /> ELECTRIC</span>}
              <span className="text-white/70 text-label-sm uppercase tracking-widest">{m.bodyType} · {m.year}</span>
            </div>
            <h1 className="text-display-lg text-white drop-shadow">{title}</h1>
          </div>
        </div>
      </section>

      <main className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-2xl grid grid-cols-12 gap-xl lg:gap-3xl">
        {/* Left: specs + variants */}
        <div className="col-span-12 lg:col-span-8 space-y-2xl">
          {m.description && <p className="text-body-lg text-on-surface-variant leading-relaxed">{m.description}</p>}

          {Object.keys(specs).length > 0 && (
            <section>
              <h2 className="text-headline-md font-bold text-primary mb-lg">Key Specifications</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-lg">
                {Object.entries(specs).map(([k, v]) => (
                  <div key={k} className="bg-surface-container-low border border-border-subtle rounded-2xl p-lg flex flex-col gap-xs">
                    <span className="text-label-sm text-on-surface-variant uppercase tracking-widest font-bold">{k}</span>
                    <span className="text-body-lg font-bold text-on-surface">{String(v)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {m.variants?.length > 0 && (
            <section>
              <h2 className="text-headline-md font-bold text-primary mb-lg">Variants &amp; Prices</h2>
              <div className="bg-surface-container-lowest border border-border-subtle rounded-2xl overflow-hidden divide-y divide-border-subtle">
                {m.variants.map((v) => (
                  <div key={v.id} className="flex items-center justify-between p-lg gap-4">
                    <div>
                      <p className="font-semibold text-on-surface">{v.name}</p>
                      <p className="text-label-sm text-on-surface-variant">{[TRANSMISSION_LABELS[v.transmission] || v.transmission, FUEL_LABELS[v.fuelType] || v.fuelType].filter(Boolean).join(' · ')}</p>
                    </div>
                    <span className="text-headline-sm font-bold text-primary whitespace-nowrap">{formatPrice(v.price)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Right: sticky action */}
        <aside className="col-span-12 lg:col-span-4">
          <div className="lg:sticky lg:top-24 bg-surface-container-low border border-border-subtle rounded-2xl p-xl shadow-2xl space-y-lg">
            <div>
              <span className="text-label-sm text-on-surface-variant uppercase tracking-widest">Starting Price</span>
              <p className="text-display-lg font-bold text-primary tracking-tight">{formatPrice(m.startingPrice)}</p>
            </div>
            <div className="space-y-md">
              <button onClick={() => navigate(`/cars?make=${encodeURIComponent(m.make)}`)} className="w-full bg-primary text-on-primary py-4 rounded-xl text-label-md font-bold hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
                <Icon name="search" className="text-[20px]" /> See used {m.make} {m.model}
              </button>
              <Link to="/financing" className="w-full bg-surface-container-high border border-border-subtle text-primary py-4 rounded-xl text-label-md font-bold hover:bg-surface-container-highest transition-all flex items-center justify-center gap-2">
                <Icon name="calculate" className="text-[20px]" /> Estimate Financing
              </Link>
            </div>
            <div className="pt-md border-t border-border-subtle space-y-md">
              <TrustRow icon="verified_user" title="Official pricing" body="Indicative SRP — confirm with a dealer for the latest." />
              <TrustRow icon="electric_bolt" title={m.isElectric ? 'Zero emissions' : 'Brand new'} body={m.isElectric ? 'Fully electric drivetrain.' : 'Factory-fresh with full warranty.'} />
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function TrustRow({ icon, title, body }) {
  return (
    <div className="flex items-start gap-md">
      <div className="p-2 bg-primary/10 rounded-lg"><Icon name={icon} className="text-primary" /></div>
      <div>
        <span className="block text-label-md font-bold text-on-surface">{title}</span>
        <span className="text-body-sm text-on-surface-variant leading-relaxed">{body}</span>
      </div>
    </div>
  );
}
