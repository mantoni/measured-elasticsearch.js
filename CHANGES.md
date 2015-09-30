# Changes

## 1.6.1

- Use ISO time to generate index name to match with `@timestamp`

## 1.6.0

- Allow to configure a `getTime` function that returns the time to use

## 1.5.0

- Move the index to the top level instead of repeating it on every entry

## 1.4.0

- Allow to override the default ping request timeout
- Emit "error" events if ping requests fail

## 1.3.1

- Send `0` values if histogram was never updated

## 1.3.0

- Emit "error" event if bulk update to elasticsearch failed

## 1.2.1

- Fix `additionalFields` for `gauge` metrics
- Disable max listeners warning

## 1.2.0

- Emit "start", "stop" and "update" events

## 1.1.0

- Add support for `additionalFields`

## 1.0.0

- Initial release
