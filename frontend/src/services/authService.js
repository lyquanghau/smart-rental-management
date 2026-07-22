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

export async function changePassword(payload) {
  const response = await api.patch('/auth/change-password', payload);
  storeSession(response.data.data);
  return response.data.data;
}

export async function unlockUser(userId) {
  const response = await api.patch(`/auth/users/${userId}/unlock`);
  return response.data.data;
}
