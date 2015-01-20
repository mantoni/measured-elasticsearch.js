/*global describe, it, beforeEach, afterEach*/
/*
 * measured-elasticsearch
 *
 * Copyright (c) 2015 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var assert        = require('assert');
var sinon         = require('sinon');
var measured      = require('measured');
var elasticsearch = require('elasticsearch');
var defaults      = require('./fixture/defaults');
var api           = require('..');


describe('start', function () {
  var client;
  var reporter;
  var clock;

  beforeEach(function () {
    clock    = sinon.useFakeTimers();
    client   = new elasticsearch.Client();
    reporter = api.forClient(client);
    sinon.stub(client, 'ping').yields(null);
    sinon.stub(client, 'bulk');
  });

  afterEach(function () {
    clock.restore();
    client.ping.restore();
    client.bulk.restore();
  });

  it('sends an initial ping request', function () {
    client.ping.reset();

    reporter.start();

    sinon.assert.calledOnce(client.ping);
  });

  it('retries the ping request every 5 seconds if it failed', function () {
    client.ping.yields(new Error());

    reporter.start();

    clock.tick(5000);
    clock.tick(5000);

    sinon.assert.calledThrice(client.ping);
  });

  it('does not retry the ping requets if it succeeded', function () {
    reporter.start();

    clock.tick(5000);
    clock.tick(5000);

    sinon.assert.calledOnce(client.ping);
  });

  it('performs a bulk update immediately following the ping', function () {
    var collection = measured.createCollection();
    reporter.addCollection(collection);
    collection.counter('mycount').inc();

    reporter.start();

    sinon.assert.calledOnce(client.bulk);
  });

  it('performs a bulk update every 60 seconds', function () {
    var collection = measured.createCollection();
    reporter.addCollection(collection);
    collection.counter('mycount').inc();

    reporter.start();
    clock.tick(60000);
    clock.tick(60000);

    sinon.assert.calledThrice(client.bulk);
  });

  it('performs a bulk update every n configured seconds', function () {
    reporter.start(10);

    clock.tick(10000);

    sinon.assert.calledTwice(client.bulk);
  });

  it('performs a bulk update every n configured time units', function () {
    reporter.start(500, measured.units.MILLISECONDS);

    clock.tick(500);

    sinon.assert.calledTwice(client.bulk);
  });

  it('does not send updates from removed collections', function () {
    var collection = measured.createCollection();
    reporter.addCollection(collection);
    collection.meter('m').mark();
    reporter.removeCollection(collection);

    reporter.start();

    sinon.assert.calledOnce(client.bulk);
    sinon.assert.calledWith(client.bulk, {
      body : []
    });
  });

  it('stops sending updates', function () {
    var collection = measured.createCollection();
    reporter.addCollection(collection);
    collection.counter('mycount').inc();

    reporter.start();
    client.bulk.reset();
    reporter.stop();
    clock.tick(60000);

    sinon.assert.notCalled(client.bulk);
  });

  it('stops sending pings', function () {
    client.ping.yields(new Error());

    reporter.start();
    reporter.stop();
    client.ping.reset();
    clock.tick(5000);

    sinon.assert.notCalled(client.ping);
  });

  it('calls end on collections', sinon.test(function () {
    var c1 = measured.createCollection();
    var c2 = measured.createCollection();
    reporter.addCollection(c1);
    reporter.addCollection(c2);
    this.stub(c1, 'end');
    this.stub(c2, 'end');

    reporter.stop();

    sinon.assert.calledOnce(c1.end);
    sinon.assert.calledOnce(c2.end);
  }));

  it('prefixes metric names with collection names', function () {
    var collection = measured.createCollection('foo');
    reporter.addCollection(collection);
    collection.meter('bar').mark();

    reporter.start();

    sinon.assert.calledOnce(client.bulk);
    sinon.assert.calledWith(client.bulk, {
      body : [sinon.match.object, sinon.match.has('name', 'foo.bar')]
    });
  });

});
