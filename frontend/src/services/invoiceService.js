import { api } from './api.js';

export async function getInvoices(params = {}) {
  const response = await api.get('/invoices', { params });
  return response.data.data;
}

export async function generateMonthlyInvoices(payload) {
  const response = await api.post('/invoices/generate-monthly', payload);
  return response.data.data;
}

export async function markInvoicePaid(id, payload = {}) {
  const response = await api.patch(`/invoices/${id}/mark-paid`, payload);
  return response.data.data;
}

export async function cancelInvoice(id, payload = {}) {
  const response = await api.patch(`/invoices/${id}/cancel`, payload);
  return response.data.data;
}
