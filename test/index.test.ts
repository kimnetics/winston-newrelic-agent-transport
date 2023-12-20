import { expect } from 'chai'
import sinon from 'sinon'

import newrelic from 'newrelic'
import { LEVEL, MESSAGE } from 'triple-beam'

import NewrelicTransport, { type RejectCriteriaItem } from '../src/index'

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
    it('should log message and level to New Relic if rejectCriteria is undefined', () => {
      const transport = new NewrelicTransport()
      const info = {
        [MESSAGE]: 'test message',
        [LEVEL]: 'debug'
      }
      const callback = sinon.stub()
      const recordLogEventStub = sinon.stub(newrelic, 'recordLogEvent')

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

    it('should log message and level to New Relic if rejectCriteria is defined but does not match message', () => {
      const transport = new NewrelicTransport({
        rejectCriteria: [
          { property: null, regex: 'nomatch' }
        ]
      })
      const info = {
        [MESSAGE]: 'test message',
        [LEVEL]: 'debug'
      }
      const callback = sinon.stub()
      const recordLogEventStub = sinon.stub(newrelic, 'recordLogEvent')

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

    it('should log message and level to New Relic if rejectCriteria is defined but does not match info object', () => {
      const transport = new NewrelicTransport({
        rejectCriteria: [
          { property: 'property', regex: 'nomatch' }
        ]
      })
      const info = {
        property: 'test property',
        [MESSAGE]: 'test message',
        [LEVEL]: 'debug'
      }
      const callback = sinon.stub()
      const recordLogEventStub = sinon.stub(newrelic, 'recordLogEvent')

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

    it('should not log message and level to New Relic if rejectCriteria is defined and matches message', () => {
      const transport = new NewrelicTransport({
        rejectCriteria: [
          { property: null, regex: 'test message' }
        ]
      })
      const info = {
        [MESSAGE]: 'test message',
        [LEVEL]: 'debug'
      }
      const callback = sinon.stub()
      const recordLogEventStub = sinon.stub(newrelic, 'recordLogEvent')

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      transport.log(info, callback)

      sinon.assert.notCalled(recordLogEventStub)
      sinon.assert.calledOnce(callback)
      sinon.restore()
    })

    it('should not log message and level to New Relic if rejectCriteria is defined and matches info object', () => {
      const transport = new NewrelicTransport({
        rejectCriteria: [
          { property: 'property', regex: 'test property' }
        ]
      })
      const info = {
        property: 'test property',
        [MESSAGE]: 'test message',
        [LEVEL]: 'debug'
      }
      const callback = sinon.stub()
      const recordLogEventStub = sinon.stub(newrelic, 'recordLogEvent')

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      transport.log(info, callback)

      sinon.assert.notCalled(recordLogEventStub)
      sinon.assert.calledOnce(callback)
      sinon.restore()
    })

    it('should handle errors', () => {
      const transport = new NewrelicTransport()
      const info = {
        [MESSAGE]: 'test message',
        [LEVEL]: 'debug'
      }
      const callback = sinon.stub()
      const recordLogEventStub = sinon.stub(newrelic, 'recordLogEvent')
      recordLogEventStub.throws(new Error('Error recording log event'))

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

  describe('reject', () => {
    it('should return false when rejectCriteria is an empty array', () => {
      const transport = new NewrelicTransport()
      const info = {}
      const message = 'test message'
      const rejectCriteria: RejectCriteriaItem[] = []

      const result = transport.reject(info, message, rejectCriteria)
      expect(result).to.equal(false)
    })

    it('should return true when all rejectCriteria match the message string', () => {
      const transport = new NewrelicTransport()
      const info = {}
      const message = 'test message'
      const rejectCriteria = [
        { property: null, regex: 'test' },
        { property: null, regex: 'message' }
      ]

      const result = transport.reject(info, message, rejectCriteria)
      expect(result).to.equal(true)
    })

    it('should return true when all rejectCriteria match the value of the specified property in the info object', () => {
      const transport = new NewrelicTransport()
      const info = { property: 'test property' }
      const message = ''
      const rejectCriteria = [
        { property: 'property', regex: 'test' },
        { property: 'property', regex: 'property' }
      ]

      const result = transport.reject(info, message, rejectCriteria)
      expect(result).to.equal(true)
    })

    it('should return false if any rejectCriteria do not match the message string', () => {
      const transport = new NewrelicTransport()
      const info = {}
      const message = 'test message'

      let rejectCriteria = [
        { property: null, regex: 'nomatch' },
        { property: null, regex: 'message' }
      ]
      let result = transport.reject(info, message, rejectCriteria)
      expect(result).to.equal(false)

      rejectCriteria = [
        { property: null, regex: 'test' },
        { property: null, regex: 'nomatch' }
      ]
      result = transport.reject(info, message, rejectCriteria)
      expect(result).to.equal(false)
    })

    it('should return false if any rejectCriteria do not match the value of the specified property in the info object', () => {
      const transport = new NewrelicTransport()
      const info = { property: 'test property' }
      const message = ''

      let rejectCriteria = [
        { property: 'property', regex: 'nomatch' },
        { property: 'property', regex: 'property' }
      ]
      let result = transport.reject(info, message, rejectCriteria)
      expect(result).to.equal(false)

      rejectCriteria = [
        { property: 'property', regex: 'test' },
        { property: 'property', regex: 'nomatch' }
      ]
      result = transport.reject(info, message, rejectCriteria)
      expect(result).to.equal(false)
    })
  })

  describe('getValue', () => {
    it('should return the value of a property in an object when given a valid property string', () => {
      const transport = new NewrelicTransport()
      const object = { foo: { bar: 'baz' } }

      let property = 'foo.bar'
      let result = transport.getValue(object, property)
      expect(result).to.equal('baz')

      property = '[foo][bar]'
      result = transport.getValue(object, property)
      expect(result).to.equal('baz')

      property = 'foo[bar]'
      result = transport.getValue(object, property)
      expect(result).to.equal('baz')

      property = 'foo.[bar]'
      result = transport.getValue(object, property)
      expect(result).to.equal('baz')
    })

    it('should return undefined when given an invalid property string', () => {
      const transport = new NewrelicTransport()
      const object = { foo: { bar: 'baz' } }
      const property = 'foo.baz'

      const result = transport.getValue(object, property)
      expect(result).to.equal(undefined)
    })

    it('should handle property strings with non-existent nested properties correctly', () => {
      const transport = new NewrelicTransport()
      const object = { foo: { bar: 'baz' } }
      const property = 'foo.baz.qux'

      const result = transport.getValue(object, property)
      expect(result).to.equal(undefined)
    })
  })
})
