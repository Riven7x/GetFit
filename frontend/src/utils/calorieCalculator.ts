// MET (Metabolic Equivalent of Task) values for exercises
const MET_VALUES: { [key: string]: number } = {
  pushup: 8.0,
  squats: 5.5,
  arm_circles: 4.0,
};

// Average time per rep in seconds
const AVG_TIME_PER_REP: { [key: string]: number } = {
  pushup: 2.0,  // 2 seconds per pushup
  squats: 3.0,  // 3 seconds per squat
  arm_circles: 1.5,  // 1.5 seconds per arm circle
};

/**
 * Calculate calories burned for an exercise
 * Formula: Calories = MET × Weight(kg) × Time(hours)
 * 
 * @param exerciseType - Type of exercise (pushup, squats, arm_circles)
 * @param count - Number of reps
 * @param weightKg - User's weight in kilograms
 * @returns Calories burned
 */
export function calculateCalories(
  exerciseType: string,
  count: number,
  weightKg: number
): number {
  const met = MET_VALUES[exerciseType] || 5.0;
  const timePerRep = AVG_TIME_PER_REP[exerciseType] || 2.0;
  
  // Calculate total time in hours
  const totalTimeHours = (count * timePerRep) / 3600;
  
  // Calculate calories
  const calories = met * weightKg * totalTimeHours;
  
  return Math.round(calories * 10) / 10; // Round to 1 decimal place
}

/**
 * Get duration in seconds for a given number of reps
 */
export function getDuration(exerciseType: string, count: number): number {
  const timePerRep = AVG_TIME_PER_REP[exerciseType] || 2.0;
  return count * timePerRep;
}
