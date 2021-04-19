import { beginnerPlan, Meter, Seconds, WeeklyPlan } from "../constants/RowingPlan";
import { addOneWeek } from "../utils/dateUtils";

export interface CompletedWorkout {
  weeklyPlanId: number
  workoutId: number
  completedAt: string
  time: Seconds
  distance: Meter
}

export interface WorkoutLog {
  plan: WeeklyPlan[]
  completedWorkouts: CompletedWorkout[]
  currentWeeklyPlanId: number
  nextWorkoutId?: number
  nextWeekStartsAt: string
}

export const buildDefaultWorkoutLog = () => {
  const workoutLog: WorkoutLog = {
    plan: beginnerPlan,
    completedWorkouts: [],
    currentWeeklyPlanId: beginnerPlan[0].id,
    nextWorkoutId: beginnerPlan[0].mandatoryWorkouts[0].id,
    nextWeekStartsAt: addOneWeek(new Date()).toISOString(),
  }

  return workoutLog
}
