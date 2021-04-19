import { BleError, BleManager, Characteristic, Device, ScanMode } from "react-native-ble-plx";
import { readBytesAsInt } from "./utils";
import { Buffer } from 'buffer'
import CsafeMultiplexer from "./csafe/multiplexer";
import { CsafeCmd, CsafeCommands } from "./csafe/commands";

const RowingService = {
  uuid: 'ce060030-43e5-11e4-916c-0800200c9a66',
  characteristics: {
    rowingStatus: 'ce060031-43e5-11e4-916c-0800200c9a66',
    sampleRate: 'ce060034-43e5-11e4-916c-0800200c9a66',
    workoutSummary: 'ce060039-43e5-11e4-916c-0800200c9a66',
    extraWorkoutSummary: 'ce06003a-43e5-11e4-916c-0800200c9a66',
  },
}

export type WorkoutState = 'WAITING' | 'ROWING' | 'COMPLETED' | 'TERMINATED' | 'OTHER'
function convertWorkoutState(n: number): WorkoutState {
  switch(n) {
    case 0:
      return 'WAITING'
    case 1:
      return 'ROWING'
    case 10:
      return 'COMPLETED'
    case 11:
      return 'TERMINATED'
    default:
      return 'OTHER'
  }
}
export interface RowingStatusEvent {
  time: number
  distance: number
  workoutState: WorkoutState
}
export interface WorkoutCompletedEvent {
  time: number
  distance: number
  cancelled: boolean
}
export type EventListener<T> = (ev: T) => void

export default class Monitor {
  private manager: BleManager
  private device: Device
  private conn: CsafeMultiplexer
  private rowingStatusListener?: EventListener<RowingStatusEvent>
  private workoutCompletedListener?: EventListener<WorkoutCompletedEvent>

  constructor(manager: BleManager) {
    this.manager = manager
    this.device = null as any
    this.conn = null as any
  }

  // Scans for a PM, connects to it, registers the notifications and sets up the multiplexer.
  // You can call this directly, but it is automatically called by all other functions.
  initialize() {
    return new Promise<void>(async (res, rej) => {
      console.log(`[Monitor] isConnected: ${this.device && await this.device.isConnected()}`)
      if (this.device && await this.device.isConnected()) return res()
      console.log(`[Monitor] starting scan...`)
      const subscription = this.manager.onStateChange(state => {
        if (state !== 'PoweredOn') return
        subscription.remove();
        this.manager.startDeviceScan(null, { scanMode: ScanMode.LowLatency }, async (error, device) => {
          if (error || !device) {
            rej(error || 'No device')
            return
          }

          if (!device.localName?.startsWith("PM5")) {
            return
          }

          this.manager.stopDeviceScan()

          console.log(`[Monitor] found device ${device.localName}`)
          try {
            this.device = await device.connect()
            await device.discoverAllServicesAndCharacteristics()
            this.conn = new CsafeMultiplexer(device)
            this.conn.addResponseListener()
            this.device.monitorCharacteristicForService(
              RowingService.uuid,
              RowingService.characteristics.rowingStatus,
              this.onRowingStatusUpdate.bind(this),
            )
            this.device.monitorCharacteristicForService(
              RowingService.uuid,
              RowingService.characteristics.workoutSummary,
              this.onWorkoutStatusUpdate.bind(this),
            )
            res()
          } catch (err) {
            rej(err)
          }
        })
      }, true);
    })
  }

  // Register a listener for RowingStatusEvents (overwrites old listener)
  onRowingStatusChange(cb: EventListener<RowingStatusEvent>) {
    this.rowingStatusListener = cb
  }

  // Register a listener for WorkoutCompletedEvent (overwrites old listener)
  onWorkoutCompleted(cb: EventListener<WorkoutCompletedEvent>) {
    this.workoutCompletedListener = cb
  }

  // Resolves true iff there is a device currently connected
  async connected() {
    return this.device && await this.device.isConnected()
  }

  async startDistanceWorkout(distance: number) {
    await this.startWorkout(CsafeCommands.setHorizontal(distance))
  }

  async startTimeWorkout(time: number) {
    await this.startWorkout(CsafeCommands.setTWork(time))
  }

  // Note: this doesn't work, and is probably impossible
  async startIntervalWorkout(distance: number) {
    await this.initialize()
    const commands: CsafeCmd[] = [
      CsafeCommands.reset(),
      // CsafeCommands.setWorkoutType(7),
      // CsafeCommands.setHorizontal(distance),
      // CsafeCommands.setWorkoutIntervalCount(5),
      CsafeCommands.setProgram(5),
      CsafeCommands.setHorizontal(250),
      CsafeCommands.setRestDuration(44),
      CsafeCommands.goInUse(),
    ]
    for (const command of commands) { await this.conn.send(command) }
  }

  private async startWorkout(...extraCommands: CsafeCmd[]) {
    await this.initialize()
    const commands: CsafeCmd[] = [
      CsafeCommands.reset(),
      ...extraCommands,
      CsafeCommands.setProgram(),
      CsafeCommands.goInUse()
    ]
    for (const command of commands) {
      await this.conn.send(command)
    }
  }

  private onRowingStatusUpdate(err: BleError | null, c: Characteristic | null) {
    if (err) {
      console.error(`[Monitor] error: ${err}`)
      return
    }
    if (!c?.value) return
    const bytes = Array.from(Buffer.from(c.value, 'base64'))
    // console.log(`[Monitor] got rowing update from erg: ${bytes.map(n => n.toString(16)).join(' ')}`)
    const time = readBytesAsInt(...bytes.slice(0, 3))/100
    const distance = readBytesAsInt(...bytes.slice(3,6))/10
    const workoutType = bytes[6]
    const workoutState = convertWorkoutState(bytes[8])
    const rowingState = bytes[9]
    const strokeState = bytes[10]
    console.log(`[Monitor] got rowing update from erg: time=${time}, distance=${distance}, workoutType=${workoutType}, workoutState=${workoutState} rowingState=${rowingState}, strokeState=${strokeState}`)
    this.rowingStatusListener?.({time, distance, workoutState})
  }

  private onWorkoutStatusUpdate(err: BleError | null, c: Characteristic | null) {
    if (err) {
      console.error(`[Monitor] error: ${err}`)
      return
    }
    if (!c?.value) return
    const bytes = Array.from(Buffer.from(c.value, 'base64'))
    console.log(`[Monitor] got workout summary from erg: ${bytes.map(n => n.toString(16)).join(' ')}`)
    const time = readBytesAsInt(...bytes.slice(4,7))/100
    const distance = readBytesAsInt(...bytes.slice(7, 10))/10
    this.workoutCompletedListener?.({time, distance, cancelled: false})
  }
}

let monitor: Monitor | null = null
export const getMonitor = () => {
  if (monitor) return monitor
  return monitor = new Monitor(new BleManager())
}
