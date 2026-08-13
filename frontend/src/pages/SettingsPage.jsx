import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  DollarSign,
  KeyRound,
  Languages,
  Monitor,
} from 'lucide-react';
import { useToast } from '../components/ToastProvider.jsx';
import { changePassword } from '../services/authService.js';
import { getStoredUser } from '../services/sessionStorage.js';
import {
  currencyOptions,
  formatCurrency,
  languageOptions,
  loadPreferences,
  savePreferences,
  themeOptions,
} from '../services/preferences.js';

const copy = {
  vi: {
    account: 'Tài khoản',
    accountTitle: 'Thông tin đăng nhập',
    changePassword: 'Đổi mật khẩu',
    confirmPassword: 'Xác nhận mật khẩu mới',
    currency: 'Tiền tệ',
    currencyNote:
      'Tiền tệ dùng để hiển thị số tiền trong dashboard, phòng, hợp đồng và thanh toán.',
    currentPassword: 'Mật khẩu hiện tại',
    display: 'Hiển thị',
    language: 'Ngôn ngữ',
    minPasswordHelp: 'Mật khẩu mới cần tối thiểu 8 ký tự.',
    newPassword: 'Mật khẩu mới',
    pageSummary: 'Quản lý tài khoản, giao diện, ngôn ngữ và tiền tệ hiển thị.',
    pageTitle: 'Cài đặt',
    passwordCurrentRequired: 'Vui lòng nhập mật khẩu hiện tại.',
    passwordMismatch: 'Xác nhận mật khẩu mới không khớp.',
    passwordMustDiffer: 'Mật khẩu mới phải khác mật khẩu hiện tại.',
    passwordSaved: 'Đã đổi mật khẩu.',
    passwordTooShort: 'Mật khẩu mới phải có ít nhất 8 ký tự.',
    preview: 'Xem trước',
    role: 'Vai trò',
    saving: 'Đang lưu...',
    theme: 'Tông giao diện',
    unknownEmail: 'Chưa có email',
    unknownRole: 'Chưa xác định',
    user: 'Người dùng',
  },
  en: {
    account: 'Account',
    accountTitle: 'Login information',
    changePassword: 'Change password',
    confirmPassword: 'Confirm new password',
    currency: 'Currency',
    currencyNote:
      'Currency is used for amounts in dashboard, rooms, contracts, and payments.',
    currentPassword: 'Current password',
    display: 'Display',
    language: 'Language',
    minPasswordHelp: 'The new password must be at least 8 characters.',
    newPassword: 'New password',
    pageSummary: 'Manage account, theme, language, and display currency.',
    pageTitle: 'Settings',
    passwordCurrentRequired: 'Please enter your current password.',
    passwordMismatch: 'The password confirmation does not match.',
    passwordMustDiffer:
      'The new password must be different from the current password.',
    passwordSaved: 'Password changed.',
    passwordTooShort: 'The new password must be at least 8 characters.',
    preview: 'Preview',
    role: 'Role',
    saving: 'Saving...',
    theme: 'Theme',
    unknownEmail: 'No email',
    unknownRole: 'Unknown',
    user: 'User',
  },
};

const emptyPasswordForm = {
  confirmPassword: '',
  currentPassword: '',
  newPassword: '',
};

function validatePasswordForm(form, text) {
  if (!form.currentPassword) return text.passwordCurrentRequired;
  if (form.newPassword.length < 8) return text.passwordTooShort;
  if (form.newPassword !== form.confirmPassword) return text.passwordMismatch;
  if (form.currentPassword === form.newPassword) return text.passwordMustDiffer;

  return '';
}

