import newrelic from 'newrelic'
import { LEVEL, MESSAGE } from 'triple-beam'
import Transport, { type TransportStreamOptions } from 'winston-transport'

export interface NewrelicTransportOptions extends TransportStreamOptions {
  rejectCriteria?: RejectCriteria
}

export type RejectCriteria = RejectCriteriaItem[]

export interface RejectCriteriaItem {
  property: string | null
  regex: string
}

export default class NewrelicTransport extends Transport {
  public readonly name: string
  private readonly rejectCriteria?: RejectCriteria

  constructor (options: NewrelicTransportOptions = {}) {
    super(options)
    this.name = 'winston-newrelic-agent-transport'
    this.level = options.level ?? 'info'
    this.rejectCriteria = options.rejectCriteria
  }

  log (info: Record<string | symbol, any>, callback: () => void): void {
    setImmediate(() => {
      this.emit('logged', info)
    })

    try {
      const message = info[MESSAGE] as string
      if ((this.rejectCriteria === undefined) || (!this.reject(info, message, this.rejectCriteria))) {
        newrelic.recordLogEvent({
          message,
          level: info[LEVEL]
        })
      }
    } catch (err) {
    } finally {
      callback()
    }
  }

  reject (info: Record<string, any>, message: string, rejectCriteria: RejectCriteria): boolean {
    if (rejectCriteria.length === 0) {
      return false
    }

    for (const item of rejectCriteria) {
      let value
      if (item.property === null) {
        value = message
      } else {
        value = this.getValue(info, item.property)
      }

      if ((value === undefined) || (value === null) || (typeof value !== 'string')) {
        return false
      }

      if (value.match(item.regex) === null) {
        return false
      }
    }

    return true
  }

  getValue (info: Record<string, any>, property: string): Record<string, any> | string | undefined {
    return property
      .replace(/\[([^\]]*)]/g, '.$1')
      .split('.')
      .filter(p => p !== '')
      .reduce((accumulator: Record<string, any> | string | undefined, current: string) => { return (typeof accumulator === 'string' ? undefined : accumulator?.[current]) }, info)
  }
}
