import * as React from 'react'
import { Button, StyleSheet, TextInput } from 'react-native'
import { useDispatch, useSelector } from 'react-redux'
import { Meter, Seconds, Workout } from '../constants/RowingPlan'
import { WorkoutLogSlice } from '../state/reducers'
import SecondsInput from './SecondsInput'
import StartWorkoutOnPM from './StartWorkoutOnPM'
import { View, Text } from './Themed'

interface IDoWorkoutProps {
  workout: Workout
  complete: (time: Seconds, distance: Meter) => void
}
const DoWorkout: React.FC<IDoWorkoutProps> = ({workout, complete}) => {
  const isTimeWorkout = !!(workout as any).time
  const [time, setTime] = React.useState(((workout as any).time as number ?? 0) * 60)
  const [distance, setDistance] = React.useState((workout as any).distance as number ?? 0)
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Doing workout: {workoutName(workout)}</Text>
      <StartWorkoutOnPM workout={workout} complete={complete} />
      <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20}}>
        <Text style={{fontWeight: 'bold', fontSize: 16}}>{isTimeWorkout ? 'Distance (m)' : 'Time'}</Text>
        {isTimeWorkout ?
          <TextInput style={{height: 40,marginLeft: 10, minWidth: 100, borderWidth: 1, padding: 10,}} autoFocus value={distance.toString()} onChangeText={text => setDistance(parseInt(text, 10))} keyboardType="numeric" /> :
          <SecondsInput initialValue={0} onChange={seconds => setTime(seconds)} autoFocus onSubmit={() => complete(time, distance)} />
        }

      </View>
      <View style={styles.title}>
        <Button title="Complete" onPress={() => {
          complete(time, distance)
        }} />
      </View>
    </View>
  )
}

export default function NextWorkout() {
  const workoutLog = useSelector((state: RootState) => state.workoutLog)
  const dispatch = useDispatch()
  if (!workoutLog) throw new Error("workoutLog is null!")
  const weeklyPlan = workoutLog.plan.find(plan => plan.id === workoutLog.currentWeeklyPlanId)
  if (!weeklyPlan) throw new Error("Couldn't find weekly plan")
  const allWeeklyWorkouts = weeklyPlan.mandatoryWorkouts.concat(weeklyPlan.optionalWorkouts)
  const nextWorkout = allWeeklyWorkouts.find(workout => workout.id === workoutLog.nextWorkoutId)

  const [doingWorkout, setDoingWorkout] = React.useState(false)

  if (doingWorkout) {
    if (!nextWorkout) throw new Error("Dunno which workout to do...")
    return <DoWorkout workout={nextWorkout} complete={(time, distance) => {
      dispatch(WorkoutLogSlice.actions.set({
        ...workoutLog,
        completedWorkouts: [...workoutLog.completedWorkouts, {
          weeklyPlanId: weeklyPlan.id,
          workoutId: nextWorkout.id,
          time,
          distance,
          completedAt: new Date(),
        }],
        nextWorkoutId: allWeeklyWorkouts[allWeeklyWorkouts.indexOf(nextWorkout) + 1]?.id,
      }))
      setDoingWorkout(false)
    }} />
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  checkboxContainer: {
    flexDirection: "row",
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 20,
    textAlign: 'center',
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
  },
  label: {
    margin: 8,
  },
})
