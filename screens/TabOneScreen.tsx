import * as React from 'react';
import { Button, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import EditScreenInfo from '../components/EditScreenInfo';
import NextWorkout from '../components/NextWorkout';
import { Text, View } from '../components/Themed';
import { buildDefaultWorkoutLog } from '../state/AppState';
import { RootState, WorkoutLogSlice } from '../state/reducers';

export default function TabOneScreen() {
  const workoutLog = useSelector((state: RootState) => state.workoutLog)
  const dispatch = useDispatch()
  if (workoutLog) {
    return <NextWorkout />
  }
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tab One</Text>
      <Text>WorkoutLog: {JSON.stringify(workoutLog)}</Text>
      <Button title="Get started" onPress={() => dispatch(WorkoutLogSlice.actions.set(buildDefaultWorkoutLog()))} />
      <View style={styles.separator} lightColor="#eee" darkColor="rgba(255,255,255,0.1)" />
      <EditScreenInfo path="/screens/TabOneScreen.tsx" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  separator: {
    marginVertical: 30,
    height: 1,
    width: '80%',
  },
});
