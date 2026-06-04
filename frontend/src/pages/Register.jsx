import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ROLES = [
  { value: 'buyer', label: 'Buyer', desc: 'Looking to buy a used car' },
  { value: 'seller', label: 'Private Seller', desc: 'Selling my personal vehicle' },
  { value: 'dealer', label: 'Dealer', desc: 'Running a dealership or car lot' },
];

const inputCls =
  'w-full bg-surface-container border border-border-subtle rounded-xl px-md py-sm text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-on-surface-variant/60';

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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-headline-md font-bold text-primary-container dark:text-primary-fixed-dim">Ryderr</Link>
          <h1 className="text-headline-lg font-headline-lg text-on-surface mt-4">Create an account</h1>
          <p className="text-on-surface-variant text-body-sm mt-1">Join thousands of buyers and sellers</p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-border-subtle p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-error-container/40 border border-error/30 rounded-xl p-3 text-body-sm text-error">{error}</div>}

            <div>
              <label className="block text-label-sm font-medium text-on-surface-variant mb-1">I am a...</label>
              <div className="grid grid-cols-3 gap-2">
                {ROLES.map(r => (
                  <button key={r.value} type="button" onClick={() => set('role', r.value)}
                    className={`p-3 rounded-xl border-2 text-left transition-colors ${form.role === r.value ? 'border-primary bg-primary/5' : 'border-border-subtle hover:border-outline-variant'}`}>
                    <p className={`text-body-sm font-semibold ${form.role === r.value ? 'text-primary' : 'text-on-surface'}`}>{r.label}</p>
                    <p className="text-xs text-on-surface-variant mt-0.5 leading-tight">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-label-sm font-medium text-on-surface-variant mb-1">Full Name</label>
                <input type="text" value={form.name} onChange={e => set('name', e.target.value)} required className={inputCls} placeholder="Juan dela Cruz" />
              </div>
              <div>
                <label className="block text-label-sm font-medium text-on-surface-variant mb-1">Phone (optional)</label>
                <input type="tel" value={form.phone} onChange={e => set('phone', e.target.value)} className={inputCls} placeholder="09XXXXXXXXX" />
              </div>
            </div>

            <div>
              <label className="block text-label-sm font-medium text-on-surface-variant mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => set('email', e.target.value)} required className={inputCls} placeholder="your@email.com" />
            </div>

            <div>
              <label className="block text-label-sm font-medium text-on-surface-variant mb-1">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={form.password} onChange={e => set('password', e.target.value)} required className={`${inputCls} pr-10`} placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-label-sm font-medium text-on-surface-variant mb-1">Confirm Password</label>
              <input type={showPw ? 'text' : 'password'} value={form.confirmPassword} onChange={e => set('confirmPassword', e.target.value)} required className={inputCls} placeholder="Repeat password" />
            </div>

            <button type="submit" disabled={loading} className="w-full bg-primary text-on-primary rounded-xl py-2.5 font-label-md hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50">
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="text-center text-body-sm text-on-surface-variant mt-4">
            Already have an account? <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
