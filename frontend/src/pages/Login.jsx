import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

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
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Car className="w-8 h-8 text-primary-600" />
            <span className="text-2xl font-bold">AutoBenta<span className="text-primary-600">PH</span></span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back</h1>
          <p className="text-gray-500 text-sm mt-1">Sign in to your account</p>
        </div>

        <div className="card p-6 space-y-4">
          {/* Demo credentials */}
          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
            <p className="text-xs font-semibold text-blue-700 mb-2">Demo Accounts</p>
            <div className="flex flex-wrap gap-1.5">
              {['admin', 'dealer', 'buyer', 'seller'].map(role => (
                <button key={role} onClick={() => fillDemo(role)} className="text-xs bg-white border border-blue-200 text-blue-700 px-2.5 py-1 rounded-full hover:bg-blue-100 capitalize">{role}</button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">{error}</div>}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="input" placeholder="your@email.com" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} required className="input pr-10" placeholder="••••••••" />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full btn-primary py-2.5">
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-500">
            Don't have an account? <Link to="/register" className="text-primary-600 hover:text-primary-800 font-medium">Create one</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
