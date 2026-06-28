import React from 'react';
import { NavLink } from 'react-router-dom';

export function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">Smart Rental</div>
      <nav className="nav">
        <NavLink to="/">Tổng quan</NavLink>
        <NavLink to="/rooms">Phòng</NavLink>
        <NavLink to="/tenants">Khách thuê</NavLink>
        <NavLink to="/contracts">Hợp đồng</NavLink>
        <NavLink to="/login">Đăng nhập</NavLink>
      </nav>
    </aside>
  );
}
