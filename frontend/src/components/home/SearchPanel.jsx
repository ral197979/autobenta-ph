import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, MapPin, Wallet } from 'lucide-react';

const CONDITION_TABS = [
  { label: 'All Cars', value: '' },
  { label: 'Brand New', value: 'brand_new' },
  { label: 'Used', value: 'used' },
];

const QUICK_FILTERS = [
  { label: 'Toyota', query: 'make=Toyota' },
  { label: 'Honda', query: 'make=Honda' },
  { label: 'Mitsubishi', query: 'make=Mitsubishi' },
  { label: 'SUV', query: 'bodyType=SUV' },
  { label: 'Sedan', query: 'bodyType=Sedan' },
  { label: 'Pickup', query: 'bodyType=Pickup' },
];

const BUDGETS = [
  { label: 'Any budget', value: '' },
  { label: 'Under ₱500k', value: '0-500000' },
  { label: '₱500k – ₱800k', value: '500000-800000' },
  { label: '₱800k – ₱1.2M', value: '800000-1200000' },
  { label: '₱1.2M – ₱1.8M', value: '1200000-1800000' },
  { label: '₱1.8M+', value: '1800000-' },
];

export default function SearchPanel() {
  const navigate = useNavigate();
  const [condition, setCondition] = useState('');
  const [keyword, setKeyword] = useState('');
  const [city, setCity] = useState('');
  const [budget, setBudget] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (condition) params.set('condition', condition);
    if (keyword) params.set('search', keyword);
    if (city) params.set('city', city);
    if (budget) {
      const [min, max] = budget.split('-');
      if (min) params.set('minPrice', min);
      if (max) params.set('maxPrice', max);
    }
    navigate(`/cars?${params.toString()}`);
  };

  return (
    <div className="rounded-2xl border border-cardborder bg-white p-5 shadow-xl shadow-ink/5 md:p-6">
      {/* Condition tabs */}
      <div className="mb-4 flex rounded-xl bg-softbg p-1 gap-1">
        {CONDITION_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setCondition(tab.value)}
            className={`flex-1 rounded-lg py-2 text-xs font-semibold transition-colors ${
              condition === tab.value
                ? 'bg-white text-deepblue shadow-sm'
                : 'text-slatetext hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <label className="relative block">
            <span className="mb-1 block text-xs font-semibold text-slatetext">
              Make, model or keyword
            </span>
            <Search className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-slatetext" />
            <input
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="e.g. Toyota Vios"
              className="w-full rounded-xl border border-cardborder bg-softbg py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-slatetext/70 focus:border-electric focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric/20"
            />
          </label>

          <label className="relative block">
            <span className="mb-1 block text-xs font-semibold text-slatetext">
              City / Province
            </span>
            <MapPin className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-slatetext" />
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="e.g. Quezon City"
              className="w-full rounded-xl border border-cardborder bg-softbg py-2.5 pl-9 pr-3 text-sm text-ink placeholder:text-slatetext/70 focus:border-electric focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric/20"
            />
          </label>

          <label className="relative block">
            <span className="mb-1 block text-xs font-semibold text-slatetext">Budget</span>
            <Wallet className="pointer-events-none absolute left-3 top-9 h-4 w-4 text-slatetext" />
            <select
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              className="w-full appearance-none rounded-xl border border-cardborder bg-softbg py-2.5 pl-9 pr-3 text-sm text-ink focus:border-electric focus:bg-white focus:outline-none focus:ring-2 focus:ring-electric/20"
            >
              {BUDGETS.map((b) => (
                <option key={b.label} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-deepblue px-5 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-ink hover:shadow-lg"
        >
          <Search className="h-4 w-4" />
          Search cars
        </button>
      </form>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-slatetext">Popular:</span>
        {QUICK_FILTERS.map((f) => (
          <Link
            key={f.label}
            to={`/cars?${f.query}`}
            className="rounded-full border border-cardborder bg-white px-3 py-1 text-xs font-medium text-ink transition-colors hover:border-electric hover:text-electric"
          >
            {f.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
