import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { usePreferences } from '../hooks/usePreferences.js';
import { login } from '../services/authService.js';
import { getToken } from '../services/sessionStorage.js';

const copy = {
  en: {
    emailRequired: 'Please enter an email or username.',
    email: 'Email or username',
    passwordRequired: 'Please enter a password.',
    password: 'Password',
    signIn: 'Sign in',
    signingIn: 'Signing in...',
  },
  vi: {
    emailRequired: 'Vui lòng nhập email hoặc tên đăng nhập.',
    email: 'Email hoặc tên đăng nhập',
    passwordRequired: 'Vui lòng nhập mật khẩu.',
    password: 'Mật khẩu',
    signIn: 'Đăng nhập',
    signingIn: 'Đang đăng nhập...',
  },
};

export function LoginPage() {
  const { language } = usePreferences();
  const text = copy[language] || copy.vi;
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
    if (!form.email.trim()) return text.emailRequired;
    if (!form.password) return text.passwordRequired;
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
        <h1>{text.signIn}</h1>
        <form className="form-panel" onSubmit={handleSubmit}>
          <label>
            {text.email}
            <input
              name="email"
              type="text"
              value={form.email}
              onChange={handleChange}
              required
            />
          </label>
          <label>
            {text.password}
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
            {isSubmitting ? text.signingIn : text.signIn}
          </button>
        </form>
      </section>
    </main>
  );
}
