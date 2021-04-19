import { Buffer } from 'buffer'
import { BleError, Characteristic, Device } from 'react-native-ble-plx'
import { writeIntAsBytes } from '../utils'
import { CsafeCmd } from './commands'

const PMCONTROL_SERVICE = "ce060020-43e5-11e4-916c-0800200c9a66"
const TRANSMIT_TO_PM_CHARACTERISIC = "ce060021-43e5-11e4-916c-0800200c9a66"
const RECEIVE_FROM_PM_CHARACTERISIC = "ce060022-43e5-11e4-916c-0800200c9a66"

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
    default:
      no(cmd)
  }
  return contents
}

const makePacket = (cmd: CsafeCmd): string => {
  const ret: number[] = []

  ret.push(StandardFrameStartFlag)
  const contents = serializeCmd(cmd)
  ret.push(...stuffed(...contents))
  ret.push(...stuffed(checksum(contents)))
  ret.push(StopFrameFlag)
  return Buffer.from(ret).toString('base64')
}

function no(_: never): never { throw new Error("NEVER") }

interface MessageInfo {
  command: CsafeCmd
  serialized: number[]
  res: (result: CsafeResponse) => void
  rej: (error: Error) => void
}

export default class CsafeMultiplexer {
  private queue: MessageInfo[] = []
  private state: "ready" | "busy" = "ready"
  private device: Device

  public onStateChange: (state: number) => void = () => { }

  constructor(device: Device) {
    this.device = device
  }

  addResponseListener() {
    this.device.monitorCharacteristicForService(
      PMCONTROL_SERVICE, RECEIVE_FROM_PM_CHARACTERISIC, this.receive.bind(this)
    )
  }

  async send(command: CsafeCmd): Promise<CsafeResponse> {
    return new Promise((res, rej) => {
      this.queue.push({ command, serialized: serializeCmd(command), res, rej })
      this.trySend()
    })
  }

  private resolve(res: CsafeResponse) {
    this.queue[0].res(res)
    this.queue.splice(0)
  }
  private reject(err: Error) {
    this.queue[0].rej(err)
    this.queue.splice(0)
  }

  private async trySend() {
    if (this.queue.length === 0 || this.state !== 'ready') return

    this.state = 'busy'
    const message = makePacket(this.queue[0].command)

    try {
      console.log(`[CSAFE] Sending message: ${message}`)
      await this.device.writeCharacteristicWithoutResponseForService(
        PMCONTROL_SERVICE,
        TRANSMIT_TO_PM_CHARACTERISIC,
        message
      )
    } catch (err) {
      this.reject(err)
    }
  }

  public async receive(err: BleError | null, c: Characteristic | null) {
    try {
      if (err) throw err
      if (!c?.value) return
      const bytes = Buffer.from(c.value, 'base64').map(x => x)
      console.log(`[CSAFE] Received message of ${bytes.length} bytes`)
      if (bytes[0] !== StandardFrameStartFlag) {
        throw new Error(`First byte was 0x${bytes[0].toString(16)}, not 0xF1`)
      }
      if (bytes[bytes.length - 1] !== StopFrameFlag) {
        throw new Error(`Last byte was 0x${bytes[0].toString(16)}, not 0xF2`)
      }
      const dataAndChecksum = unstuffed(Array.from(bytes.slice(1, -1)))
      if (dataAndChecksum.length < 2) {
        throw new Error(`Message is too small: ${dataAndChecksum.length}`)
      }
      console.log(`[CSAFE] dataAndChecksum:`, dataAndChecksum.map(n => n.toString(16)).join(' '))
      if (dataAndChecksum.reduce((c, n) => c ^ n, 0) !== 0) {
        console.error("[CSAFE] Checksum doesn't match:", dataAndChecksum.map(n => n.toString(16)).join(' '))
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
        console.error(`[CSAFE] Received unexpected message ${JSON.stringify(response)}`)
        return
      }
      this.resolve(response)
    } catch (err) {
      console.error(`[CSAFE] Error: ${err}`)
      if (this.queue[0]) this.reject(err)
      await new Promise(r => setTimeout(r, 1000))
    }

    this.state = 'ready'
    await this.trySend()
  }
}
