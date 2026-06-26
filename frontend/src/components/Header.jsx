import React from 'react';
import { logout } from '../services/authService.js';
import { getStoredUser } from '../services/sessionStorage.js';

export function Header() {
  const user = getStoredUser();

  function handleLogout() {
    logout();
    window.location.href = '/login';
  }

  return (
    <header className="topbar">
      <div>
        <span className="eyebrow">Smart Rental</span>
        <strong>Quản lý phòng trọ</strong>
      </div>
      {user ? (
        <div className="user-menu">
          <span>{user.fullName}</span>
          <button type="button" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      ) : null}
    </header>
  );
}
