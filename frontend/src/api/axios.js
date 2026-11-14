import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('phishbook_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On a 401 the server has rejected the stored token (missing, expired, or
// revoked). Clear the stale session and send the admin back to the right
// login page instead of letting every poller keep failing in a loop.
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('phishbook_token');
      localStorage.removeItem('phishbook_user');
      const onAdminPage = window.location.pathname.startsWith('/admin');
      const loginPath = onAdminPage ? '/admin/login' : '/login';
      if (window.location.pathname !== loginPath) {
        window.location.assign(loginPath);
      }
    }
    return Promise.reject(error);
  },
);

export default api;