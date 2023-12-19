import newrelic from 'newrelic'
import { LEVEL, MESSAGE } from 'triple-beam'
import Transport, { type TransportStreamOptions } from 'winston-transport'

export default class NewrelicTransport extends Transport {
  private readonly name: string

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
      // Send log entry to New Relic unless message is from Amazon Lightsail health check.
      const userAgent = info?.metadata?.headers?.['user-agent'] as string | undefined
      if ((userAgent === undefined) || (!userAgent.startsWith('ELB-HealthChecker'))) {
        newrelic.recordLogEvent({
          message: info[MESSAGE],
          level: info[LEVEL]
        })
      }
    } catch (err) {
    } finally {
      callback()
    }
  }
}
