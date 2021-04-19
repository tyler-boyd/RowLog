import 'should'
import 'mocha'
import CsafeMultiplexer, { pvt } from '../../csafe/multiplexer'
import { CsafeCommands } from '../../csafe/commands'
import { Buffer } from 'buffer'


describe('multiplexer', () => {
  it('only sends one message at a time', async () => {
    const multiplexer = new CsafeMultiplexer((message: string) => {
      message.should.be.equal(pvt.makePacket(CsafeCommands.reset()))
      return Promise.resolve()
    })

    multiplexer.send(CsafeCommands.reset())
    multiplexer.send(CsafeCommands.autoUpload())
    await new Promise(r => setTimeout(r, 100))
  })
})
