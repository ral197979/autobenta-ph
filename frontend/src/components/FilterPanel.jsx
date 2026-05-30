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

export default function FilterPanel({ filters, onChange, onReset, geo }) {
  const [expanded, setExpanded] = useState({ price: true, vehicle: true, specs: false, location: false });

  const toggle = (section) => setExpanded(p => ({ ...p, [section]: !p[section] }));
  const set = (key, val) => onChange({ ...filters, [key]: val });

  const Section = ({ id, label, children }) => (
    <div className="border-b border-gray-100 last:border-0">
      <button onClick={() => toggle(id)} className="w-full flex items-center justify-between py-3 text-sm font-semibold text-gray-700">
        {label}
        {expanded[id] ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      {expanded[id] && <div className="pb-3">{children}</div>}
    </div>
  );

  const hasFilters = Object.values(filters).some(v => v !== '' && v !== undefined && v !== null);

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-bold text-gray-900">Filters</h3>
        {hasFilters && (
          <button onClick={onReset} className="flex items-center gap-1 text-xs text-primary-600 hover:text-primary-800">
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      <Section id="price" label="Price Range">
        <div className="flex gap-2">
          <input type="number" placeholder="Min ₱" value={filters.priceMin || ''} onChange={e => set('priceMin', e.target.value)} className="input text-sm" />
          <input type="number" placeholder="Max ₱" value={filters.priceMax || ''} onChange={e => set('priceMax', e.target.value)} className="input text-sm" />
        </div>
      </Section>

      <Section id="vehicle" label="Vehicle">
        <div className="space-y-2">
          <select value={filters.make || ''} onChange={e => set('make', e.target.value)} className="input text-sm">
            <option value="">All Makes</option>
            {MAKES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
          <input type="text" placeholder="Model (e.g. Vios)" value={filters.model || ''} onChange={e => set('model', e.target.value)} className="input text-sm" />
          <div className="flex gap-2">
            <select value={filters.yearMin || ''} onChange={e => set('yearMin', e.target.value)} className="input text-sm">
              <option value="">Year From</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
            <select value={filters.yearMax || ''} onChange={e => set('yearMax', e.target.value)} className="input text-sm">
              <option value="">Year To</option>
              {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>
        </div>
      </Section>

      <Section id="specs" label="Specs & Condition">
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Fuel Type</label>
            <div className="flex flex-wrap gap-1.5">
              {FUEL_TYPES.map(([val, label]) => (
                <button key={val} onClick={() => set('fuelType', filters.fuelType === val ? '' : val)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${filters.fuelType === val ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Transmission</label>
            <div className="flex gap-1.5">
              {TRANSMISSIONS.map(([val, label]) => (
                <button key={val} onClick={() => set('transmission', filters.transmission === val ? '' : val)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${filters.transmission === val ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Condition</label>
            <div className="flex flex-wrap gap-1.5">
              {CONDITIONS.map(([val, label]) => (
                <button key={val} onClick={() => set('condition', filters.condition === val ? '' : val)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${filters.condition === val ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Mileage (max km)</label>
            <input type="number" placeholder="e.g. 50000" value={filters.mileageMax || ''} onChange={e => set('mileageMax', e.target.value)} className="input text-sm" />
          </div>
        </div>
      </Section>

      <Section id="location" label="Location & Seller">
        <div className="space-y-2">
          {/* Near me toggle */}
          {geo && (
            <div className="space-y-2">
              {!geo.active ? (
                <button
                  onClick={geo.request}
                  disabled={geo.loading || geo.error === 'denied'}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-primary-400 py-2 text-xs font-semibold text-primary-600 transition-colors hover:bg-primary-50 disabled:opacity-50"
                >
                  <Navigation className="h-3.5 w-3.5" />
                  {geo.loading ? 'Locating…' : geo.error === 'denied' ? 'Location denied' : 'Use my location'}
                </button>
              ) : (
                <div className="rounded-lg bg-primary-50 p-2">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1 text-xs font-semibold text-primary-700">
                      <Navigation className="h-3.5 w-3.5" /> Location active
                    </span>
                    <button onClick={geo.clear} className="text-xs text-gray-400 hover:text-gray-600">Clear</button>
                  </div>
                  <label className="mt-2 block text-xs text-gray-500">Radius</label>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {RADIUS_OPTIONS.map((r) => (
                      <button
                        key={r}
                        onClick={() => set('radius', filters.radius === String(r) ? '' : String(r))}
                        className={`rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
                          (filters.radius ? filters.radius === String(r) : r === 50)
                            ? 'bg-primary-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {r} km
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          {/* City text filter (hidden when near-me is active) */}
          {(!geo || !geo.active) && (
            <select value={filters.location || ''} onChange={e => set('location', e.target.value)} className="input text-sm">
              <option value="">All Locations</option>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          )}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Seller Type</label>
            <div className="flex flex-wrap gap-1.5">
              {SELLER_TYPES.map(([val, label]) => (
                <button key={val} onClick={() => set('sellerType', filters.sellerType === val ? '' : val)}
                  className={`px-2.5 py-1 rounded-full text-xs font-medium transition-colors ${filters.sellerType === val ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </Section>
    </div>
  );
}
