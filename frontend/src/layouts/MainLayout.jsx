import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header.jsx';
import { Sidebar } from '../components/Sidebar.jsx';

export function MainLayout() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-column">
        <Header />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
