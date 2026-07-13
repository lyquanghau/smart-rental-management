import React from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from '../components/Header.jsx';
import { Sidebar } from '../components/Sidebar.jsx';

export function MainLayout() {
  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Bỏ qua menu
      </a>
      <Sidebar />
      <div className="main-column">
        <Header />
        <main className="content" id="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
