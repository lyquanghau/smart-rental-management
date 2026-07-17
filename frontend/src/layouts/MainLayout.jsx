import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Header } from '../components/Header.jsx';
import { Sidebar } from '../components/Sidebar.jsx';
import { usePreferences } from '../hooks/usePreferences.js';

export function MainLayout() {
  const { language } = usePreferences();
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(() => {
    return localStorage.getItem('smart-rental-sidebar-collapsed') === 'true';
  });

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [location.pathname]);

  function toggleSidebar() {
    setIsSidebarCollapsed((currentValue) => {
      const nextValue = !currentValue;
      localStorage.setItem('smart-rental-sidebar-collapsed', String(nextValue));
      return nextValue;
    });
  }

  return (
    <div
      className={`app-shell ${isSidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}
    >
      <a className="skip-link" href="#main-content">
        {language === 'en' ? 'Skip navigation' : 'Bỏ qua menu'}
      </a>
      <Sidebar isCollapsed={isSidebarCollapsed} onToggle={toggleSidebar} />
      <div className="main-column">
        <Header />
        <main
          className="content route-transition"
          id="main-content"
          key={location.pathname}
        >
          <Outlet />
        </main>
      </div>
    </div>
  );
}
