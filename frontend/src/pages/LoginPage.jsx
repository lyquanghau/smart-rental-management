import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import loginIllustration from '../assets/auth/login-illustration.png';
import brandMark from '../assets/brand/smart-rental-mark.svg';
import { usePreferences } from '../hooks/usePreferences.js';
import { login } from '../services/authService.js';
import { getToken } from '../services/sessionStorage.js';

const copy = {
  en: {
    emailRequired: 'Please enter an email or username.',
    email: 'Email or username',
    passwordRequired: 'Please enter a password.',
    password: 'Password',
    slogan: 'Rental management, simplified.',
    subtitle:
      'Smart Rental helps small landlords manage daily rental work with less manual tracking.',
    signIn: 'Sign in',
    signingIn: 'Signing in...',
    title: 'Smart Rental',
    welcome: 'Welcome back',
  },
  vi: {
    emailRequired: 'Vui lòng nhập email hoặc tên đăng nhập.',
    email: 'Email hoặc tên đăng nhập',
    passwordRequired: 'Vui lòng nhập mật khẩu.',
    password: 'Mật khẩu',
    slogan: 'Quản lý khu trọ.',
    subtitle:
      'Smart Rental giúp chủ trọ giảm việc ghi chép thủ công và theo dõi vận hành mỗi ngày.',
    signIn: 'Đăng nhập',
    signingIn: 'Đang đăng nhập...',
    title: 'Smart Rental',
    welcome: 'Chào mừng trở lại',
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
      <section className="login-visual-panel" aria-label={text.title}>
        <div className="login-brand-lockup">
          <img alt="" src={brandMark} />
          <span>{text.title}</span>
        </div>
        <div className="login-visual-copy">
          <h1>{text.slogan}</h1>
          <p>{text.subtitle}</p>
        </div>
        <img alt="" className="login-illustration" src={loginIllustration} />
      </section>

      <section className="login-form-panel">
        <div className="login-form-wrap">
          <div className="login-form-heading">
            <span>{text.title}</span>
            <h2>{text.welcome}</h2>
          </div>
          <form className="form-panel login-form-card" onSubmit={handleSubmit}>
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
        </div>
      </section>
    </main>
  );
}
