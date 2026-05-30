import { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { CreditCard, Calculator, CheckCircle, FileCheck } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import { formatPrice } from '../utils/format';
import { useAuth } from '../context/AuthContext';

const INCOME_OPTIONS = [
  { value: 'under_30k', label: 'Under ₱30,000/month', rate: 9.5 },
  { value: '30k_50k', label: '₱30,000 – ₱50,000/month', rate: 8.5 },
  { value: '50k_100k', label: '₱50,000 – ₱100,000/month', rate: 7.5 },
  { value: '100k_above', label: 'Above ₱100,000/month', rate: 6.5 },
];

const TERMS = [24, 36, 48, 60, 72];

export default function Financing() {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    vehiclePrice: searchParams.get('price') || '',
    downPayment: '',
    termMonths: 60,
    incomeRange: '50k_100k',
    employmentType: 'employed',
    listingId: searchParams.get('listingId') || '',
  });
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);

  const { data: listing } = useQuery({
    queryKey: ['listing-brief', form.listingId],
    queryFn: () => api.get(`/listings/${form.listingId}`).then(r => r.data),
    enabled: !!form.listingId,
  });

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const calculate = async () => {
    if (!form.vehiclePrice || !form.downPayment) return;
    setLoading(true);
    try {
      const { data } = await api.post('/financing/calculate', {
        vehiclePrice: form.vehiclePrice,
        downPayment: form.downPayment,
        termMonths: form.termMonths,
        incomeRange: form.incomeRange,
      });
      setEstimate(data);
    } catch {
      alert('Failed to calculate');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return navigate('/login');
    if (!form.listingId) return alert('Please select a car listing first');
    if (!estimate) return alert('Please calculate first');
    setLoading(true);
    try {
      await api.post('/financing/request', {
        ...form,
        vehiclePrice: parseFloat(form.vehiclePrice),
        downPayment: parseFloat(form.downPayment),
        termMonths: parseInt(form.termMonths),
      });
      setSubmitted(true);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to submit financing request');
    } finally {
      setLoading(false);
    }
  };

  const dpPercent = form.vehiclePrice && form.downPayment
    ? Math.round((parseFloat(form.downPayment) / parseFloat(form.vehiclePrice)) * 100)
    : 0;

  if (submitted) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
      <h1 className="text-2xl font-bold mb-2">Financing Request Submitted!</h1>
      <p className="text-gray-500 mb-6">Our financing team will review your application and contact you within 24 hours.</p>
      <div className="flex gap-3 justify-center flex-wrap mb-6">
        <Link to="/dashboard" className="btn-primary">View My Requests</Link>
        <Link to="/cars" className="btn-secondary">Browse More Cars</Link>
      </div>
      {form.listingId && (
        <Link
          to={`/ownership-transfer?listingId=${form.listingId}`}
          className="inline-flex items-center gap-2 rounded-xl border border-deepblue/30 bg-blue-50 px-5 py-3 text-sm font-semibold text-deepblue transition-colors hover:bg-blue-100"
        >
          <FileCheck className="w-4 h-4" />
          Review LTO transfer steps for this vehicle
        </Link>
      )}
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <CreditCard className="w-7 h-7 text-primary-600" />
        <div>
          <h1 className="text-2xl font-bold">Car Financing Calculator</h1>
          <p className="text-sm text-gray-500">Estimate your monthly payment and apply for financing</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Calculator Form */}
        <div className="card p-6 space-y-5">
          <h2 className="font-bold text-lg">Loan Calculator</h2>

          {listing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center gap-3">
              <div className="w-14 h-10 rounded overflow-hidden bg-gray-200 shrink-0">
                <img src={listing.photos?.[0]?.url || ''} alt="" className="w-full h-full object-cover" />
              </div>
              <div>
                <p className="text-sm font-medium text-blue-900">{listing.year} {listing.make} {listing.model}</p>
                <p className="text-xs text-blue-600">{formatPrice(listing.price)}</p>
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vehicle Price (₱)</label>
            <input type="number" value={form.vehiclePrice} onChange={e => set('vehiclePrice', e.target.value)} className="input" placeholder="e.g. 800000" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Down Payment (₱){dpPercent > 0 && <span className="text-gray-400 ml-1">({dpPercent}%)</span>}</label>
            <input type="number" value={form.downPayment} onChange={e => set('downPayment', e.target.value)} className="input" placeholder="e.g. 160000 (20%)" />
            <div className="flex gap-2 mt-2">
              {[20, 30, 40, 50].map(pct => (
                <button key={pct} type="button" onClick={() => set('downPayment', Math.round(parseFloat(form.vehiclePrice || 0) * pct / 100))}
                  className="text-xs bg-gray-100 hover:bg-gray-200 px-2.5 py-1 rounded-full">{pct}%</button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Loan Term</label>
            <div className="flex gap-2">
              {TERMS.map(t => (
                <button key={t} type="button" onClick={() => set('termMonths', t)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${form.termMonths === t ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}>
                  {t}mo
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Monthly Gross Income</label>
            <select value={form.incomeRange} onChange={e => set('incomeRange', e.target.value)} className="input">
              {INCOME_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label} (est. {o.rate}% p.a.)</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
            <select value={form.employmentType} onChange={e => set('employmentType', e.target.value)} className="input">
              {[['employed', 'Employed (Regular)'], ['self_employed', 'Self-Employed / Business Owner'], ['ofw', 'OFW'], ['professional', 'Professional (Doctor, Lawyer, etc.)']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>

          <button onClick={calculate} disabled={loading || !form.vehiclePrice || !form.downPayment} className="w-full btn-primary flex items-center justify-center gap-2">
            <Calculator className="w-4 h-4" /> {loading ? 'Calculating...' : 'Calculate Payment'}
          </button>
        </div>

        {/* Results */}
        <div className="space-y-4">
          {estimate ? (
            <>
              <div className="card p-6 bg-gradient-to-br from-primary-50 to-blue-50 border-primary-200">
                <h3 className="font-bold text-lg text-primary-900 mb-5">Estimated Financing</h3>
                <div className="text-center mb-5">
                  <p className="text-5xl font-bold text-primary-700">{formatPrice(estimate.estimatedMonthly)}</p>
                  <p className="text-gray-500 mt-1">per month for {form.termMonths} months</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {[
                    ['Loan Amount', formatPrice(estimate.loanAmount)],
                    ['Down Payment', formatPrice(form.downPayment)],
                    ['Interest Rate', `${estimate.estimatedRate}% p.a.`],
                    ['Total Payment', formatPrice(estimate.totalPayment)],
                    ['Total Interest', formatPrice(estimate.totalInterest)],
                    ['Term', `${form.termMonths} months`],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-white/70 rounded-lg p-3">
                      <p className="text-gray-500 text-xs">{label}</p>
                      <p className="font-bold text-gray-900">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="card p-5 bg-yellow-50 border-yellow-200">
                <p className="text-xs text-yellow-800">⚠️ This is an estimate only. Actual rates depend on credit evaluation, lender terms, and vehicle appraisal. Rates shown are indicative bank financing rates in the Philippines.</p>
              </div>

              {form.listingId && (
                <button onClick={handleSubmit} disabled={loading} className="w-full btn-primary py-3 text-base">
                  {loading ? 'Submitting...' : 'Submit Financing Application'}
                </button>
              )}
              {!form.listingId && (
                <div className="card p-4 text-center text-sm text-gray-500">
                  Browse a specific car to submit a financing application.
                  <Link to="/cars" className="text-primary-600 hover:underline ml-1">Browse Cars →</Link>
                </div>
              )}
            </>
          ) : (
            <div className="card p-8 text-center text-gray-400 flex flex-col items-center gap-3">
              <Calculator className="w-12 h-12 opacity-30" />
              <p>Fill in the form and click "Calculate" to see your estimated monthly payment.</p>
              <div className="grid grid-cols-2 gap-3 w-full mt-4 text-left text-xs text-gray-500">
                {[['✅', 'Low interest rates from 6.5% p.a.'], ['✅', 'Terms up to 72 months'], ['✅', 'Pre-qualification in 24 hrs'], ['✅', 'Partner banks across PH']].map(([icon, text]) => (
                  <div key={text} className="flex items-start gap-1.5">{icon} {text}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
