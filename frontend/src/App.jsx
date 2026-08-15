import React, { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { ConfirmProvider } from './components/ConfirmProvider.jsx';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { ToastProvider } from './components/ToastProvider.jsx';
import { MainLayout } from './layouts/MainLayout.jsx';
import { ContractsPage } from './pages/ContractsPage.jsx';
import { ChangePasswordPage } from './pages/ChangePasswordPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { HelpSupportPage } from './pages/HelpSupportPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { PaymentsPage } from './pages/PaymentsPage.jsx';
import { RoomsPage } from './pages/RoomsPage.jsx';
import { ServicesPage } from './pages/ServicesPage.jsx';
import { SettingsPage } from './pages/SettingsPage.jsx';
import { TenantsPage } from './pages/TenantsPage.jsx';
import { TenantPortalPage } from './pages/TenantPortalPage.jsx';
import { applyPreferences, loadPreferences } from './services/preferences.js';
import { getStoredUser } from './services/sessionStorage.js';

function RoleHome() {
  const user = getStoredUser();

  if (user?.role === 'tenant') {
    return <Navigate to="/tenant-portal" replace />;
  }

  return <DashboardPage />;
}

export default function App() {
  useEffect(() => {
    applyPreferences(loadPreferences());
  }, []);

  return (
    <ToastProvider>
      <ConfirmProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/change-password" element={<ChangePasswordPage />} />
            <Route element={<MainLayout />}>
              <Route path="/" element={<RoleHome />} />
              <Route element={<ProtectedRoute allowedRoles={['tenant']} />}>
                <Route path="/tenant-portal" element={<TenantPortalPage />} />
                <Route
                  path="/tenant-portal/billing"
                  element={<TenantPortalPage defaultTab="billing" />}
                />
              </Route>
              <Route element={<ProtectedRoute allowedRoles={['landlord']} />}>
                <Route path="/rooms" element={<RoomsPage />} />
                <Route path="/tenants" element={<TenantsPage />} />
                <Route path="/contracts" element={<ContractsPage />} />
                <Route path="/payments" element={<PaymentsPage />} />
                <Route path="/services" element={<ServicesPage />} />
              </Route>
              <Route path="/help" element={<HelpSupportPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Routes>
      </ConfirmProvider>
    </ToastProvider>
  );
}
