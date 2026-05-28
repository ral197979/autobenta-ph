import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Search, Shield, Car, TrendingDown, Star, ArrowRight, CheckCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '../api/client';
import CarCard from '../components/CarCard';

const POPULAR_BRANDS = ['Toyota', 'Honda', 'Mitsubishi', 'Ford', 'Nissan', 'Suzuki', 'Hyundai', 'Isuzu'];

export default function Home() {
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const { data: featuredData } = useQuery({
    queryKey: ['featured-listings'],
    queryFn: () => api.get('/listings?sortBy=viewCount&sortOrder=desc').then(r => r.data),
  });

  const handleSearch = (e) => {
    e.preventDefault();
    navigate(`/cars?search=${encodeURIComponent(search)}`);
  };

  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-primary-900 via-primary-800 to-primary-700 text-white py-16 md:py-24">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm mb-6">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span>Philippines #1 Used Car Marketplace</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold mb-4 leading-tight">
            Find Your Next <span className="text-yellow-400">Dream Car</span>
          </h1>
          <p className="text-lg text-primary-200 mb-8 max-w-2xl mx-auto">
            Browse thousands of verified used cars across the Philippines. Buy, sell, and finance with confidence.
          </p>
          <form onSubmit={handleSearch} className="flex gap-2 max-w-2xl mx-auto">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search by make, model, or location..."
                className="w-full pl-10 pr-4 py-3 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-base"
              />
            </div>
            <button type="submit" className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-bold px-6 py-3 rounded-xl transition-colors whitespace-nowrap">
              Search Cars
            </button>
          </form>
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            {POPULAR_BRANDS.map(brand => (
              <Link key={brand} to={`/cars?make=${brand}`} className="bg-white/10 hover:bg-white/20 px-3 py-1.5 rounded-full text-sm transition-colors">
                {brand}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { label: 'Active Listings', value: `${(featuredData?.pagination?.total || 500).toLocaleString()}+` },
              { label: 'Verified Dealers', value: '50+' },
              { label: 'Cities Covered', value: '50+' },
              { label: 'Happy Buyers', value: '10,000+' },
            ].map(stat => (
              <div key={stat.label} className="text-center">
                <p className="text-2xl font-bold text-primary-700">{stat.value}</p>
                <p className="text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Featured Listings</h2>
            <p className="text-gray-500 text-sm">Top viewed cars this week</p>
          </div>
          <Link to="/cars" className="flex items-center gap-1 text-primary-600 hover:text-primary-800 font-medium text-sm">
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {(featuredData?.listings || []).slice(0, 8).map(listing => (
            <CarCard key={listing.id} listing={listing} />
          ))}
          {!featuredData && Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card overflow-hidden animate-pulse">
              <div className="aspect-[4/3] bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-5 bg-gray-200 rounded w-1/2" />
                <div className="h-3 bg-gray-200 rounded w-full" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-14">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">How AutoBenta PH Works</h2>
            <p className="text-gray-500">Simple, safe, and fast.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: Search, title: 'Browse & Compare', desc: 'Search thousands of listings with advanced filters. Compare models side by side.' },
              { icon: Shield, title: 'Inspect & Verify', desc: 'Request professional inspections. Check fraud flags and AI-powered analysis.' },
              { icon: Car, title: 'Buy with Confidence', desc: 'Connect with verified sellers. Apply for financing in minutes.' },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="card p-6 text-center">
                <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-500 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by type */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Browse by Type</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Sedans', icon: '🚗', query: 'bodyType=Sedan' },
            { label: 'SUVs', icon: '🚙', query: 'bodyType=SUV' },
            { label: 'Pickup Trucks', icon: '🛻', query: 'bodyType=Pickup' },
            { label: 'Vans & MPVs', icon: '🚐', query: 'bodyType=Van' },
          ].map(({ label, icon, query }) => (
            <Link key={label} to={`/cars?${query}`} className="card p-5 text-center hover:shadow-md transition-shadow group">
              <div className="text-3xl mb-2">{icon}</div>
              <p className="font-semibold text-gray-900 group-hover:text-primary-600 transition-colors">{label}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust Section */}
      <section className="bg-primary-900 text-white py-12">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-2">Why Trust AutoBenta PH?</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              { icon: <Shield className="w-5 h-5" />, title: 'Fraud Detection', desc: 'AI-powered fraud risk scoring on every listing.' },
              { icon: <CheckCircle className="w-5 h-5" />, title: 'Verified Inspections', desc: 'Professional vehicle inspections with certified reports.' },
              { icon: <TrendingDown className="w-5 h-5" />, title: 'Fair Price Estimate', desc: 'AI estimates fair market value so you never overpay.' },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="flex gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg flex items-center justify-center shrink-0">{icon}</div>
                <div><p className="font-semibold mb-1">{title}</p><p className="text-primary-300 text-sm">{desc}</p></div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sell CTA */}
      <section className="max-w-7xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-primary-600 to-primary-800 rounded-2xl p-8 md:p-12 text-white text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Ready to Sell Your Car?</h2>
          <p className="text-primary-200 mb-6">List for free. Reach thousands of buyers across the Philippines.</p>
          <Link to="/register" className="inline-flex items-center gap-2 bg-white text-primary-700 hover:bg-gray-50 font-bold px-8 py-3 rounded-xl transition-colors">
            Post Your Car <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
