import axios from 'axios';

const API_BASE_URL = "https://servernodepro.vercel.app/api"

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  register: (userData: { name: string; email: string; password: string }) =>
    api.post('/auth/register', userData),
  getCurrentUser: () => api.get('/auth/me'),
};

// Task API
export const taskAPI = {
  getTasks: (filters: any = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => {
      if (value) params.append(key, value as string);
    });
    return api.get(`/tasks?${params.toString()}`);
  },
  createTask: (taskData: any) => api.post('/tasks', taskData),
  updateTask: (id: string, taskData: any) => api.put(`/tasks/${id}`, taskData),
  deleteTask: (id: string) => api.delete(`/tasks/${id}`),
  reorderTasks: (updates: any[]) => api.put('/tasks/bulk/reorder', { updates }),
};

// User API
export const userAPI = {
  searchUsers: (query: string) => api.get(`/users/search?q=${encodeURIComponent(query)}`),
  getAllUsers: () => api.get('/users'),
};

// Notification API
export const notificationAPI = {
  getNotifications: () => api.get('/notifications'),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all-read'),
  deleteNotification: (id: string) => api.delete(`/notifications/${id}`),
};

export default api;