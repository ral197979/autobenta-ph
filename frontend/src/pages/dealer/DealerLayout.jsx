import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Building2, LayoutDashboard, Users, Car, BarChart2, Settings,
  CreditCard, Plus, ChevronRight, BadgeCheck, Crown, Star, Plug,
} from 'lucide-react';
import api from '../../api/client';
import { useAuth } from '../../context/AuthContext';
import TrialBanner from '../../components/dealer/TrialBanner';

const NAV = [
  { to: '/dealer', end: true, icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/dealer/leads', icon: Users, label: 'Leads' },
  { to: '/dealer/listings', icon: Car, label: 'Listings' },
  { to: '/dealer/analytics', icon: BarChart2, label: 'Analytics' },
  { to: '/dealer/customers', icon: Users, label: 'Customers' },
  { to: '/dealer/featured', icon: Star, label: 'Featured' },
  { to: '/dealer/integrations', icon: Plug, label: 'Integrations' },
  { to: '/dealer/settings', icon: Settings, label: 'Settings' },
  { to: '/dealer/subscription', icon: CreditCard, label: 'Subscription' },
];

const TIER_BADGE = {
  basic: null,
  verified: { label: 'Verified', color: 'bg-blue-100 text-blue-700' },
  verified_pro: { label: 'Pro', color: 'bg-purple-100 text-purple-700' },
  enterprise: { label: 'Enterprise', color: 'bg-amber-100 text-amber-700' },
};

export default function DealerLayout() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: profile } = useQuery({
    queryKey: ['dealer-profile'],
    queryFn: () => api.get('/dealers/me/profile').then(r => r.data),
  });

  const { data: sub } = useQuery({
    queryKey: ['dealer-sub'],
    queryFn: () => api.get('/dealers/me/subscription').then(r => r.data),
  });

  const tier = profile?.tier || 'basic';
  const tierBadge = TIER_BADGE[tier];
  const plan = sub?.plan || 'free';

  return (
    <div className="flex min-h-[calc(100vh-64px)] bg-surface-container">
      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col w-60 shrink-0 border-r border-border-subtle bg-surface-container-lowest">
        {/* Dealer identity */}
        <div className="p-5 border-b border-border-subtle">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-on-surface text-sm truncate">{profile?.businessName || user?.name}</p>
              <div className="flex items-center gap-1 mt-0.5">
                {tierBadge && (
                  <span className={`inline-flex items-center rounded-full px-1.5 py-0.5 text-[10px] font-bold ${tierBadge.color}`}>
                    {tierBadge.label}
                  </span>
                )}
                <span className="text-[10px] text-on-surface-variant capitalize">{plan} plan</span>
              </div>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 p-3 space-y-0.5">
          {NAV.map(({ to, end, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-on-primary'
                    : 'text-on-surface-variant hover:bg-surface-container hover:text-on-surface'
                }`
              }
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Upgrade CTA for non-enterprise */}
        {plan !== 'enterprise' && (
          <div className="p-4 border-t border-border-subtle">
            <Link
              to="/dealer/subscription"
              className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
            >
              <Crown className="h-3.5 w-3.5" />
              Upgrade Plan
              <ChevronRight className="h-3.5 w-3.5 ml-auto" />
            </Link>
          </div>
        )}
      </aside>

      {/* Mobile top nav */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-30 border-t border-border-subtle bg-surface-container-lowest flex">
        {NAV.slice(0, 5).map(({ to, end, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2 text-[10px] font-medium transition-colors ${
                isActive ? 'text-primary' : 'text-on-surface-variant'
              }`
            }
          >
            <Icon className="h-5 w-5 mb-0.5" />
            {label}
          </NavLink>
        ))}
      </div>

      {/* Content */}
      <main className="flex-1 min-w-0 pb-20 lg:pb-0">
        {/* Header bar */}
        <div className="sticky top-16 z-10 border-b border-border-subtle bg-surface-container-lowest/90 backdrop-blur px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-on-surface-variant">
            <Building2 className="h-4 w-4" />
            <span className="font-medium text-on-surface">{profile?.businessName || 'Dealer Portal'}</span>
          </div>
          <Link
            to="/sell"
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-bold text-white hover:bg-primary/90"
          >
            <Plus className="h-3.5 w-3.5" /> Add Listing
          </Link>
        </div>

        <TrialBanner trial={profile?.trial} />
        <div className="p-6">
          <Outlet context={{ profile, sub, plan, tier }} />
        </div>
      </main>
    </div>
  );
}
