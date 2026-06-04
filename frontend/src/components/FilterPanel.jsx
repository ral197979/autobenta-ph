import { useState } from 'react';
import { ChevronDown, ChevronUp, X, Navigation } from 'lucide-react';

const MAKES = ['Toyota', 'Honda', 'Mitsubishi', 'Ford', 'Nissan', 'Suzuki', 'Hyundai', 'Isuzu', 'Mazda', 'Kia'];
const FUEL_TYPES = [['gasoline', 'Gasoline'], ['diesel', 'Diesel'], ['hybrid', 'Hybrid'], ['electric', 'Electric'], ['lpg', 'LPG']];
const TRANSMISSIONS = [['automatic', 'Automatic'], ['manual', 'Manual'], ['cvt', 'CVT']];
const SELLER_TYPES = [['private', 'Private Seller'], ['dealer', 'Dealer'], ['repossessed', 'Repossessed']];
const CONDITIONS = [['brand_new', 'Brand New'], ['excellent', 'Excellent'], ['good', 'Good'], ['fair', 'Fair'], ['poor', 'Poor']];
const CITIES = ['Metro Manila', 'Cebu City', 'Davao City', 'Angeles City', 'Bacoor', 'San Pedro', 'Laguna', 'Pampanga'];
const YEARS = Array.from({ length: 15 }, (_, i) => new Date().getFullYear() - i);
const RADIUS_OPTIONS = [10, 25, 50, 100, 200];

const inputCls =
  'w-full border border-border-subtle rounded-xl px-md py-sm bg-surface-container text-on-surface text-body-sm focus:ring-2 focus:ring-primary outline-none placeholder-on-surface-variant/50 transition-all';

function Chip({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={`px-md py-xs rounded-full text-body-sm transition-all active:scale-95 ${
        active
          ? 'bg-primary text-on-primary font-bold shadow-md shadow-primary/20'
          : 'border border-border-subtle text-on-surface hover:border-primary hover:bg-primary/5'
      }`}
    >
      {children}
    </button>
  );
}

export default function FilterPanel({ filters, onChange, onReset, geo }) {
  const [expanded, setExpanded] = useState({ price: true, vehicle: true, specs: false, location: false });
  const toggle = (section) => setExpanded((p) => ({ ...p, [section]: !p[section] }));
  const set = (key, val) => onChange({ ...filters, [key]: val });

  const Section = ({ id, label, children }) => (
    <div className="border-b border-border-subtle last:border-0">
      <button onClick={() => toggle(id)} className="w-full flex items-center justify-between py-3 text-label-md font-semibold text-on-surface">
        {label}
        {expanded[id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded[id] && <div className="pb-3">{children}</div>}
    </div>
  );

  const hasFilters = Object.values(filters).some((v) => v !== '' && v !== undefined && v !== null);

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-border-subtle p-lg">
      <div className="flex items-center justify-between mb-3 pb-sm border-b border-border-subtle">
        <h3 className="text-headline-sm font-bold text-on-surface">Filters</h3>
        {hasFilters && (
          <button onClick={onReset} className="flex items-center gap-1 text-label-sm text-primary hover:underline">
            <X className="w-3 h-3" /> Reset All
          </button>
        )}
      </div>

      <Section id="price" label="Price Range">
        <div className="flex gap-2">
          <input type="number" placeholder="Min ₱" value={filters.priceMin || ''} onChange={(e) => set('priceMin', e.target.value)} className={inputCls} />
          <input type="number" placeholder="Max ₱" value={filters.priceMax || ''} onChange={(e) => set('priceMax', e.target.value)} className={inputCls} />
        </div>
      </Section>

      <Section id="vehicle" label="Vehicle">
        <div className="space-y-2">
          <select value={filters.make || ''} onChange={(e) => set('make', e.target.value)} className={inputCls}>
            <option value="">All Makes</option>
            {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="text" placeholder="Model (e.g. Vios)" value={filters.model || ''} onChange={(e) => set('model', e.target.value)} className={inputCls} />
          <div className="flex gap-2">
            <select value={filters.yearMin || ''} onChange={(e) => set('yearMin', e.target.value)} className={inputCls}>
              <option value="">Year From</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={filters.yearMax || ''} onChange={(e) => set('yearMax', e.target.value)} className={inputCls}>
              <option value="">Year To</option>
              {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </Section>

      <Section id="specs" label="Specs & Condition">
        <div className="space-y-3">
          <div>
            <label className="text-label-sm text-on-surface-variant mb-1 block">Fuel Type</label>
            <div className="flex flex-wrap gap-1.5">
              {FUEL_TYPES.map(([val, label]) => (
                <Chip key={val} active={filters.fuelType === val} onClick={() => set('fuelType', filters.fuelType === val ? '' : val)}>{label}</Chip>
              ))}
            </div>
          </div>
          <div>
            <label className="text-label-sm text-on-surface-variant mb-1 block">Transmission</label>
            <div className="flex flex-wrap gap-1.5">
              {TRANSMISSIONS.map(([val, label]) => (
                <Chip key={val} active={filters.transmission === val} onClick={() => set('transmission', filters.transmission === val ? '' : val)}>{label}</Chip>
              ))}
            </div>
          </div>
          <div>
            <label className="text-label-sm text-on-surface-variant mb-1 block">Condition</label>
            <div className="flex flex-wrap gap-1.5">
              {CONDITIONS.map(([val, label]) => (
                <Chip key={val} active={filters.condition === val} onClick={() => set('condition', filters.condition === val ? '' : val)}>{label}</Chip>
              ))}
            </div>
          </div>
          <div>
            <label className="text-label-sm text-on-surface-variant mb-1 block">Mileage (max km)</label>
            <input type="number" placeholder="e.g. 50000" value={filters.mileageMax || ''} onChange={(e) => set('mileageMax', e.target.value)} className={inputCls} />
          </div>
        </div>
      </Section>

      <Section id="location" label="Location & Seller">
        <div className="space-y-2">
          {geo && (
            <div className="space-y-2">
              {!geo.active ? (
                <button
                  onClick={geo.request}
                  disabled={geo.loading || geo.error === 'denied'}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-primary/60 py-2 text-label-sm font-semibold text-primary transition-colors hover:bg-primary/5 disabled:opacity-50"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  {geo.loading ? 'Locating…' : geo.error === 'denied' ? 'Location denied' : 'Use my location'}
                </button>
              ) : (
                <div className="rounded-xl bg-primary/5 p-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-label-sm font-semibold text-primary">
                      <Navigation className="h-3.5 w-3.5" /> Location active
                    </span>
                    <button onClick={geo.clear} className="text-label-sm text-on-surface-variant hover:text-on-surface">Clear</button>
                  </div>
                  <label className="mt-2 block text-label-sm text-on-surface-variant">Radius</label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {RADIUS_OPTIONS.map((r) => (
                      <Chip
                        key={r}
                        active={filters.radius ? filters.radius === String(r) : r === 50}
                        onClick={() => set('radius', filters.radius === String(r) ? '' : String(r))}
                      >
                        {r} km
                      </Chip>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {(!geo || !geo.active) && (
            <select value={filters.location || ''} onChange={(e) => set('location', e.target.value)} className={inputCls}>
              <option value="">All Locations</option>
              {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <div>
            <label className="text-label-sm text-on-surface-variant mb-1 block">Seller Type</label>
            <div className="flex flex-wrap gap-1.5">
              {SELLER_TYPES.map(([val, label]) => (
                <Chip key={val} active={filters.sellerType === val} onClick={() => set('sellerType', filters.sellerType === val ? '' : val)}>{label}</Chip>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
