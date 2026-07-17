import React from 'react';
import { usePreferences } from '../hooks/usePreferences.js';

const labels = {
  en: {
    eyebrow: 'Dashboard',
    title: 'Rental operations today',
  },
  vi: {
    eyebrow: 'Bảng điều hành',
    title: 'Vận hành khu trọ hôm nay',
  },
};

export function Header() {
  const { language } = usePreferences();
  const text = labels[language] || labels.vi;

  return (
    <header className="topbar">
      <div className="topbar-brand">
        <div className="topbar-title">
          <span className="eyebrow">{text.eyebrow}</span>
          <strong>{text.title}</strong>
        </div>
      </div>
    </header>
  );
}
