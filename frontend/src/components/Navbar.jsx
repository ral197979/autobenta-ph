import { useEffect, useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Menu,
  X,
  Heart,
  User,
  LogOut,
  ChevronDown,
  Shield,
  Car,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

function Logo() {
  return (
    <Link to="/" className="flex items-center gap-2">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink text-accent shadow-md">
        <Car className="h-4 w-4" />
      </span>
      <span className="text-lg font-bold tracking-tight text-ink">
        AutoBenta<span className="text-deepblue">PH</span>
      </span>
    </Link>
  );
}

const NAV_LINKS = [
  { to: '/cars', label: 'Browse cars' },
  { to: '/financing', label: 'Car value' },
  { to: '/inspections', label: 'Inspections' },
  { to: '/#how-it-works', label: 'How it works' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };
  const isActive = (path) => location.pathname === path;

  return (
    <nav
      className={`sticky top-0 z-50 transition-all duration-200 ${
        scrolled
          ? 'border-b border-cardborder bg-white/85 backdrop-blur-md shadow-sm'
          : 'border-b border-transparent bg-white'
      }`}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <Logo />
            <div className="hidden items-center gap-1 md:flex">
              {NAV_LINKS.map(({ to, label }) => (
                <Link
                  key={to}
                  to={to}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    isActive(to)
                      ? 'text-deepblue'
                      : 'text-slatetext hover:text-ink'
                  }`}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  className="flex items-center gap-1.5 rounded-md px-3 py-2 text-sm text-slatetext transition-colors hover:bg-softbg hover:text-ink"
                >
                  <Heart className="h-4 w-4" /> Favorites
                </Link>
                <div className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-ink transition-colors hover:bg-softbg"
                  >
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-deepblue text-white">
                      <span className="text-xs font-bold">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="max-w-24 truncate">{user.name}</span>
                    <ChevronDown className="h-3 w-3" />
                  </button>
                  {userMenuOpen && (
                    <div className="absolute right-0 z-50 mt-1 w-48 rounded-lg border border-cardborder bg-white py-1 shadow-lg">
                      <Link
                        to="/dashboard"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-softbg"
                      >
                        <User className="h-4 w-4" /> My Dashboard
                      </Link>
                      {user.role === 'dealer' && (
                        <Link
                          to="/dealer"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-softbg"
                        >
                          <Car className="h-4 w-4" /> Dealer Panel
                        </Link>
                      )}
                      {user.role === 'admin' && (
                        <Link
                          to="/admin"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-ink hover:bg-softbg"
                        >
                          <Shield className="h-4 w-4" /> Admin Panel
                        </Link>
                      )}
                      <div className="my-1 border-t border-cardborder" />
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" /> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className="rounded-lg px-3 py-2 text-sm font-semibold text-ink transition-colors hover:bg-softbg"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  className="rounded-lg bg-deepblue px-4 py-2 text-sm font-semibold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-ink hover:shadow-md"
                >
                  List your car
                </Link>
              </>
            )}
          </div>

          <button
            className="rounded-md p-2 text-ink hover:bg-softbg md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="space-y-1 border-t border-cardborder bg-white px-4 py-3 md:hidden">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className="block rounded-md px-3 py-2 text-sm font-medium text-ink hover:bg-softbg"
            >
              {label}
            </Link>
          ))}
          <div className="border-t border-cardborder pt-2">
            {user ? (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-md px-3 py-2 text-sm text-ink hover:bg-softbg"
                >
                  My Dashboard
                </Link>
                {user.role === 'dealer' && (
                  <Link
                    to="/dealer"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm text-ink hover:bg-softbg"
                  >
                    Dealer Panel
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link
                    to="/admin"
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-md px-3 py-2 text-sm text-ink hover:bg-softbg"
                  >
                    Admin Panel
                  </Link>
                )}
                <button
                  onClick={() => {
                    setMobileOpen(false);
                    handleLogout();
                  }}
                  className="block w-full rounded-md px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <div className="flex gap-2">
                <Link
                  to="/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg border border-cardborder px-3 py-2 text-center text-sm font-semibold text-ink"
                >
                  Sign in
                </Link>
                <Link
                  to="/register"
                  onClick={() => setMobileOpen(false)}
                  className="flex-1 rounded-lg bg-deepblue px-3 py-2 text-center text-sm font-semibold text-white"
                >
                  List your car
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
