import React from 'react';
import { Link } from 'react-router-dom';
import { logout } from '../services/authService.js';
import { getStoredUser } from '../services/sessionStorage.js';

function getPasswordWarning(user) {
  if (!user?.mustChangePassword || !user.temporaryPasswordExpiresAt) return '';

  const expiresAt = new Date(user.temporaryPasswordExpiresAt);
  const remainingMs = expiresAt.getTime() - Date.now();
  const remainingDays = Math.max(Math.ceil(remainingMs / 86400000), 0);

  if (remainingDays <= 0) {
    return 'Mật khẩu tạm đã quá hạn, tài khoản sẽ bị khóa.';
  }

  return `Mật khẩu tạm còn ${remainingDays} ngày để đổi.`;
}

export function Header() {
  const user = getStoredUser();
  const passwordWarning = getPasswordWarning(user);

  function handleLogout() {
    logout();
    window.location.href = '/login';
  }

  return (
    <header className="topbar">
      <div>
        <span className="eyebrow">Quản lý phòng trọ thông minh</span>
        <strong>Quản lý phòng trọ</strong>
      </div>
      {user ? (
        <div className="user-menu">
          {passwordWarning ? (
            <Link className="password-warning" to="/change-password">
              {passwordWarning}
            </Link>
          ) : null}
          <span>{user.fullName}</span>
          <Link className="secondary-link" to="/change-password">
            Đổi mật khẩu
          </Link>
          <button type="button" onClick={handleLogout}>
            Đăng xuất
          </button>
        </div>
      ) : null}
    </header>
  );
}
