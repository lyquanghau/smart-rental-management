import { api } from './api.js';

export async function getTenantPortalSummary() {
  const response = await api.get('/tenant-portal/summary');
  return response.data.data;
}
