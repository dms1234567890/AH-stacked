import axios from 'axios';
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
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
api.interceptors.response.use((response) => response, (error) => {
    if (error.response?.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/auth/login';
    }
    return Promise.reject(error);
});
// Auth endpoints
export const authApi = {
    login: (credentials) => api.post('/auth/login', credentials),
    refresh: () => api.post('/auth/refresh'),
    logout: () => api.post('/auth/logout'),
};
// Users endpoints
export const usersApi = {
    getMe: () => api.get('/users/me'),
    updateMe: (data) => api.put('/users/me', data),
};
// Students endpoints
export const studentsApi = {
    getAll: (params) => api.get('/students', { params }),
    getById: (id) => api.get(`/students/${id}`),
    create: (data) => api.post('/students', data),
    update: (id, data) => api.put(`/students/${id}`, data),
    delete: (id) => api.delete(`/students/${id}`),
    // Admissions
    getAdmissions: (params) => api.get('/students/admissions', { params }),
    createAdmission: (data) => api.post('/students/admissions', data),
    // Batch changes
    changeBatch: (data) => api.post('/students/batch-change', data),
    getBatchHistory: (studentId) => api.get(`/students/${studentId}/batch-history`),
};
// Employees endpoints
export const employeesApi = {
    getAll: () => api.get('/employees'),
    getById: (id) => api.get(`/employees/${id}`),
    create: (data) => api.post('/employees', data),
    update: (id, data) => api.put(`/employees/${id}`, data),
    delete: (id) => api.delete(`/employees/${id}`),
};
// Teachers endpoints
export const teachersApi = {
    getAll: () => api.get('/teachers'),
    getById: (id) => api.get(`/teachers/${id}`),
    create: (data) => api.post('/teachers', data),
    update: (id, data) => api.put(`/teachers/${id}`, data),
    delete: (id) => api.delete(`/teachers/${id}`),
};
// Batches endpoints
export const batchesApi = {
    getAll: () => api.get('/batches'),
    getById: (id) => api.get(`/batches/${id}`),
    create: (data) => api.post('/batches', data),
    update: (id, data) => api.put(`/batches/${id}`, data),
    delete: (id) => api.delete(`/batches/${id}`),
    // Subjects in batch
    addSubject: (batchId, subjectId) => api.post(`/batches/${batchId}/subjects`, { subjectId }),
    removeSubject: (batchId, subjectId) => api.delete(`/batches/${batchId}/subjects/${subjectId}`),
};
// Subjects endpoints
export const subjectsApi = {
    getAll: () => api.get('/subjects'),
    getById: (id) => api.get(`/subjects/${id}`),
    create: (data) => api.post('/subjects', data),
    update: (id, data) => api.put(`/subjects/${id}`, data),
    delete: (id) => api.delete(`/subjects/${id}`),
};
// Classes endpoints
export const classesApi = {
    getAll: (params) => api.get('/classes', { params }),
    getById: (id) => api.get(`/classes/${id}`),
    create: (data) => api.post('/classes', data),
    update: (id, data) => api.put(`/classes/${id}`, data),
    delete: (id) => api.delete(`/classes/${id}`),
};
// Tasks endpoints
export const tasksApi = {
    getAll: (params) => api.get('/tasks', { params }),
    getById: (id) => api.get(`/tasks/${id}`),
    create: (data) => api.post('/tasks', data),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
    // Task completions
    complete: (taskId, data) => api.post(`/tasks/${taskId}/complete`, data),
    // Task ratings
    rate: (taskId, data) => api.post(`/tasks/${taskId}/rate`, data),
};
//# sourceMappingURL=api.js.map