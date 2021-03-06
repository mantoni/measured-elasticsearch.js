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


describe('config', function () {
  var client;
  var reporter;
  var collection;
  var clock;

  beforeEach(function () {
    clock      = sinon.useFakeTimers();
    client     = { ping: sinon.stub(), bulk: sinon.stub() };
    collection = measured.createCollection();
    collection.meter('foo').mark();
  });

  afterEach(function () {
    clock.restore();
  });

  it('changes default metric name', function () {
    reporter = api.forClient(client, {
      index : 'yo'
    });
    reporter.addCollection(collection);

    reporter.sendBulk();

    sinon.assert.calledOnce(client.bulk);
    sinon.assert.calledWith(client.bulk, {
      index   : 'yo-1970.01',
      body    : [{
        index : sinon.match.object
      }, sinon.match.object]
    });
  });

  it('changes default index date format', function () {
    reporter = api.forClient(client, {
      indexDateFormat : 'yyyy.mm.dd'
    });
    reporter.addCollection(collection);

    reporter.sendBulk();

    sinon.assert.calledOnce(client.bulk);
    sinon.assert.calledWith(client.bulk, {
      index   : 'metrics-1970.01.01',
      body    : [{
        index : sinon.match.object
      }, sinon.match.object]
    });
  });

  it('changes default timestamp name', function () {
    reporter = api.forClient(client, {
      timestampFieldname : 'tick'
    });
    reporter.addCollection(collection);

    reporter.sendBulk();

    sinon.assert.calledOnce(client.bulk);
    sinon.assert.calledWith(client.bulk, {
      index : sinon.match.string,
      body  : [sinon.match.object, sinon.match.has('tick', defaults.timestamp)]
    });
  });

  it('adds configured additional fields to meter', function () {
    reporter = api.forClient(client, {
      additionalFields : {
        server   : 'cheesy-server-name',
        instance : 1
      }
    });
    reporter.addCollection(collection);

    reporter.sendBulk();

    sinon.assert.calledOnce(client.bulk);
    sinon.assert.calledWith(client.bulk, {
      index : sinon.match.string,
      body  : [sinon.match.object, sinon.match({
        server   : 'cheesy-server-name',
        instance : 1
      })]
    });
  });

  it('adds configured additional fields to gauge', function () {
    reporter = api.forClient(client, {
      additionalFields : {
        server   : 'cheesy-server-name',
        instance : 1
      }
    });
    reporter.addCollection(collection);
    collection.gauge('bar', function () {
      return { my : 'custom' };
    });

    reporter.sendBulk();

    sinon.assert.calledOnce(client.bulk);
    sinon.assert.calledWith(client.bulk, {
      index : sinon.match.string,
      body  : [sinon.match.object, sinon.match.object, sinon.match.object,
        sinon.match({
          server   : 'cheesy-server-name',
          instance : 1,
          my       : 'custom'
        })]
    });
  });

  it('uses configured ping request timeout', function () {
    reporter = api.forClient(client, {
      pingTimeout : 12345
    });

    reporter.start();

    sinon.assert.calledOnce(client.ping);
    sinon.assert.calledWith(client.ping, { requestTimeout : 12345 });
  });

  it('does not use a ping request timeout if not configured', function () {
    reporter = api.forClient(client, {});

    reporter.start();

    sinon.assert.calledOnce(client.ping);
    sinon.assert.neverCalledWith(client.ping,
        sinon.match.has('requestTimeout'));
  });

  it('uses configured getTime() function to retrieve the time', function () {
    var getTime = sinon.stub().returns('2015-08-20T12:00:00Z');
    reporter = api.forClient(client, {
      indexDateFormat : 'yyyy.mm.dd',
      getTime         : getTime
    });

    reporter.sendBulk();

    sinon.assert.calledOnce(getTime);
    sinon.assert.calledOnce(client.bulk);
    sinon.assert.calledWith(client.bulk, {
      index : "metrics-2015.08.20",
      body  : []
    });
  });

  it('uses ISO time to generate index to match with @timestamp', function () {
    var getTime = sinon.stub().returns('2015-08-20T01:00:00+02:00');
    reporter = api.forClient(client, {
      indexDateFormat : 'yyyy.mm.dd',
      getTime         : getTime
    });

    reporter.sendBulk();

    sinon.assert.calledOnce(client.bulk);
    sinon.assert.calledWith(client.bulk, {
      index : "metrics-2015.08.19",
      body  : []
    });
  });

});
