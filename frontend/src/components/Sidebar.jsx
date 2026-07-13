import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Building2,
  CreditCard,
  FileText,
  LayoutDashboard,
  Users,
  DoorOpen,
} from 'lucide-react';

const mainLinks = [
  { to: '/', label: 'Tổng quan', icon: LayoutDashboard },
  { to: '/rooms', label: 'Phòng', icon: DoorOpen },
  { to: '/tenants', label: 'Khách thuê', icon: Users },
];

const financeLinks = [
  { to: '/contracts', label: 'Hợp đồng', icon: FileText },
  { to: '/payments', label: 'Thanh toán', icon: CreditCard },
];

function NavItem({ to, label, icon: Icon }) {
  return (
    <NavLink to={to}>
      <Icon aria-hidden="true" size={18} strokeWidth={2.2} />
      <span>{label}</span>
    </NavLink>
  );
}

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-mark" aria-hidden="true">
          <Building2 size={22} strokeWidth={2.3} />
        </span>
        <div>
          <strong>Smart Rental</strong>
          <span>Quản lý nhà trọ</span>
        </div>
      </div>
      <nav className="nav" aria-label="Điều hướng chính">
        <span className="nav-section">Vận hành</span>
        {mainLinks.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
        <span className="nav-section">Hồ sơ & thu tiền</span>
        {financeLinks.map((item) => (
          <NavItem key={item.to} {...item} />
        ))}
      </nav>
    </aside>
  );
}
