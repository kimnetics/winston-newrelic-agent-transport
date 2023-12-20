# winston-newrelic-agent-transport

A Winston transport using the New Relic agent. The transport requires your application to be using the New Relic agent.

The transport leverages the agent API to send the log messages so it is not necessary to use an http client or set New Relic connection information for the transport. Once your agent is configured and connecting to New Relic, this transport should send logs.

If the New Relic agent is not automatically sending your logs, this transport can help.

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

#### rejectCriteria

The rejectCriteria option allows you to specify an array of regexes that will be matched against either the Winston info object or log message to determine whether or not a log message should be rejected and not logged to New Relic.

If a log message matches any of the regexes, it will be rejected and not logged to New Relic.

Each item in the array is an object with the following fields:

`property`
: The name of the property in the Winston info object whose value should be checked or use `null` to indicate that the log message should be checked.

`regex`
: The regex to match against the value indicated by `property`.

For example, a hosting provider was sending 45 health checks a minute to our site. We used the following rejectCriteria to not log these health checks to New Relic:

```javascript
  new NewrelicTransport({
    level: 'info',
    rejectCriteria: [
      {
        property: 'metadata.headers.user-agent',
        regex: '/^ELB-HealthChecker/g'
      }
    ]
  })
```

## Notes

Code uses the [JavaScript Standard Style](https://standardjs.com) and may be checked with `npm run lint`.
