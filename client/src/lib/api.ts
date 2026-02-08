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

// Video types (match backend API response)
export interface VideoFormat {
  id: string;
  resolution: string;
  bitrate: number;
  codec: string;
  key: string | null;
  streamUrl: string | null;
  fileSize: number | null;
}

export interface VideoThumbnail {
  id: string;
  objectKey: string;
  publicUrl: string;
  fileSize: number | null;
}

export interface Video {
  id: string;
  title: string;
  description: string | null;
  status: string;
  rawVideoUrl: string | null;
  fileSize: number | null;
  createdAt: string;
  formats: VideoFormat[];
  thumbnail: VideoThumbnail | null;
}

export interface DeleteAllVideosResponse {
  deleted: number;
  message: string;
}

export type UploadProgressHandler = (loaded: number, total: number | undefined) => void;

export const fileManagementAPI = {
  uploadFile: (
    data: FormData,
    options?: { onUploadProgress?: UploadProgressHandler }
  ) =>
    api.post("/videos/upload", data, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress:
        options?.onUploadProgress &&
        ((e) => options!.onUploadProgress!(e.loaded, e.total)),
    }),
};

export interface UpdateVideoData {
  title?: string;
  description?: string;
}

export interface UpdateVideoResponse {
  message: string;
  id: string;
  title: string;
  description: string | null;
}

export interface GetVideosParams {
  q?: string | null;
  status?: string | null;
  sort?: string;
  order?: "asc" | "desc";
}

export const videosAPI = {
  getVideos: (params?: GetVideosParams) =>
    api.get<Video[]>("/videos", {
      params: {
        ...(params?.q != null && params.q !== "" && { q: params.q }),
        ...(params?.status != null && params.status !== "" && { status: params.status }),
        ...(params?.sort != null && { sort: params.sort }),
        ...(params?.order != null && { order: params.order }),
      },
    }),
  updateVideo: (id: string, data: UpdateVideoData) => api.patch<UpdateVideoResponse>(`/videos/${id}`, data),
  deleteVideo: (id: string) => api.delete<{ message: string; id: string }>(`/videos/${id}`),
  deleteAllVideos: () => api.delete<DeleteAllVideosResponse>("/videos"),
};
