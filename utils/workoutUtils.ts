import { Workout } from "../constants/RowingPlan";

export function workoutTime(workout: Workout) {
  switch (workout.type) {
    case 'TimeWorkout':
      return workout.time
    case 'TimeIntervalWorkout':
      return workout.repetitions * workout.time
    default:
      return null
  }
}

export function workoutDistance(workout: Workout) {
  switch (workout.type) {
    case 'DistanceWorkout':
      return workout.distance
    case 'DistanceIntervalWorkout':
      return workout.repetitions * workout.distance
    default:
      return null
  }
}

export function workoutName(workout: Workout): string {
  switch (workout.type) {
    case "DistanceWorkout":
      return `${workout.distance}m`
    case "DistanceIntervalWorkout":
      return `${workout.repetitions} x ${workout.distance}m / ${workout.rest} min rest`
    case "TimeWorkout":
      return `${workout.time} min`
    case "TimeIntervalWorkout":
      return `${workout.repetitions} x ${workout.time} min / ${workout.rest} min rest`
  }
}
