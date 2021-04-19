export type Meter = number
export type Minute = number
export type Seconds = number

export interface DistanceWorkout {
  type: "DistanceWorkout"
  id: number
  distance: Meter
}

export interface DistanceIntervalWorkout {
  type: "DistanceIntervalWorkout"
  id: number
  repetitions: number
  distance: Meter
  rest: Minute
}

export interface TimeWorkout {
  type: "TimeWorkout"
  id: number
  time: Minute
}

export interface TimeIntervalWorkout {
  type: "TimeIntervalWorkout"
  id: number
  repetitions: number
  time: Minute
  rest: Minute
}

export type Workout = DistanceWorkout | DistanceIntervalWorkout | TimeWorkout | TimeIntervalWorkout

export interface WeeklyPlan {
  id: number
  mandatoryWorkouts: Workout[]
  optionalWorkouts: Workout[]
}

let nextId = 1
function id() {
  return nextId++
}

function distanceWorkout(distance: Meter): DistanceWorkout {
  return {type: "DistanceWorkout", distance, id: id()}
}
function distanceIntervalWorkout(repetitions: number, distance: Meter, rest: Minute): DistanceIntervalWorkout {
  return {type: "DistanceIntervalWorkout", repetitions, distance, rest, id: id()}
}
function timeWorkout(time: Minute): TimeWorkout {
  return {type: "TimeWorkout", time, id: id()}
}
function timeIntervalWorkout(repetitions: number, time: Minute, rest: Minute): TimeIntervalWorkout {
  return {type: "TimeIntervalWorkout", repetitions, time, rest, id: id()}
}

export const beginnerPlan: WeeklyPlan[] = [
  {
    id: 1,
    mandatoryWorkouts: [distanceWorkout(5000), distanceIntervalWorkout(6, 500, 2), distanceWorkout(5000)],
    optionalWorkouts: [timeWorkout(20), timeIntervalWorkout(2, 10, 2)]
  },
  {
    id: 2,
    mandatoryWorkouts: [distanceWorkout(5500), distanceIntervalWorkout(4, 750, 2), distanceWorkout(5500)],
    optionalWorkouts: [timeWorkout(20), timeIntervalWorkout(3, 8, 20)],
  },
]
