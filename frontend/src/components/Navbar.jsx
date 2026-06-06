import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from './ThemeToggle';

const NAV_LINKS = [
  { to: '/new-cars', label: 'New Cars' },
  { to: '/cars', label: 'Used Cars' },
  { to: '/inspection-services', label: 'Ryderr Certified' },
  { to: '/sell', label: 'Sell My Car' },
];

function Icon({ name, className = '' }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    setMobileOpen(false);
    navigate('/');
  };
  const isActive = (path) =>
    path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  return (
    <header className="sticky top-0 z-50 w-full h-16 flex justify-between items-center px-gutter-mobile md:px-gutter-desktop bg-surface/90 backdrop-blur-md border-b border-border-subtle">
      {/* Left: mobile menu + wordmark */}
      <div className="flex items-center gap-4">
        <button
          className="md:hidden p-2 text-on-surface-variant hover:bg-surface-container-low transition-colors rounded-lg"
          onClick={() => setMobileOpen((o) => !o)}
          aria-label="Toggle menu"
        >
          <Icon name={mobileOpen ? 'close' : 'menu'} />
        </button>
        <Link
          to="/"
          className="text-headline-md font-bold text-primary-container dark:text-primary-fixed-dim"
        >
          Ryderr
        </Link>
      </div>

      {/* Center: primary nav */}
      <nav className="hidden md:flex items-center gap-xl">
        {NAV_LINKS.map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className={
              isActive(to)
                ? 'text-primary dark:text-tertiary-fixed-dim font-bold text-label-md transition-all active:opacity-80 active:scale-95'
                : 'text-on-surface-variant dark:text-on-secondary-fixed-variant hover:bg-surface-container-low transition-colors text-label-md px-2 py-1 rounded'
            }
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Right: search + theme + account */}
      <div className="flex items-center gap-md">
        <button
          onClick={() => navigate('/cars')}
          className="hidden md:flex items-center justify-center p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors"
          aria-label="Search"
        >
          <Icon name="search" />
        </button>
        <ThemeToggle />
        {user && (
          <Link
            to="/notifications"
            className="hidden md:flex items-center justify-center p-2 rounded-full text-on-surface-variant hover:bg-surface-container-low transition-colors"
            aria-label="Notifications"
          >
            <Icon name="notifications" />
          </Link>
        )}

        {user ? (
          <div className="relative">
            <button
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-2"
              aria-label="Account menu"
            >
              <span className="w-10 h-10 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-bold border border-outline-variant">
                {user.name?.charAt(0).toUpperCase() || 'U'}
              </span>
            </button>
            {userMenuOpen && (
              <div className="absolute right-0 z-50 mt-2 w-52 rounded-xl border border-border-subtle bg-surface-container-lowest py-1 shadow-lg">
                <Link to="/dashboard" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container-low">
                  <Icon name="dashboard" className="text-base" /> My Dashboard
                </Link>
                <Link to="/saved" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container-low">
                  <Icon name="favorite" className="text-base" /> Saved Vehicles
                </Link>
                <Link to="/inquiries" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container-low">
                  <Icon name="forum" className="text-base" /> Inquiries
                </Link>
                <Link to="/offers" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container-low">
                  <Icon name="local_offer" className="text-base" /> Offers
                </Link>
                <Link to="/account" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container-low">
                  <Icon name="settings" className="text-base" /> Account Settings
                </Link>
                {['seller', 'dealer'].includes(user.role) && (
                  <Link to="/verification" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container-low">
                    <Icon name="verified_user" className="text-base" /> Get Verified
                  </Link>
                )}
                {user.role === 'dealer' && (
                  <Link to="/dealer" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container-low">
                    <Icon name="storefront" className="text-base" /> Dealer Panel
                  </Link>
                )}
                {user.role === 'admin' && (
                  <Link to="/admin" onClick={() => setUserMenuOpen(false)} className="flex items-center gap-2 px-4 py-2 text-body-sm text-on-surface hover:bg-surface-container-low">
                    <Icon name="shield" className="text-base" /> Admin Panel
                  </Link>
                )}
                <div className="my-1 border-t border-border-subtle" />
                <button onClick={handleLogout} className="flex w-full items-center gap-2 px-4 py-2 text-body-sm text-error hover:bg-error-container/40">
                  <Icon name="logout" className="text-base" /> Sign Out
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="hidden md:flex items-center gap-sm">
            <Link to="/login" className="px-3 py-2 rounded-lg text-label-md text-on-surface hover:bg-surface-container-low transition-colors">
              Sign in
            </Link>
            <Link to="/sell" className="bg-primary text-on-primary px-lg py-sm rounded-lg text-label-md hover:opacity-90 transition-all active:scale-95">
              List your car
            </Link>
          </div>
        )}
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="absolute top-16 left-0 right-0 md:hidden bg-surface border-b border-border-subtle px-gutter-mobile py-md space-y-1 shadow-lg">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              className={`block rounded-lg px-3 py-2 text-label-md ${
                isActive(to)
                  ? 'text-primary dark:text-tertiary-fixed-dim font-bold'
                  : 'text-on-surface-variant hover:bg-surface-container-low'
              }`}
            >
              {label}
            </Link>
          ))}
          {!user && (
            <div className="flex gap-sm pt-2 border-t border-border-subtle mt-2">
              <Link to="/login" onClick={() => setMobileOpen(false)} className="flex-1 rounded-lg border border-outline-variant px-3 py-2 text-center text-label-md text-on-surface">
                Sign in
              </Link>
              <Link to="/sell" onClick={() => setMobileOpen(false)} className="flex-1 rounded-lg bg-primary text-on-primary px-3 py-2 text-center text-label-md">
                List your car
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
