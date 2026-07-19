import { api } from './api.js';

export async function getUtilityReadings(params = {}) {
  const response = await api.get('/utility-readings', { params });
  return response.data.data;
}

export async function saveUtilityReading(payload) {
  const response = await api.post('/utility-readings', payload);
  return response.data.data;
}

export async function updateUtilityReading(id, payload) {
  const response = await api.put(`/utility-readings/${id}`, payload);
  return response.data.data;
}

export async function deleteUtilityReading(id) {
  const response = await api.delete(`/utility-readings/${id}`);
  return response.data;
}
