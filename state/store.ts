import { configureStore } from '@reduxjs/toolkit'
import { useSelector } from 'react-redux'
import { WorkoutLog } from './AppState'
import { WorkoutLogSlice } from './reducers'


const store = configureStore({
  reducer: {
    workoutLog: WorkoutLogSlice.reducer,
  }
})

export default store

export type RootState = ReturnType<typeof store.getState>

export function useWorkoutLog(): WorkoutLog {
  const workoutLog = useSelector((state: RootState) => state.workoutLog)
  if (!workoutLog) throw new Error("Couldn't find workout log")
  return workoutLog
}
