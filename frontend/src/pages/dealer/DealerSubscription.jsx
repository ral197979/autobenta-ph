import { Link, useOutletContext } from 'react-router-dom';
import { CheckCircle, XCircle, Crown, Zap, Building2, Rocket } from 'lucide-react';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    icon: Zap,
    price: null,
    description: 'Get started with basic marketplace access.',
    color: 'border-cardborder',
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

export default function DealerSubscription() {
  const { plan } = useOutletContext();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-ink">Subscription</h1>
        <p className="text-sm text-slatetext mt-1">
          Current plan: <span className="font-semibold text-ink capitalize">{plan || 'Free'}</span>
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {PLANS.map((p) => {
          const isCurrentPlan = p.id === (plan || 'free');
          const Icon = p.icon;
          return (
            <div
              key={p.id}
              className={`relative rounded-2xl border-2 bg-white p-5 flex flex-col ${p.color} ${isCurrentPlan ? 'ring-2 ring-deepblue ring-offset-2' : ''}`}
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
                  <span className="inline-flex items-center rounded-full bg-deepblue px-2.5 py-0.5 text-[11px] font-bold text-white">Current</span>
                </div>
              )}

              <div className="flex items-center gap-2 mb-3">
                <div className="h-8 w-8 rounded-lg bg-softbg flex items-center justify-center">
                  <Icon className="h-4 w-4 text-ink" />
                </div>
                <div>
                  <p className="font-bold text-ink text-sm">{p.name}</p>
                  <p className="text-xs text-slatetext">{p.price || 'Free forever'}</p>
                </div>
              </div>

              <p className="text-xs text-slatetext mb-4 leading-relaxed">{p.description}</p>

              <ul className="space-y-1.5 mb-5 flex-1">
                {p.features.map(({ label, ok }) => (
                  <li key={label} className="flex items-center gap-2 text-xs">
                    {ok
                      ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500 shrink-0" />
                      : <XCircle className="h-3.5 w-3.5 text-cardborder shrink-0" />
                    }
                    <span className={ok ? 'text-ink' : 'text-slatetext/60'}>{label}</span>
                  </li>
                ))}
              </ul>

              {isCurrentPlan ? (
                <div className="rounded-xl border border-deepblue/20 bg-deepblue/5 px-4 py-2 text-center text-xs font-semibold text-deepblue">
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
                <button
                  onClick={() => alert('Payment integration coming soon. Contact dealers@autobentaph.com to upgrade.')}
                  className="rounded-xl bg-deepblue px-4 py-2 text-xs font-bold text-white hover:bg-deepblue/90 transition-colors"
                >
                  Upgrade to {p.name}
                </button>
              )}
            </div>
          );
        })}
      </div>

      <div className="card p-5 bg-softbg">
        <p className="text-xs text-slatetext">
          Payment processing is coming soon. To upgrade your plan now, contact{' '}
          <a href="mailto:dealers@autobentaph.com" className="text-deepblue font-semibold hover:underline">
            dealers@autobentaph.com
          </a>
          . All plans include a 14-day free trial.
        </p>
      </div>
    </div>
  );
}
