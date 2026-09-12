import axios from 'axios';

export const API_BASE = import.meta.env.VITE_API_URL || '';

const api = axios.create({ baseURL: API_BASE });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('civic_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('civic_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export const getImageUrl = (path) => (path ? `${API_BASE}${path}` : null);

const unwrap = (res) => res.data?.data;

export const register = (data) => api.post('/api/auth/register', data).then(unwrap);
export const login = (data) => api.post('/api/auth/login', data).then(unwrap);
export const getMe = () => api.get('/api/auth/me').then(unwrap);

export const createIssue = (formData) =>
  api
    .post('/api/issues', formData, { headers: { 'Content-Type': 'multipart/form-data' } })
    .then(unwrap);
export const getMyIssues = (status) =>
  api.get('/api/issues/my', { params: { status: status || undefined } }).then(unwrap);
export const getIssueById = (id) => api.get(`/api/issues/${id}`).then(unwrap);
export const getNearbyIssues = (lat, lon, radius = 1000) =>
  api.get('/api/issues/nearby', { params: { lat, lon, radius } }).then(unwrap);

export const adminGetIssues = (params) => api.get('/api/admin/issues', { params }).then(unwrap);
export const adminUpdateStatus = (id, status) =>
  api.patch(`/api/admin/issues/${id}/status`, { status }).then(unwrap);
export const adminUpdatePriority = (id, priority) =>
  api.patch(`/api/admin/issues/${id}/priority`, { priority }).then(unwrap);
export const adminAssign = (id, departmentId, notes) =>
  api.post(`/api/admin/issues/${id}/assign`, { departmentId, notes }).then(unwrap);
export const adminDashboard = () => api.get('/api/admin/dashboard').then(unwrap);
export const adminGetUsers = (params) => api.get('/api/admin/users', { params }).then(unwrap);
export const adminUpdateRole = (id, role) =>
  api.patch(`/api/admin/users/${id}/role`, { role }).then(unwrap);

export const createDepartment = (data) => api.post('/api/departments', data).then(unwrap);
export const getDepartments = () => api.get('/api/departments').then(unwrap);
export const getDepartment = (id) => api.get(`/api/departments/${id}`).then(unwrap);
export const updateDepartment = (id, data) => api.put(`/api/departments/${id}`, data).then(unwrap);
export const deleteDepartment = (id) => api.delete(`/api/departments/${id}`).then(unwrap);

export const getComments = (issueId) => api.get(`/api/issues/${issueId}/comments`).then(unwrap);
export const addComment = (issueId, content) =>
  api.post(`/api/issues/${issueId}/comments`, { content }).then(unwrap);
export const deleteComment = (issueId, commentId) =>
  api.delete(`/api/issues/${issueId}/comments/${commentId}`).then(unwrap);

export const getNotifications = () => api.get('/api/notifications').then(unwrap);
export const getUnreadCount = () => api.get('/api/notifications/unread-count').then((res) => res.data?.data ?? 0);
export const markRead = (id) => api.patch(`/api/notifications/${id}/read`).then(unwrap);
export const markAllRead = () => api.patch('/api/notifications/read-all').then(unwrap);

export default api;
