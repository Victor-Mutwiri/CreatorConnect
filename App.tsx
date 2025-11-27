
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import TermsAndConditions from './pages/legal/TermsAndConditions';
import CreatorOnboarding from './pages/creator/Onboarding';
import ClientOnboarding from './pages/client/ClientOnboarding';
import ClientDashboard from './pages/client/ClientDashboard';
import ClientPublicProfile from './pages/client/Profile';
import CreateContract from './pages/client/CreateContract';
import ClientSettings from './pages/client/Settings';
import Profile from './pages/creator/Profile';
import Dashboard from './pages/creator/Dashboard';
import Contracts from './pages/creator/Contracts';
import ContractDetail from './pages/creator/ContractDetail';
import Settings from './pages/creator/Settings';
import Notifications from './pages/Notifications';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import FraudWarningModal from './components/FraudWarningModal';
import { UserRole } from './types';

// Protected Route Wrapper
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 dark:text-white">Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Prevent Admin from accessing regular dashboard
  if (user.role === UserRole.ADMIN) {
    return <Navigate to="/portal/8f030ac9-93da-41cc-af88-d9342cd54e5d" replace />;
  }

  // STRICT ONBOARDING CHECK
  if (!user.onboardingCompleted && !location.pathname.includes('onboarding')) {
     if (user.role === UserRole.CLIENT) {
       return <Navigate to="/client/onboarding" replace />;
     } else if (user.role === UserRole.CREATOR) {
       return <Navigate to="/creator/onboarding" replace />;
     }
  }

  return <>{children}</>;
};

// Admin Guard
const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-black text-green-500">Authenticating...</div>;
  
  if (!user || user.role !== UserRole.ADMIN) {
    // If not admin, redirect to generic 404 or home to avoid leakage
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          {/* Global Fraud Warning Modal - Renders if user is logged in but hasn't signed */}
          <FraudWarningModal />
          
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/legal/terms" element={<TermsAndConditions />} />
            
            <Route path="/profile/:id" element={<Profile />} />
            <Route path="/p/:username" element={<Profile />} />
            <Route path="/client/profile/:id" element={<ClientPublicProfile />} />
            
            {/* Secret Admin Routes */}
            <Route path="/portal/access-control" element={<AdminLogin />} />
            <Route 
              path="/portal/8f030ac9-93da-41cc-af88-d9342cd54e5d" 
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              } 
            />

            <Route 
              path="/notifications" 
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              } 
            />

            {/* Creator Routes */}
            <Route 
              path="/creator/onboarding" 
              element={
                <ProtectedRoute>
                  <CreatorOnboarding />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/creator/dashboard" 
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/creator/contracts" 
              element={
                <ProtectedRoute>
                  <Contracts />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/creator/contracts/:id" 
              element={
                <ProtectedRoute>
                  <ContractDetail />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/creator/settings" 
              element={
                <ProtectedRoute>
                  <Settings />
                </ProtectedRoute>
              } 
            />

            {/* Client Routes */}
            <Route 
              path="/client/onboarding" 
              element={
                <ProtectedRoute>
                  <ClientOnboarding />
                </ProtectedRoute>
              } 
            />
             <Route 
              path="/client/dashboard" 
              element={
                <ProtectedRoute>
                  <ClientDashboard />
                </ProtectedRoute>
              } 
            />
             <Route 
              path="/client/create-contract/:creatorId" 
              element={
                <ProtectedRoute>
                  <CreateContract />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/client/settings" 
              element={
                <ProtectedRoute>
                  <ClientSettings />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
