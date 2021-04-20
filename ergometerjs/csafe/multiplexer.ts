import { writeIntAsBytes } from '../utils'
import { CsafeCmd } from './commands'

export const ControlService = {
  uuid: 'ce060020-43e5-11e4-916c-0800200c9a66',
  characteristics: {
    transmit: 'ce060021-43e5-11e4-916c-0800200c9a66',
    receive: 'ce060022-43e5-11e4-916c-0800200c9a66'
  }
}

const ExtendedFrameStartFlag = 0xF0
const StandardFrameStartFlag = 0xF1
const StopFrameFlag = 0xF2
const ByteStuffingFlag = 0xF3

interface CsafeResponseStructure {
  identifier: number
  data: number[]
}
interface CsafeResponse {
  prevFrame: number
  slaveStatus: number
  structures: CsafeResponseStructure[]
}

// Returns a new array with all occurrences of 0xF0-0xF3 with 2 bytes [0xF3, (n & 0x03)]
const stuffed = (...data: number[]): number[] => {
  return data.flatMap(n => {
    if (n >= ExtendedFrameStartFlag && n <= ByteStuffingFlag) {
      return [ByteStuffingFlag, n & 0x03]
    }
    return n
  })
}

// Undoes stuffing (mutates array)
const unstuffed = (data: number[]): number[] => {
  for (let i = 0; i < data.length; i++) {
    if (data[i] == 0xF3) {
      if (i + 1 >= data.length) {
        throw new Error('Illegal 0xF3 found as the last non-stop character of the frame')
      }
      data[i] = data[i + 1] | 0xF0
      data.splice(i + 1)
    }
  }

  return data
}

// Computes the checksum of the byte array
const checksum = (data: number[]): number => {
  return data.reduce((c, n) => c ^ (n & 0xFF), 0)
}

// Wraps a PM-specific message in a cmdUserCfg1
const wrap = (cmd: number[]): number[] => {
  return [0x1A, cmd.length, ...cmd]
}

// Wraps a C2-specific message in a proprietary
const c2Wrap = (...body: number[]): number[] => {
  return [0x76, body.length, ...body]
}

const serializeCmd = (cmd: CsafeCmd): number[] => {
  const contents: number[] = []
  switch (cmd.type) {
    case 'Reset':
      contents.push(0x81)
      break;
    case 'AutoUpload':
      contents.push(0x01, cmd.byte & 0xFF)
      break
    case 'GoInUse':
      contents.push(0x85)
      break;
    case 'SetProgram':
      contents.push(0x24, 2, cmd.program, 0)
      break;
    case 'SetHorizontal':
      contents.push(0x21, 3, ...writeIntAsBytes(cmd.distance, 2), 36)
      break;
    case 'SetTWork':
      contents.push(0x20, 3, cmd.hours, cmd.minutes, cmd.seconds)
      break;
    case 'GetForcePlot':
      contents.push(...wrap([0x6A, 1, 32]))
      break
    case 'GetWorkDistance':
      contents.push(0xA1)
      break
    case 'SetWorkoutType':
      contents.push(...wrap([0x01, 1, 6]))
      break
    case 'SetRestDuration':
      contents.push(...wrap([0x04, 1, cmd.duration]))
      break
    case 'SetWorkoutIntervalCount':
      contents.push(...wrap([0x18, 1, cmd.count]))
      break
    case 'StartDistanceIntervalWorkout':
      contents.push(...c2Wrap(
        0x01, // CSAFE_PM_SET_WORKOUTTYPE
        0x01,
        0x07, // CSAFE_PM_SET_WORKOUTTYPE
        0x03, // CSAFE_PM_SET_WORKOUTDURATION
        0x05,
        0x80, // WORKOUT_DURATION_IDENTIFIER_DISTANCE
        ...writeIntAsBytes(cmd.distance, 4, true), // distance (Big Endian)
        0x04, // CSAFE_PM_SET_RESTDURATION
        0x02,
        ...writeIntAsBytes(cmd.restDuration, 2, true), // rest time seconds (Big Endian)
        0x14, // CSAFE_PM_CONFIGURE_WORKOUT
        0x01, 0x01,
        0x13, // CSAFE_PM_SET_SCREENSTATE
        0x02, 0x01, 0x01,
      ))
      break
    case 'Custom':
      contents.push(...cmd.bytes)
      break
    default:
      no(cmd)
  }
  return contents
}

