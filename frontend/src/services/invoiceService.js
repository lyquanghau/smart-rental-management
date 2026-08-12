import { api } from './api.js';

export async function getInvoices(params = {}) {
  const response = await api.get('/invoices', { params });
  return response.data.data;
}

export async function downloadInvoicePdf(id) {
  const response = await api.get(`/invoices/${id}/pdf`, {
    responseType: 'blob',
  });

  return response.data;
}

export async function generateMonthlyInvoices(payload) {
  const response = await api.post('/invoices/generate-monthly', payload);
  return response.data.data;
}

export async function createMomoPaymentLink(id) {
  const response = await api.post(`/invoices/${id}/momo-payment-link`);
  return response.data.data;
}

export async function simulateMomoPaymentSuccess(id) {
  const response = await api.post(`/invoices/${id}/momo-mock-success`);
  return response.data.data;
}

export async function createSepayPaymentCode(id) {
  const response = await api.post(`/invoices/${id}/sepay-payment-code`);
  return response.data.data;
}

export async function simulateSepayPaymentSuccess(id) {
  const response = await api.post(`/invoices/${id}/sepay-mock-success`);
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
