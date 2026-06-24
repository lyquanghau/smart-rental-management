import { api } from './api.js';

export async function getRooms() {
  const response = await api.get('/rooms');
  return response.data.data;
}

export async function getRoom(id) {
  const response = await api.get(`/rooms/${id}`);
  return response.data.data;
}

export async function createRoom(payload) {
  const response = await api.post('/rooms', payload);
  return response.data.data;
}

export async function updateRoom(id, payload) {
  const response = await api.put(`/rooms/${id}`, payload);
  return response.data.data;
}

export async function deleteRoom(id) {
  const response = await api.delete(`/rooms/${id}`);
  return response.data.data;
}
