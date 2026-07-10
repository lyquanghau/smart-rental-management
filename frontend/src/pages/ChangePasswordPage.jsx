import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { changePassword } from '../services/authService.js';
import { getStoredUser, getToken } from '../services/sessionStorage.js';

const emptyForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

function validateForm(form) {
  if (!form.currentPassword) return 'Vui lòng nhập mật khẩu hiện tại.';
  if (form.newPassword.length < 8) {
    return 'Mật khẩu mới phải có ít nhất 8 ký tự.';
  }
  if (form.newPassword !== form.confirmPassword) {
    return 'Xác nhận mật khẩu mới không khớp.';
  }
  if (form.currentPassword === form.newPassword) {
    return 'Mật khẩu mới phải khác mật khẩu hiện tại.';
  }

  return '';
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

export function ChangePasswordPage() {
  const navigate = useNavigate();
  const user = getStoredUser();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!getToken()) {
    return <Navigate to="/login" replace />;
  }

  function updateField(field, value) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateForm(form);

    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="form-page">
        <h1>Đổi mật khẩu</h1>
        {user?.mustChangePassword ? (
          <p className="warning-message">
            Mật khẩu tạm cần đổi trước ngày{' '}
            {formatDate(user.temporaryPasswordExpiresAt)} để tránh bị khóa tài
            khoản.
          </p>
        ) : null}
        <form className="form-panel" onSubmit={handleSubmit}>
          <label>
            Mật khẩu hiện tại
            <input
              required
              type="password"
              value={form.currentPassword}
              onChange={(event) =>
                updateField('currentPassword', event.target.value)
              }
            />
          </label>

          <label>
            Mật khẩu mới
            <input
              minLength="8"
              required
              type="password"
              value={form.newPassword}
              onChange={(event) =>
                updateField('newPassword', event.target.value)
              }
            />
            <span className="field-help">Tối thiểu 8 ký tự.</span>
          </label>

          <label>
            Xác nhận mật khẩu mới
            <input
              minLength="8"
              required
              type="password"
              value={form.confirmPassword}
              onChange={(event) =>
                updateField('confirmPassword', event.target.value)
              }
            />
          </label>

          {error ? <p className="error-message">{error}</p> : null}

          <div className="form-actions">
            <button disabled={isSubmitting} type="submit">
              {isSubmitting ? 'Đang lưu...' : 'Đổi mật khẩu'}
            </button>
            <Link className="secondary-link" to="/">
              Quay lại
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
