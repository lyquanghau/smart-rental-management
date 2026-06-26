import { api } from './api.js';

export async function getTenants() {
  const response = await api.get('/tenants');
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
