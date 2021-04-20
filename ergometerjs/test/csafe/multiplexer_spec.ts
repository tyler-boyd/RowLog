import 'should'
import 'mocha'
import CsafeMultiplexer from '../../csafe/multiplexer'
import { CsafeCommands } from '../../csafe/commands'

describe('multiplexer', () => {
  let messages: number[][] = []
  let multiplexer: CsafeMultiplexer = null as any
  CsafeMultiplexer.TIMEOUT = 5
  beforeEach(() => {
    multiplexer = new CsafeMultiplexer(message => {
      messages.push(message)
      return Promise.resolve()
    })
    messages = []
  })

  it('handles responses with no structures', async () => {
    const responsePromise = multiplexer.send(CsafeCommands.reset())
    multiplexer.receive(null, [0xF1, 0x81, 0x81, 0xF2])
    const response = await responsePromise
    response.prevFrame.should.equal(0)
    response.slaveStatus.should.equal(1)
    response.structures.should.be.empty()
  })

  it('handles a response with an empty structure', async () => {
    const responsePromise = multiplexer.send(CsafeCommands.reset())
    multiplexer.receive(null, [0xF1, 0x81, 0x1A, 0x00, 0x9B, 0xF2])
    const response = await responsePromise
    response.prevFrame.should.equal(0)
    response.slaveStatus.should.equal(1)
    response.structures.should.be.deepEqual([{identifier: 0x1A, data: []}])
  })

  it('times out if too slow', async () => {
    await multiplexer.send(CsafeCommands.reset())
      .should.be.rejectedWith(/Never received a response/)
  })

  it('serializes multiple messages correctly', async () => {
    const setTWork = CsafeCommands.setTWork(20 * 60)
    const response = multiplexer.send(CsafeCommands.reset(), setTWork, setTWork, setTWork, setTWork)
    multiplexer.receive(null, [0xF1, 0x81, 0x81, 0xF2])
    await response.should.be.fulfilledWith({prevFrame: 0, slaveStatus: 1, structures: []})
    messages.should.deepEqual([
      [0xf1, 0x81, 0x20, 0x03, 0x00, 0x14, 0x00, 0x20, 0x03, 0x00, 0x14, 0x00, 0x20, 0x03, 0x00, 0x14, 0x00, 0x20, 0x03, 0x00],
      [0x14, 0x00, 0x81, 0xF2]
    ])
  })

  it('deserializes multiple messages correctly', async () => {
    const response = multiplexer.send(CsafeCommands.reset())
    const thirtyNumbers = [...new Array(30)].map((_, idx) => idx)
    const bytes = [0xF1, 0x81, 0x22, 30, ...thirtyNumbers, 188, 0xF2]
    multiplexer.receive(null, bytes.slice(0, 20))
    multiplexer.receive(null, bytes.slice(20))
    await response.should.be.fulfilledWith({prevFrame: 0, slaveStatus: 1, structures: [{
      identifier: 0x22,
      data: thirtyNumbers,
    }]})
  })

  it('raises errors properly', async () => {
    let response = multiplexer.send(CsafeCommands.reset())
    multiplexer.receive(new Error('Test error'), null)
    await response.should.be.rejectedWith(/Test error/)
    response = multiplexer.send(CsafeCommands.reset())
    multiplexer.receive(null, [0xF1, 0x81, 0x81, 0xF2])
    await response.should.be.fulfilled()
  })

  it('can send proper data to start distance interval', async () => {
    let response = multiplexer.send(CsafeCommands.startDistanceIntervalWorkout(500, 30))
    multiplexer.receive(null, [0xF1, 0x81, 0x81, 0xF2])
    await response.should.be.fulfilled()
    messages.should.deepEqual([
      [0xF1, 0x76, 0x15, 0x01, 0x01, 0x07, 0x03, 0x05, 0x80, 0x00, 0x00, 0x01, 0xF4, 0x04, 0x02, 0x00, 0x1E, 0x14, 0x01, 0x01],
      [0x13, 0x02, 0x01, 0x01, 0x0A, 0xF2],
    ])
  })
})
