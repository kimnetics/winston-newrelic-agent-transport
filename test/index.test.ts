import { expect } from 'chai'
import sinon from 'sinon'

import newrelic from 'newrelic'
import { LEVEL, MESSAGE } from 'triple-beam'

import NewrelicTransport from '../src/index'

describe('NewrelicTransport', () => {
  describe('constructor', () => {
    it('should set the proper name', () => {
      const transport = new NewrelicTransport()
      expect(transport.name).to.equal('winston-newrelic-agent-transport')
    })

    it('should set level to value provided', () => {
      const transport = new NewrelicTransport({
        level: 'debug'
      })
      expect(transport.level).to.equal('debug')
    })

    it('should set level to \'info\' if not provided', () => {
      const transport = new NewrelicTransport()
      expect(transport.level).to.equal('info')
    })
  })

  describe('log', () => {
    it('should log message and level to New Relic', () => {
      const info = {
        [MESSAGE]: 'test message',
        [LEVEL]: 'debug'
      }
      const callback = sinon.stub()
      const recordLogEventStub = sinon.stub(newrelic, 'recordLogEvent')

      const transport = new NewrelicTransport()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      transport.log(info, callback)

      sinon.assert.calledOnce(recordLogEventStub)
      sinon.assert.calledWith(recordLogEventStub, {
        message: info[MESSAGE],
        level: info[LEVEL]
      })
      sinon.assert.calledOnce(callback)
      sinon.restore()
    })

    it('should handle errors', () => {
      const info = {
        [MESSAGE]: 'test message',
        [LEVEL]: 'debug'
      }
      const callback = sinon.stub()
      const recordLogEventStub = sinon.stub(newrelic, 'recordLogEvent')
      recordLogEventStub.throws(new Error('Error recording log event'))

      const transport = new NewrelicTransport()
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      transport.log(info, callback)

      sinon.assert.calledOnce(recordLogEventStub)
      sinon.assert.calledWith(recordLogEventStub, {
        message: info[MESSAGE],
        level: info[LEVEL]
      })
      sinon.assert.calledOnce(callback)
      sinon.restore()
    })
  })
})
