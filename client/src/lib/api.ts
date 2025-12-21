import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('access_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const response = await api.post('/auth/refresh');
        const { access_token } = response.data;

        localStorage.setItem('access_token', access_token);

        // Retry the original request with new token
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear auth state
        localStorage.removeItem('access_token');
        localStorage.removeItem('user');
        window.location.href = '/auth';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SignUpData {
  email: string;
  password: string;
}

export interface SignInData {
  email: string;
  password: string;
}

// Auth API methods
export const authAPI = {
  signUp: (data: SignUpData) =>
    api.post<AuthResponse>('/auth/signup', data),

  signIn: (data: SignInData) =>
    api.post<AuthResponse>('/auth/signin', data),

  signOut: () =>
    api.post('/auth/signout'),

  getCurrentUser: () =>
    api.get<User>('/auth/me'),

  refreshToken: () =>
    api.post<{ access_token: string; token_type: string }>('/auth/refresh'),
};

export interface FileUploadData {
  title: string,
  description: string,
  file : File,
}

export const fileManagementAPI = {
  uploadFile : (data : FileUploadData) => 
    api.post("/video/upload", data)
}
