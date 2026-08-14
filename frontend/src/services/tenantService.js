import { api } from './api.js';

export async function getTenants(params = {}) {
  const response = await api.get('/tenants', { params });
  return response.data.data;
}

export async function getTenant(id) {
  const response = await api.get(`/tenants/${id}`);
  return response.data.data;
}

export async function createTenant(payload) {
  const response = await api.post('/tenants', payload);
  return response.data.data;
}

export async function updateTenant(id, payload) {
  const response = await api.put(`/tenants/${id}`, payload);
  return response.data.data;
}

export async function deleteTenant(id) {
  const response = await api.delete(`/tenants/${id}`);
  return response.data.data;
}

export async function restoreTenant(id) {
  const response = await api.patch(`/tenants/${id}/restore`);
  return response.data.data;
}
