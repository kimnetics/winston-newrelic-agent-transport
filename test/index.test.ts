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

    it('should throw when a rejectCriteria regex is invalid', () => {
      expect(() => new NewrelicTransport({
        rejectCriteria: [
          { property: 'message', regex: '^valid' },
          { property: 'message', regex: '(unclosed' }
        ]
      })).to.throw('Invalid rejectCriteria regex: (unclosed')
    })

    it('should not throw when all rejectCriteria regexes are valid', () => {
      expect(() => new NewrelicTransport({
        rejectCriteria: [
          { property: 'message', regex: '^valid' },
          { property: null, regex: 'also valid$' }
        ]
      })).to.not.throw()
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

    it('should log the level property to New Relic when the level symbol is missing', () => {
      const transport = new NewrelicTransport()
      // A format returning a new info object drops the level symbol.
      const info = {
        level: 'warn',
        [MESSAGE]: 'test message'
      }
      const callback = sinon.stub()
      const recordLogEventStub = sinon.stub(newrelic, 'recordLogEvent')

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      transport.log(info, callback)

      sinon.assert.calledOnce(recordLogEventStub)
      sinon.assert.calledWith(recordLogEventStub, {
        message: info[MESSAGE],
        level: 'warn'
      })
      sinon.assert.calledOnce(callback)
      sinon.restore()
    })

    it('should prefer the level symbol over the level property', () => {
      const transport = new NewrelicTransport()
      // Formats such as colorize rewrite the level property but leave the symbol.
      const info = {
        level: '[33mwarn[39m',
        [MESSAGE]: 'test message',
        [LEVEL]: 'warn'
      }
      const callback = sinon.stub()
      const recordLogEventStub = sinon.stub(newrelic, 'recordLogEvent')

      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      transport.log(info, callback)

      sinon.assert.calledOnce(recordLogEventStub)
      sinon.assert.calledWith(recordLogEventStub, {
        message: info[MESSAGE],
        level: 'warn'
      })
      sinon.assert.calledOnce(callback)
      sinon.restore()
    })

    it('should log message and level to New Relic if checking the reject criteria throws', () => {
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
      sinon.stub(transport, 'reject').throws(new Error('Error checking reject criteria'))

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

    it('should return true when any rejectCriteria match the message string', () => {
      const transport = new NewrelicTransport()
      const info = {}
      const message = 'test message'

      let rejectCriteria = [
        { property: null, regex: '^test' },
        { property: null, regex: 'nomatch$' }
      ]
      let result = transport.reject(info, message, rejectCriteria)
      expect(result).to.equal(true)

      rejectCriteria = [
        { property: null, regex: '^nomatch' },
        { property: null, regex: 'message$' }
      ]
      result = transport.reject(info, message, rejectCriteria)
      expect(result).to.equal(true)
    })

    it('should return true when any rejectCriteria match the value of the specified property in the info object', () => {
      const transport = new NewrelicTransport()
      const info = { property: 'test property' }
      const message = ''

      let rejectCriteria = [
        { property: 'property', regex: '^test' },
        { property: 'property', regex: 'nomatch$' }
      ]
      let result = transport.reject(info, message, rejectCriteria)
      expect(result).to.equal(true)

      rejectCriteria = [
        { property: 'property', regex: '^nomatch' },
        { property: 'property', regex: 'property$' }
      ]
      result = transport.reject(info, message, rejectCriteria)
      expect(result).to.equal(true)
    })

    it('should return false if all rejectCriteria do not match the message string', () => {
      const transport = new NewrelicTransport()
      const info = {}
      const message = 'test message'

      const rejectCriteria = [
        { property: null, regex: '^nomatch1' },
        { property: null, regex: 'nomatch2$' }
      ]
      const result = transport.reject(info, message, rejectCriteria)
      expect(result).to.equal(false)
    })

    it('should return false if all rejectCriteria do not match the value of the specified property in the info object', () => {
      const transport = new NewrelicTransport()
      const info = { property: 'test property' }
      const message = ''

      const rejectCriteria = [
        { property: 'property', regex: '^nomatch1' },
        { property: 'property', regex: 'nomatch2$' }
      ]
      const result = transport.reject(info, message, rejectCriteria)
      expect(result).to.equal(false)
    })

    it('should keep checking remaining rejectCriteria when a property is missing from the info object', () => {
      const transport = new NewrelicTransport()
      const info = { property: 'test property' }
      const message = 'test message'

      const rejectCriteria = [
        { property: 'missing.property', regex: '^test' },
        { property: 'property', regex: '^test' }
      ]
      const result = transport.reject(info, message, rejectCriteria)
      expect(result).to.equal(true)
    })

    it('should keep checking remaining rejectCriteria when a property holds a non-string value', () => {
      const transport = new NewrelicTransport()
      const info = { count: 42, property: 'test property' }
      const message = 'test message'

      const rejectCriteria = [
        { property: 'count', regex: '^42' },
        { property: 'property', regex: '^test' }
      ]
      const result = transport.reject(info, message, rejectCriteria)
      expect(result).to.equal(true)
    })

    it('should give the same result regardless of rejectCriteria order', () => {
      const transport = new NewrelicTransport()
      const info = { property: 'test property' }
      const message = 'test message'

      const missingFirst = [
        { property: 'missing.property', regex: '^test' },
        { property: 'property', regex: '^test' }
      ]
      const missingLast = [
        { property: 'property', regex: '^test' },
        { property: 'missing.property', regex: '^test' }
      ]
      expect(transport.reject(info, message, missingFirst)).to.equal(transport.reject(info, message, missingLast))
    })

    it('should return false when every rejectCriteria property is missing', () => {
      const transport = new NewrelicTransport()
      const info = { property: 'test property' }
      const message = 'test message'

      const rejectCriteria = [
        { property: 'missing.property', regex: '^test' },
        { property: 'another.missing.property', regex: '^test' }
      ]
      const result = transport.reject(info, message, rejectCriteria)
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

    it('should return the value of a property named with quoted bracket notation', () => {
      const transport = new NewrelicTransport()
      const object = { metadata: { headers: { 'user-agent': 'ELB-HealthChecker/2.0' } } }

      let property = 'metadata.headers[\'user-agent\']'
      let result = transport.getValue(object, property)
      expect(result).to.equal('ELB-HealthChecker/2.0')

      property = 'metadata.headers["user-agent"]'
      result = transport.getValue(object, property)
      expect(result).to.equal('ELB-HealthChecker/2.0')
    })

    it('should treat a dot inside quoted bracket notation as part of the key', () => {
      const transport = new NewrelicTransport()
      const object = { metadata: { 'error.message': 'missing.txt' } }

      const property = 'metadata[\'error.message\']'
      const result = transport.getValue(object, property)
      expect(result).to.equal('missing.txt')
    })

    it('should treat a dot inside unquoted bracket notation as another level', () => {
      const transport = new NewrelicTransport()
      const object = { metadata: { error: { message: 'missing.txt' } } }

      const property = 'metadata[error.message]'
      const result = transport.getValue(object, property)
      expect(result).to.equal('missing.txt')
    })
  })

  describe('parseProperty', () => {
    it('should split property strings into the keys to walk', () => {
      const transport = new NewrelicTransport()

      expect(transport.parseProperty('foo.bar')).to.deep.equal(['foo', 'bar'])
      expect(transport.parseProperty('[foo][bar]')).to.deep.equal(['foo', 'bar'])
      expect(transport.parseProperty('foo[bar]')).to.deep.equal(['foo', 'bar'])
      expect(transport.parseProperty('foo.[bar]')).to.deep.equal(['foo', 'bar'])
      expect(transport.parseProperty('foo[0].bar')).to.deep.equal(['foo', '0', 'bar'])
      expect(transport.parseProperty('foo[\'bar.baz\']')).to.deep.equal(['foo', 'bar.baz'])
      expect(transport.parseProperty('foo["bar.baz"]')).to.deep.equal(['foo', 'bar.baz'])
    })

    it('should split an unquoted bracketed key on dots', () => {
      const transport = new NewrelicTransport()

      // Only quoting a bracketed key keeps a dot in it as part of the key.
      expect(transport.parseProperty('foo[bar.baz]')).to.deep.equal(['foo', 'bar', 'baz'])
      expect(transport.parseProperty('a.b[c.d]')).to.deep.equal(['a', 'b', 'c', 'd'])
      expect(transport.parseProperty('metadata[error.message]')).to.deep.equal(['metadata', 'error', 'message'])
    })

    it('should keep an unmatched closing bracket as part of the key', () => {
      const transport = new NewrelicTransport()

      expect(transport.parseProperty('foo]bar')).to.deep.equal(['foo]bar'])
    })

    it('should ignore empty keys', () => {
      const transport = new NewrelicTransport()

      expect(transport.parseProperty('')).to.deep.equal([])
      expect(transport.parseProperty('.foo..bar.')).to.deep.equal(['foo', 'bar'])
      expect(transport.parseProperty('foo[]bar')).to.deep.equal(['foo', 'bar'])
    })
  })
})
