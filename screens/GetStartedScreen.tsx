import * as React from 'react';
import { StackActions, useNavigation } from '@react-navigation/core';
import { Button, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';

import { Text, View } from '../components/Themed';
import { buildDefaultWorkoutLog } from '../state/AppState';
import { RootState, useWorkoutLog } from '../state/store';
import { WorkoutLogSlice } from '../state/reducers';

export default function GetStartedScreen() {
  const workoutLog = useSelector((state: RootState) => state.workoutLog)
  const dispatch = useDispatch()
  const navigation = useNavigation()
  React.useEffect(() => {
    if (workoutLog) {
      // navigation.navigate('WeeklyPlanScreen')
      navigation.dispatch(StackActions.replace('WeeklyPlanScreen'))
    }
  }, [workoutLog])

  return (
    <View style={styles.container}>
      <Button title="Get started" onPress={() => dispatch(WorkoutLogSlice.actions.set(buildDefaultWorkoutLog()))} />
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
