import { useEffect, useState } from 'react';
import { loadPreferences } from '../services/preferences.js';

export function usePreferences() {
  const [preferences, setPreferences] = useState(loadPreferences);

  useEffect(() => {
    function handlePreferencesChanged() {
      setPreferences(loadPreferences());
    }

    window.addEventListener(
      'smart-rental-preferences-changed',
      handlePreferencesChanged,
    );
    window.addEventListener('storage', handlePreferencesChanged);

    return () => {
      window.removeEventListener(
        'smart-rental-preferences-changed',
        handlePreferencesChanged,
      );
      window.removeEventListener('storage', handlePreferencesChanged);
    };
  }, []);

  return preferences;
}
