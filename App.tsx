
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import CreatorOnboarding from './pages/creator/Onboarding';
import ClientOnboarding from './pages/client/ClientOnboarding';
import ClientDashboard from './pages/client/ClientDashboard';
import Profile from './pages/creator/Profile';
import Dashboard from './pages/creator/Dashboard';
import Contracts from './pages/creator/Contracts';
import ContractDetail from './pages/creator/ContractDetail';
import Settings from './pages/creator/Settings';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 dark:text-white">Loading...</div>;
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/profile/:id" element={<Profile />} />
            
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
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;