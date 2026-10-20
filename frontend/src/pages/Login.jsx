import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const inputCls =
  'w-full bg-surface-container border border-border-subtle rounded-xl px-md py-sm text-body-md text-on-surface focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all placeholder-on-surface-variant/60';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const user = await login(email, password);
      navigate(user.role === 'admin' ? '/admin' : user.role === 'dealer' ? '/dealer' : from, { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (role) => {
    const creds = {
      admin: { email: 'admin@autobenta.ph', password: 'admin123' },
      dealer: { email: 'dealer@lto-motors.ph', password: 'dealer123' },
      buyer: { email: 'juan@example.com', password: 'buyer123' },
      seller: { email: 'carlo@example.com', password: 'seller123' },
    };
    if (creds[role]) { setEmail(creds[role].email); setPassword(creds[role].password); }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-background">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="text-headline-md font-bold text-primary-container dark:text-primary-fixed-dim">Ryderr</Link>
          <h1 className="text-headline-lg font-headline-lg text-on-surface mt-4">Welcome back</h1>
          <p className="text-on-surface-variant text-body-sm mt-1">Sign in to your account</p>
        </div>

        <div className="bg-surface-container-lowest rounded-2xl border border-border-subtle p-6 space-y-4">
          {/* Demo credentials */}
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3">
            <p className="text-label-sm font-semibold text-primary mb-2">Demo Accounts</p>
            <div className="flex flex-wrap gap-1.5">
              {['admin', 'dealer', 'buyer', 'seller'].map(role => (
                <button key={role} onClick={() => fillDemo(role)} className="text-xs bg-surface-container-lowest border border-primary/30 text-primary px-2.5 py-1 rounded-full hover:bg-primary/10 capitalize transition-colors">{role}</button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-error-container/40 border border-error/30 rounded-xl p-3 text-body-sm text-error">{error}</div>}

            <div>
              <label htmlFor="login-email" className="block text-label-sm font-medium text-on-surface-variant mb-1">Email</label>
              <input id="login-email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputCls} placeholder="your@email.com" />
            </div>

            <div>
              <label htmlFor="login-password" className="block text-label-sm font-medium text-on-surface-variant mb-1">Password</label>
              <div className="relative">
                <input id="login-password" type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required className={`${inputCls} pr-10`} placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)} aria-label={showPw ? 'Hide password' : 'Show password'} className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-primary text-on-primary rounded-xl py-2.5 font-label-md hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-body-sm text-on-surface-variant">
            Don't have an account? <Link to="/register" className="text-primary hover:underline font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
