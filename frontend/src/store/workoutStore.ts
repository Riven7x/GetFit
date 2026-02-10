import { create } from 'zustand';
import { Exercise } from '../types';

interface WorkoutState {
  isActive: boolean;
  exercises: Exercise[];
  currentExercise: string | null;
  exerciseCounts: { [key: string]: number };
  startTime: Date | null;
  
  startWorkout: () => void;
  stopWorkout: () => void;
  addExercise: (type: string) => void;
  setCurrentExercise: (exercise: string | null) => void;
  resetWorkout: () => void;
}

const MET_VALUES: { [key: string]: number } = {
  pushup: 8.0,
  squats: 5.5,
  arm_circles: 4.0,
};

export const useWorkoutStore = create<WorkoutState>((set, get) => ({
  isActive: false,
  exercises: [],
  currentExercise: null,
  exerciseCounts: {},
  startTime: null,
  
  startWorkout: () => set({ isActive: true, startTime: new Date(), exercises: [], exerciseCounts: {} }),
  
  stopWorkout: () => set({ isActive: false }),
  
  addExercise: (type: string) => {
    const state = get();
    const normalizedType = type === 'arm_circle' ? 'arm_circles' : type;
    const newCount = (state.exerciseCounts[normalizedType] || 0) + 1;
    
    set({
      exerciseCounts: {
        ...state.exerciseCounts,
        [normalizedType]: newCount,
      },
      currentExercise: normalizedType,
    });
  },
  
  setCurrentExercise: (exercise) => set({ currentExercise: exercise }),
  
  resetWorkout: () => set({
    isActive: false,
    exercises: [],
    currentExercise: null,
    exerciseCounts: {},
    startTime: null,
  }),
}));
