import axios from 'axios';
import { getToken } from './sessionStorage.js';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ||
      'Không thể kết nối máy chủ. Vui lòng thử lại.';

    return Promise.reject(new Error(message));
  },
);
