import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  CircleHelp,
  CreditCard,
  DoorOpen,
  FileText,
  LayoutDashboard,
  LogOut,
  Settings,
  Users,
} from 'lucide-react';
import { logout } from '../services/authService.js';
import { getStoredUser } from '../services/sessionStorage.js';
import { usePreferences } from '../hooks/usePreferences.js';
import smartRentalMark from '../assets/brand/smart-rental-mark.svg';

const mainLinks = [
  { to: '/', labelKey: 'overview', icon: LayoutDashboard },
  { to: '/rooms', labelKey: 'rooms', icon: DoorOpen },
  { to: '/tenants', labelKey: 'tenants', icon: Users },
];

const financeLinks = [
  { to: '/contracts', labelKey: 'contracts', icon: FileText },
  { to: '/payments', labelKey: 'payments', icon: CreditCard },
];

const utilityLinks = [
  { to: '/help', labelKey: 'help', icon: CircleHelp },
  { to: '/settings', labelKey: 'settings', icon: Settings },
];

const labels = {
  en: {
    account: 'Account',
    brandSubtitle: 'Rental management',
    finance: 'Records & Billing',
    help: 'Help & Support',
    mainNav: 'Main navigation',
    operations: 'Operations',
    overview: 'Overview',
    rooms: 'Rooms',
    tenants: 'Tenants',
    contracts: 'Contracts',
    payments: 'Payments',
    settings: 'Settings',
    signOut: 'Sign out',
    utilityNav: 'Help and settings',
  },
  vi: {
    account: 'Tài khoản',
    brandSubtitle: 'Quản lý nhà trọ',
    finance: 'Hồ sơ & thu tiền',
    help: 'Trợ giúp & Hỗ trợ',
    mainNav: 'Điều hướng chính',
    operations: 'Vận hành',
    overview: 'Tổng quan',
    rooms: 'Phòng',
    tenants: 'Khách thuê',
    contracts: 'Hợp đồng',
    payments: 'Thanh toán',
    settings: 'Cài đặt',
    signOut: 'Đăng xuất',
    utilityNav: 'Hỗ trợ và cài đặt',
  },
};

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink to={to}>
      <Icon aria-hidden="true" size={18} strokeWidth={2.4} />
      <span>{label}</span>
    </NavLink>
  );
}

export function Sidebar({ isCollapsed, onToggle }) {
  const user = getStoredUser();
  const { language } = usePreferences();
  const text = labels[language] || labels.vi;
  const toggleLabel = isCollapsed ? 'Mở thanh bên' : 'Thu gọn thanh bên';
  const toggleIcon = isCollapsed ? 'arrow_forward' : 'arrow_back';

  function handleLogout() {
    logout();
    window.location.href = '/login';
  }

  return (
    <aside className={`sidebar ${isCollapsed ? 'is-collapsed' : ''}`}>
      <div className="sidebar-main">
        <div className="brand">
          <button
            aria-label={toggleLabel}
            className="brand-logo-action"
            title={isCollapsed ? toggleLabel : undefined}
            type="button"
            onClick={isCollapsed ? onToggle : undefined}
          >
            <img
              className="brand-mark brand-logo-mark"
              src={smartRentalMark}
              alt=""
              aria-hidden="true"
            />
            <span
              aria-hidden="true"
              className="material-symbols-outlined brand-dock-icon"
            >
              {toggleIcon}
            </span>
          </button>
          <div className="brand-copy">
            <strong>Smart Rental</strong>
          </div>
          <button
            aria-label={toggleLabel}
            className="sidebar-toggle-button"
            title={toggleLabel}
            type="button"
            onClick={onToggle}
          >
            <span aria-hidden="true" className="material-symbols-outlined">
              {toggleIcon}
            </span>
          </button>
        </div>
        <nav className="nav" aria-label={text.mainNav}>
          <span className="nav-section">{text.operations}</span>
          {mainLinks.map((item) => (
            <NavItem key={item.to} {...item} label={text[item.labelKey]} />
          ))}
          <span className="nav-section">{text.finance}</span>
          {financeLinks.map((item) => (
            <NavItem key={item.to} {...item} label={text[item.labelKey]} />
          ))}
        </nav>
      </div>

      <div className="sidebar-bottom">
        <nav className="nav sidebar-utility-nav" aria-label={text.utilityNav}>
          {utilityLinks.map((item) => (
            <NavItem key={item.to} {...item} label={text[item.labelKey]} />
          ))}
        </nav>
        <button
          className="sidebar-account-button"
          type="button"
          onClick={handleLogout}
        >
          <span>
            <strong>{user?.fullName || text.account}</strong>
            <small>{text.signOut}</small>
          </span>
          <LogOut aria-hidden="true" size={17} strokeWidth={2.5} />
        </button>
        <div className="sidebar-footer">
          <span>© 2026 Smart Rental</span>
          <strong>Design by Quang Hau</strong>
        </div>
      </div>
    </aside>
  );
}
