import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Provider } from 'react-redux';


import useCachedResources from './hooks/useCachedResources';
import useColorScheme from './hooks/useColorScheme';
import Navigation from './navigation';
import { WorkoutLogSlice } from './state/reducers';
import store from './state/store';

export default function App() {
  const isLoadingComplete = useCachedResources();
  const colorScheme = useColorScheme();

  useEffect(() => {
    const workoutLog = store.getState().workoutLog
    if (!workoutLog) return
    if (workoutLog.nextWeekStartsAt < new Date()) {
      const plan = workoutLog.plan[workoutLog.plan.findIndex(p => p.id === workoutLog.currentWeeklyPlanId) + 1]
      store.dispatch(WorkoutLogSlice.actions.set({...workoutLog, currentWeeklyPlanId: plan.id, nextWorkoutId: plan.mandatoryWorkouts[0].id}))
    }
  }, [])

  if (!isLoadingComplete) {
    return null;
  } else {
    return (
      <SafeAreaProvider>
        <Provider store={store}>
          <Navigation colorScheme={colorScheme} />
          <StatusBar />
        </Provider>
      </SafeAreaProvider>
    );
  }
}
