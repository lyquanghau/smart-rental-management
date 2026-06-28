import { api } from './api.js';

export async function getPayments(params = {}) {
  const response = await api.get('/payments', { params });
  return response.data.data;
}

export async function getPayment(id) {
  const response = await api.get(`/payments/${id}`);
  return response.data.data;
}

export async function createPayment(payload) {
  const response = await api.post('/payments', payload);
  return response.data.data;
}

export async function updatePayment(id, payload) {
  const response = await api.put(`/payments/${id}`, payload);
  return response.data.data;
}

export async function markPaymentPaid(id, payload = {}) {
  const response = await api.patch(`/payments/${id}/mark-paid`, payload);
  return response.data.data;
}

export async function cancelPayment(id, payload = {}) {
  const response = await api.patch(`/payments/${id}/cancel`, payload);
  return response.data.data;
}