const makePackets = (commands: CsafeCmd[]): number[][] => {
  const bytes: number[] = []

  bytes.push(StandardFrameStartFlag)
  const contents = commands.flatMap(cmd => serializeCmd(cmd))
  bytes.push(...stuffed(...contents))
  bytes.push(...stuffed(checksum(contents)))
  bytes.push(StopFrameFlag)
  const packets: number[][] = []
  for (let idx = 0; idx < bytes.length;) {
    packets.push(bytes.slice(idx, idx+20))
    idx += 20
  }
  return packets
}

function no(_: never): never { throw new Error("NEVER") }

// Represents a request from the user to send one or more messages
interface CsafeQueueEntry {
  commands: CsafeCmd[]
  timeout: ReturnType<typeof setTimeout>
  res: (result: CsafeResponse) => void
  rej: (error: Error) => void
}

// Multiplexer/state machine which "owns" the bidirectional CSAFE communication.
// Only this class should send messages, and all messages + errors received from
// the PM must be sent to the multiplexer (by calling receive(err, data))
export default class CsafeMultiplexer {
  private queue: CsafeQueueEntry[] = []
  private state: "ready" | "busy" = "ready"
  private writeMessage: (message: number[]) => Promise<void>
  private receivedBytes: number[] = []
  public static TIMEOUT = 5 * 1000
  public static DEBUG = false

  constructor(writeMessage: (message: number[]) => Promise<void>) {
    this.writeMessage = writeMessage
  }

  async send(...commands: CsafeCmd[]): Promise<CsafeResponse> {
    return new Promise((res, rej) => {
      this.queue.push({ commands, res, rej, timeout: setTimeout(() => this.timeout(), CsafeMultiplexer.TIMEOUT) })
      this.trySend()
    })
  }

  // Called when we don't receive a response from the PM within $timeout
  private timeout() {
    this.debug("TIMEOUT")
    this.reject(new Error('Never received a response from the PM'))
    this.state = 'ready'
    this.trySend()
  }
  private resolve(res: CsafeResponse) {
    this.queue[0].res(res)
    clearTimeout(this.queue[0].timeout)
    this.queue.splice(0)
  }
  private reject(err: Error) {
    this.queue[0].rej(err)
    clearTimeout(this.queue[0].timeout)
    this.queue.splice(0)
  }
  private debug(message: string, ...args: any) {
    if (!CsafeMultiplexer.DEBUG) return
    console.log(`[CSAFE] ${message}`, ...args)
  }

  private async trySend() {
    if (this.queue.length === 0 || this.state !== 'ready') return

    this.state = 'busy'
    try {
      const packets = makePackets(this.queue[0].commands)

      for (const packet of packets) {
        await this.writeMessage(packet)
      }
    } catch (err) {
      this.reject(err)
    }
  }

  public receive(err: Error | null, bytes: number[] | null) {
    try {
      if (err) throw err
      if (!bytes) return
      if (bytes[0] === StandardFrameStartFlag) {
        this.receivedBytes = []
      }
      this.receivedBytes.push(...Array.from(bytes))
      if (bytes[bytes.length - 1] !== StopFrameFlag) {
        return
      }
      const dataAndChecksum = unstuffed(Array.from(this.receivedBytes.slice(1, -1)))
      if (dataAndChecksum.length < 2) {
        throw new Error(`Message is too small: ${dataAndChecksum.length}`)
      }
      this.debug(`Received message body from PM:`, dataAndChecksum.map(n => n.toString(16)).join(' '))
      if (dataAndChecksum.reduce((c, n) => c ^ n, 0) !== 0) {
        this.debug("Checksum doesn't match:", dataAndChecksum.reduce((c, n) => c ^ n, 0))
        throw new Error(`Checksum doesn't match`)
      }
      const statusByte = dataAndChecksum[0]
      const structures: CsafeResponseStructure[] = []
      for (let i = 1; i < dataAndChecksum.length - 1;) {
        const end = i + 2 + dataAndChecksum[i + 1]
        structures.push({
          identifier: dataAndChecksum[i],
          data: dataAndChecksum.slice(i + 2, end)
        })
        i = end
      }
      const response: CsafeResponse = {
        prevFrame: (statusByte >> 4) & 0x03,
        slaveStatus: statusByte & 0x0F,
        structures,
      }
      if (!this.queue[0]) {
        this.debug(`Received unexpected message ${JSON.stringify(response)}`)
        return
      }
      this.resolve(response)
    } catch (err) {
      this.debug(`Error: ${err}`)
      if (this.queue[0]) this.reject(err)
    }

    this.state = 'ready'
    this.trySend()
  }
}
