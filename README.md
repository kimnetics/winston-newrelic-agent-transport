# winston-newrelic-agent-transport

A Winston transport using the New Relic agent. The transport requires your application to be using the New Relic agent.

The transport leverages the agent API to send the log messages so it is not necessary to use an http client or set New Relic connection information for the transport. Once your agent is configured and connecting to New Relic, this transport should send logs.

The New Relic agent typically automatically sends Winston logs to New Relic when using CommonJS. With CommonJS no additional transport should be needed. However, when using ECMAScript modules, the automatic sending of logs can with certain coding patterns not work. If the New Relic agent is not automatically sending your logs, this transport provides a solution.

Notable is that the transport allows you to exclude log messages that match configured characteristics. If there are certain types of log messages you wish to exclude from being sent to New Relic, the transport can help with that.

## Installation

```sh
npm install --save winston-newrelic-agent-transport
```

## Usage

```javascript
import { createLogger } from 'winston'
import NewrelicTransport from 'winston-newrelic-agent-transport'

const logger = createLogger({
  transports: [
    new NewrelicTransport({
      level: 'info'
    })
  ]
})

export default logger
```

### Options

#### level (optional)

The Winston logging level to use as the maximum level of messages that the transport will log.

#### rejectCriteria (optional)

The rejectCriteria option allows you to specify an array of regexes that will be matched against either the Winston info object or log message to determine whether or not a log message should be rejected and not logged to New Relic.

If a log message matches any of the regexes, it will be rejected and not logged to New Relic.

Each item in the array is an object with the following fields:

`property`
: The name of the property in the Winston info object whose value should be checked or use `null` to indicate that the log message should be checked.

`regex`
: The regex to match against the value indicated by `property`.

The Winston info object includes the data you added using the logger `meta` parameter. For example, if you added a log entry with commands like the following, the headers could be retrieved at `metadata.headers`.

```javascript
  const meta = {
    headers: req.headers
  }

  logger.info(message, meta)
```

A hosting provider was sending many health checks to our site and we wished to exclude them from the New Relic logs. We used the following rejectCriteria to not log these health checks to New Relic:

```javascript
  new NewrelicTransport({
    level: 'info',
    rejectCriteria: [
      {
        property: 'metadata.headers.user-agent',
        regex: '^ELB-HealthChecker'
      }
    ]
  })
```

## Notes

I found that using the agent recordLogEvent method to log events also adds the New Relic context to the log. It is not necessary to add `application_logging.local_decorating.enabled: true` to your New Relic config. In fact adding that entry did not appear to change the context behavior at all.

I did also try `@newrelic/winston-enricher` to add New Relic context. I learned that it was not necessary to use the enricher since the agent was already adding context. The enricher did have an interesting additional behavior that you might find useful. Along with the message, I was logging additional data in each log entry. The additional data was a JSON stringified version of the additional data object. Without the enricher, log entries show as the message and JSON stringified data as one big string. With the enricher, only the message is left in the New Relic message field. The JSON data is extracted and loaded into additional fields on the New Relic side. I decided I liked the metadata being placed into separate fields, so I kept the enricher. With separate fields, it makes it easier to query against them. The downside is you need to click into a log entry to see the additional fields in the New Relic Logs UI.

The transport code uses the [JavaScript Standard Style](https://standardjs.com) and may be checked with `npm run lint`.
