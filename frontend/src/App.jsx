import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Browse from './pages/Browse';
import CarDetail from './pages/CarDetail';
import Sell from './pages/Sell';
import Dashboard from './pages/Dashboard';
import DealerPanel from './pages/DealerPanel';
import AdminPanel from './pages/AdminPanel';
import Inspections from './pages/Inspections';
import Financing from './pages/Financing';
import Compare from './pages/Compare';
import Login from './pages/Login';
import Register from './pages/Register';
import AIListingWizard from './pages/AIListingWizard';
import OwnershipTransfer from './pages/OwnershipTransfer';
import Insurance from './pages/Insurance';
import SafeBuying from './pages/SafeBuying';
import InspectionServices from './pages/InspectionServices';
import DealerLayout from './pages/dealer/DealerLayout';
import DealerDashboard from './pages/dealer/DealerDashboard';
import DealerLeads from './pages/dealer/DealerLeads';
import DealerListings from './pages/dealer/DealerListings';
import DealerAnalytics from './pages/dealer/DealerAnalytics';
import DealerSettings from './pages/dealer/DealerSettings';
import DealerSubscription from './pages/dealer/DealerSubscription';
import DealerApply from './pages/dealer/DealerApply';
import DealerOnboarding from './pages/dealer/DealerOnboarding';
import DealerOperations from './pages/admin/DealerOperations';
import DealerCustomers from './pages/dealer/DealerCustomers';
import DealerFeatured from './pages/dealer/DealerFeatured';
import RevenueInsights from './pages/admin/RevenueInsights';

function ProtectedRoute({ children, roles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600" /></div>;
  if (!user) return <Navigate to="/login" replace />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/dashboard" replace />;
  return children;
}

function AppRoutes() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/cars" element={<Browse />} />
          <Route path="/cars/:id" element={<CarDetail />} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/sell" element={<ProtectedRoute roles={['seller', 'dealer', 'admin']}><Sell /></ProtectedRoute>} />
          <Route path="/ai-wizard" element={<ProtectedRoute roles={['seller', 'dealer', 'admin']}><AIListingWizard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/dealer-panel" element={<ProtectedRoute roles={['dealer', 'admin']}><DealerPanel /></ProtectedRoute>} />
          <Route path="/dealer/apply" element={<ProtectedRoute><DealerApply /></ProtectedRoute>} />
          <Route path="/dealer" element={<ProtectedRoute roles={['dealer', 'admin']}><DealerLayout /></ProtectedRoute>}>
            <Route index element={<DealerDashboard />} />
            <Route path="leads" element={<DealerLeads />} />
            <Route path="listings" element={<DealerListings />} />
            <Route path="analytics" element={<DealerAnalytics />} />
            <Route path="settings" element={<DealerSettings />} />
            <Route path="subscription" element={<DealerSubscription />} />
            <Route path="onboarding" element={<DealerOnboarding />} />
            <Route path="customers" element={<DealerCustomers />} />
            <Route path="featured" element={<DealerFeatured />} />
          </Route>
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/dealers" element={<ProtectedRoute roles={['admin']}><DealerOperations /></ProtectedRoute>} />
          <Route path="/admin/revenue" element={<ProtectedRoute roles={['admin']}><RevenueInsights /></ProtectedRoute>} />
          <Route path="/inspection-services" element={<InspectionServices />} />
          <Route path="/inspections" element={<ProtectedRoute><Inspections /></ProtectedRoute>} />
          <Route path="/financing" element={<Financing />} />
          <Route path="/ownership-transfer" element={<OwnershipTransfer />} />
          <Route path="/insurance" element={<Insurance />} />
          <Route path="/safe-buying" element={<SafeBuying />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="bg-gray-900 text-gray-400 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 mb-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Buy</p>
              <ul className="space-y-2 text-sm">
                <li><a href="/cars" className="hover:text-white transition-colors">Browse Cars</a></li>
                <li><a href="/safe-buying" className="hover:text-white transition-colors">Safe Buying Guide</a></li>
                <li><a href="/inspection-services" className="hover:text-white transition-colors">Book Inspection</a></li>
                <li><a href="/financing" className="hover:text-white transition-colors">Car Financing</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Transfer</p>
              <ul className="space-y-2 text-sm">
                <li><a href="/ownership-transfer" className="hover:text-white transition-colors">Ownership Transfer</a></li>
                <li><a href="/insurance" className="hover:text-white transition-colors">Motor Insurance</a></li>
                <li><a href="/ownership-transfer#checklist" className="hover:text-white transition-colors">Transfer Checklist</a></li>
                <li><a href="/ownership-transfer#estimator" className="hover:text-white transition-colors">Cost Estimator</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Sell</p>
              <ul className="space-y-2 text-sm">
                <li><a href="/sell" className="hover:text-white transition-colors">List Your Car</a></li>
                <li><a href="/dashboard" className="hover:text-white transition-colors">My Listings</a></li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Company</p>
              <ul className="space-y-2 text-sm">
                <li><a href="/#how-it-works" className="hover:text-white transition-colors">How It Works</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
            <p className="font-semibold text-white">AutoBenta<span className="text-blue-400">PH</span></p>
            <p>The Philippines&apos; trusted new &amp; used car marketplace. © {new Date().getFullYear()}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
