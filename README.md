# Measured Elasticsearch Reporter

This is a port of the [Java elasticsearch metric reporter][java] for node.

It uses a [measured][] collection and publishes the metrics using the official
[elasticsearch][] module.

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

- `sendBulk()` sends a bulk update using the elasticsearch client
- `start([interval[, unit]])` performs a ping request and once successful sends
  bulk updates every `interval * unit` where `interval` defaults to `60` and
  `unit` defaults to `1000`.
- `stop()` stops performing ping and bulk update requests and calls `end()` on
  all registered collections

[java]: https://github.com/elasticsearch/elasticsearch-metrics-reporter-java
[measured]: https://github.com/felixge/node-measured
[elasticsearch]: https://www.npmjs.com/package/elasticsearch
