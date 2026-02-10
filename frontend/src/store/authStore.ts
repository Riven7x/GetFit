import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  
  setToken: async (token) => {
    if (token) {
      await AsyncStorage.setItem('auth_token', token);
    } else {
      await AsyncStorage.removeItem('auth_token');
    }
    set({ token, isAuthenticated: !!token });
  },
  
  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    set({ user: null, token: null, isAuthenticated: false });
  },
  
  loadAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('auth_token');
      set({ token, isAuthenticated: !!token, isLoading: false });
    } catch (error) {
      console.error('Failed to load auth:', error);
      set({ isLoading: false });
    }
  },
}));
