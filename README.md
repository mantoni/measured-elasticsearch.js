# Measured Elasticsearch Reporter

This is a port of the [Java elasticsearch metric reporter][java] for node.

It uses a [measured][] collection and publishes the metrics using the official
[elasticsearch][] module.

## Install

    npm install measured-elasticsearch

## Usage

```js
var collection = require('measured').createCollection();
var reporter = require('measured-elasticsearch').forCollection(collection, {
  host : 'localhost:9200'
  log  : 'trace'
});

reporter.start(60);
```

[java]: https://github.com/elasticsearch/elasticsearch-metrics-reporter-java
[measured]: https://github.com/felixge/node-measured
[elasticsearch]: https://www.npmjs.com/package/elasticsearch
