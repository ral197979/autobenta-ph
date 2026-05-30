import { Link, useOutletContext } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Users, Car, TrendingUp, Award, AlertCircle, Clock, FileCheck, BadgeCheck, ChevronRight } from 'lucide-react';
import api from '../../api/client';
import { formatPrice, formatRelativeTime } from '../../utils/format';
import DealerReminders from './DealerReminders';

const ONBOARDING_STEPS = [
  { key: 'profile', label: 'Complete dealer profile', link: '/dealer/settings' },
  { key: 'listing', label: 'Post your first listing', link: '/sell' },
  { key: 'verification', label: 'Get verified', link: '/dashboard?tab=verification' },
  { key: 'lead', label: 'Respond to first lead', link: '/dealer/leads' },
  { key: 'subscription', label: 'Choose a plan', link: '/dealer/subscription' },
];

export default function DealerDashboard() {
  const { profile, sub, plan } = useOutletContext();

  const { data: analytics } = useQuery({
    queryKey: ['dealer-analytics'],
    queryFn: () => api.get('/dealer/analytics').then(r => r.data),
  });

  const { data: recentLeads } = useQuery({
    queryKey: ['dealer-leads-recent'],
    queryFn: () => api.get('/dealers/me/leads?status=new').then(r => r.data),
  });

  const onboardingStep = profile?.onboardingStep || 0;
  const onboardingComplete = onboardingStep >= ONBOARDING_STEPS.length;

  const stats = [
    { icon: Car, label: 'Active Listings', value: analytics?.listings?.active || 0, color: 'text-deepblue bg-deepblue/10', link: '/dealer/listings' },
    { icon: Users, label: 'Total Leads', value: analytics?.leads?.total || 0, color: 'text-purple-600 bg-purple-100', link: '/dealer/leads' },
    { icon: AlertCircle, label: 'New Leads', value: analytics?.leads?.byStatus?.new || 0, color: 'text-orange-600 bg-orange-100', link: '/dealer/leads' },
    { icon: TrendingUp, label: 'Win Rate', value: `${analytics?.leads?.winRate || 0}%`, color: 'text-emerald-600 bg-emerald-100', link: '/dealer/analytics' },
  ];

  return (
    <div className="space-y-6">
      {/* Onboarding checklist — shown until complete */}
      {!onboardingComplete && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <div className="flex items-center gap-2 mb-4">
            <Award className="h-5 w-5 text-amber-600" />
            <h3 className="font-bold text-amber-900">Complete your dealer setup</h3>
            <span className="ml-auto text-xs font-bold text-amber-700">{onboardingStep}/{ONBOARDING_STEPS.length} done</span>
          </div>
          <div className="space-y-2">
            {ONBOARDING_STEPS.map((step, i) => {
              const done = i < onboardingStep;
              return (
                <Link
                  key={step.key}
                  to={done ? '#' : step.link}
                  className={`flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm transition-colors ${done ? 'bg-emerald-50 text-emerald-700' : 'bg-white text-ink hover:bg-amber-100'}`}
                >
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${done ? 'bg-emerald-500 text-white' : 'border-2 border-amber-300 text-amber-500'}`}>
                    {done ? '✓' : i + 1}
                  </span>
                  {step.label}
                  {!done && <ChevronRight className="h-4 w-4 ml-auto text-slatetext" />}
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(({ icon: Icon, label, value, color, link }) => (
          <Link key={label} to={link} className="card p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className={`h-11 w-11 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold text-ink">{value}</p>
              <p className="text-xs text-slatetext">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* New leads */}
        <div className="lg:col-span-2 card overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-cardborder">
            <h2 className="font-bold text-ink flex items-center gap-2">
              <Users className="h-4 w-4 text-deepblue" /> New Leads
            </h2>
            <Link to="/dealer/leads" className="text-xs font-semibold text-deepblue hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-cardborder">
            {!recentLeads?.length && (
              <div className="text-center py-10 text-slatetext">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No new leads yet</p>
              </div>
            )}
            {recentLeads?.slice(0, 5).map((lead) => (
              <div key={lead.id} className="flex items-center gap-3 px-5 py-3">
                <div className="h-10 w-14 rounded-lg overflow-hidden bg-softbg shrink-0">
                  <img src={lead.listing?.photos?.[0]?.url || ''} alt="" className="h-full w-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-ink truncate">{lead.buyerName}</p>
                  <p className="text-xs text-slatetext truncate">
                    {lead.listing?.year} {lead.listing?.make} {lead.listing?.model}
                  </p>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-xs text-slatetext">{formatRelativeTime(lead.createdAt)}</p>
                  <Link to="/dealer/leads" className="text-xs font-semibold text-deepblue hover:underline">Respond</Link>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right column: verification status + reminders */}
        <div className="space-y-4">
          {/* Verification status */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-3">
              <BadgeCheck className="h-4 w-4 text-deepblue" />
              <h3 className="font-bold text-sm text-ink">Verification Status</h3>
            </div>
            <div className="space-y-2 text-sm">
              {[
                { label: 'Dealer Badge', value: profile?.isVerified ? 'Verified' : 'Not verified', ok: profile?.isVerified },
                { label: 'Tier', value: profile?.tier?.replace('_', ' ') || 'Basic', ok: profile?.tier !== 'basic' },
                { label: 'Plan', value: plan || 'Free', ok: plan !== 'free' },
              ].map(({ label, value, ok }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-slatetext">{label}</span>
                  <span className={`font-semibold capitalize ${ok ? 'text-emerald-600' : 'text-slatetext'}`}>{value}</span>
                </div>
              ))}
            </div>
            {!profile?.isVerified && (
              <Link to="/dashboard?tab=verification" className="mt-3 flex items-center justify-center gap-1.5 rounded-lg border border-deepblue/20 bg-deepblue/5 px-3 py-2 text-xs font-semibold text-deepblue hover:bg-deepblue/10">
                <FileCheck className="h-3.5 w-3.5" /> Get Verified
              </Link>
            )}
          </div>

          {/* Quick reminders preview */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-sm text-ink flex items-center gap-2">
                <Clock className="h-4 w-4 text-slatetext" /> Upcoming
              </h3>
            </div>
            <DealerReminders compact />
          </div>
        </div>
      </div>
    </div>
  );
}
