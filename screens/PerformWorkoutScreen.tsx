import { RouteProp, useNavigation, useRoute } from '@react-navigation/core'
import * as React from 'react'
import { Button, StyleSheet, TextInput } from 'react-native'
import { useDispatch } from 'react-redux'
import SecondsInput from '../components/SecondsInput'
import StartWorkoutOnPM from '../components/StartWorkoutOnPM'
import { Text, View } from '../components/Themed'
import { WorkoutLogSlice } from '../state/reducers'
import { useWorkoutLog } from '../state/store'
import { WorkoutTabParamList } from '../types'
import { workoutDistance, workoutName, workoutTime } from '../utils/workoutUtils'

const PerformWorkoutScreen: React.FC = () => {
  const dispatch = useDispatch()
  const navigator = useNavigation();
  const route = useRoute<RouteProp<WorkoutTabParamList, 'PerformWorkoutScreen'>>()
  if (!route.params?.workoutId) {
    throw new Error('No workoutId')
  }
  const workoutLog = useWorkoutLog()
  const weeklyPlan = workoutLog.plan.find(week => week.id === workoutLog.currentWeeklyPlanId)
  if (!weeklyPlan) throw new Error("Couldn't find weeklyPlan")
  const allWeeklyWorkouts = weeklyPlan.mandatoryWorkouts.concat(weeklyPlan.optionalWorkouts)
  const workout = allWeeklyWorkouts.find(w => w.id === route.params!.workoutId)
  if (!workout) throw new Error("Couldn't find workout")
  const isTimeWorkout = !!(workout as any).time
  const [time, setTime] = React.useState((workoutTime(workout) ?? 0) * 60)
  const [distance, setDistance] = React.useState(workoutDistance(workout) ?? 0)
  const complete = (time: number, distance: number) => {
    dispatch(WorkoutLogSlice.actions.completeWorkout({time, distance, workoutId: workout.id}))
    navigator.goBack()
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Doing workout: {workoutName(workout)}</Text>
      <StartWorkoutOnPM workout={workout} complete={complete} />
      <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20}}>
        <Text style={{fontWeight: 'bold', fontSize: 16}}>{isTimeWorkout ? 'Distance (m)' : 'Time'}</Text>
        {isTimeWorkout ?
          <TextInput style={{height: 40,marginLeft: 10, minWidth: 100, borderWidth: 1, padding: 10,}} value={distance.toString()} onChangeText={text => setDistance(parseInt(text, 10))} keyboardType="numeric" /> :
          <SecondsInput initialValue={0} onChange={seconds => setTime(seconds)} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginVertical: 30,
    textAlign: 'center',
  },
  heading: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
    marginTop: 20,
  },
})

export default PerformWorkoutScreen
