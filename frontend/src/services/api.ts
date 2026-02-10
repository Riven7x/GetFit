import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { User, DailyStats, WeeklyStats, Exercise } from '../types';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL + '/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: async (email: string, password: string, name: string, gender?: string, weight_kg?: number, height_cm?: number) => {
    const response = await api.post('/auth/register', { email, password, name, gender, weight_kg, height_cm });
    return response.data;
  },
  
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

// Profile API
export const profileAPI = {
  update: async (data: Partial<User>) => {
    const response = await api.put('/profile', data);
    return response.data;
  },
};

// Workout API
export const workoutAPI = {
  create: async (exercises: Exercise[], startTime: Date, endTime: Date) => {
    const response = await api.post('/workouts', {
      exercises,
      start_time: startTime.toISOString(),
      end_time: endTime.toISOString(),
    });
    return response.data;
  },
  
  getToday: async (): Promise<DailyStats> => {
    const response = await api.get('/workouts/today');
    return response.data;
  },
  
  getDaily: async (date: string): Promise<DailyStats> => {
    const response = await api.get(`/workouts/daily/${date}`);
    return response.data;
  },
  
  getWeekly: async (): Promise<WeeklyStats> => {
    const response = await api.get('/workouts/weekly');
    return response.data;
  },
};
