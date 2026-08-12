import { api } from './api.js';

export async function getNotifications(params = {}) {
  const response = await api.get('/notifications', { params });
  return {
    items: response.data.data,
    meta: response.data.meta || { unreadCount: 0 },
  };
}

export async function markNotificationRead(id) {
  const response = await api.patch(`/notifications/${id}/read`);
  return response.data.data;
}

export async function markAllNotificationsRead() {
  const response = await api.patch('/notifications/read-all');
  return response.data;
}
