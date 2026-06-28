import { api } from './api.js';

export async function getContracts() {
  const response = await api.get('/contracts');
  return response.data.data;
}

export async function getContract(id) {
  const response = await api.get(`/contracts/${id}`);
  return response.data.data;
}

export async function createContract(payload) {
  const response = await api.post('/contracts', payload);
  return response.data.data;
}

export async function updateContract(id, payload) {
  const response = await api.put(`/contracts/${id}`, payload);
  return response.data.data;
}

export async function deleteContract(id) {
  const response = await api.delete(`/contracts/${id}`);
  return response.data.data;
}
