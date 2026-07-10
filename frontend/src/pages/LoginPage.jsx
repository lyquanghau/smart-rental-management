import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { login } from '../services/authService.js';
import { getToken } from '../services/sessionStorage.js';

export function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    email: 'admin@smartrental.local',
    password: 'Admin@123456',
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fromLocation = location.state?.from;
  const redirectPath = fromLocation
    ? `${fromLocation.pathname}${fromLocation.search || ''}`
    : '/';

  if (getToken()) {
    return <Navigate to={redirectPath} replace />;
  }

  function handleChange(event) {
    setForm((currentForm) => ({
      ...currentForm,
      [event.target.name]: event.target.value,
    }));
  }

  function validateForm() {
    if (!form.email.trim()) return 'Vui lòng nhập email hoặc tên đăng nhập.';
    if (!form.password) return 'Vui lòng nhập mật khẩu.';
    return '';
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const validationError = validateForm();

    if (validationError) {
      setError(validationError);
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      await login({
        email: form.email.trim(),
        password: form.password,
      });
      navigate(redirectPath, { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-shell">
      <section className="form-page">
        <h1>Đăng nhập</h1>
        <form className="form-panel" onSubmit={handleSubmit}>
          <label>
            Email hoặc tên đăng nhập
            <input
              name="email"
              type="text"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            Mật khẩu
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </label>
          {error ? <p className="error-message">{error}</p> : null}
          <button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>
      </section>
    </main>
  );
}
