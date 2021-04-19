import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { beginnerPlan } from "../constants/RowingPlan";
import { addOneWeek } from "../utils/dateUtils";
import { WorkoutLog } from "./AppState";

type WorkoutLogState = WorkoutLog | null
const initialState: WorkoutLogState = null

interface CompleteWorkoutPayload {
  workoutId: number
  time: number
  distance: number
}

export const WorkoutLogSlice = createSlice({
  name: 'workoutLog',
  initialState: initialState as WorkoutLogState,
  reducers: {
    set: (_, action: PayloadAction<WorkoutLogState>) => {
      return action.payload
    },
    completeWorkout: (state, action: PayloadAction<CompleteWorkoutPayload>) => {
      if (!state) return
      state.completedWorkouts.push({
        workoutId: action.payload.workoutId,
        weeklyPlanId: state.currentWeeklyPlanId,
        completedAt: new Date().toISOString(),
        time: action.payload.time,
        distance: action.payload.distance,
      })
      const weeklyPlan = state.plan.find(p => p.id === state.currentWeeklyPlanId)
      if (!weeklyPlan) return
      const allWorkouts = [...weeklyPlan.mandatoryWorkouts, ...weeklyPlan.optionalWorkouts]
      state.nextWorkoutId = allWorkouts.find(w => !state.completedWorkouts.find(cw => cw.workoutId === w.id))?.id
    },
    editCompletedWorkout: (state, action: PayloadAction<CompleteWorkoutPayload>) => {
      if (!state) return
      const completedWorkout = state.completedWorkouts.find(cw => cw.workoutId === action.payload.workoutId)
      if (!completedWorkout) return
      completedWorkout.time = action.payload.time
      completedWorkout.distance = action.payload.distance
    },
    deleteCompletedWorkout: (state, action: PayloadAction<{workoutId: number}>) => {
      if (!state) return
      state.completedWorkouts = state.completedWorkouts.filter(cw => cw.workoutId !== action.payload.workoutId)
    },
    moveToNextWeek: (state) => {
      if (!state) return
      state.plan = beginnerPlan
      if (new Date() > new Date(state.nextWeekStartsAt)) {
        state.nextWeekStartsAt = addOneWeek(new Date()).toISOString()
      }
    },
  }
})
