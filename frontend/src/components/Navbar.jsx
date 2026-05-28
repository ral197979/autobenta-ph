import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Menu, X, Car, Heart, User, LogOut, ChevronDown, Shield } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };
  const isActive = (path) => location.pathname === path;

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <Car className="w-7 h-7 text-primary-600" />
              <span className="text-xl font-bold text-gray-900">AutoBenta<span className="text-primary-600">PH</span></span>
            </Link>
            <div className="hidden md:flex items-center gap-1">
              <Link to="/cars" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/cars') ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Browse Cars</Link>
              <Link to="/sell" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/sell') ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Sell Your Car</Link>
              <Link to="/financing" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/financing') ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Financing</Link>
              <Link to="/inspections" className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${isActive('/inspections') ? 'text-primary-600 bg-primary-50' : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'}`}>Inspections</Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <Link to="/dashboard" className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors">
                  <Heart className="w-4 h-4" /> Favorites
                </Link>
                <div className="relative">
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-md transition-colors">
                    <div className="w-7 h-7 bg-primary-100 rounded-full flex items-center justify-center">
                      <span className="text-primary-700 text-xs font-bold">{user.name?.charAt(0).toUpperCase()}</span>
                    </div>
                    <span className="max-w-24 truncate">{user.name}</span>
                    <ChevronDown className="w-3 h-3" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
                      <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                        <User className="w-4 h-4" /> My Dashboard
                      </Link>
                      {user.role === 'dealer' && (
                        <Link to="/dealer" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Car className="w-4 h-4" /> Dealer Panel
                        </Link>
                      )}
                      {user.role === 'admin' && (
                        <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50">
                          <Shield className="w-4 h-4" /> Admin Panel
                        </Link>
                      )}
                      <div className="border-t border-gray-100 my-1" />
                      <button onClick={() => { setUserMenuOpen(false); handleLogout(); }} className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50">
                        <LogOut className="w-4 h-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link to="/login" className="btn-secondary text-sm">Sign In</Link>
                <Link to="/register" className="btn-primary text-sm">List Your Car</Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2 rounded-md text-gray-600 hover:bg-gray-50" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-3 space-y-1">
          {[['/', 'Home'], ['/cars', 'Browse Cars'], ['/sell', 'Sell Your Car'], ['/financing', 'Financing'], ['/inspections', 'Inspections']].map(([to, label]) => (
            <Link key={to} to={to} onClick={() => setMobileOpen(false)} className="block px-3 py-2 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">{label}</Link>
          ))}
          <div className="border-t border-gray-100 pt-2">
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">My Dashboard</Link>
                {user.role === 'dealer' && <Link to="/dealer" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">Dealer Panel</Link>}
                {user.role === 'admin' && <Link to="/admin" onClick={() => setMobileOpen(false)} className="block px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 rounded-md">Admin Panel</Link>}
                <button onClick={() => { setMobileOpen(false); handleLogout(); }} className="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-md">Sign Out</button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 btn-secondary text-sm text-center">Sign In</Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="flex-1 btn-primary text-sm text-center">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
