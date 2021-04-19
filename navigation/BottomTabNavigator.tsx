import { Ionicons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import * as React from 'react';

import Colors from '../constants/Colors';
import useColorScheme from '../hooks/useColorScheme';
import TabTwoScreen from '../screens/TabTwoScreen';
import { BottomTabParamList, TabTwoParamList, WorkoutTabParamList } from '../types';
import WorkoutTabScreen from '../screens/WorkoutTabScreen';
import GetStartedScreen from '../screens/GetStartedScreen';
import WeeklyPlanScreen from '../screens/WeeklyPlanScreen';
import PerformWorkoutScreen from '../screens/PerformWorkoutScreen';
import EditCompletedWorkoutScreen from '../screens/EditCompletedWorkoutScreen';

const BottomTab = createBottomTabNavigator<BottomTabParamList>();

export default function BottomTabNavigator() {
  const colorScheme = useColorScheme();

  return (
    <BottomTab.Navigator
      initialRouteName="WorkoutTab"
      tabBarOptions={{ activeTintColor: Colors[colorScheme].tint }}>
      <BottomTab.Screen
        name="WorkoutTab"
        component={WorkoutTabNavigator}
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="bicycle-outline" color={color} />,
          title: 'Workout',
        }}
      />
      <BottomTab.Screen
        name="TabTwo"
        component={TabTwoNavigator}
        options={{
          tabBarIcon: ({ color }) => <TabBarIcon name="ios-code" color={color} />,
        }}
      />
    </BottomTab.Navigator>
  );
}

// You can explore the built-in icon families and icons on the web at:
// https://icons.expo.fyi/
function TabBarIcon(props: { name: React.ComponentProps<typeof Ionicons>['name']; color: string }) {
  return <Ionicons size={30} style={{ marginBottom: -3 }} {...props} />;
}

// Each tab has its own navigation stack, you can read more about this pattern here:
// https://reactnavigation.org/docs/tab-based-navigation#a-stack-navigator-for-each-tab
const WorkoutTabStack = createStackNavigator<WorkoutTabParamList>();

function WorkoutTabNavigator() {
  return (
    <WorkoutTabStack.Navigator initialRouteName="GetStartedScreen">
      <WorkoutTabStack.Screen
        name="GetStartedScreen"
        component={GetStartedScreen}
        options={{ headerTitle: 'Get Started' }}
      />
      <WorkoutTabStack.Screen
        name="WeeklyPlanScreen"
        component={WeeklyPlanScreen}
        options={{headerTitle: 'Weekly Workout Plan'}}
      />
      <WorkoutTabStack.Screen
        name="PerformWorkoutScreen"
        component={PerformWorkoutScreen}
        options={{headerTitle: 'Perform workout'}}
      />
      <WorkoutTabStack.Screen
        name="EditCompletedWorkoutScreen"
        component={EditCompletedWorkoutScreen}
        options={{headerTitle: 'Editing completed workout'}}
      />
    </WorkoutTabStack.Navigator>
  );
}

const TabTwoStack = createStackNavigator<TabTwoParamList>();

function TabTwoNavigator() {
  return (
    <TabTwoStack.Navigator>
      <TabTwoStack.Screen
        name="TabTwoScreen"
        component={TabTwoScreen}
        options={{ headerTitle: 'Tab Two Title' }}
      />
    </TabTwoStack.Navigator>
  );
}
