import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import FeaturedListings from '../components/home/FeaturedListings';

const BODY_TYPES = [
  { name: 'Sedan', icon: 'directions_car' },
  { name: 'SUV', icon: 'directions_car' },
  { name: 'Crossover', icon: 'directions_car' },
  { name: 'Hatchback', icon: 'directions_car' },
  { name: 'Pickup', icon: 'local_shipping' },
  { name: 'MPV', icon: 'airport_shuttle' },
  { name: 'Van', icon: 'airport_shuttle' },
];

const STEPS = [
  { icon: 'search', title: 'Search & Filter', body: 'Browse verified listings with photos, history, and transparent pricing.' },
  { icon: 'verified', title: 'Inspect & Verify', body: 'Request a Ryderr Certified inspection and check the readiness score.' },
  { icon: 'forum', title: 'Inquire & Offer', body: 'Message the seller, make an offer, or counter — all in-app.' },
  { icon: 'fact_check', title: 'Close & Transfer', body: 'Follow the LTO transfer checklist and complete the sale with confidence.' },
];

// Manufacturer logos for make-based browsing (nominative fair use). Served from
// a stable, versioned CDN; `color` is the fallback monogram tint if a logo fails.
const LOGO = (slug) => `https://cdn.jsdelivr.net/gh/filippofilip95/car-logos-dataset@master/logos/optimized/${slug}.png`;
const BRANDS = [
  { name: 'Toyota', slug: 'toyota', color: '#E11D2A' },
  { name: 'Mitsubishi', slug: 'mitsubishi', color: '#C81E2B' },
  { name: 'Honda', slug: 'honda', color: '#111827' },
  { name: 'Ford', slug: 'ford', color: '#1D4ED8' },
  { name: 'BMW', slug: 'bmw', color: '#0EA5E9' },
  { name: 'Nissan', slug: 'nissan', color: '#BE123C' },
  { name: 'Hyundai', slug: 'hyundai', color: '#1E3A8A' },
  { name: 'Isuzu', slug: 'isuzu', color: '#DC2626' },
];

function BrandLogo({ brand }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className="w-16 h-16 rounded-full flex items-center justify-center text-white font-bold text-headline-sm shadow-sm ring-1 ring-black/5" style={{ backgroundColor: brand.color }}>
        {brand.name.charAt(0)}
      </div>
    );
  }
  return (
    <div className="w-16 h-16 rounded-full bg-white border border-border-subtle flex items-center justify-center p-2.5 shadow-sm group-hover:scale-105 transition-transform">
      <img src={LOGO(brand.slug)} alt={`${brand.name} logo`} className="w-full h-full object-contain" loading="lazy" onError={() => setErr(true)} />
    </div>
  );
}

const DEALERS = [
  { name: 'Elite Motors', tag: 'Premium Partner' },
  { name: 'Autohaus PH', tag: 'Verified Dealer' },
  { name: 'Summit Auto', tag: 'Verified Dealer' },
  { name: 'Auto Gallery', tag: 'Verified Dealer' },
];

const TRUST = [
  { icon: 'verified_user', title: '100% Inspected', body: 'Every listing undergoes a rigorous 180-point inspection before it appears on Ryderr.' },
  { icon: 'lock', title: 'Secure Transactions', body: 'Our escrow service ensures your funds are protected until the title transfer is complete.' },
  { icon: 'support_agent', title: '24/7 Expert Help', body: 'Our specialists guide you through every step of the buying or selling process.' },
];

function HeroSearch() {
  const navigate = useNavigate();
  const [brand, setBrand] = useState('');
  const [model, setModel] = useState('');
  const [budget, setBudget] = useState('');

  const onSearch = () => {
    const params = new URLSearchParams();
    if (brand) params.set('make', brand);
    if (model) params.set('q', model);
    if (budget) params.set('budget', budget);
    navigate(`/cars${params.toString() ? `?${params}` : ''}`);
  };

  return (
    <section className="relative w-full h-[600px] md:h-[720px] flex items-center justify-center px-gutter-mobile md:px-gutter-desktop overflow-hidden bg-ink">
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0B1220] via-[#131b2e] to-[#1e3a5f]" />
        <div className="absolute -top-24 -right-24 w-[28rem] h-[28rem] rounded-full bg-electric/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 w-[26rem] h-[26rem] rounded-full bg-accent/10 blur-3xl" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
      </div>
      <div className="relative z-10 max-w-container-max w-full text-center">
        <h1 className="text-white font-display-lg text-display-lg mb-lg max-w-3xl mx-auto">
          Precision Engineering. Seamless Ownership.
        </h1>
        <p className="text-white/90 font-body-lg text-body-lg mb-3xl max-w-2xl mx-auto">
          Discover the Philippines' most trusted marketplace for verified, high-performance vehicles.
        </p>
        <div className="bg-surface-container-lowest p-sm md:p-md rounded-xl shadow-xl max-w-4xl mx-auto flex flex-col md:flex-row items-stretch gap-sm border border-border-subtle">
          <Field label="Brand" placeholder="e.g. Toyota" value={brand} onChange={setBrand} bordered />
          <Field label="Model" placeholder="e.g. Fortuner" value={model} onChange={setModel} bordered />
          <Field label="Budget" placeholder="e.g. 1M - 2M" value={budget} onChange={setBudget} />
          <button
            onClick={onSearch}
            className="bg-primary text-on-primary px-xl py-md rounded-lg font-label-md text-label-md flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95"
          >
            <span className="material-symbols-outlined">search</span>
            Search Marketplace
          </button>
        </div>
      </div>
    </section>
  );
}

