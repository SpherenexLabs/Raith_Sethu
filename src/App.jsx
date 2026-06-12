import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ErrorBoundary from './components/ErrorBoundary';
import Home from './pages/Home';
import Login from './pages/Login';
import CropPlanning from './pages/CropPlanning';
import Analytics from './pages/Analytics';
import Marketplace from './pages/Marketplace';
import Profile from './pages/Profile';
import VoiceSupport from './pages/VoiceSupport';
import MarketIntelligence from './pages/MarketIntelligence';
import BuyerDashboard from './pages/BuyerDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import TrustCenter from './pages/TrustCenter';
import AdminDashboard from './pages/AdminDashboard';
import Chat from './pages/Chat';
import FarmingActivity from './pages/FarmingActivity';
import InputMarketplace from './pages/InputMarketplace';
import EquipmentRental from './pages/EquipmentRental';
import GovernmentSchemes from './pages/GovernmentSchemes';
import CropInsurance from './pages/CropInsurance';
import FarmerMapping from './pages/FarmerMapping';
import FarmerDashboard from './pages/FarmerDashboard';
import { getDashboardPath } from './utils/roleDashboard';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();
  
  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to={getDashboardPath('admin')} replace />;
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

const HomeRoute = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (isAuthenticated && user?.role === 'admin') {
    return <Navigate to={getDashboardPath('admin')} replace />;
  }

  return <Home />;
};

// Redirects user to their role-specific dashboard if they try to access the wrong one
const RoleProtectedRoute = ({ children, allowedRoles }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const role = user?.role;

  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={getDashboardPath(role)} replace />;
  }

  return children;
};

const DashboardRedirect = () => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <Navigate to={getDashboardPath(user?.role)} replace />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <LanguageProvider>
          <div className="app">
            <Navbar />
            <main className="main-content">
              <ErrorBoundary>
              <Routes>
                <Route path="/" element={<HomeRoute />} />
                <Route path="/login" element={<Login />} />
                <Route path="/dashboard" element={<DashboardRedirect />} />
                <Route
                  path="/farmer-dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['farmer']}>
                      <FarmerDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/crop-planning"
                  element={
                    <RoleProtectedRoute allowedRoles={['farmer', 'admin']}>
                      <CropPlanning />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/analytics"
                  element={
                    <RoleProtectedRoute allowedRoles={['farmer', 'admin']}>
                      <Analytics />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/marketplace"
                  element={
                    <ProtectedRoute>
                      <Marketplace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/voice-support"
                  element={
                    <ProtectedRoute>
                      <VoiceSupport />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/market-intelligence"
                  element={
                    <ProtectedRoute>
                      <MarketIntelligence />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/buyer-dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['buyer']}>
                      <BuyerDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/customer-dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['customer']}>
                      <CustomerDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/trust-center"
                  element={
                    <ProtectedRoute>
                      <TrustCenter />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/chat"
                  element={
                    <ProtectedRoute>
                      <Chat />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/farming-activity"
                  element={
                    <RoleProtectedRoute allowedRoles={['farmer', 'admin']}>
                      <FarmingActivity />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/input-marketplace"
                  element={
                    <ProtectedRoute>
                      <InputMarketplace />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/equipment-rental"
                  element={
                    <ProtectedRoute>
                      <EquipmentRental />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/government-schemes"
                  element={
                    <ProtectedRoute>
                      <GovernmentSchemes />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/crop-insurance"
                  element={
                    <RoleProtectedRoute allowedRoles={['farmer', 'admin']}>
                      <CropInsurance />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/farmer-mapping"
                  element={
                    <RoleProtectedRoute allowedRoles={['buyer', 'customer', 'admin']}>
                      <FarmerMapping />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </RoleProtectedRoute>
                  }
                />
                <Route
                  path="/admin-dashboard"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin']}>
                      <AdminDashboard />
                    </RoleProtectedRoute>
                  }
                />
              </Routes>
              </ErrorBoundary>
            </main>
            <Footer />
          </div>
        </LanguageProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
