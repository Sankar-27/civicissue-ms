import axios from 'axios';

// Backend base URL. Set VITE_API_URL at build time (e.g. your Render API URL).
// When unset (local dev) requests go to relative /api and are proxied by Vite
// to the FastAPI backend, avoiding CORS and localhost/IPv6 port conflicts.
export const API_BASE = import.meta.env.VITE_API_URL || '';

const API = axios.create({ baseURL: API_BASE });

// Attach JWT token from localStorage to every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem('civic_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Build a full URL for uploaded images served by the backend
export const getImageUrl = (path) => (path ? `${API_BASE}${path}` : null);

// Auth
export const register = (data) => API.post('/api/auth/register', data);
export const login    = (data) => API.post('/api/auth/login', data);

// Citizen Issues
export const createIssueJson      = (data)        => API.post('/api/issues', data);
export const createIssueMultipart = (formData)    => API.post('/api/issues', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
export const getMyIssues          = ()            => API.get('/api/issues/my');
export const getIssueById         = (id)          => API.get(`/api/issues/${id}`);

// Admin
export const adminGetIssues   = (params) => API.get('/api/admin/issues', { params });
export const adminUpdateStatus   = (id, status)   => API.patch(`/api/admin/issues/${id}/status`,   { status });
export const adminUpdatePriority = (id, priority) => API.patch(`/api/admin/issues/${id}/priority`, { priority });
export const adminGetDashboard   = ()             => API.get('/api/admin/dashboard');
export const adminGetUsers       = ()             => API.get('/api/admin/users');
export const adminUpdateRole     = (id, role)     => API.patch(`/api/admin/users/${id}/role`, { role });

export default API;
