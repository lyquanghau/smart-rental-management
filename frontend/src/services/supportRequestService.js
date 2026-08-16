import { api } from './api.js';

export async function getSupportRequests(params = {}) {
  const response = await api.get('/support-requests', { params });
  return response.data.data;
}

export async function createSupportRequest(payload) {
  const response = await api.post('/support-requests', payload);
  return response.data.data;
}

export async function updateSupportRequest(id, payload) {
  const response = await api.patch(`/support-requests/${id}`, payload);
  return response.data.data;
}

export async function closeSupportRequest(id) {
  const response = await api.patch(`/support-requests/${id}/close`);
  return response.data.data;
}
