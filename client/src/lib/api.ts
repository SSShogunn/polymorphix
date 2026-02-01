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

// Response interceptor to handle expired tokens
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If token is expired (401), clear auth and redirect to login
    if (error.response?.status === 401) {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
      window.location.href = '/auth';
    }

    return Promise.reject(error);
  }
);

export interface User {
  id: string;
  email: string;
  username: string;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface SignUpData {
  username: string;
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
};

// Video types (match backend Prisma serialization)
export interface VideoFormat {
  id: string;
  videoId: string;
  resolution: string;
  bitrate: number;
  codec: string;
  videoUrl: string | null;
  fileSize: number | null;
  createdAt: string;
}

export interface Video {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  originalFilename: string;
  fileSize: number | null;
  duration: number | null;
  rawVideoUrl: string | null;
  thumbnailUrl: string | null;
  status: string;
  processingProgress: number;
  errorMessage: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  processedAt: string | null;
  formats?: VideoFormat[];
}

export interface DeleteAllVideosResponse {
  deleted: number;
  message: string;
}

export const fileManagementAPI = {
  uploadFile: (data: FormData) =>
    api.post("/videos/upload", data, {
      headers: { "Content-Type": "multipart/form-data" },
    }),
};

export const videosAPI = {
  getVideos: () => api.get<Video[]>("/videos"),
  deleteAllVideos: () => api.delete<DeleteAllVideosResponse>("/videos"),
};
