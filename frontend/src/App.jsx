import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { ProtectedRoute } from './components/ProtectedRoute.jsx';
import { MainLayout } from './layouts/MainLayout.jsx';
import { ContractsPage } from './pages/ContractsPage.jsx';
import { ChangePasswordPage } from './pages/ChangePasswordPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { PaymentsPage } from './pages/PaymentsPage.jsx';
import { RoomsPage } from './pages/RoomsPage.jsx';
import { TenantsPage } from './pages/TenantsPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/change-password" element={<ChangePasswordPage />} />
        <Route element={<MainLayout />}>
          <Route path="/" element={<DashboardPage />} />
          <Route path="/rooms" element={<RoomsPage />} />
          <Route path="/tenants" element={<TenantsPage />} />
          <Route path="/contracts" element={<ContractsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
