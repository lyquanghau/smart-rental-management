import { api } from './api.js';

export async function getServiceSetting() {
  const response = await api.get('/service-settings');
  return response.data.data;
}

export async function updateServiceSetting(payload) {
  const response = await api.put('/service-settings', payload);
  return response.data.data;
}
