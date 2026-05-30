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
          <Route path="/dealer" element={<ProtectedRoute roles={['dealer', 'admin']}><DealerPanel /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminPanel /></ProtectedRoute>} />
          <Route path="/inspections" element={<ProtectedRoute><Inspections /></ProtectedRoute>} />
          <Route path="/financing" element={<Financing />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="bg-gray-900 text-gray-400 py-8 mt-auto">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm">
          <p className="font-semibold text-white mb-1">AutoBenta PH</p>
          <p>The Philippines' trusted new &amp; used car marketplace. © {new Date().getFullYear()}</p>
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
