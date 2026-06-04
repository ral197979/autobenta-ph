import { useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { CheckCircle, XCircle, Crown, Zap, Building2, Rocket, Clock, AlertTriangle } from 'lucide-react';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    icon: Zap,
    price: null,
    description: 'Get started with basic marketplace access.',
    color: 'border-border-subtle',
    features: [
      { label: 'Up to 5 listings', ok: true },
      { label: 'Basic lead inbox', ok: true },
      { label: 'Analytics dashboard', ok: false },
      { label: 'Priority placement', ok: false },
      { label: 'Verified Dealer badge', ok: false },
      { label: 'Multi-branch support', ok: false },
      { label: 'V8Atlas sync', ok: false },
      { label: 'API access', ok: false },
    ],
  },
  {
    id: 'verified',
    name: 'Verified',
    icon: CheckCircle,
    price: '₱1,499/mo',
    description: 'Verified badge + CRM for growing dealers.',
    color: 'border-blue-300',
    highlight: false,
    features: [
      { label: 'Up to 25 listings', ok: true },
      { label: 'Full lead CRM', ok: true },
      { label: 'Analytics dashboard', ok: false },
      { label: 'Priority placement', ok: false },
      { label: 'Verified Dealer badge', ok: true },
      { label: 'Multi-branch support', ok: false },
      { label: 'V8Atlas sync', ok: false },
      { label: 'API access', ok: false },
    ],
  },
  {
    id: 'pro',
    name: 'Dealer Pro',
    icon: Crown,
    price: '₱3,499/mo',
    description: 'Priority placement + full analytics for serious dealers.',
    color: 'border-purple-400',
    highlight: true,
    features: [
      { label: 'Up to 100 listings', ok: true },
      { label: 'Full lead CRM', ok: true },
      { label: 'Analytics dashboard', ok: true },
      { label: 'Priority placement', ok: true },
      { label: 'Verified Dealer Pro badge', ok: true },
      { label: 'Multi-branch support', ok: false },
      { label: 'V8Atlas sync', ok: false },
      { label: 'API access', ok: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    icon: Building2,
    price: 'Custom',
    description: 'Multi-branch, V8Atlas sync, and API access for dealer groups.',
    color: 'border-amber-400',
    features: [
      { label: 'Unlimited listings', ok: true },
      { label: 'Full lead CRM', ok: true },
      { label: 'Analytics dashboard', ok: true },
      { label: 'Priority placement', ok: true },
      { label: 'Enterprise Dealer badge', ok: true },
      { label: 'Multi-branch support', ok: true },
      { label: 'V8Atlas sync', ok: true },
      { label: 'API access', ok: true },
    ],
  },
];

const PRO_FEATURES = [
  'Unlimited listings',
  'Lead CRM',
  'Analytics dashboard',
  'Priority placement',
  'Verified Dealer badge',
  'V8Atlas sync',
  'API access',
];

function TrialStatusCard({ trial }) {
  const [showContact, setShowContact] = useState(false);

  if (!trial) return null;

  const expired = !trial.isOnTrial && trial.daysRemaining <= 0;
  const urgent  = trial.isOnTrial && trial.daysRemaining <= 7;
  const warning = trial.isOnTrial && trial.daysRemaining <= 30;

  let cardClass, headerText, headerIcon, urgencyCopy;

  if (expired) {
    cardClass = 'border-red-300 bg-red-50';
    headerText = 'Your trial has ended';
    headerIcon = <AlertTriangle className="h-5 w-5 text-red-500" />;
    urgencyCopy = 'Contact us to continue at ₱3,599/month.';
  } else if (urgent) {
    cardClass = 'border-amber-400 bg-amber-50';
    headerText = `Free trial — ${trial.daysRemaining} day${trial.daysRemaining === 1 ? '' : 's'} remaining`;
    headerIcon = <AlertTriangle className="h-5 w-5 text-amber-500" />;
    urgencyCopy = 'Your Founding Dealer rate expires when your trial ends. Lock it in now.';
  } else if (warning) {
    cardClass = 'border-amber-300 bg-amber-50';
    headerText = `Free trial — ${trial.daysRemaining} days remaining`;
    headerIcon = <Clock className="h-5 w-5 text-amber-500" />;
    urgencyCopy = 'Your Founding Dealer rate expires when your trial ends. Lock it in now.';
  } else {
    cardClass = 'border-primary/30 bg-primary/5';
    headerText = `You're on a free trial — ${trial.daysRemaining} days remaining`;
    headerIcon = <Zap className="h-5 w-5 text-primary" />;
    urgencyCopy = null;
  }

  return (
    <div className={`rounded-2xl border-2 p-6 space-y-4 ${cardClass}`}>
      <div className="flex items-center gap-2">
        {headerIcon}
        <span className="font-bold text-on-surface">{headerText}</span>
      </div>

      {urgencyCopy && (
        <p className="text-sm font-semibold text-amber-700">{urgencyCopy}</p>
      )}

      {!expired && (
        <div>
          <p className="text-sm text-on-surface-variant mb-2">Full Pro features included during your trial:</p>
          <ul className="grid sm:grid-cols-2 gap-1.5">
            {PRO_FEATURES.map(f => (
              <li key={f} className="flex items-center gap-2 text-sm text-on-surface">
                <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="rounded-xl border border-primary/20 bg-surface-container-lowest px-4 py-3">
        <p className="text-sm text-on-surface-variant">
          After your trial: <span className="font-bold text-on-surface">₱3,599/month</span>
          <span className="ml-2 text-xs text-on-surface-variant">— Founding Dealer rate, locked for life</span>
        </p>
      </div>

      <button
        onClick={() => setShowContact(o => !o)}
        className="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
      >
        {expired ? 'Contact Us to Continue' : 'Secure My Founding Dealer Rate'}
      </button>

      {showContact && (
        <div className="rounded-xl border border-border-subtle bg-surface-container-lowest px-4 py-4 text-sm text-on-surface-variant space-y-1">
          <p>Para ma-activate ang inyong subscription pagkatapos ng trial:</p>
          <p>i-message kami sa{' '}
            <a href="mailto:dealers@autobentaph.com" className="text-primary font-semibold hover:underline">
              dealers@autobentaph.com
            </a>
            {' '}or WhatsApp: <span className="font-semibold text-on-surface">+63 917 000 0000</span>.
          </p>
          <p>Mag-aayos kami ng GCash/Maya payment para sa inyo.</p>
        </div>
      )}
    </div>
  );
}

export default function DealerSubscription() {
  const { plan, profile } = useOutletContext();
  const trial = profile?.trial;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-on-surface">Subscription</h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Current plan: <span className="font-semibold text-on-surface capitalize">{plan || 'Free'}</span>
        </p>
      </div>

      {trial && <TrialStatusCard trial={trial} />}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => {
          const isCurrentPlan = p.id === (plan || 'free');
          const Icon = p.icon;
          return (
            <div
              key={p.id}
              className={`relative rounded-2xl border-2 bg-surface-container-lowest p-5 flex flex-col ${p.color} ${isCurrentPlan ? 'ring-2 ring-deepblue ring-offset-2' : ''}`}
            >
              {p.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-600 px-3 py-0.5 text-[11px] font-bold text-white">
                    <Rocket className="h-3 w-3" /> Most Popular
                  </span>
                </div>
              )}
              {isCurrentPlan && (
                <div className="absolute -top-3 right-4">
                  <span className="inline-flex items-center rounded-full bg-primary px-2.5 py-0.5 text-[11px] font-bold text-white">Current</span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-surface-container flex items-center justify-center">
                  <Icon className="h-4 w-4 text-on-surface" />
                </div>
                <div>
                  <p className="font-bold text-on-surface text-sm">{p.name}</p>
                  <p className="text-xs text-on-surface-variant">{p.price || 'Free forever'}</p>
                </div>
              </div>

              <p className="text-xs text-on-surface-variant mb-4 leading-relaxed">{p.description}</p>

              <ul className="space-y-1.5 mb-5 flex-1">
                {p.features.map(({ label, ok }) => (
                  <li key={label} className="flex items-center gap-2 text-xs">
                    {ok
                      ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      : <XCircle className="h-3.5 w-3.5 text-cardborder shrink-0" />
                    }
                    <span className={ok ? 'text-on-surface' : 'text-on-surface-variant/60'}>{label}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <div className="rounded-xl border border-primary/20 bg-primary/5 px-4 py-2 text-center text-xs font-semibold text-primary">
                  Active Plan
                </div>
              ) : p.id === 'enterprise' ? (
                <a
                  href="mailto:dealers@autobentaph.com"
                  className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-2 text-center text-xs font-semibold text-amber-700 hover:bg-amber-100 transition-colors"
                >
                  Contact Sales
                </a>
              ) : (
                <a
                  href="mailto:dealers@autobentaph.com"
                  className="rounded-xl bg-primary px-4 py-2 text-xs font-bold text-white hover:bg-primary/90 transition-colors text-center"
                >
                  Upgrade to {p.name}
                </a>
              )}
            </div>
          );
        })}
      </div>

      <div className="card p-5 bg-surface-container">
        <p className="text-xs text-on-surface-variant">
          To activate your subscription, contact{' '}
          <a href="mailto:dealers@autobentaph.com" className="text-primary font-semibold hover:underline">
            dealers@autobentaph.com
          </a>
          . We'll set up GCash/Maya payment for you.
        </p>
      </div>
    </div>
  );
}
