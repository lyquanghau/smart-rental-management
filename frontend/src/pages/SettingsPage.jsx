import React, { useEffect, useState } from 'react';
import { CheckCircle2, DollarSign, Languages, Monitor } from 'lucide-react';
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
    currency: 'Tiền tệ',
    currencyNote:
      'Tiền tệ dùng để hiển thị số tiền trong dashboard, phòng, hợp đồng và thanh toán.',
    display: 'Hiển thị',
    language: 'Ngôn ngữ',
    pageSummary: 'Quản lý tài khoản, giao diện, ngôn ngữ và tiền tệ hiển thị.',
    pageTitle: 'Cài đặt',
    preview: 'Xem trước',
    role: 'Vai trò',
    theme: 'Tông giao diện',
    unknownEmail: 'Chưa có email',
    unknownRole: 'Chưa xác định',
    user: 'Người dùng',
  },
  en: {
    account: 'Account',
    accountTitle: 'Login information',
    currency: 'Currency',
    currencyNote:
      'Currency is used for amounts in dashboard, rooms, contracts, and payments.',
    display: 'Display',
    language: 'Language',
    pageSummary: 'Manage account, theme, language, and display currency.',
    pageTitle: 'Settings',
    preview: 'Preview',
    role: 'Role',
    theme: 'Theme',
    unknownEmail: 'No email',
    unknownRole: 'Unknown',
    user: 'User',
  },
};

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
  const [preferences, setPreferences] = useState(loadPreferences);
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
