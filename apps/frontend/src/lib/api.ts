import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/auth/login';
    }
    return Promise.reject(error);
  }
);

// Auth endpoints
export const authApi = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  refresh: () => api.post('/auth/refresh'),
  
  logout: () => api.post('/auth/logout'),
};

// Users endpoints
export const usersApi = {
  getMe: () => api.get('/users/me'),
  updateMe: (data: any) => api.put('/users/me', data),
};

// Students endpoints
export const studentsApi = {
  getAll: (params?: any) => api.get('/students', { params }),
  getById: (id: string) => api.get(`/students/${id}`),
  create: (data: any) => api.post('/students', data),
  update: (id: string, data: any) => api.put(`/students/${id}`, data),
  delete: (id: string) => api.delete(`/students/${id}`),
  
  // Admissions
  getAdmissions: (params?: any) => api.get('/students/admissions', { params }),
  createAdmission: (data: any) => api.post('/students/admissions', data),
  getNew: () => api.get('/students/new'),
  deleteAdmission: (id: string) => api.delete(`/students/admissions/${id}`),
  deleteDuplicate: (id: string, studentId: string) =>
    api.delete(`/students/admissions/duplicate/${id}`, { params: { studentId } }),
  
  // Batch changes
  changeBatch: (data: { studentId: string; newBatchId: string }) =>
    api.post('/students/batch-change', data),
  
  getBatchHistory: (studentId: string) =>
    api.get(`/students/batch-history/${studentId}`),

  // Sync and duplicates
  getSyncPreview: () => api.get('/students/sync-preview'),
  syncIds: () => api.post('/students/sync'),
  getDuplicates: () => api.get('/students/duplicates'),
};

// Employees endpoints
export const employeesApi = {
  getAll: () => api.get('/employees'),
  getById: (id: string) => api.get(`/employees/${id}`),
  create: (data: any) => api.post('/employees', data),
  update: (id: string, data: any) => api.put(`/employees/${id}`, data),
  delete: (id: string) => api.delete(`/employees/${id}`),
};

// Teachers endpoints
export const teachersApi = {
  getAll: () => api.get('/teachers'),
  getById: (id: string) => api.get(`/teachers/${id}`),
  create: (data: any) => api.post('/teachers', data),
  update: (id: string, data: any) => api.put(`/teachers/${id}`, data),
  delete: (id: string) => api.delete(`/teachers/${id}`),
};

// Batches endpoints
export const batchesApi = {
  getAll: () => api.get('/batches'),
  getById: (id: string) => api.get(`/batches/${id}`),
  create: (data: any) => api.post('/batches', data),
  update: (id: string, data: any) => api.put(`/batches/${id}`, data),
  delete: (id: string, params?: { action?: string; targetBatchId?: string }) =>
    api.delete(`/batches/${id}`, { params }),
  
  // Subjects in batch
  addSubject: (batchId: string, subjectId: string) =>
    api.post(`/batches/${batchId}/subjects`, { subjectId }),
  removeSubject: (batchId: string, subjectId: string) =>
    api.delete(`/batches/${batchId}/subjects/${subjectId}`),
};

// Subjects endpoints
export const subjectsApi = {
  getAll: () => api.get('/subjects'),
  getById: (id: string) => api.get(`/subjects/${id}`),
  create: (data: any) => api.post('/subjects', data),
  update: (id: string, data: any) => api.put(`/subjects/${id}`, data),
  delete: (id: string) => api.delete(`/subjects/${id}`),
};

// Classes endpoints
export const classesApi = {
  getAll: (params?: any) => api.get('/classes', { params }),
  getById: (id: string) => api.get(`/classes/${id}`),
  create: (data: any) => api.post('/classes', data),
  update: (id: string, data: any) => api.put(`/classes/${id}`, data),
  delete: (id: string) => api.delete(`/classes/${id}`),
};

// Tasks endpoints
export const tasksApi = {
  getAll: (params?: any) => api.get('/tasks', { params }),
  getById: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.put(`/tasks/${id}`, data),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  
  // Task completions
  complete: (taskId: string, data?: any) =>
    api.post(`/tasks/${taskId}/complete`, data),
  
  // Task ratings
  rate: (taskId: string, data: { rating: number; notes?: string }) =>
    api.post(`/tasks/${taskId}/rate`, data),
};