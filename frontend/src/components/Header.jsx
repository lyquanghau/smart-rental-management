import React from 'react';
import { Link } from 'react-router-dom';
import { KeyRound, LogOut } from 'lucide-react';
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
        <span className="eyebrow">Bảng điều hành</span>
        <strong>Vận hành khu trọ hôm nay</strong>
      </div>
      {user ? (
        <div className="user-menu">
          {passwordWarning ? (
            <Link className="password-warning" to="/change-password">
              {passwordWarning}
            </Link>
          ) : null}
          <span className="user-chip">{user.fullName}</span>
          <Link className="secondary-link" to="/change-password">
            <KeyRound className="link-icon" size={16} strokeWidth={2.5} />
            Đổi mật khẩu
          </Link>
          <button type="button" onClick={handleLogout}>
            <LogOut className="button-icon" size={16} strokeWidth={2.5} />
            Đăng xuất
          </button>
        </div>
      ) : null}
    </header>
  );
}
