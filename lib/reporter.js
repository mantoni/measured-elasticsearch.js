/*
 * measured-elasticsearch
 *
 * Copyright (c) 2015 Maximilian Antoni <mail@maxantoni.de>
 *
 * @license MIT
 */
'use strict';

var dateFormat = require("dateformat");

function two(num) {
  return num < 10 ? '0' + num : num;
}

function translateMeter(meter, data) {
  data.count     = meter.count;
  data.m1_rate   = meter['1MinuteRate'];
  data.m5_rate   = meter['5MinuteRate'];
  data.m15_rate  = meter['15MinuteRate'];
  data.mean_rate = meter.mean;
}

function translateHistogram(histogram, data) {
  data.count  = histogram.count;
  data.max    = histogram.max;
  data.mean   = histogram.mean;
  data.min    = histogram.min;
  data.p50    = histogram.median;
  data.p75    = histogram.p75;
  data.p95    = histogram.p95;
  data.p99    = histogram.p99;
  data.p999   = histogram.p999;
  data.stddev = histogram.stddev;
}

function sendBulk(client, collections, config) {
  var now       = new Date();
  var index     = config.index + '-' + dateFormat(now, config.indexDateFormat);
  var timestamp = now.toISOString();
  var body      = [];

  collections.forEach(function (collection) {
    var prefix = '';
    var json   = collection.toJSON();
    if (collection.name) {
      prefix = collection.name + '.';
      json   = json[collection.name];
    }
    Object.keys(json).forEach(function (name) {
      var raw   = json[name];
      var data  = {};
      var type;
      if (typeof raw === 'number') {
        type = 'counter';
        data.count = raw;
      } else if (raw.histogram && raw.meter) {
        type = 'timer';
        translateHistogram(raw.histogram, data);
        translateMeter(raw.meter, data);
        data.duration_units = 'milliseconds';
        data.rate_units     = 'calls/second';
      } else if (raw.hasOwnProperty('1MinuteRate')) {
        type = 'meter';
        translateMeter(raw, data);
        data.units = 'events/second';
      } else if (raw.hasOwnProperty('p999')) {
        type = 'histogram';
        translateHistogram(raw, data);
      } else {
        type = 'gauge';
        data = raw;
      }
      body.push({
        index    : {
          _index : index,
          _type  : type
        }
      });
      data.name = prefix + name;
      data[config.timestampFieldname] = timestamp;
      body.push(data);
    });
  });

  client.bulk({ body : body });
}

function endCollection(collection) {
  collection.end();
}


exports.forClient = function (client, config) {
  if (!config) {
    config = {};
  }
  if (!config.index) {
    config.index = 'metrics';
  }
  if (!config.indexDateFormat) {
    config.indexDateFormat = 'yyyy.mm';
  }
  if (!config.timestampFieldname) {
    config.timestampFieldname = '@timestamp';
  }

  var collections    = [];
  var updateInterval = null;
  var pingTimeout    = null;

  function update() {
    sendBulk(client, collections, config);
  }

  return {

    sendBulk: update,

    start: function start(interval, unit) {
      client.ping(function (err) {
        if (err) {
          pingTimeout = setTimeout(start, 5000);
          return;
        }
        pingTimeout = null;
        update();
        var updateMillis = (interval || 60) * (unit || 1000);
        updateInterval = setInterval(update, updateMillis);
      });
    },

    stop: function () {
      if (pingTimeout !== null) {
        clearTimeout(pingTimeout);
        pingTimeout = null;
      }
      if (updateInterval !== null) {
        clearInterval(updateInterval);
        updateInterval = null;
      }
      collections.forEach(endCollection);
    },

    addCollection: function (collection) {
      collections.push(collection);
    },

    removeCollection: function (collection) {
      var p = collections.indexOf(collection);
      if (p !== -1) {
        collections.splice(p, 1);
      }
    }

  };
};