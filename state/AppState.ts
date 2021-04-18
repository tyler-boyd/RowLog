import { beginnerPlan, Meter, Seconds, WeeklyPlan } from "../constants/RowingPlan";

export interface CompletedWorkout {
  weeklyPlanId: number
  workoutId: number
  completedAt: Date
  time: Seconds
  distance: Meter
}

export interface WorkoutLog {
  plan: WeeklyPlan[]
  completedWorkouts: CompletedWorkout[]
  currentWeeklyPlanId: number
  nextWorkoutId?: number
  nextWeekStartsAt: Date
}

export const buildDefaultWorkoutLog = () => {
  const workoutLog: WorkoutLog = {
    plan: beginnerPlan,
    completedWorkouts: [],
    currentWeeklyPlanId: beginnerPlan[0].id,
    nextWorkoutId: beginnerPlan[0].mandatoryWorkouts[0].id,
    nextWeekStartsAt: new Date(new Date().setDate(new Date().getDate() + 7)),
  }

  return workoutLog
}
