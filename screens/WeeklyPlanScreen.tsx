import * as React from 'react'
import { dayOfWeek } from '../utils/dateUtils'
import { SectionList, StyleSheet } from 'react-native'
import { Text, useThemeColor, View } from '../components/Themed'
import { useNavigation } from '@react-navigation/core'
import { TouchableNativeFeedback } from 'react-native-gesture-handler'
import { workoutName } from '../utils/workoutUtils'
import { useWorkoutLog } from '../state/store'
import { useDispatch } from 'react-redux'

export default function WeeklyPlanScreen() {
  const workoutLog = useWorkoutLog()
  const navigation = useNavigation()
  const weeklyPlan = workoutLog.plan.find(plan => plan.id === workoutLog.currentWeeklyPlanId)
  if (!weeklyPlan) throw new Error("Couldn't find weekly plan")
  const allWeeklyWorkouts = weeklyPlan.mandatoryWorkouts.concat(weeklyPlan.optionalWorkouts)
  const nextWorkout = allWeeklyWorkouts.find(workout => !workoutLog.completedWorkouts.find(cw => cw.workoutId === workout.id))

  return (
    <View style={styles.container}>
      {/* <Text style={styles.title}>Welcome to week {weeklyPlan.id} of your plan!</Text> */}
      <SectionList
        style={{width: '80%', height: '100%'}}
        sections={[
          { title: 'Mandatory workouts', data: weeklyPlan.mandatoryWorkouts },
          { title: 'Optional workouts', data: weeklyPlan.optionalWorkouts },
        ]}
        keyExtractor={item => item.id.toString()}
        renderItem={({item}) => {
          const completedWorkout = workoutLog.completedWorkouts.find(cw => cw.workoutId === item.id)
          if (completedWorkout) {
            const backgroundColor = useThemeColor({}, 'accent')
            return <>
              <TouchableNativeFeedback onPress={() => navigation.navigate('EditCompletedWorkoutScreen', {workoutId: item.id})}>
                <View style={{backgroundColor, ...styles.workout}}>
                  <Text>{workoutName(item)}</Text>
                </View>
              </TouchableNativeFeedback>
            </>
          }
          const backgroundColor = useThemeColor({}, 'tint')
          return <>
            <TouchableNativeFeedback onPress={() => navigation.navigate('PerformWorkoutScreen', {workoutId: item.id})}>
              <View style={{backgroundColor, ...styles.workout}}>
                <Text lightColor="#fff">{workoutName(item)}</Text>
              </View>
            </TouchableNativeFeedback>
          </>
        }}
        renderSectionHeader={({ section: { title } }) => {
          return <Text style={styles.heading}>{title}</Text>
        }}
      />
      {!nextWorkout && <View style={{ alignItems: 'center' }}>
        <Text style={styles.title}>All workouts complete!</Text>
        <Text style={styles.title}>Workouts continue on {dayOfWeek(new Date(workoutLog.nextWeekStartsAt))}</Text>
      </View>}

    </View>
  )
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
    marginVertical: 20,
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
  workout: {
    padding: 16,
    marginVertical: 8,
  },
})
