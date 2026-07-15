import React from 'react';
import { usePreferences } from '../hooks/usePreferences.js';

const statusLabels = {
  en: {
    available: 'Available',
    occupied: 'Occupied',
    maintenance: 'Maintenance',
  },
  vi: {
    available: 'Trống',
    occupied: 'Đã thuê',
    maintenance: 'Bảo trì',
  },
};

export function RoomStatusBadge({ status }) {
  const { language } = usePreferences();
  const labels = statusLabels[language] || statusLabels.vi;

  return (
    <span className={`status status-${status}`}>
      {labels[status] || status}
    </span>
  );
}
