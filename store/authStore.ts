import { create } from 'zustand';
import { authAPI, setToken, removeToken } from '@/lib/api';
import { router } from 'expo-router';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  phone?: string;
  department?: string;
  profile_image?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
  
  // Actions
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: false,
  isAuthenticated: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.login({ email, password });
      const { token, user } = response.data;
      
      await setToken(token);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      // Navigate based on role
      if (user.role === 'admin') {
        router.replace('/(admin)');
      } else {
        router.replace('/(tabs)');
      }
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Login failed',
        isLoading: false,
      });
      throw error;
    }
  },

  register: async (data: any) => {
    set({ isLoading: true, error: null });
    try {
      const response = await authAPI.register(data);
      const { token, user } = response.data;
      
      await setToken(token);
      set({
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
      });
      
      router.replace('/(tabs)');
    } catch (error: any) {
      set({
        error: error.response?.data?.message || 'Registration failed',
        isLoading: false,
      });
      throw error;
    }
  },

  logout: async () => {
    set({ isLoading: true });
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      await removeToken();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
      router.replace('/(auth)/login');
    }
  },

  setUser: (user: User) => {
    set({ user });
  },

  clearError: () => {
    set({ error: null });
  },

  checkAuth: async () => {
    set({ isLoading: true });
    try {
      const response = await authAPI.verifyToken();
      const { user } = response.data;
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      await removeToken();
      set({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },
}));