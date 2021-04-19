import * as React from "react"
import { useAsyncStorage } from "@react-native-async-storage/async-storage"
import { useDispatch, useSelector } from "react-redux"
import { WorkoutLog } from "../state/AppState"
import { WorkoutLogSlice } from "../state/reducers"
import { RootState } from "../state/store"

export default function StatePersister() {
  const workoutLog = useSelector((state: RootState) => state.workoutLog)
  const dispatch = useDispatch()
  const asyncStorage = useAsyncStorage('@workout_log')

  React.useEffect(() => {
    asyncStorage.getItem()
      .then(json => JSON.parse(json || 'null') as WorkoutLog | null)
      .then(savedLog => {
        if (!savedLog) return
        dispatch(WorkoutLogSlice.actions.set(savedLog))
      })
      .catch(err => console.error(`Failed to restore workout log due to: ${err}`))
      .finally(() => dispatch(WorkoutLogSlice.actions.moveToNextWeek()))
  }, [])

  React.useEffect(() => {
    if (!workoutLog) return
    // console.log(JSON.stringify(workoutLog, null, 2))
    asyncStorage.setItem(JSON.stringify(workoutLog))
      .catch(err => console.error(`Failed to save workout log due to: ${err}`))
  }, [workoutLog])

  return <></>
}
