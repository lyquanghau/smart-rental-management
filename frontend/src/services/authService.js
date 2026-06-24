import { api } from './api.js';
import { clearSession, storeSession } from './sessionStorage.js';

export function logout() {
  clearSession();
}

export async function login(credentials) {
  const response = await api.post('/auth/login', credentials);
  storeSession(response.data.data);
  return response.data.data;
}
