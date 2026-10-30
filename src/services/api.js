import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 5000,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('doc_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (localStorage.getItem('doc_token')) {
        localStorage.removeItem('doc_token');
        localStorage.removeItem('doc_user');
        window.location.href = '/login?expired=true';
      }
    }
    // Normalize static host 405 (Method Not Allowed) or 404 into a clean network error
    if (error.response?.status === 405 || error.response?.status === 404) {
      error.code = 'ERR_NETWORK';
      error.message = 'Network Error';
    }
    return Promise.reject(error);
  }
);

export default api;
