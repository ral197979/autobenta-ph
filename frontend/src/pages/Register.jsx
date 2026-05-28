import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'buyer', label: 'Buyer', desc: 'Looking to buy a used car' },
  { value: 'seller', label: 'Private Seller', desc: 'Selling my personal vehicle' },
  { value: 'dealer', label: 'Dealer', desc: 'Running a dealership or car lot' },
];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '', role: 'buyer' });
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const set = (k, v) => setForm(p => ({ ...p, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirmPassword) return setError('Passwords do not match');
    if (form.password.length < 6) return setError('Password must be at least 6 characters');
    setLoading(true);
    try {
      const user = await register({ name: form.name, email: form.email, phone: form.phone, password: form.password, role: form.role });
      navigate(user.role === 'dealer' ? '/dealer' : '/dashboard', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Car className="w-8 h-8 text-primary-600" />
            <span className="text-2xl font-bold">AutoBenta<span className="text-primary-600">PH</span></span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Create an account</h1>
          <p className="text-gray-500 text-sm mt-1">Join thousands of buyers and sellers</p>
        </div>

        <div className="card p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">I am a...</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button key={r.value} type="button" onClick={() => set('role', r.value)}
                    className={`p-3 rounded-lg border-2 text-left transition-colors ${form.role === r.value ? 'border-primary-600 bg-primary-50' : 'border-gray-200 hover:border-gray-300'}`}>
                    <p className={`text-sm font-semibold ${form.role === r.value ? 'text-primary-700' : 'text-gray-800'}`}>{r.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5 leading-tight">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required className="input" placeholder="Juan dela Cruz" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className="input" placeholder="09XXXXXXXXX" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => set(  'email', e.target.value)} required className="input" placeholder="your@email.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} required className="input pr-10" placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <input type={showPw ? 'text' : 'password'} value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required className="input" placeholder="Repeat password" />
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-2.5">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-4">
            Already have an account? <Link to="/login" className="text-primary-600 hover:text-primary-800 font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
