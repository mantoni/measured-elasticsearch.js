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


describe('config', function () {
  var client;
  var reporter;
  var collection;
  var clock;

  beforeEach(function () {
    clock      = sinon.useFakeTimers();
    client     = new elasticsearch.Client();
    collection = measured.createCollection();
    collection.meter('foo').mark();
    sinon.stub(client, 'bulk');
  });

  afterEach(function () {
    clock.restore();
    client.bulk.restore();
  });

  it('changes default metric name', function () {
    reporter = api.forClient(client, {
      index : 'yo'
    });
    reporter.addCollection(collection);

    reporter.sendBulk();

    sinon.assert.calledOnce(client.bulk);
    sinon.assert.calledWith(client.bulk, {
      body    : [{
        index : sinon.match.has('_index', 'yo-1970.01')
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
      body    : [{
        index : sinon.match.has('_index', 'metrics-1970.01.01')
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
      body : [sinon.match.object, sinon.match.has('tick', defaults.timestamp)]
    });
  });

});
