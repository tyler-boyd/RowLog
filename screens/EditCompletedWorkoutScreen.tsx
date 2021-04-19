import { RouteProp, useNavigation, useRoute } from '@react-navigation/core'
import * as React from 'react'
import { Button, StyleSheet, TextInput } from 'react-native'
import { useDispatch } from 'react-redux'
import SecondsInput from '../components/SecondsInput'
import { Text, View } from '../components/Themed'
import { WorkoutLogSlice } from '../state/reducers'
import { useWorkoutLog } from '../state/store'
import { WorkoutTabParamList } from '../types'
import { workoutName, workoutTime } from '../utils/workoutUtils'

export default function EditCompletedWorkoutScreen() {
  const route = useRoute<RouteProp<WorkoutTabParamList, 'EditCompletedWorkoutScreen'>>()
  if (!route.params?.workoutId) throw new Error("Missing workoutId")

  const workoutLog = useWorkoutLog()
  const completedWorkout = workoutLog.completedWorkouts.find(cw => cw.workoutId === route.params?.workoutId)
  const workout = workoutLog.plan.flatMap(weeklyPlan => weeklyPlan.mandatoryWorkouts.concat(weeklyPlan.optionalWorkouts)).find(w => w.id === route.params?.workoutId)
  if (!workout) throw new Error("Missing workout")

  const [time, setTime] = React.useState(completedWorkout?.time || 0)
  const [distance, setDistance] = React.useState(completedWorkout?.distance || 0)
  const dispatch = useDispatch()
  const navigation = useNavigation()

  if (!completedWorkout) return null

  return <>
    <View style={styles.container}>
      <Text style={styles.heading}>{workoutName(workout)}</Text>
      <Text>Completed {new Date(completedWorkout.completedAt).toDateString()}</Text>
      <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20}}>
        <Text style={{fontWeight: 'bold', fontSize: 16}}>Distance</Text>
        <TextInput style={{height: 40,marginLeft: 10, minWidth: 100, borderWidth: 1, padding: 10,}} value={distance.toString()} onChangeText={text => setDistance(parseInt(text, 10))} keyboardType="numeric" />
      </View>
      <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20}}>
        <Text style={{fontWeight: 'bold', fontSize: 16}}>Time</Text>
        <SecondsInput initialValue={time} onChange={seconds => setTime(seconds)} />
      </View>
      <View style={{flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20, maxWidth: '80%'}}>
        <Button title='Delete' color='red' onPress={() => {
          dispatch(WorkoutLogSlice.actions.deleteCompletedWorkout({workoutId: workout.id}))
          navigation.goBack()
        }} />
        <View style={{flexGrow: 1}}></View>
        <Button title='Save changes' onPress={() => {
          dispatch(WorkoutLogSlice.actions.editCompletedWorkout({workoutId: workout.id, time, distance}))
          navigation.goBack()
        }} />
      </View>
    </View>
  </>
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  heading: {
    fontSize: 16,
    marginVertical: 20,
  },
})
