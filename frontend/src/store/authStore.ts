import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

interface AuthStore {
  user: any | null;
  loading: boolean;
  token: string | null;
  setUser: (user: any) => void;
  setToken: (token: string | null) => void;
  setLoading: (loading: boolean) => void;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  signup: (email: string, password: string, name?: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  loading: false,
  token: localStorage.getItem('auth_token'),

  setUser: (user) => set({ user }),
  setToken: (token) => {
    set({ token });
    if (token) {
      localStorage.setItem('auth_token', token);
    } else {
      localStorage.removeItem('auth_token');
    }
  },
  setLoading: (loading) => set({ loading }),

  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      console.log('🔐 Attempting login...');

      const response = await axios.post(`${API_BASE}/auth/login`, {
        email,
        password,
      });

      console.log('✅ Login successful:', response.data);

      const { user, token } = response.data;
      set({ token, user });
      localStorage.setItem('auth_token', token);

      return { success: true };
    } catch (error: any) {
      console.error('❌ Login error:', error);

      let message = 'Login failed. Please check your credentials.';

      if (error.response?.data) {
        message = error.response.data.message || error.response.data.error || message;
      } else if (error.message) {
        message = error.message;
      }

      console.log('📌 Error message:', message);

      return { success: false, message };
    } finally {
      set({ loading: false });
    }
  },

  signup: async (email: string, password: string, name?: string) => {
    set({ loading: true });
    try {
      console.log('✍️ Attempting signup...');

      const response = await axios.post(`${API_BASE}/auth/signup`, {
        email,
        password,
        name: name || email.split('@')[0],
      });

      console.log('✅ Signup successful:', response.data);

      return {
        success: true,
        message: response.data.message || 'Account created! Please login now.',
      };
    } catch (error: any) {
      console.error('❌ Signup error:', error);

      let message = 'Signup failed. Please try again.';

      if (error.response?.data) {
        message = error.response.data.message || error.response.data.error || message;
      } else if (error.message) {
        message = error.message;
      }

      console.log('📌 Error message:', message);

      return { success: false, message };
    } finally {
      set({ loading: false });
    }
  },

  logout: async () => {
    set({ loading: true });
    try {
      await supabase.auth.signOut();
      set({ user: null, token: null });
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Logout failed:', error);
    } finally {
      set({ loading: false });
    }
  },

  checkAuth: async () => {
    try {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (token) {
        set({ token });
        localStorage.setItem('auth_token', token);

        try {
          const response = await axios.post(`${API_BASE}/auth/verify`, { token });
          set({ user: response.data.user });
          console.log('✅ Auth verified');
        } catch (error) {
          console.error('❌ Token verification failed:', error);
          set({ token: null });
        }
      } else {
        console.log('ℹ️ No session found');
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
    }
  },
}));