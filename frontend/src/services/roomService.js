import { api } from './api.js';

export async function getRooms() {
  const response = await api.get('/rooms');
  return response.data.data;
}
