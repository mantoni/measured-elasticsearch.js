/*global describe, it, beforeEach, afterEach*/
/*
 * measured-elasticsearch
 *
 * Copyright (c) 2015 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var assert   = require('assert');
var sinon    = require('sinon');
var measured = require('measured');
var defaults = require('./fixture/defaults');
var api      = require('..');


describe('metrics', function () {
  var client;
  var reporter;
  var collection;
  var clock;

  beforeEach(function () {
    clock      = sinon.useFakeTimers();
    client     = { ping: sinon.stub(), bulk: sinon.stub() };
    reporter   = api.forClient(client);
    collection = measured.createCollection();
    reporter.addCollection(collection);
  });

  afterEach(function () {
    clock.restore();
  });

  it('timer stopwatch sends the correct json format', function () {
    var timer = collection.timer('mytime');
    var stopwatch = timer.start();
    clock.tick(1000);
    stopwatch.end();

    reporter.sendBulk();

    sinon.assert.calledOnce(client.bulk);
    sinon.assert.calledWith(client.bulk, {
      index            : defaults.index,
      body             : [defaults.headerTimer, {
        name           : 'mytime',
        '@timestamp'   :  '1970-01-01T00:00:01.000Z',
        count          : 1,
        max            : sinon.match.number,
        mean           : sinon.match.number,
        min            : sinon.match.number,
        p50            : sinon.match.number,
        p75            : sinon.match.number,
        p95            : sinon.match.number,
        p99            : sinon.match.number,
        p999           : sinon.match.number,
        stddev         : 0,
        m1_rate        : 0,
        m5_rate        : 0,
        m15_rate       : 0,
        mean_rate      : sinon.match.number,
        duration_units : 'milliseconds',
        rate_units     : 'calls/second'
      }]
    });
  });

  it('timer meter sends the correct json format', function () {
    var timer = collection.timer('mytime');
    timer.update(5);
    clock.tick(1000);
    timer.update(3);

    reporter.sendBulk();

    sinon.assert.calledOnce(client.bulk);
    sinon.assert.calledWith(client.bulk, {
      index            : defaults.index,
      body             : [defaults.headerTimer, {
        name           : 'mytime',
        '@timestamp'   : '1970-01-01T00:00:01.000Z',
        count          : 2,
        max            : 5,
        mean           : 4,
        min            : 3,
        p50            : 4,
        p75            : 5,
        p95            : 5,
        p99            : 5,
        p999           : 5,
        stddev         : sinon.match.number,
        m1_rate        : 0,
        m5_rate        : 0,
        m15_rate       : 0,
        mean_rate      : sinon.match.number,
        duration_units : 'milliseconds',
        rate_units     : 'calls/second'
      }]
    });
  });

  it('meter sends the correct json format', function () {
    var meter = collection.meter('mymeter');
    meter.mark();
    clock.tick(1000);
    meter.mark();
    clock.tick(1000);
    meter.mark();

    reporter.sendBulk();

    sinon.assert.calledOnce(client.bulk);
    sinon.assert.calledWith(client.bulk, {
      index          : defaults.index,
      body           : [defaults.headerMeter, {
        name         : 'mymeter',
        '@timestamp' : '1970-01-01T00:00:02.000Z',
        count        : 3,
        m1_rate      : 0,
        m5_rate      : 0,
        m15_rate     : 0,
        mean_rate    : sinon.match.number,
        units        : 'events/second'
      }]
    });
  });

  it('meter sends 0 values if mark was never called', function () {
    collection.meter('mymeter');

    reporter.sendBulk();

    sinon.assert.calledOnce(client.bulk);
    sinon.assert.calledWith(client.bulk, {
      index          : defaults.index,
      body           : [defaults.headerMeter, {
        name         : 'mymeter',
        '@timestamp' : '1970-01-01T00:00:00.000Z',
        count        : 0,
        m1_rate      : 0,
        m5_rate      : 0,
        m15_rate     : 0,
        mean_rate    : sinon.match.number,
        units        : 'events/second'
      }]
    });
  });

  it('histogram sends the correct json format', function () {
    var histogram = collection.histogram('myhistogram');
    histogram.update(1);
    clock.tick(1000);
    histogram.update(3);
    clock.tick(1000);
    histogram.update(5);

    reporter.sendBulk();

    sinon.assert.calledOnce(client.bulk);
    sinon.assert.calledWith(client.bulk, {
      index          : defaults.index,
      body           : [defaults.headerHistogram, {
        name         : 'myhistogram',
        '@timestamp' : '1970-01-01T00:00:02.000Z',
        count        : 3,
        max          : 5,
        mean         : 3,
        min          : 1,
        p50          : 3,
        p75          : 5,
        p95          : 5,
        p99          : 5,
        p999         : 5,
        stddev       : 2
      }]
    });
  });

  it('histogram sends 0 values if update was never called', function () {
    collection.histogram('myhistogram');

    reporter.sendBulk();

    sinon.assert.calledOnce(client.bulk);
    sinon.assert.calledWith(client.bulk, {
      index          : defaults.index,
      body           : [defaults.headerHistogram, {
        name         : 'myhistogram',
        '@timestamp' : '1970-01-01T00:00:00.000Z',
        count        : 0,
        max          : 0,
        mean         : 0,
        min          : 0,
        p50          : 0,
        p75          : 0,
        p95          : 0,
        p99          : 0,
        p999         : 0,
        stddev       : 0
      }]
    });
  });

  it('counter sends the correct json format', function () {
    collection.counter('mycount').inc();

    reporter.sendBulk();

    sinon.assert.calledOnce(client.bulk);
    sinon.assert.calledWith(client.bulk, {
      index          : defaults.index,
      body           : [defaults.headerCounter, {
        name         : 'mycount',
        '@timestamp' : defaults.timestamp,
        count        : 1
      }]
    });
  });

  it('counter sends 0 count if inc was never called', function () {
    collection.counter('mycount');

    reporter.sendBulk();

    sinon.assert.calledOnce(client.bulk);
    sinon.assert.calledWith(client.bulk, {
      index          : defaults.index,
      body           : [defaults.headerCounter, {
        name         : 'mycount',
        '@timestamp' : defaults.timestamp,
        count        : 0
      }]
    });
  });

  it('gauge sends the correct json format', function () {
    collection.gauge('mygauge', function () {
      return { random : 42 };
    });

    reporter.sendBulk();

    sinon.assert.calledOnce(client.bulk);
    sinon.assert.calledWith(client.bulk, {
      index          : defaults.index,
      body           : [defaults.headerGauge, {
        name         : 'mygauge',
        '@timestamp' : defaults.timestamp,
        random       : 42
      }]
    });
  });

});
