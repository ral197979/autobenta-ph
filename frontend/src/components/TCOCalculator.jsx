import { useState } from 'react';
import { formatPrice } from '../utils/format';
import { computeTCO, TCO_YEARS, ANNUAL_KM_OPTIONS } from '../utils/tco';

function Icon({ name, className = '', filled = false }) {
  return <span className={`material-symbols-outlined ${className}`} style={filled ? { fontVariationSettings: "'FILL' 1" } : undefined}>{name}</span>;
}

const BAR = {
  depreciation: 'bg-alert-orange',
  fuel: 'bg-primary',
  insurance: 'bg-trust-emerald',
  maintenance: 'bg-secondary',
  registration: 'bg-on-surface-variant',
};

export default function TCOCalculator({ listing }) {
  const [annualKm, setAnnualKm] = useState(15000);
  const { items, total, residualValue, perMonth } = computeTCO(listing, annualKm);
  const max = Math.max(...items.map((i) => i.value), 1);

  return (
    <section className="space-y-xl">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-headline-md font-bold text-primary">{TCO_YEARS}-Year Cost to Own</h2>
        <span className="text-label-sm text-on-surface-variant">Beyond the sticker price</span>
      </div>

      <div className="bg-surface-container-low border border-border-subtle rounded-2xl p-xl space-y-xl">
        {/* Headline total */}
        <div className="flex flex-wrap items-end justify-between gap-md">
          <div>
            <p className="text-label-sm text-on-surface-variant uppercase tracking-widest font-bold">Estimated {TCO_YEARS}-year total</p>
            <p className="text-display-lg font-bold text-on-surface tracking-tight">{formatPrice(total)}</p>
          </div>
          <div className="text-right">
            <p className="text-label-sm text-on-surface-variant uppercase tracking-widest font-bold">≈ Per month</p>
            <p className="text-headline-md font-bold text-primary">{formatPrice(perMonth)}</p>
          </div>
        </div>

        {/* Annual mileage selector */}
        <div className="space-y-sm">
          <p className="text-label-sm text-on-surface-variant">How much will you drive per year?</p>
          <div className="flex flex-wrap gap-2">
            {ANNUAL_KM_OPTIONS.map((km) => (
              <button
                key={km}
                onClick={() => setAnnualKm(km)}
                className={`px-md py-1.5 rounded-full text-label-sm font-bold transition-colors border ${
                  annualKm === km
                    ? 'bg-primary text-on-primary border-primary'
                    : 'bg-surface-container border-border-subtle text-on-surface hover:bg-surface-container-high'
                }`}
              >
                {(km / 1000).toLocaleString()}k km
              </button>
            ))}
          </div>
        </div>

        {/* Cost breakdown bars */}
        <div className="space-y-lg">
          {items.map((it) => (
            <div key={it.key} className="space-y-1.5">
              <div className="flex items-center justify-between gap-md">
                <span className="flex items-center gap-2 text-body-md text-on-surface">
                  <Icon name={it.icon} className="text-[20px] text-on-surface-variant" /> {it.label}
                  <span className="text-label-sm text-on-surface-variant/70 hidden sm:inline">· {it.hint}</span>
                </span>
                <span className="text-body-md font-bold text-on-surface tabular-nums">{formatPrice(it.value)}</span>
              </div>
              <div className="h-2 bg-surface-container-highest rounded-full overflow-hidden">
                <div className={`h-full ${BAR[it.key] || 'bg-primary'} rounded-full transition-all duration-500`} style={{ width: `${(it.value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Residual + disclaimer */}
        <div className="flex flex-wrap items-center justify-between gap-md pt-md border-t border-border-subtle">
          <div className="flex items-center gap-2 text-body-sm text-on-surface-variant">
            <Icon name="sell" className="text-[18px] text-trust-emerald" />
            Est. resale value after {TCO_YEARS} yrs: <span className="font-bold text-on-surface">{formatPrice(residualValue)}</span>
          </div>
        </div>
        <p className="text-label-sm text-on-surface-variant/60 leading-relaxed">
          Planning estimate using PH averages for fuel, insurance, maintenance, and LTO fees. Actual costs vary by usage, location, and provider.
        </p>
      </div>
    </section>
  );
}
