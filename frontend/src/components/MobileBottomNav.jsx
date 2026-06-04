import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ITEMS = [
  { to: '/', icon: 'home', label: 'Home', match: (p) => p === '/' },
  { to: '/cars', icon: 'search', label: 'Search', match: (p) => p.startsWith('/cars') },
  { to: '/sell', icon: 'add_circle', label: 'Sell', match: (p) => p.startsWith('/sell') },
  { to: '/saved', icon: 'favorite', label: 'Saved', match: (p) => p.startsWith('/saved') },
];

export default function MobileBottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const accountTo = user ? '/dashboard' : '/login';
  const items = [...ITEMS, { to: accountTo, icon: 'person', label: 'Account', match: (p) => p.startsWith('/login') || p.startsWith('/register') }];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 py-2 bg-surface border-t border-border-subtle shadow-lg md:hidden">
      {items.map((it) => {
        const active = it.match(location.pathname);
        return (
          <Link
            key={it.label}
            to={it.to}
            className={`flex flex-col items-center justify-center p-2 rounded-lg transition-all ${
              active ? 'text-primary dark:text-tertiary-fixed-dim font-semibold scale-110' : 'text-on-surface-variant hover:bg-surface-container-high'
            }`}
          >
            <span className="material-symbols-outlined" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>{it.icon}</span>
            <span className="text-label-sm font-label-sm">{it.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
