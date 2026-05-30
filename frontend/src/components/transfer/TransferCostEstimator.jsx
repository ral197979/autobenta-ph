import { useState } from 'react';
import { Calculator, Info } from 'lucide-react';

const VEHICLE_TYPES = [
  { value: 'motorcycle', label: 'Motorcycle' },
  { value: 'car', label: 'Car / SUV' },
  { value: 'truck', label: 'Truck / Commercial' },
];

const REGIONS = [
  { value: 'metro_manila', label: 'Metro Manila' },
  { value: 'luzon', label: 'Luzon (outside Metro Manila)' },
  { value: 'visayas', label: 'Visayas' },
  { value: 'mindanao', label: 'Mindanao' },
];

const SALE_TYPES = [
  { value: 'private', label: 'Private Sale' },
  { value: 'dealer', label: 'Dealer Sale' },
];

function computeFees({ vehicleType, region, saleType, vehiclePrice, needsHpg }) {
  const price = parseFloat(vehiclePrice) || 0;

  const base = {
    motorcycle: { transfer: 200, registration: 650 },
    car: { transfer: 300, registration: 1200 },
    truck: { transfer: 500, registration: 2000 },
  }[vehicleType] || { transfer: 300, registration: 1200 };

  const regionMultiplier = region === 'metro_manila' ? 1.15 : 1.0;

  const transferFee = Math.round(base.transfer * regionMultiplier);
  const registrationFee = Math.round(base.registration * regionMultiplier);
  const emissionsFee = vehicleType === 'motorcycle' ? 250 : 400;
  const notarizationFee = saleType === 'private' ? 1000 : 500;
  const hpgFee = needsHpg ? 400 : 0;
  const tplInsurance = vehicleType === 'motorcycle' ? 350 : 600;

  const comprehensiveMin = price > 0 ? Math.round(price * 0.015) : 8000;
  const comprehensiveMax = price > 0 ? Math.round(price * 0.025) : 15000;

  const govtTotal = transferFee + registrationFee + emissionsFee + (needsHpg ? hpgFee : 0);
  const servicesTotal = notarizationFee + tplInsurance;
  const totalMin = govtTotal + servicesTotal + comprehensiveMin;
  const totalMax = govtTotal + servicesTotal + comprehensiveMax;

  return {
    rows: [
      { label: 'LTO Transfer Fee', amount: `₱${transferFee.toLocaleString()}`, category: 'govt' },
      { label: 'Vehicle Registration Fee', amount: `₱${registrationFee.toLocaleString()}`, category: 'govt' },
      { label: 'Emission Test (PETC)', amount: `₱${emissionsFee.toLocaleString()}`, category: 'govt' },
      needsHpg && { label: 'HPG Vehicle Clearance', amount: `₱${hpgFee.toLocaleString()}`, category: 'govt' },
      { label: 'Deed of Sale Notarization', amount: `₱${notarizationFee.toLocaleString()}`, category: 'service' },
      { label: 'CTPL Insurance (minimum)', amount: `₱${tplInsurance.toLocaleString()}`, category: 'insurance' },
      { label: 'Comprehensive Insurance', amount: `₱${comprehensiveMin.toLocaleString()} – ₱${comprehensiveMax.toLocaleString()}`, category: 'insurance' },
    ].filter(Boolean),
    totalMin,
    totalMax,
  };
}

export default function TransferCostEstimator() {
  const [form, setForm] = useState({
    vehicleType: 'car',
    region: 'metro_manila',
    saleType: 'private',
    vehiclePrice: '',
    needsHpg: false,
  });
  const [computed, setComputed] = useState(null);

  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleCompute = () => {
    setComputed(computeFees(form));
  };

  const categoryColors = {
    govt: 'text-deepblue',
    service: 'text-slatetext',
    insurance: 'text-emerald-700',
  };

  const categoryLabels = {
    govt: 'Government',
    service: 'Services',
    insurance: 'Insurance',
  };

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Inputs */}
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slatetext">
            Vehicle Type
          </label>
          <div className="grid grid-cols-3 gap-2">
            {VEHICLE_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => set('vehicleType', value)}
                className={`rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
                  form.vehicleType === value
                    ? 'border-deepblue bg-deepblue text-white'
                    : 'border-cardborder bg-white text-slatetext hover:border-deepblue/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slatetext">
            Region
          </label>
          <select
            value={form.region}
            onChange={(e) => set('region', e.target.value)}
            className="input"
          >
            {REGIONS.map(({ value, label }) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slatetext">
            Sale Type
          </label>
          <div className="grid grid-cols-2 gap-2">
            {SALE_TYPES.map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => set('saleType', value)}
                className={`rounded-lg border py-2.5 text-sm font-semibold transition-colors ${
                  form.saleType === value
                    ? 'border-deepblue bg-deepblue text-white'
                    : 'border-cardborder bg-white text-slatetext hover:border-deepblue/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slatetext">
            Vehicle Purchase Price (₱)
          </label>
          <input
            type="number"
            placeholder="e.g. 800000"
            value={form.vehiclePrice}
            onChange={(e) => set('vehiclePrice', e.target.value)}
            className="input"
          />
          <p className="mt-1 text-[11px] text-slatetext/70">Used to estimate comprehensive insurance cost.</p>
        </div>

        <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-cardborder bg-softbg px-4 py-3">
          <input
            type="checkbox"
            checked={form.needsHpg}
            onChange={(e) => set('needsHpg', e.target.checked)}
            className="h-4 w-4 rounded accent-deepblue"
          />
          <div>
            <p className="text-sm font-semibold text-ink">Requires HPG Clearance</p>
            <p className="text-xs text-slatetext">400cc+ displacement or for-hire vehicles</p>
          </div>
        </label>

        <button
          type="button"
          onClick={handleCompute}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-deepblue py-3 text-sm font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-ink hover:shadow-md"
        >
          <Calculator className="h-4 w-4" />
          Estimate Transfer Cost
        </button>
      </div>

      {/* Output */}
      <div>
        {computed ? (
          <div className="rounded-2xl border border-cardborder bg-white overflow-hidden">
            <div className="bg-ink px-5 py-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-white/50">Estimated Breakdown</p>
              <p className="mt-1 text-2xl font-bold text-white">
                ₱{computed.totalMin.toLocaleString()} – ₱{computed.totalMax.toLocaleString()}
              </p>
              <p className="text-xs text-white/50 mt-0.5">Total estimated transfer cost</p>
            </div>
            <div className="p-5 space-y-3">
              {computed.rows.map((row) => (
                <div key={row.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${categoryColors[row.category]}`}>
                      {categoryLabels[row.category]}
                    </span>
                    <span className="text-ink">{row.label}</span>
                  </div>
                  <span className="font-semibold text-ink tabular-nums">{row.amount}</span>
                </div>
              ))}
            </div>
            <div className="border-t border-cardborder bg-softbg px-5 py-3">
              <div className="flex items-start gap-2 text-xs text-slatetext">
                <Info className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                Estimates only. Actual fees may vary by LTO district and vehicle classification. Verify current rates at your local LTO office.
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full min-h-64 items-center justify-center rounded-2xl border-2 border-dashed border-cardborder">
            <div className="text-center">
              <Calculator className="mx-auto h-10 w-10 text-cardborder mb-3" />
              <p className="text-sm font-semibold text-slatetext">Fill in details to estimate</p>
              <p className="text-xs text-slatetext/70 mt-1">Your breakdown will appear here</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
