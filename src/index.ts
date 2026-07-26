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
  private readonly regexes = new Map<string, RegExp>()

  constructor (options: NewrelicTransportOptions = {}) {
    super(options)
    this.name = 'winston-newrelic-agent-transport'
    this.level = options.level ?? 'info'
    this.rejectCriteria = options.rejectCriteria

    // Compile the regexes now so that an invalid one is reported here rather than
    // quietly stopping log forwarding for every log entry.
    for (const item of options.rejectCriteria ?? []) {
      try {
        this.regexes.set(item.regex, new RegExp(item.regex))
      } catch (err) {
        throw new Error(`Invalid rejectCriteria regex: ${item.regex}`, { cause: err })
      }
    }
  }

  log (info: Record<string | symbol, any>, callback: () => void): void {
    setImmediate(() => {
      this.emit('logged', info)
    })

    try {
      const message = info[MESSAGE] as string

      // A failure while checking the criteria should cost the filtering, not the
      // log entry.
      let rejected = false
      try {
        rejected = (this.rejectCriteria !== undefined) && this.reject(info, message, this.rejectCriteria)
      } catch (err) {
        rejected = false
      }

      if (!rejected) {
        newrelic.recordLogEvent({
          message,
          // A format that returns a new info object drops the level symbol, so fall
          // back to the level property. The symbol is preferred because formats such
          // as colorize rewrite the property.
          level: info[LEVEL] ?? info.level
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

      // The property may be missing or hold a non-string on this particular log
      // entry. Skip the item and keep checking the remaining criteria.
      if ((value === undefined) || (value === null) || (typeof value !== 'string')) {
        continue
      }

      // Criteria passed directly to this method were not seen by the constructor.
      const re = this.regexes.get(item.regex) ?? new RegExp(item.regex)
      if (re.test(value)) {
        return true
      }
    }

    return false
  }

  getValue (info: Record<string, any>, property: string): Record<string, any> | string | undefined {
    return this.parseProperty(property)
      .reduce((accumulator: Record<string, any> | string | undefined, current: string) => { return (typeof accumulator === 'string' ? undefined : accumulator?.[current]) }, info)
  }

  /**
   * Splits a property string into the keys to walk.
   *
   * Only a quoted bracketed key is taken as written, so a key holding a dot can be
   * reached with quoted bracket notation. For example, `metadata['error.message']`
   * gives the keys `metadata` and `error.message`. An unquoted key still splits on
   * dots, so `metadata[error.message]` gives `metadata`, `error` and `message`.
   */
  parseProperty (property: string): string[] {
    const parts: string[] = []
    const pattern = /\[(['"])(.*?)\1]|\[([^\]]*)]|([^.[]+)/g

    let match
    while ((match = pattern.exec(property)) !== null) {
      const quoted: string | undefined = match[2]
      if (quoted !== undefined) {
        if (quoted !== '') {
          parts.push(quoted)
        }
        continue
      }

      const part: string | undefined = match[3] ?? match[4]
      parts.push(...(part ?? '').split('.').filter(p => p !== ''))
    }

    return parts
  }
}
