import newrelic from 'newrelic'
import { LEVEL, MESSAGE } from 'triple-beam'
import Transport, { type TransportStreamOptions } from 'winston-transport'

export default class NewrelicTransport extends Transport {
  public readonly name: string

  constructor (options: TransportStreamOptions = {}) {
    super(options)
    this.name = 'winston-newrelic-agent-transport'
    this.level = options.level ?? 'info'
  }

  log (info: any, callback: () => void): void {
    setImmediate(() => {
      this.emit('logged', info)
    })

    try {
      newrelic.recordLogEvent({
        message: info[MESSAGE],
        level: info[LEVEL]
      })
    } catch (err) {
    } finally {
      callback()
    }
  }
}
