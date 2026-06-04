import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import MobileBottomNav from './components/MobileBottomNav';
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
import SavedVehicles from './pages/SavedVehicles';
import InquiryHistory from './pages/InquiryHistory';
import AccountSettings from './pages/AccountSettings';
import InspectionReport from './pages/InspectionReport';
import NotificationsCenter from './pages/NotificationsCenter';
import ActiveOffers from './pages/ActiveOffers';
import HelpCenter from './pages/HelpCenter';
import SellerProfile from './pages/SellerProfile';
import MessageThread from './pages/MessageThread';
import PromoteListing from './pages/PromoteListing';
import EditListing from './pages/EditListing';
import ReportDispute from './pages/ReportDispute';
import Verification from './pages/Verification';
import VehicleDocumentVerification from './pages/VehicleDocumentVerification';
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
import DealerIntegrations from './pages/dealer/DealerIntegrations';
import NetworkDashboard from './pages/admin/NetworkDashboard';
import RevenueInsights from './pages/admin/RevenueInsights';
import ForDealers from './pages/ForDealers';
import FoundingDealer from './pages/FoundingDealer';
import FoundingDealersCRM from './pages/admin/FoundingDealersCRM';
import GrowthDashboard from './pages/admin/GrowthDashboard';
import ClosingCenter from './pages/admin/ClosingCenter';
import OnboardingCenter from './pages/admin/OnboardingCenter';
import DealerSuccess from './pages/admin/DealerSuccess';
import BookDemo from './pages/BookDemo';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import DealerAgreement from './pages/DealerAgreement';

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
          <Route path="/listings/:id/edit" element={<ProtectedRoute roles={['seller', 'dealer', 'admin']}><EditListing /></ProtectedRoute>} />
          <Route path="/listings/:listingId/documents" element={<ProtectedRoute roles={['seller', 'dealer', 'admin']}><VehicleDocumentVerification /></ProtectedRoute>} />
          <Route path="/compare" element={<Compare />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/sell" element={<ProtectedRoute roles={['seller', 'dealer', 'admin']}><Sell /></ProtectedRoute>} />
          <Route path="/ai-wizard" element={<ProtectedRoute roles={['seller', 'dealer', 'admin']}><AIListingWizard /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/saved" element={<ProtectedRoute><SavedVehicles /></ProtectedRoute>} />
          <Route path="/inquiries" element={<ProtectedRoute><InquiryHistory /></ProtectedRoute>} />
          <Route path="/account" element={<ProtectedRoute><AccountSettings /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><NotificationsCenter /></ProtectedRoute>} />
          <Route path="/offers" element={<ProtectedRoute><ActiveOffers /></ProtectedRoute>} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/seller/:id" element={<SellerProfile />} />
          <Route path="/messages/:id" element={<ProtectedRoute><MessageThread /></ProtectedRoute>} />
          <Route path="/promote/:listingId" element={<ProtectedRoute roles={['dealer', 'admin']}><PromoteListing /></ProtectedRoute>} />
          <Route path="/report-dispute" element={<ReportDispute />} />
          <Route path="/verification" element={<ProtectedRoute><Verification /></ProtectedRoute>} />
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
            <Route path="integrations" element={<DealerIntegrations />} />
          </Route>
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />
          <Route path="/admin/dealers" element={<ProtectedRoute roles={['admin']}><DealerOperations /></ProtectedRoute>} />
          <Route path="/admin/revenue" element={<ProtectedRoute roles={['admin']}><RevenueInsights /></ProtectedRoute>} />
          <Route path="/inspection-services" element={<InspectionServices />} />
          <Route path="/inspections" element={<ProtectedRoute><Inspections /></ProtectedRoute>} />
          <Route path="/inspections/:id" element={<ProtectedRoute><InspectionReport /></ProtectedRoute>} />
          <Route path="/financing" element={<Financing />} />
          <Route path="/ownership-transfer" element={<OwnershipTransfer />} />
          <Route path="/insurance" element={<Insurance />} />
          <Route path="/safe-buying" element={<SafeBuying />} />
          <Route path="/for-dealers" element={<ForDealers />} />
          <Route path="/for-dealers/founding" element={<FoundingDealer />} />
          <Route path="/admin/founding-dealers" element={<ProtectedRoute roles={['admin']}><FoundingDealersCRM /></ProtectedRoute>} />
          <Route path="/admin/growth" element={<ProtectedRoute roles={['admin']}><GrowthDashboard /></ProtectedRoute>} />
          <Route path="/admin/closing" element={<ProtectedRoute roles={['admin']}><ClosingCenter /></ProtectedRoute>} />
          <Route path="/admin/onboarding" element={<ProtectedRoute roles={['admin']}><OnboardingCenter /></ProtectedRoute>} />
          <Route path="/admin/dealer-success" element={<ProtectedRoute roles={['admin']}><DealerSuccess /></ProtectedRoute>} />
          <Route path="/admin/network" element={<ProtectedRoute roles={['admin']}><NetworkDashboard /></ProtectedRoute>} />
          <Route path="/book-demo" element={<BookDemo />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/dealer-agreement" element={<DealerAgreement />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
      <MobileBottomNav />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </ThemeProvider>
  );
}
