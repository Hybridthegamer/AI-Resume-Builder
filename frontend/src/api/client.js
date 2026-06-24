import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 60000, // 60s for AI generation calls
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: attach JWT token
client.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle auth errors
client.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/register')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  register: (data) => client.post('/auth/register', data),
  login: (data) => client.post('/auth/login', data),
  getProfile: () => client.get('/auth/profile'),
  updateProfile: (data) => client.put('/auth/profile', data),
};

// Resume API
export const resumeAPI = {
  create: (data) => client.post('/resumes', data),
  getAll: () => client.get('/resumes'),
  getOne: (id) => client.get(`/resumes/${id}`),
  update: (id, data) => client.put(`/resumes/${id}`, data),
  delete: (id) => client.delete(`/resumes/${id}`),
  generateAI: (id) => client.post(`/resumes/${id}/generate`),
  getATSScore: (id) => client.post(`/resumes/${id}/ats-score`),
  jobMatch: (id, data) => client.post(`/resumes/${id}/job-match`, data),
};

// Template API
export const templateAPI = {
  getAll: () => client.get('/templates'),
  getOne: (id) => client.get(`/templates/${id}`),
};

// Export API
export const exportAPI = {
  exportPDF: (resumeId) => client.post(`/exports/${resumeId}/pdf`),
  exportDOCX: (resumeId) => client.post(`/exports/${resumeId}/docx`),
  getExports: (resumeId) => client.get(`/exports/${resumeId}`),
  download: (exportId) => client.get(`/exports/download/${exportId}`, { responseType: 'blob' }),
};

export default client;
