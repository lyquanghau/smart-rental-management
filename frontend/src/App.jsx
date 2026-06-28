import React from 'react';
import { Route, Routes } from 'react-router-dom';
import { MainLayout } from './layouts/MainLayout.jsx';
import { ContractsPage } from './pages/ContractsPage.jsx';
import { DashboardPage } from './pages/DashboardPage.jsx';
import { LoginPage } from './pages/LoginPage.jsx';
import { RoomsPage } from './pages/RoomsPage.jsx';
import { TenantsPage } from './pages/TenantsPage.jsx';

export default function App() {
  return (
    <Routes>
      <Route element={<MainLayout />}>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/rooms" element={<RoomsPage />} />
        <Route path="/tenants" element={<TenantsPage />} />
        <Route path="/contracts" element={<ContractsPage />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>
    </Routes>
  );
}
