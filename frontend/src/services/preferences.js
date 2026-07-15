const STORAGE_KEY = 'smart_rental_preferences';
const USD_EXCHANGE_RATE = 25000;

export const defaultPreferences = {
  theme: 'light',
  language: 'vi',
  currency: 'VND',
};

export const themeOptions = [
  {
    value: 'light',
    label: { vi: 'Sáng', en: 'Light' },
    description: {
      vi: 'Giao diện sáng, nền trắng',
      en: 'Bright white interface',
    },
  },
  {
    value: 'dark',
    label: { vi: 'Tối', en: 'Dark' },
    description: {
      vi: 'Giao diện tối, ít chói mắt',
      en: 'Low-glare dark interface',
    },
  },
];

export const languageOptions = [
  {
    value: 'vi',
    label: { vi: 'Tiếng Việt', en: 'Vietnamese' },
    description: { vi: 'Hiển thị tiếng Việt', en: 'Vietnamese interface' },
  },
  {
    value: 'en',
    label: { vi: 'English', en: 'English' },
    description: { vi: 'Hiển thị tiếng Anh', en: 'English interface' },
  },
];

export const currencyOptions = [
  {
    value: 'VND',
    label: { vi: 'VND', en: 'VND' },
    description: { vi: 'Việt Nam đồng', en: 'Vietnamese dong' },
  },
  {
    value: 'USD',
    label: { vi: 'USD', en: 'USD' },
    description: {
      vi: 'US Dollar, quy đổi tham khảo',
      en: 'US Dollar, estimated conversion',
    },
  },
];

export function loadPreferences() {
  try {
    const rawPreferences = localStorage.getItem(STORAGE_KEY);
    return rawPreferences
      ? { ...defaultPreferences, ...JSON.parse(rawPreferences) }
      : defaultPreferences;
  } catch {
    return defaultPreferences;
  }
}

export function applyPreferences(preferences) {
  document.documentElement.dataset.theme = preferences.theme;
  document.documentElement.lang = preferences.language;
}

export function savePreferences(preferences) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  applyPreferences(preferences);
  window.dispatchEvent(
    new CustomEvent('smart-rental-preferences-changed', {
      detail: preferences,
    }),
  );
}

export function formatCurrency(value, preferences = loadPreferences()) {
  const amount = Number(value || 0);

  if (preferences.currency === 'USD') {
    return new Intl.NumberFormat('en-US', {
      currency: 'USD',
      maximumFractionDigits: 2,
      minimumFractionDigits: 2,
      style: 'currency',
    }).format(amount / USD_EXCHANGE_RATE);
  }

  return new Intl.NumberFormat('vi-VN', {
    currency: 'VND',
    maximumFractionDigits: 0,
    style: 'currency',
  }).format(amount);
}
