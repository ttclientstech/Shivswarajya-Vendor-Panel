import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Onboarding } from './pages/Onboarding';
import { Profile } from './pages/Profile';
import { Maintenance } from './pages/Maintenance';

import { Categories } from './pages/Categories';
import { Orders } from './pages/Orders';
import { OrderDetail } from './pages/OrderDetail';

import { Layout } from './components/Layout';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { MobileDisclaimer } from './components/MobileDisclaimer';

function App() {
  const [isMobile, setIsMobile] = useState(false);
  const isMaintenanceMode = true; // Set to true to enable maintenance mode

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1280);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (isMaintenanceMode) {
    return (
      <Router>
        <Routes>
          <Route path="*" element={<Maintenance />} />
        </Routes>
      </Router>
    );
  }

  if (isMobile) {
    return <MobileDisclaimer />;
  }

  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Routes with Layout */}
          {/* Protected Routes with Layout */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/orders" element={
            <ProtectedRoute>
              <Layout>
                <Orders />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/orders/:orderId" element={
            <ProtectedRoute>
              <Layout>
                <OrderDetail />
              </Layout>
            </ProtectedRoute>
          } />

          <Route path="/categories" element={
            <ProtectedRoute>
              <Layout>
                <Categories />
              </Layout>
            </ProtectedRoute>
          } />



          <Route path="/profile" element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          } />



          <Route path="/onboarding" element={
            <ProtectedRoute>
              <Onboarding />
            </ProtectedRoute>
          } />

          {/* Redirect empty path to login for now */}
          <Route path="/" element={<Navigate to="/login" replace />} />

          {/* Fallback for other routes - Debugging */}
          <Route path="*" element={<div className="p-10 text-center">
            <h1 className="text-2xl font-bold">404 - Page Not Found</h1>
            <p className="mt-2 text-gray-600">Current Path: {window.location.pathname}</p>
            <a href="/login" className="text-orange-600 underline mt-4 inline-block">Go to Login</a>
          </div>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