function Field({ label, placeholder, value, onChange, bordered }) {
  return (
    <label
      className={`flex-1 flex flex-col items-start px-md py-sm hover:bg-surface-container-low rounded-lg transition-colors cursor-text ${
        bordered ? 'border-b md:border-b-0 md:border-r border-border-subtle' : ''
      }`}
    >
      <span className="text-label-sm font-label-sm text-secondary uppercase tracking-wider mb-1">{label}</span>
      <input
        className="w-full border-none p-0 focus:ring-0 text-body-md font-body-md text-on-surface bg-transparent placeholder:text-outline-variant"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="text"
      />
    </label>
  );
}

function TopBrands() {
  const [tab, setTab] = useState('makes');
  return (
    <section className="py-xl bg-surface-container-lowest border-b border-border-subtle">
      <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-md mb-lg">
          <h2 className="text-headline-sm font-headline-sm text-primary">Popular Makes &amp; Body Types</h2>
          <div className="flex items-center gap-1 bg-surface-container rounded-full p-1 w-fit">
            {[['makes', 'Car Makes'], ['types', 'Body Types']].map(([k, l]) => (
              <button key={k} onClick={() => setTab(k)} className={`px-md py-1.5 rounded-full text-label-md transition-colors ${tab === k ? 'bg-surface-container-lowest text-primary shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`}>{l}</button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-xl overflow-x-auto hide-scrollbar py-2">
          {tab === 'makes'
            ? BRANDS.map((b) => (
                <Link key={b.name} to={`/cars?make=${encodeURIComponent(b.name)}`} className="flex flex-col items-center gap-sm min-w-[100px] group cursor-pointer">
                  <BrandLogo brand={b} />
                  <span className="text-label-sm font-label-sm text-on-surface-variant group-hover:text-primary transition-colors">{b.name}</span>
                </Link>
              ))
            : BODY_TYPES.map((t) => (
                <Link key={t.name} to={`/cars?bodyType=${encodeURIComponent(t.name)}`} className="flex flex-col items-center gap-sm min-w-[100px] group cursor-pointer">
                  <div className="w-16 h-16 rounded-full bg-surface-container-low border border-border-subtle flex items-center justify-center group-hover:bg-primary transition-colors">
                    <span className="material-symbols-outlined text-primary group-hover:text-on-primary transition-colors">{t.icon}</span>
                  </div>
                  <span className="text-label-sm font-label-sm text-on-surface-variant group-hover:text-primary transition-colors">{t.name}</span>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}

function HowItWorks() {
  return (
    <section className="py-3xl bg-background">
      <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop">
        <h2 className="text-headline-lg font-headline-lg text-primary text-center mb-2xl">How Ryderr Works</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-lg">
          {STEPS.map((s, i) => (
            <div key={s.title} className="bg-surface-container-lowest border border-border-subtle rounded-2xl p-lg text-center relative">
              <span className="absolute top-4 right-4 text-headline-lg font-bold text-surface-container-high">{i + 1}</span>
              <div className="w-14 h-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-md">
                <span className="material-symbols-outlined text-primary text-2xl">{s.icon}</span>
              </div>
              <h3 className="text-headline-sm font-headline-sm text-on-surface mb-sm">{s.title}</h3>
              <p className="text-body-sm text-on-surface-variant">{s.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function Newsletter() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | done | error

  const submit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setStatus('loading');
    try {
      await api.post('/newsletter', { email });
      setStatus('done');
      setEmail('');
    } catch {
      setStatus('error');
    }
  };

  return (
    <section className="py-2xl px-gutter-mobile md:px-gutter-desktop">
      <div className="max-w-container-max mx-auto bg-primary-container rounded-2xl p-xl md:p-3xl relative overflow-hidden text-center">
        <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-tertiary-container/30 blur-3xl" />
        <div className="relative z-10 max-w-xl mx-auto">
          <h2 className="text-headline-lg font-headline-lg text-on-primary mb-sm">Join thousands of car buyers</h2>
          <p className="text-on-primary-container font-body-md mb-lg">Get new listings, price drops, and buying tips in your inbox. No spam.</p>
          {status === 'done' ? (
            <p className="text-on-primary font-label-md flex items-center justify-center gap-2"><span className="material-symbols-outlined">check_circle</span> You're subscribed — welcome aboard!</p>
          ) : (
            <form onSubmit={submit} className="flex flex-col sm:flex-row gap-sm max-w-md mx-auto">
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="your@email.com"
                className="flex-1 bg-surface-container-lowest border border-border-subtle rounded-xl px-md py-sm text-body-md text-on-surface focus:ring-2 focus:ring-primary outline-none" />
              <button type="submit" disabled={status === 'loading'} className="bg-surface-container-lowest text-primary px-xl py-sm rounded-xl font-label-md hover:bg-surface-container-low transition-all active:scale-95 disabled:opacity-60">
                {status === 'loading' ? 'Joining…' : 'Subscribe'}
              </button>
            </form>
          )}
          {status === 'error' && <p className="text-on-primary-container text-label-sm mt-2">Something went wrong — please try again.</p>}
        </div>
      </div>
    </section>
  );
}

function SellCTA() {
  return (
    <section className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop py-2xl">
      <div className="bg-primary-container rounded-2xl p-xl md:p-3xl relative overflow-hidden flex flex-col md:flex-row items-center gap-2xl">
        <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-tertiary-container rounded-full blur-3xl opacity-40" />
        <div className="relative z-10 flex-1 text-center md:text-left">
          <h2 className="text-on-primary font-headline-lg text-headline-lg mb-md">Sell Your Car for the Best Price.</h2>
          <p className="text-on-primary-container font-body-lg text-body-lg mb-2xl max-w-lg">
            Our experts handle the inspection and paperwork. Get paid in as fast as 24 hours.
          </p>
          <div className="flex flex-col sm:flex-row gap-md justify-center md:justify-start">
            <Link to="/sell" className="bg-surface-container-lowest text-primary px-3xl py-md rounded-xl font-label-md text-label-md hover:bg-surface-container-low transition-all shadow-lg active:scale-95">
              Get Instant Quote
            </Link>
            <Link to="/safe-buying" className="bg-transparent border border-white/30 text-on-primary px-3xl py-md rounded-xl font-label-md text-label-md hover:bg-white/10 transition-all active:scale-95">
              Learn How It Works
            </Link>
          </div>
        </div>
        <div className="relative z-10 w-full md:w-[400px] h-[300px] rounded-2xl overflow-hidden shadow-2xl bg-gradient-to-br from-[#1e3a5f] to-[#0B1220] flex items-center justify-center">
          <span className="material-symbols-outlined text-white/30" style={{ fontSize: '96px' }}>directions_car</span>
        </div>
      </div>
    </section>
  );
}

function VerifiedDealers() {
  return (
    <section className="py-3xl bg-surface-container-lowest">
      <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop">
        <div className="text-center mb-3xl">
          <h2 className="text-headline-lg font-headline-lg text-primary mb-sm">Verified Dealers</h2>
          <p className="text-on-surface-variant font-body-md text-body-md max-w-xl mx-auto">
            Shop with confidence from our network of pre-vetted dealerships.
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-lg">
          {DEALERS.map((d) => (
            <Link key={d.name} to="/cars" className="bg-surface-container-lowest p-lg rounded-xl border border-border-subtle flex flex-col items-center text-center group cursor-pointer hover:border-primary transition-all">
              <div className="w-20 h-20 bg-surface rounded-full flex items-center justify-center mb-md border border-border-subtle">
                <span className="material-symbols-outlined text-3xl text-primary">storefront</span>
              </div>
              <h4 className="font-headline-sm text-headline-sm text-primary mb-xs">{d.name}</h4>
              <span className="text-label-sm font-label-sm text-trust-emerald flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                {d.tag}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

function TrustPillars() {
  return (
    <section id="how-it-works" className="py-3xl bg-background border-t border-border-subtle">
      <div className="max-w-container-max mx-auto px-gutter-mobile md:px-gutter-desktop">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2xl">
          {TRUST.map((t) => (
            <div key={t.title} className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-primary-container text-on-primary rounded-2xl flex items-center justify-center mb-lg shadow-lg">
                <span className="material-symbols-outlined text-3xl">{t.icon}</span>
              </div>
              <h3 className="text-headline-sm font-headline-sm text-primary mb-sm">{t.title}</h3>
              <p className="text-on-surface-variant font-body-md text-body-md">{t.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <div className="bg-background">
      <HeroSearch />
      <TopBrands />
      <HowItWorks />
      <FeaturedListings />
      <SellCTA />
      <VerifiedDealers />
      <Newsletter />
      <TrustPillars />
    </div>
  );
}