function PreferenceButtonGroup({
  icon: Icon,
  label,
  language,
  options,
  value,
  onChange,
}) {
  return (
    <section className="preference-group">
      <div className="preference-group-title">
        <Icon size={16} strokeWidth={2.5} />
        <span>{label}</span>
      </div>
      <div className="preference-button-grid">
        {options.map((option) => {
          const isActive = option.value === value;

          return (
            <button
              className={`preference-button ${isActive ? 'active' : ''}`}
              key={option.value}
              type="button"
              onClick={() => onChange(option.value)}
            >
              <span>
                <strong>{option.label[language] || option.label.vi}</strong>
                <small>
                  {option.description[language] || option.description.vi}
                </small>
              </span>
              {isActive ? (
                <CheckCircle2
                  className="preference-check"
                  size={16}
                  strokeWidth={2.5}
                />
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}

export function SettingsPage() {
  const user = getStoredUser();
  const { showError, showSuccess } = useToast();
  const [preferences, setPreferences] = useState(loadPreferences);
  const [passwordForm, setPasswordForm] = useState(emptyPasswordForm);
  const [passwordError, setPasswordError] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const text = copy[preferences.language] || copy.vi;

  useEffect(() => {
    savePreferences(preferences);
  }, [preferences]);

  function updatePreference(field, value) {
    setPreferences((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updatePasswordField(field, value) {
    setPasswordForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleChangePassword(event) {
    event.preventDefault();
    const validationError = validatePasswordForm(passwordForm, text);

    if (validationError) {
      setPasswordError(validationError);
      return;
    }

    setIsChangingPassword(true);
    setPasswordError('');

    try {
      await changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm(emptyPasswordForm);
      showSuccess(text.passwordSaved);
    } catch (error) {
      setPasswordError(error.message);
      showError(error.message);
    } finally {
      setIsChangingPassword(false);
    }
  }

  return (
    <section>
      <div className="page-heading">
        <div>
          <h1>{text.pageTitle}</h1>
          <p className="page-summary">{text.pageSummary}</p>
        </div>
      </div>

      <div className="settings-grid">
        <section className="settings-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{text.account}</span>
              <h2>{text.accountTitle}</h2>
            </div>
          </div>
          <div className="account-summary">
            <div className="account-avatar" aria-hidden="true">
              {user?.fullName?.charAt(0)?.toUpperCase() || 'S'}
            </div>
            <div>
              <strong>{user?.fullName || text.user}</strong>
              <span>{user?.email || text.unknownEmail}</span>
              <span>
                {text.role}: {user?.role || text.unknownRole}
              </span>
            </div>
          </div>
        </section>

        <section className="settings-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{text.account}</span>
              <h2>{text.changePassword}</h2>
            </div>
          </div>
          <form className="settings-form" onSubmit={handleChangePassword}>
            <label>
              {text.currentPassword}
              <input
                autoComplete="current-password"
                required
                type="password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  updatePasswordField('currentPassword', event.target.value)
                }
              />
            </label>

            <label>
              {text.newPassword}
              <input
                autoComplete="new-password"
                minLength="8"
                required
                type="password"
                value={passwordForm.newPassword}
                onChange={(event) =>
                  updatePasswordField('newPassword', event.target.value)
                }
              />
              <span className="field-help">{text.minPasswordHelp}</span>
            </label>

            <label>
              {text.confirmPassword}
              <input
                autoComplete="new-password"
                minLength="8"
                required
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(event) =>
                  updatePasswordField('confirmPassword', event.target.value)
                }
              />
            </label>

            {passwordError ? (
              <p className="error-message">{passwordError}</p>
            ) : null}

            <button disabled={isChangingPassword} type="submit">
              <KeyRound className="button-icon" size={16} strokeWidth={2.5} />
              {isChangingPassword ? text.saving : text.changePassword}
            </button>
          </form>
        </section>

        <section className="settings-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">{text.display}</span>
              <h2>{text.pageTitle}</h2>
            </div>
          </div>
          <div className="settings-form">
            <PreferenceButtonGroup
              icon={Monitor}
              language={preferences.language}
              label={text.theme}
              options={themeOptions}
              value={preferences.theme}
              onChange={(value) => updatePreference('theme', value)}
            />

            <PreferenceButtonGroup
              icon={Languages}
              language={preferences.language}
              label={text.language}
              options={languageOptions}
              value={preferences.language}
              onChange={(value) => updatePreference('language', value)}
            />

            <PreferenceButtonGroup
              icon={DollarSign}
              language={preferences.language}
              label={text.currency}
              options={currencyOptions}
              value={preferences.currency}
              onChange={(value) => updatePreference('currency', value)}
            />

            <div className="preference-preview">
              <span>{text.preview}</span>
              <strong>{formatCurrency(2500000, preferences)}</strong>
              <small>{text.currencyNote}</small>
            </div>
          </div>
        </section>
      </div>
    </section>
  );
}
