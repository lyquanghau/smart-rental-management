import React, { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { usePreferences } from '../hooks/usePreferences.js';
import { changePassword } from '../services/authService.js';
import { getStoredUser, getToken } from '../services/sessionStorage.js';

const emptyForm = {
  currentPassword: '',
  newPassword: '',
  confirmPassword: '',
};

const copy = {
  en: {
    back: 'Back',
    changePassword: 'Change password',
    confirm: 'Confirm new password',
    current: 'Current password',
    currentRequired: 'Please enter your current password.',
    mismatch: 'The password confirmation does not match.',
    minHelp: 'At least 8 characters.',
    minLength: 'The new password must be at least 8 characters.',
    mustDiffer: 'The new password must be different from the current password.',
    newPassword: 'New password',
    saving: 'Saving...',
    temporaryWarning: (date) =>
      `Temporary password must be changed before ${date} to avoid account lockout.`,
  },
  vi: {
    back: 'Quay lại',
    changePassword: 'Đổi mật khẩu',
    confirm: 'Xác nhận mật khẩu mới',
    current: 'Mật khẩu hiện tại',
    currentRequired: 'Vui lòng nhập mật khẩu hiện tại.',
    mismatch: 'Xác nhận mật khẩu mới không khớp.',
    minHelp: 'Tối thiểu 8 ký tự.',
    minLength: 'Mật khẩu mới phải có ít nhất 8 ký tự.',
    mustDiffer: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
    newPassword: 'Mật khẩu mới',
    saving: 'Đang lưu...',
    temporaryWarning: (date) =>
      `Mật khẩu tạm cần đổi trước ngày ${date} để tránh bị khóa tài khoản.`,
  },
};

function validateForm(form, text) {
  if (!form.currentPassword) return text.currentRequired;
  if (form.newPassword.length < 8) {
    return text.minLength;
  }
  if (form.newPassword !== form.confirmPassword) {
    return text.mismatch;
  }
  if (form.currentPassword === form.newPassword) {
    return text.mustDiffer;
  }

  return '';
}

function formatDate(value) {
  if (!value) return '';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

export function ChangePasswordPage() {
  const { language } = usePreferences();
  const text = copy[language] || copy.vi;
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
    const validationError = validateForm(form, text);

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
        <h1>{text.changePassword}</h1>
        {user?.mustChangePassword ? (
          <p className="warning-message">
            {text.temporaryWarning(formatDate(user.temporaryPasswordExpiresAt))}
          </p>
        ) : null}
        <form className="form-panel" onSubmit={handleSubmit}>
          <label>
            {text.current}
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
            {text.newPassword}
            <input
              minLength="8"
              required
              type="password"
              value={form.newPassword}
              onChange={(event) =>
                updateField('newPassword', event.target.value)
              }
            />
            <span className="field-help">{text.minHelp}</span>
          </label>

          <label>
            {text.confirm}
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
              {isSubmitting ? text.saving : text.changePassword}
            </button>
            <Link className="secondary-link" to="/">
              {text.back}
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
