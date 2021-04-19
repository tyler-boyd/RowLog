import React, { useEffect, useRef, useState } from 'react'
import { Button } from 'react-native'
import { Workout } from '../constants/RowingPlan'

import { getMonitor } from '../ergometerjs/monitor'
import { Text } from './Themed'

interface Props {
  workout: Workout
  complete: (time: number, distance: number) => void
}

const Test: React.FC<Props> = ({ workout, complete: completeRaw }) => {
  const monitor = getMonitor()
  const [time, setTime] = useState(0)
  const [distance, setDistance] = useState(0)
  const complete = useRef(completeRaw)
  complete.current = completeRaw
  const [status, setStatus] = useState<'idle' | 'connecting' | 'rowing'>('idle')
  const startWorkout = async () => {
    setStatus('connecting')
    try {
      switch(workout.type) {
        case 'DistanceWorkout':
          await monitor.startDistanceWorkout(workout.distance)
          break
        case 'TimeWorkout':
          await monitor.startTimeWorkout(workout.time)
          break
      }
      setStatus('rowing')
    } catch (err) {
      console.error(err)
      alert(err.message + err.stack)
      setStatus('idle')
    }
  }

  useEffect(() => {
    monitor.onRowingStatusChange(({time, distance}) => {
      setTime(time)
      setDistance(distance)
    })
    monitor.onWorkoutCompleted(({time, distance, cancelled}) => {
      if (cancelled) {
        alert('Detected that the workout has been cancelled')
        setStatus('idle')
        return
      }
      complete.current(time, distance)
    })
  }, [])

  if (status === 'idle') {
    return <>
      <Button title="Connect to PM5 + Start" onPress={() => startWorkout()} />
    </>
  }

  if (status === 'connecting') {
    return <>
      <Text>Connecting to PM...</Text>
    </>
  }

  return <>
    <Text>Tracking workout on PM. Time={time}, distance={distance}</Text>
  </>
}

export default Test
