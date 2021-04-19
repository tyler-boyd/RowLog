export type RootStackParamList = {
  Root: undefined;
  NotFound: undefined;
};

export type BottomTabParamList = {
  WorkoutTab: undefined;
  TabTwo: undefined;
};

export type WorkoutTabParamList = {
  GetStartedScreen: undefined
  WeeklyPlanScreen: undefined
  PerformWorkoutScreen: PerformWorkoutScreenParamList | undefined
  EditCompletedWorkoutScreen: {workoutId: number} | undefined
};

export type PerformWorkoutScreenParamList = {
  workoutId: number
}

export type TabTwoParamList = {
  TabTwoScreen: undefined;
};
