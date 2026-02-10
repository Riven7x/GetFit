export interface User {
  id: string;
  email: string;
  name: string;
  gender?: string;
  weight_kg?: number;
  height_cm?: number;
  created_at: string;
}

export interface Exercise {
  type: 'pushup' | 'squats' | 'arm_circles';
  count: number;
  duration_seconds: number;
  calories: number;
}

export interface DailyStats {
  date: string;
  total_calories: number;
  pushups: number;
  squats: number;
  arm_circles: number;
}

export interface WeeklyStats {
  week_start: string;
  days: DailyStats[];
  total_calories: number;
  total_exercises: number;
}

export interface BLEDevice {
  id: string;
  name: string;
}
