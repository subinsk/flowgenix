import api from './api';

export interface User {
  id: string;
  email: string;
  username?: string;
  is_active: boolean;
  created_at: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  username?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

function setAuthHeader(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const response = await api.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData: RegisterData): Promise<User> => {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    }
    catch (error) {
      console.error('Logout failed:', error);
    } 
  },

  getCurrentUser: async (): Promise<User> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  refreshToken: async (): Promise<AuthResponse> => {
    const response = await api.post('/auth/refresh');
    const { access_token } = response.data;
    localStorage.setItem('auth_token', access_token);
    setAuthHeader(access_token);
    return response.data;
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem('auth_token');
  },

  setAuthHeader,
};
