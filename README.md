# Measured Elasticsearch Reporter

Reports [measured][] metrics to [elasticsearch][] in the same format as the
[Java elasticsearch metric reporter][java].

## Install

    npm install measured-elasticsearch

## Usage

```js
var elasticsearch = require('elasticsearch');
var client        = new elasticsearch.Client({ host : 'localhost:9200' });

var reporter   = require('measured-elasticsearch').forClient(client);
var measured   = require('measured');
var collection = measured.createCollection();

reporter.addCollection(collection);
reporter.start(60, measured.units.SECONDS);
```

## API

- `forClient(client[, config])` creates a new reporter for the given client and
  optional config. Available configs are:
    - `index` the index to use. Defaults to `metrics`.
    - `indexDateFormat` the date format to make sure to rotate to a new index.
      Defaults to `yyyy.mm`. Uses [dateformat][].
    - `timestampFieldname` the field name of the timestamp. Defaults to
      `@timestamp`.
- `sendBulk()` sends a bulk update using the elasticsearch client
- `start([interval[, unit]])` performs a ping request and once successful sends
  bulk updates every `interval * unit` where `interval` defaults to `60` and
  `unit` defaults to `1000`.
- `stop()` stops performing ping and bulk update requests and calls `end()` on
  all registered collections

[java]: https://github.com/elasticsearch/elasticsearch-metrics-reporter-java
[measured]: https://github.com/felixge/node-measured
[elasticsearch]: https://www.npmjs.com/package/elasticsearch
[dateformat]: https://www.npmjs.com/package/dateformat
