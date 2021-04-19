export type CsafeCmd = ResetCmd | AutoUploadCmd |
  GoInUseCmd | SetProgramCmd | SetTWorkCmd |
  SetHorizontalCmd | GetForcePlotCmd | GetWorkDistanceCmd
  | SetWorkoutTypeCmd | SetRestDurationCmd | SetWorkoutInvervalCountCmd

export const CsafeCommands = {
  reset(): ResetCmd {
    return { type: 'Reset' }
  },
  goInUse(): GoInUseCmd {
    return { type: 'GoInUse' }
  },
  setProgram(n?: number): SetProgramCmd {
    return { type: 'SetProgram', program: n || 0 }
  },
  setTWork(seconds: number): SetTWorkCmd {
    return {
      type: 'SetTWork',
      hours: Math.floor(seconds / 60 / 60),
      minutes: Math.floor(seconds / 60),
      seconds: seconds % 60,
    }
  },
  setHorizontal(distance: number): SetHorizontalCmd {
    return {
      type: 'SetHorizontal',
      distance,
      unit: 'm',
    }
  },
  autoUpload(): AutoUploadCmd {
    return {
      type: 'AutoUpload',
      byte: 1 | (1 << 4),
    }
  },
  getForcePlot(): GetForcePlotCmd {
    return { type: 'GetForcePlot' }
  },
  getWorkDistance(): GetWorkDistanceCmd {
    return { type: 'GetWorkDistance' }
  },
  setWorkoutType(workoutType: number): SetWorkoutTypeCmd {
    return { type: 'SetWorkoutType', workoutType }
  },
  setRestDuration(duration: number): SetRestDurationCmd {
    return { type: 'SetRestDuration', duration }
  },
  setWorkoutIntervalCount(count: number): SetWorkoutInvervalCountCmd {
    return { type: 'SetWorkoutIntervalCount', count }
  }
}

export interface SetWorkoutInvervalCountCmd {
  type: 'SetWorkoutIntervalCount'
  count: number
}

export interface SetRestDurationCmd {
  type: 'SetRestDuration',
  duration: number
}

export interface ResetCmd {
  type: 'Reset'
}

export interface GoInUseCmd {
  type: 'GoInUse'
}

export interface AutoUploadCmd {
  type: 'AutoUpload'
  byte: number
}

export interface SetProgramCmd {
  type: 'SetProgram'
  program: number
}

export interface SetTWorkCmd {
  type: 'SetTWork'
  hours: number
  minutes: number
  seconds: number
}

export interface SetHorizontalCmd {
  type: 'SetHorizontal'
  distance: number
  unit: 'm'
}

export interface GetForcePlotCmd {
  type: 'GetForcePlot'
}

export interface GetWorkDistanceCmd {
  type: 'GetWorkDistance'
}

export interface SetSplitCmd {
  type: 'SetSplit'
  splitType: 'Time' | 'Distance'
  value: number
}

export interface SetWorkoutTypeCmd {
  type: 'SetWorkoutType'
  workoutType: number
}
